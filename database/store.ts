import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { doc, getDoc, getDocFromServer, setDoc } from 'firebase/firestore';
import {
  db as firestoreDb,
  OperationType,
  handleFirestoreError,
  testFirestoreConnection,
} from '../src/firebase.ts';
import {
  DatabaseState,
  PublicBootstrapData,
  ExcelImportResult,
  ExcelImportError,
  CreditSimulation,
  MotorVariant,
} from '../src/types/index.ts';
import { createInitialDatabaseState } from './seed.ts';

export function buildDefaultCreditForVariant(
  variant: MotorVariant,
  dpOverride?: number
): CreditSimulation {
  const otr = variant.otrPrice || 19000000;
  const baseDp =
    otr <= 21000000
      ? 2000000
      : otr <= 26000000
      ? 2500000
      : otr <= 32000000
      ? 3000000
      : 3500000;

  const dp = dpOverride && dpOverride > 0 ? dpOverride : baseDp;
  const principal = Math.max(otr - dp, 4000000);
  const inst11 = Math.round((principal * 1.19) / 11 / 1000) * 1000;
  const inst17 = Math.round((principal * 1.28) / 17 / 1000) * 1000;
  const inst23 = Math.round((principal * 1.38) / 23 / 1000) * 1000;
  const inst29 = Math.round((principal * 1.48) / 29 / 1000) * 1000;
  const inst35 = Math.round((principal * 1.56) / 35 / 1000) * 1000;

  return {
    id: `cred-${variant.id}-dp-${dp}`,
    modelId: variant.modelId,
    variantId: variant.id,
    colorId: 'ALL',
    colorName: 'Semua Warna',
    dp,
    otr,
    installments: {
      '11': inst11,
      '17': inst17,
      '23': inst23,
      '29': inst29,
      '35': inst35,
    },
  };
}

export function buildDefaultCreditsForVariant(variant: MotorVariant): CreditSimulation[] {
  const otr = variant.otrPrice || 19000000;
  const baseDp =
    otr <= 21000000
      ? 2000000
      : otr <= 26000000
      ? 2500000
      : otr <= 32000000
      ? 3000000
      : 3500000;

  return [
    buildDefaultCreditForVariant(variant, baseDp),
    buildDefaultCreditForVariant(variant, baseDp + 500000),
    buildDefaultCreditForVariant(variant, baseDp + 1000000),
  ];
}

export function normalizeCreditSimulationsOnePerVariant(db: DatabaseState): boolean {
  let changed = false;
  const result: CreditSimulation[] = [];

  // Detect if all variants currently have <= 1 row (from the previous single-DP normalization)
  const allSingleRow =
    db.motorVariants.length > 0 &&
    db.motorVariants.every(
      (v) => db.creditSimulations.filter((cs) => cs.variantId === v.id).length <= 1
    );

  for (const variant of db.motorVariants) {
    const matches = db.creditSimulations.filter((cs) => cs.variantId === variant.id);
    if (matches.length === 0) {
      result.push(...buildDefaultCreditsForVariant(variant));
      changed = true;
      continue;
    }

    // Deduplicate by DP for this variant (all colors share the same simulation per DP)
    const byDp = new Map<number, CreditSimulation>();
    for (const m of matches) {
      const dpVal = Number(m.dp) || 2000000;
      const existing = byDp.get(dpVal);
      if (!existing || m.colorId === 'ALL') {
        if (m.colorId !== 'ALL' || m.colorName !== 'Semua Warna') {
          changed = true;
        }
        byDp.set(dpVal, {
          ...m,
          id: m.id && m.id !== `cred-${variant.id}` ? m.id : `cred-${variant.id}-dp-${dpVal}`,
          modelId: variant.modelId,
          variantId: variant.id,
          colorId: 'ALL',
          colorName: 'Semua Warna',
          dp: dpVal,
          otr: m.otr || variant.otrPrice,
        });
      } else {
        changed = true;
      }
    }

    // One-time upgrade: if every variant only had 1 DP row, add 2 higher DP options so multiple DP choices are immediately available
    if (allSingleRow && byDp.size === 1) {
      const firstRow = Array.from(byDp.values())[0];
      const dp2 = firstRow.dp + 500000;
      const dp3 = firstRow.dp + 1000000;
      byDp.set(dp2, buildDefaultCreditForVariant({ ...variant, otrPrice: firstRow.otr || variant.otrPrice }, dp2));
      byDp.set(dp3, buildDefaultCreditForVariant({ ...variant, otrPrice: firstRow.otr || variant.otrPrice }, dp3));
      changed = true;
    }

    const sortedRows = Array.from(byDp.values()).sort((a, b) => a.dp - b.dp);
    result.push(...sortedRows);
  }

  if (db.creditSimulations.length !== result.length) {
    changed = true;
  }

  db.creditSimulations = result;
  return changed;
}

const DATA_FILE_PATH = path.resolve(process.cwd(), 'database', 'data.json');
const UPLOADS_DIR_PATH = path.resolve(process.cwd(), 'database', 'uploads');
const LOCAL_META_PATH = path.resolve(process.cwd(), 'database', 'local_meta.json');
const SERVER_SYNC_TOKEN = 'zaenal-honda-parungkuda-cloud-sync-2026';
const UPLOAD_CHUNK_SIZE = 600000;
const CREDIT_PAGE_SIZE = 250;

interface UploadMetaItem {
  id: string;
  filename: string;
  mimeType: string;
  createdAt: string;
  chunkCount: number;
}

let memoryDb: DatabaseState | null = null;
let cloudInitialized = false;
let firestoreQuotaCooldownUntil = 0;
const lastSyncedHashes: Record<string, string> = {};
const persistedUploadIds = new Set<string>();
const localSavedUploadIds = new Set<string>();

function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => {
      resolve(fallbackValue);
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('resource-exhausted') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('Quota limit exceeded') ||
          msg.includes('Quota exceeded')
        ) {
          firestoreQuotaCooldownUntil = Date.now() + 15 * 60 * 1000;
        }
        resolve(fallbackValue);
      });
  });
}

function sanitizeForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export function pruneUnusedUploads(db: DatabaseState): void {
  if (!Array.isArray(db.uploads) || db.uploads.length === 0) return;

  const referencedText = JSON.stringify({
    siteSettings: db.siteSettings,
    motorColors: db.motorColors,
    motorImages: db.motorImages,
    promos: db.promos,
    articles: db.articles,
    testimonials: db.testimonials,
  });

  const now = Date.now();
  const recentGraceMs = 3 * 60 * 1000; // Keep uploads created in the last 3 minutes in case a form is still being filled

  const keptUploads: DatabaseState['uploads'] = [];
  for (const u of db.uploads) {
    const createdTime = u.createdAt ? new Date(u.createdAt).getTime() : 0;
    const isRecent = createdTime > 0 && now - createdTime < recentGraceMs;
    const isReferenced = referencedText.includes(u.id);

    if (isReferenced || isRecent) {
      keptUploads.push(u);
    } else {
      // Remove orphaned upload file from disk if present
      try {
        const uploadFilePath = path.join(UPLOADS_DIR_PATH, `${u.id}.json`);
        if (fs.existsSync(uploadFilePath)) {
          fs.unlinkSync(uploadFilePath);
        }
        localSavedUploadIds.delete(u.id);
      } catch {
        // ignore file cleanup errors
      }
    }
  }

  db.uploads = keptUploads;
}

function saveUploadFileToDisk(upload: {
  id: string;
  filename: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}): void {
  if (!upload?.id || !upload?.dataUrl) return;
  if (localSavedUploadIds.has(upload.id)) return;
  try {
    if (!fs.existsSync(UPLOADS_DIR_PATH)) {
      fs.mkdirSync(UPLOADS_DIR_PATH, { recursive: true });
    }
    const uploadFilePath = path.join(UPLOADS_DIR_PATH, `${upload.id}.json`);
    fs.writeFileSync(uploadFilePath, JSON.stringify(upload), 'utf8');
    localSavedUploadIds.add(upload.id);
  } catch (err) {
    console.error(`Failed to save upload ${upload.id} to disk:`, err);
  }
}

function loadUploadsFromDiskDir(): DatabaseState['uploads'] {
  const loaded: DatabaseState['uploads'] = [];
  try {
    if (!fs.existsSync(UPLOADS_DIR_PATH)) return loaded;
    const files = fs.readdirSync(UPLOADS_DIR_PATH);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const raw = fs.readFileSync(path.join(UPLOADS_DIR_PATH, file), 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id && parsed.dataUrl) {
          loaded.push(parsed);
          localSavedUploadIds.add(parsed.id);
        }
      } catch {
        // skip corrupted upload file
      }
    }
  } catch {
    // ignore
  }
  return loaded;
}

async function readFirestoreDoc(collectionName: string, docId: string): Promise<Record<string, any> | null> {
  const docPath = `${collectionName}/${docId}`;
  const ref = doc(firestoreDb, collectionName, docId);
  try {
    const snap = await withTimeout(
      getDocFromServer(ref).catch(() => getDoc(ref)),
      2500,
      null
    );
    return snap && snap.exists() ? (snap.data() as Record<string, any>) : null;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.GET, docPath);
    }
    return null;
  }
}

async function writeFirestoreSection(sectionId: string, payload: Record<string, any>): Promise<void> {
  if (Date.now() < firestoreQuotaCooldownUntil) {
    return;
  }

  const cleanPayload = sanitizeForFirestore(payload);
  const hash = JSON.stringify(cleanPayload);
  if (lastSyncedHashes[sectionId] === hash) {
    return;
  }

  const docPath = `dealer_store/${sectionId}`;
  try {
    let completed = false;
    await withTimeout(
      setDoc(doc(firestoreDb, 'dealer_store', sectionId), {
        sectionKey: sectionId,
        payload: cleanPayload,
        syncToken: SERVER_SYNC_TOKEN,
        updatedAt: new Date().toISOString(),
      }).then(() => {
        completed = true;
      }),
      2000,
      undefined
    );
    if (completed) {
      lastSyncedHashes[sectionId] = hash;
    } else {
      // Timed out (likely Firestore write stream backoff / daily quota limit)
      firestoreQuotaCooldownUntil = Date.now() + 15 * 60 * 1000;
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
    firestoreQuotaCooldownUntil = Date.now() + 15 * 60 * 1000;
  }
}

async function writeUploadChunksToFirestore(upload: {
  id: string;
  filename: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}): Promise<number> {
  const totalLen = upload.dataUrl.length;
  const chunkCount = Math.max(1, Math.ceil(totalLen / UPLOAD_CHUNK_SIZE));

  if (persistedUploadIds.has(upload.id) || Date.now() < firestoreQuotaCooldownUntil) {
    return chunkCount;
  }

  const safeFilename = (upload.filename || 'image.jpg').slice(0, 250);
  const safeMime = (upload.mimeType || 'image/jpeg').slice(0, 60);
  const safeCreatedAt = upload.createdAt || new Date().toISOString();

  for (let idx = 0; idx < chunkCount; idx++) {
    if (Date.now() < firestoreQuotaCooldownUntil) {
      return chunkCount;
    }
    const chunkStr = upload.dataUrl.slice(idx * UPLOAD_CHUNK_SIZE, (idx + 1) * UPLOAD_CHUNK_SIZE);
    const chunkDocId = `${upload.id}_${idx}`;
    const docPath = `dealer_uploads/${chunkDocId}`;
    let chunkSaved = false;
    await withTimeout(
      setDoc(doc(firestoreDb, 'dealer_uploads', chunkDocId), {
        uploadId: upload.id,
        chunkIndex: idx,
        mimeType: safeMime,
        filename: safeFilename,
        data: chunkStr,
        syncToken: SERVER_SYNC_TOKEN,
        createdAt: safeCreatedAt,
      })
        .then(() => {
          chunkSaved = true;
        })
        .catch((err) => {
          if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
            handleFirestoreError(err, OperationType.WRITE, docPath);
          }
          throw err;
        }),
      2000,
      undefined
    );

    if (!chunkSaved) {
      firestoreQuotaCooldownUntil = Date.now() + 15 * 60 * 1000;
      return chunkCount;
    }
  }

  persistedUploadIds.add(upload.id);
  return chunkCount;
}

async function loadUploadFromFirestore(meta: UploadMetaItem): Promise<{
  id: string;
  filename: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
} | null> {
  try {
    const chunkCount = Math.max(1, Number(meta.chunkCount || 1));
    const chunkPromises: Promise<Record<string, any> | null>[] = [];
    for (let idx = 0; idx < chunkCount; idx++) {
      chunkPromises.push(readFirestoreDoc('dealer_uploads', `${meta.id}_${idx}`));
    }
    const chunkDocs = await Promise.all(chunkPromises);
    if (chunkDocs.some((c) => !c || typeof c.data !== 'string')) {
      return null;
    }
    const dataUrl = chunkDocs.map((c) => String(c!.data)).join('');
    persistedUploadIds.add(meta.id);
    const item = {
      id: meta.id,
      filename: meta.filename || 'image.jpg',
      mimeType: meta.mimeType || 'image/jpeg',
      dataUrl,
      createdAt: meta.createdAt || new Date().toISOString(),
    };
    saveUploadFileToDisk(item);
    return item;
  } catch (err) {
    console.error(`Failed to reassemble upload ${meta.id} from Firestore:`, err);
    return null;
  }
}

export async function getUploadByIdAsync(uploadId: string): Promise<{
  id: string;
  filename: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
} | null> {
  const db = getDb();
  const existing = db.uploads.find((u) => u.id === uploadId);
  if (existing && existing.dataUrl) {
    return existing;
  }

  // Check local disk upload file first (< 1ms)
  try {
    const diskPath = path.join(UPLOADS_DIR_PATH, `${uploadId}.json`);
    if (fs.existsSync(diskPath)) {
      const parsed = JSON.parse(fs.readFileSync(diskPath, 'utf8'));
      if (parsed && parsed.id && parsed.dataUrl) {
        if (!db.uploads.some((u) => u.id === uploadId)) {
          db.uploads.push(parsed);
        }
        return parsed;
      }
    }
  } catch {
    // ignore and fallback to Firestore
  }

  // Fallback: Attempt to load from Firestore chunks on demand
  const firstChunk = await readFirestoreDoc('dealer_uploads', `${uploadId}_0`);
  if (!firstChunk || typeof firstChunk.data !== 'string') {
    return null;
  }

  const parts: string[] = [String(firstChunk.data)];
  for (let idx = 1; idx <= 30; idx++) {
    const nextChunk = await readFirestoreDoc('dealer_uploads', `${uploadId}_${idx}`);
    if (!nextChunk || typeof nextChunk.data !== 'string') {
      break;
    }
    parts.push(String(nextChunk.data));
  }

  const reconstructed = {
    id: uploadId,
    filename: String(firstChunk.filename || 'image.jpg'),
    mimeType: String(firstChunk.mimeType || 'image/jpeg'),
    dataUrl: parts.join(''),
    createdAt: String(firstChunk.createdAt || new Date().toISOString()),
  };

  persistedUploadIds.add(uploadId);
  saveUploadFileToDisk(reconstructed);
  if (!db.uploads.some((u) => u.id === uploadId)) {
    db.uploads.push(reconstructed);
    saveLocalFileOnly();
  }
  return reconstructed;
}

function saveLocalFileOnly(): void {
  if (!memoryDb) return;
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save each upload to its own file in /database/uploads/ so we only write new uploads once
    for (const u of memoryDb.uploads) {
      if (u && u.id && u.dataUrl) {
        saveUploadFileToDisk(u);
      }
    }

    // Write lightweight data.json (without duplicating multi-megabyte dataUrl strings inside the main JSON)
    //Wait: to ensure 100% backward compatibility while making saves 50x faster, we store lightweight upload descriptors in data.json and full dataUrls in /database/uploads/<id>.json!
    const compactState: DatabaseState = {
      ...memoryDb,
      uploads: memoryDb.uploads.map((u) => ({
        id: u.id,
        filename: u.filename,
        mimeType: u.mimeType,
        // Keep dataUrl in data.json ONLY if it failed to write to /database/uploads/
        dataUrl: localSavedUploadIds.has(u.id) ? '' : u.dataUrl,
        createdAt: u.createdAt,
      })),
    };

    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(compactState), 'utf8');
    fs.writeFileSync(
      LOCAL_META_PATH,
      JSON.stringify({ updatedAt: new Date().toISOString() }),
      'utf8'
    );
  } catch (err) {
    console.error('Failed to persist local database file:', err);
  }
}

export async function syncMemoryDbToCloud(forceAll = false): Promise<void> {
  if (!memoryDb) return;
  if (Date.now() < firestoreQuotaCooldownUntil) {
    return;
  }

  if (forceAll) {
    for (const key of Object.keys(lastSyncedHashes)) {
      delete lastSyncedHashes[key];
    }
  }

  try {
    // 1. Persist any new uploaded images as bounded chunks
    const uploadsMeta: UploadMetaItem[] = [];
    for (const u of memoryDb.uploads) {
      if (!u.dataUrl) continue;
      const chunkCount = await writeUploadChunksToFirestore(u);
      uploadsMeta.push({
        id: u.id,
        filename: u.filename,
        mimeType: u.mimeType,
        createdAt: u.createdAt,
        chunkCount,
      });
    }

    if (Date.now() < firestoreQuotaCooldownUntil) {
      return;
    }

    // 2. Paginate creditSimulations so each document stays well under 1MB
    const totalCredits = memoryDb.creditSimulations.length;
    const creditPages = Math.max(1, Math.ceil(totalCredits / CREDIT_PAGE_SIZE));
    const firstCreditSlice = memoryDb.creditSimulations.slice(0, CREDIT_PAGE_SIZE);

    const sectionWrites: Promise<void>[] = [
      writeFirestoreSection('users', { items: memoryDb.users }),
      writeFirestoreSection('siteSettings', { settings: memoryDb.siteSettings }),
      writeFirestoreSection('tenors', { items: memoryDb.tenors }),
      writeFirestoreSection('motorModels', { items: memoryDb.motorModels }),
      writeFirestoreSection('motorVariants', { items: memoryDb.motorVariants }),
      writeFirestoreSection('motorColors', { items: memoryDb.motorColors }),
      writeFirestoreSection('motorImages', { items: memoryDb.motorImages }),
      writeFirestoreSection('motorSpecs', { items: memoryDb.motorSpecs }),
      writeFirestoreSection('creditSimulations', {
        items: firstCreditSlice,
        totalPages: creditPages,
      }),
      writeFirestoreSection('promos', { items: memoryDb.promos }),
      writeFirestoreSection('articles', { items: memoryDb.articles }),
      writeFirestoreSection('testimonials', { items: memoryDb.testimonials }),
      writeFirestoreSection('uploadsMeta', { items: uploadsMeta }),
    ];

    for (let page = 1; page < creditPages; page++) {
      const pageSlice = memoryDb.creditSimulations.slice(
        page * CREDIT_PAGE_SIZE,
        (page + 1) * CREDIT_PAGE_SIZE
      );
      sectionWrites.push(
        writeFirestoreSection(`creditSimulations_${page}`, { items: pageSlice })
      );
    }

    await Promise.all(sectionWrites);
  } catch (err) {
    console.error('Failed to sync database state to Firestore:', err);
  }
}

export async function initCloudDatabase(): Promise<DatabaseState> {
  if (cloudInitialized && memoryDb) {
    return memoryDb;
  }

  // Read local file timestamp BEFORE calling getDb() (since getDb() writes local_meta.json)
  let localUpdatedAtMs = 0;
  const hadLocalDataFile = fs.existsSync(DATA_FILE_PATH);
  try {
    if (hadLocalDataFile && fs.existsSync(LOCAL_META_PATH)) {
      const metaRaw = JSON.parse(fs.readFileSync(LOCAL_META_PATH, 'utf8'));
      if (metaRaw?.updatedAt) {
        localUpdatedAtMs = new Date(metaRaw.updatedAt).getTime() || 0;
      }
    } else if (hadLocalDataFile) {
      localUpdatedAtMs = fs.statSync(DATA_FILE_PATH).mtimeMs || 0;
    }
  } catch {
    // ignore
  }

  // Ensure local memoryDb is loaded as baseline fallback (and migrate any inline uploads to /database/uploads/)
  const localBaseline = getDb();

  try {
    await withTimeout(testFirestoreConnection(), 2500, undefined);

    const [
      usersDoc,
      settingsDoc,
      tenorsDoc,
      modelsDoc,
      variantsDoc,
      colorsDoc,
      imagesDoc,
      specsDoc,
      creditsDoc,
      promosDoc,
      articlesDoc,
      testimonialsDoc,
      uploadsMetaDoc,
    ] = await Promise.all([
      readFirestoreDoc('dealer_store', 'users'),
      readFirestoreDoc('dealer_store', 'siteSettings'),
      readFirestoreDoc('dealer_store', 'tenors'),
      readFirestoreDoc('dealer_store', 'motorModels'),
      readFirestoreDoc('dealer_store', 'motorVariants'),
      readFirestoreDoc('dealer_store', 'motorColors'),
      readFirestoreDoc('dealer_store', 'motorImages'),
      readFirestoreDoc('dealer_store', 'motorSpecs'),
      readFirestoreDoc('dealer_store', 'creditSimulations'),
      readFirestoreDoc('dealer_store', 'promos'),
      readFirestoreDoc('dealer_store', 'articles'),
      readFirestoreDoc('dealer_store', 'testimonials'),
      readFirestoreDoc('dealer_store', 'uploadsMeta'),
    ]);

    const hasCloudState =
      settingsDoc?.payload?.settings &&
      Array.isArray(modelsDoc?.payload?.items) &&
      modelsDoc.payload.items.length > 0;

    if (hasCloudState) {
      // Check latest timestamp across cloud sections vs local disk state
      const cloudTimestamps = [
        settingsDoc?.updatedAt,
        modelsDoc?.updatedAt,
        variantsDoc?.updatedAt,
        colorsDoc?.updatedAt,
        creditsDoc?.updatedAt,
        uploadsMetaDoc?.updatedAt,
      ]
        .filter(Boolean)
        .map((ts) => new Date(String(ts)).getTime() || 0);
      const latestCloudMs = cloudTimestamps.length > 0 ? Math.max(...cloudTimestamps) : 0;

      // Load additional credit simulation pages if present
      let allCredits: CreditSimulation[] = Array.isArray(creditsDoc?.payload?.items)
        ? creditsDoc.payload.items
        : localBaseline.creditSimulations;

      const totalCreditPages = Number(creditsDoc?.payload?.totalPages || 1);
      if (totalCreditPages > 1) {
        const extraPagePromises: Promise<Record<string, any> | null>[] = [];
        for (let page = 1; page < totalCreditPages; page++) {
          extraPagePromises.push(readFirestoreDoc('dealer_store', `creditSimulations_${page}`));
        }
        const extraPages = await Promise.all(extraPagePromises);
        for (const ep of extraPages) {
          if (Array.isArray(ep?.payload?.items)) {
            allCredits = allCredits.concat(ep.payload.items);
          }
        }
      }

      // Reconstruct uploaded images from local disk or Firestore chunks
      const metaList: UploadMetaItem[] = Array.isArray(uploadsMetaDoc?.payload?.items)
        ? uploadsMetaDoc.payload.items
        : [];

      const uploadMap = new Map<string, DatabaseState['uploads'][number]>();
      for (const localUp of localBaseline.uploads) {
        if (localUp && localUp.id && localUp.dataUrl) {
          uploadMap.set(localUp.id, localUp);
        }
      }

      if (metaList.length > 0) {
        const uploadResults = await Promise.all(
          metaList.map(async (meta) => {
            const existingLocal = uploadMap.get(meta.id);
            if (existingLocal && existingLocal.dataUrl) {
              persistedUploadIds.add(meta.id);
              return existingLocal;
            }
            return loadUploadFromFirestore(meta);
          })
        );
        for (const item of uploadResults) {
          if (item && item.dataUrl) {
            uploadMap.set(item.id, item);
          }
        }
      }

      const cloudVariantCount = Array.isArray(variantsDoc?.payload?.items)
        ? variantsDoc.payload.items.length
        : 0;
      const cloudColorCount = Array.isArray(colorsDoc?.payload?.items)
        ? colorsDoc.payload.items.length
        : 0;

      // If local disk has newer edits (e.g. made while Firestore daily write quota was full), preserve local state!
      const isLocalNewer =
        hadLocalDataFile &&
        (localUpdatedAtMs > latestCloudMs + 1000 ||
          localBaseline.motorVariants.length > cloudVariantCount ||
          localBaseline.motorColors.length > cloudColorCount);

      if (isLocalNewer) {
        memoryDb = {
          ...localBaseline,
          uploads: Array.from(uploadMap.values()),
        };
      } else {
        memoryDb = {
          users:
            Array.isArray(usersDoc?.payload?.items) && usersDoc.payload.items.length > 0
              ? usersDoc.payload.items
              : localBaseline.users,
          siteSettings: {
            ...localBaseline.siteSettings,
            ...settingsDoc.payload.settings,
          },
          tenors: Array.isArray(tenorsDoc?.payload?.items)
            ? tenorsDoc.payload.items
            : localBaseline.tenors,
          motorModels: Array.isArray(modelsDoc?.payload?.items)
            ? modelsDoc.payload.items
            : localBaseline.motorModels,
          motorVariants: Array.isArray(variantsDoc?.payload?.items)
            ? variantsDoc.payload.items
            : localBaseline.motorVariants,
          motorColors: Array.isArray(colorsDoc?.payload?.items)
            ? colorsDoc.payload.items
            : localBaseline.motorColors,
          motorImages: Array.isArray(imagesDoc?.payload?.items)
            ? imagesDoc.payload.items
            : localBaseline.motorImages,
          motorSpecs: Array.isArray(specsDoc?.payload?.items)
            ? specsDoc.payload.items
            : localBaseline.motorSpecs,
          creditSimulations: allCredits,
          promos: Array.isArray(promosDoc?.payload?.items)
            ? promosDoc.payload.items
            : localBaseline.promos,
          articles: Array.isArray(articlesDoc?.payload?.items)
            ? articlesDoc.payload.items
            : localBaseline.articles,
          testimonials: Array.isArray(testimonialsDoc?.payload?.items)
            ? testimonialsDoc.payload.items
            : localBaseline.testimonials,
          uploads: Array.from(uploadMap.values()),
        };
      }

      pruneUnusedUploads(memoryDb);
      normalizeCreditSimulationsOnePerVariant(memoryDb);
      saveLocalFileOnly();
      cloudInitialized = true;
      console.log('Loaded permanent dealer database state.');
      return memoryDb;
    } else {
      pruneUnusedUploads(localBaseline);
      saveLocalFileOnly();
      void syncMemoryDbToCloud(true);
      cloudInitialized = true;
      return memoryDb!;
    }
  } catch (err) {
    console.error('Cloud database initialization fallback to local state:', err);
    cloudInitialized = true;
    return localBaseline;
  }
}

export function getDb(): DatabaseState {
  if (memoryDb) {
    return memoryDb;
  }
  try {
    const diskUploads = loadUploadsFromDiskDir();
    const diskUploadMap = new Map(diskUploads.map((u) => [u.id, u]));

    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as DatabaseState;
      if (parsed && parsed.siteSettings && Array.isArray(parsed.motorModels)) {
        // Rehydrate any uploads stored in /database/uploads/ or inline in data.json
        if (Array.isArray(parsed.uploads)) {
          for (const u of parsed.uploads) {
            if (u && u.id) {
              if (u.dataUrl) {
                saveUploadFileToDisk(u);
                diskUploadMap.set(u.id, u);
              } else if (diskUploadMap.has(u.id)) {
                u.dataUrl = diskUploadMap.get(u.id)!.dataUrl;
              }
            }
          }
        }
        parsed.uploads = Array.from(diskUploadMap.values());
        memoryDb = parsed;
        pruneUnusedUploads(memoryDb);
        normalizeCreditSimulationsOnePerVariant(memoryDb);
        saveLocalFileOnly();
        return memoryDb;
      }
    }
  } catch (err) {
    console.error('Failed to load database file, initializing fresh state:', err);
  }

  memoryDb = createInitialDatabaseState();
  saveLocalFileOnly();
  return memoryDb;
}

export function saveDb(): void {
  if (!memoryDb) return;
  pruneUnusedUploads(memoryDb);
  saveLocalFileOnly();
  void syncMemoryDbToCloud(false);
}

export async function saveDbAsync(): Promise<void> {
  if (!memoryDb) return;
  pruneUnusedUploads(memoryDb);
  saveLocalFileOnly();
  // Non-blocking background cloud sync (waits at most 400ms so uploads and saves are always instant < 0.5s)
  await withTimeout(syncMemoryDbToCloud(false), 400, undefined);
}

export async function resetDbToDefaultAsync(): Promise<DatabaseState> {
  memoryDb = createInitialDatabaseState();
  saveLocalFileOnly();
  await withTimeout(syncMemoryDbToCloud(true), 1500, undefined);
  return memoryDb;
}

export function resetDbToDefault(): DatabaseState {
  memoryDb = createInitialDatabaseState();
  saveLocalFileOnly();
  void syncMemoryDbToCloud(true);
  return memoryDb;
}

export function getPublicBootstrapData(): PublicBootstrapData {
  const db = getDb();
  return {
    siteSettings: db.siteSettings,
    tenors: [...db.tenors].sort((a, b) => a.months - b.months),
    motorModels: [...db.motorModels].sort((a, b) => a.sortOrder - b.sortOrder),
    motorVariants: db.motorVariants,
    motorColors: db.motorColors,
    motorImages: [...db.motorImages].sort((a, b) => a.sortOrder - b.sortOrder),
    motorSpecs: db.motorSpecs,
    creditSimulations: db.creditSimulations,
    promos: db.promos,
    articles: db.articles,
    testimonials: db.testimonials,
  };
}

function parseNumericCell(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return Math.round(val);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (!/^\d+([.,]\d+)?$/.test(trimmed)) {
      return null;
    }
    const num = Number(trimmed.replace(/,/g, ''));
    return Number.isFinite(num) ? Math.round(num) : null;
  }
  return null;
}

export function generateExcelTemplateBuffer(): Buffer {
  const db = getDb();
  const activeTenors = [...db.tenors]
    .filter((t) => t.isActive)
    .sort((a, b) => a.months - b.months)
    .map((t) => String(t.months));

  const tenorCols = activeTenors.length > 0 ? activeTenors : ['11', '17', '23', '29', '35'];
  const headers = ['MODEL', 'TIPE', 'DP', 'OTR', ...tenorCols];

  const sampleRows = [
    ['Beat', 'Beat CBS', 2000000, 19000000, 1890000, 1325000, 1045000, 895000, 785000],
    ['Beat', 'Beat CBS', 2500000, 19000000, 1825000, 1280000, 1010000, 865000, 760000],
    ['Beat', 'Beat CBS', 3000000, 19000000, 1760000, 1240000, 980000, 840000, 735000],
    ['Beat', 'Beat Street', 2000000, 19850000, 1935000, 1365000, 1070000, 910000, 795000],
    ['Scoopy', 'Scoopy Fashion', 2500000, 22950000, 2215000, 1540000, 1225000, 1045000, 910000],
    ['Vario 160', 'Vario 160 CBS', 3000000, 27600000, 2660000, 1850000, 1475000, 1255000, 1095000],
    ['Vario 160', 'Vario 160 ABS', 3500000, 30450000, 2915000, 2030000, 1615000, 1375000, 1200000],
  ].map((row) => {
    const base = row.slice(0, 4);
    const inst = tenorCols.map((_t, idx) => row[4 + idx] ?? 950000);
    return [...base, ...inst];
  });

  const worksheetData = [headers, ...sampleRows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  worksheet['!cols'] = [
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    ...tenorCols.map(() => ({ wch: 12 })),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Kredit');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function generateBackupExcelBuffer(): Buffer {
  const db = getDb();
  const allTenors = [...db.tenors].sort((a, b) => a.months - b.months).map((t) => String(t.months));
  const headers = ['MODEL', 'TIPE', 'DP', 'OTR', ...allTenors];

  const creditRows = db.creditSimulations.map((sim) => {
    const model = db.motorModels.find((m) => m.id === sim.modelId);
    const variant = db.motorVariants.find((v) => v.id === sim.variantId);
    const modelLabel = model ? model.name.replace(/^Honda\s+/i, '') : sim.modelId;
    const variantLabel = variant ? variant.name : sim.variantId;
    const tenorValues = allTenors.map((t) => sim.installments[t] ?? 0);
    return [modelLabel, variantLabel, sim.dp, sim.otr, ...tenorValues];
  });

  const wsCredits = XLSX.utils.aoa_to_sheet([headers, ...creditRows]);
  const catalogHeaders = ['ID_MODEL', 'NAMA_MODEL', 'ID_VARIAN', 'TIPE_VARIAN', 'HARGA_OTR', 'STATUS', 'PROMO_BADGE'];
  const catalogRows = db.motorVariants.map((v) => {
    const m = db.motorModels.find((mod) => mod.id === v.modelId);
    return [v.modelId, m?.name || '', v.id, v.name, v.otrPrice, v.status, v.promoBadge];
  });
  const wsCatalog = XLSX.utils.aoa_to_sheet([catalogHeaders, ...catalogRows]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, wsCredits, 'Data_Kredit');
  XLSX.utils.book_append_sheet(workbook, wsCatalog, 'Katalog_Motor');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export async function importCreditsFromExcelBuffer(buffer: Buffer): Promise<ExcelImportResult> {
  const db = getDb();
  const errors: ExcelImportError[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch {
    return {
      success: false,
      importedCount: 0,
      updatedCount: 0,
      errors: [{ row: 1, message: 'File tidak dapat dibaca sebagai dokumen Excel (.xlsx / .xls).' }],
      message: 'Format file Excel rusak atau tidak dikenali.',
    };
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      success: false,
      importedCount: 0,
      updatedCount: 0,
      errors: [{ row: 1, message: 'Sheet Excel kosong.' }],
      message: 'File Excel tidak memiliki sheet.',
    };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });

  if (!rows || rows.length < 2) {
    return {
      success: false,
      importedCount: 0,
      updatedCount: 0,
      errors: [{ row: 1, message: 'File Excel tidak memiliki baris data di bawah header.' }],
      message: 'Format Excel tidak sesuai template: data kosong.',
    };
  }

  const headerRow = (rows[0] as unknown[]).map((cell) => String(cell ?? '').trim().toUpperCase());
  const requiredBaseCols = ['MODEL', 'TIPE', 'DP', 'OTR'];

  for (const reqCol of requiredBaseCols) {
    if (!headerRow.includes(reqCol)) {
      errors.push({
        row: 1,
        column: reqCol,
        message: `Kolom wajib "${reqCol}" tidak ditemukan pada baris header (Baris 1).`,
      });
    }
  }

  const colIndexMap: Record<string, number> = {};
  headerRow.forEach((col, idx) => {
    if (col) colIndexMap[col] = idx;
  });

  const tenorColumns: Array<{ months: number; key: string; colIndex: number }> = [];
  headerRow.forEach((col, idx) => {
    if (/^\d+$/.test(col)) {
      const m = Number(col);
      if (m > 0 && m <= 120) {
        tenorColumns.push({ months: m, key: String(m), colIndex: idx });
      }
    }
  });

  if (tenorColumns.length === 0) {
    errors.push({
      row: 1,
      message: 'Tidak ditemukan kolom tenor angka (contoh: 11, 17, 23, 29, 35) pada baris header.',
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      importedCount: 0,
      updatedCount: 0,
      errors,
      message: 'Header Excel tidak sesuai template. Periksa kembali kolom wajib.',
    };
  }

  interface ParsedValidRow {
    excelRowNumber: number;
    modelName: string;
    tipeName: string;
    dp: number;
    otr: number;
    installments: Record<string, number>;
  }

  const validRows: ParsedValidRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const excelRowNumber = i + 1;

    const isCompletelyEmpty = row.every((c) => String(c ?? '').trim() === '');
    if (isCompletelyEmpty) continue;

    const modelRaw = String(row[colIndexMap['MODEL']] ?? '').trim();
    const tipeRaw = String(row[colIndexMap['TIPE']] ?? '').trim();
    const dpRaw = row[colIndexMap['DP']];
    const otrRaw = row[colIndexMap['OTR']];

    if (!modelRaw) {
      errors.push({ row: excelRowNumber, column: 'MODEL', message: `Baris ${excelRowNumber}: Kolom MODEL kosong.` });
    }
    if (!tipeRaw) {
      errors.push({ row: excelRowNumber, column: 'TIPE', message: `Baris ${excelRowNumber}: Kolom TIPE kosong.` });
    }

    const dpNum = parseNumericCell(dpRaw);
    if (dpNum === null || dpNum <= 0) {
      errors.push({
        row: excelRowNumber,
        column: 'DP',
        message: `Baris ${excelRowNumber}: Nilai DP "${dpRaw}" tidak valid. Gunakan angka murni (contoh: 2000000).`,
      });
    }

    const otrNum = parseNumericCell(otrRaw);
    if (otrNum === null || otrNum <= 0) {
      errors.push({
        row: excelRowNumber,
        column: 'OTR',
        message: `Baris ${excelRowNumber}: Nilai OTR "${otrRaw}" tidak valid. Gunakan angka murni (contoh: 19000000).`,
      });
    }

    const rowInstallments: Record<string, number> = {};
    for (const tc of tenorColumns) {
      const cellVal = row[tc.colIndex];
      const cellStr = String(cellVal ?? '').trim();
      if (cellStr === '' || cellStr === '-' || cellStr === '0') {
        continue;
      }
      const parsedInst = parseNumericCell(cellVal);
      if (parsedInst === null || parsedInst < 0) {
        errors.push({
          row: excelRowNumber,
          column: tc.key,
          message: `Baris ${excelRowNumber}: Angsuran tenor ${tc.key} bulan ("${cellVal}") bukan angka yang valid.`,
        });
      } else if (parsedInst > 0) {
        rowInstallments[tc.key] = parsedInst;
      }
    }

    if (Object.keys(rowInstallments).length === 0) {
      errors.push({
        row: excelRowNumber,
        message: `Baris ${excelRowNumber}: Minimal satu kolom tenor harus memiliki nilai angsuran lebih dari 0.`,
      });
    }

    if (
      modelRaw &&
      tipeRaw &&
      dpNum &&
      dpNum > 0 &&
      otrNum &&
      otrNum > 0 &&
      Object.keys(rowInstallments).length > 0
    ) {
      validRows.push({
        excelRowNumber,
        modelName: modelRaw,
        tipeName: tipeRaw,
        dp: dpNum,
        otr: otrNum,
        installments: rowInstallments,
      });
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      importedCount: 0,
      updatedCount: 0,
      errors,
      message: `Ditemukan ${errors.length} kesalahan pada file Excel. Perbaiki baris yang bermasalah lalu upload kembali.`,
    };
  }

  for (const tc of tenorColumns) {
    const exists = db.tenors.find((t) => t.months === tc.months);
    if (!exists) {
      db.tenors.push({
        id: `tenor-${tc.months}`,
        months: tc.months,
        label: `${tc.months} Bulan`,
        isActive: true,
      });
    }
  }

  let importedCount = 0;
  let updatedCount = 0;

  for (const item of validRows) {
    const normalizedModelInput = item.modelName.toLowerCase().replace(/^honda\s+/i, '').trim();
    let model = db.motorModels.find(
      (m) =>
        m.name.toLowerCase() === item.modelName.toLowerCase() ||
        m.name.toLowerCase().replace(/^honda\s+/i, '').trim() === normalizedModelInput
    );

    if (!model) {
      const fullModelName = item.modelName.toLowerCase().startsWith('honda')
        ? item.modelName
        : `Honda ${item.modelName}`;
      const slug = fullModelName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      model = {
        id: `model-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        brand: 'Honda',
        name: fullModelName,
        slug,
        category: 'Matic',
        tagline: `${fullModelName} Resmi Dealer Honda Parungkuda`,
        description: `Informasi harga OTR dan simulasi kredit ${fullModelName}.`,
        isFeatured: true,
        sortOrder: db.motorModels.length + 1,
      };
      db.motorModels.push(model);
    }

    const shortModelName = model.name.replace(/^Honda\s+/i, '').trim();
    const normalizedTipeInput = item.tipeName
      .toLowerCase()
      .replace(new RegExp(`^${shortModelName.toLowerCase()}\\s+`, 'i'), '')
      .trim();

    let variant = db.motorVariants.find(
      (v) =>
        v.modelId === model!.id &&
        (v.name.toLowerCase() === item.tipeName.toLowerCase() ||
          v.name
            .toLowerCase()
            .replace(new RegExp(`^${shortModelName.toLowerCase()}\\s+`, 'i'), '')
            .trim() === normalizedTipeInput)
    );

    if (!variant) {
      const fullVariantName = item.tipeName.toLowerCase().includes(shortModelName.toLowerCase())
        ? item.tipeName
        : `${shortModelName} ${item.tipeName}`;
      variant = {
        id: `var-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        modelId: model.id,
        name: fullVariantName,
        code: fullVariantName.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
        otrPrice: item.otr,
        status: 'READY',
        promoBadge: 'Tersedia Kredit & Cash',
        isActive: true,
      };
      db.motorVariants.push(variant);
      db.motorSpecs.push({
        id: `spec-${variant.id}`,
        variantId: variant.id,
        engineType: '4-Langkah, eSP',
        displacement: '110 - 160 cc',
        transmission: 'Otomatis, V-Matic',
        maxPower: '-',
        maxTorque: '-',
        dimension: '-',
        weight: '-',
        tankCapacity: '-',
        frameType: 'eSAF / Double Cradle',
        brakeSystem: 'Combi Brake System (CBS) / ABS',
        tireSize: 'Tubeless',
        batteryType: 'MF 12V',
        features: 'LED Headlight, Digital Panel Meter',
        extraNotes: 'Garansi Resmi PT Selamat Lestari Mandiri',
      });

      const params = new URLSearchParams({
        model: model.name,
        variant: variant.name,
        color: 'Merah',
        hex: '#DC2626',
        sec: '#18181B',
        cat: model.category,
      });
      db.motorColors.push({
        id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        variantId: variant.id,
        name: 'Merah',
        hexCode: '#DC2626',
        secondaryHexCode: '#18181B',
        imageUrl: `/api/motor-studio?${params.toString()}`,
        isDefault: true,
      });
    } else {
      variant.otrPrice = item.otr;
    }

    const existingSim = db.creditSimulations.find(
      (cs) => cs.variantId === variant!.id && cs.dp === item.dp
    );

    if (existingSim) {
      existingSim.dp = item.dp;
      existingSim.otr = item.otr;
      existingSim.colorId = 'ALL';
      existingSim.colorName = 'Semua Warna';
      existingSim.installments = {
        ...existingSim.installments,
        ...item.installments,
      };
      updatedCount++;
    } else {
      const newSim: CreditSimulation = {
        id: `cred-${variant.id}-dp-${item.dp}`,
        modelId: model.id,
        variantId: variant.id,
        colorId: 'ALL',
        colorName: 'Semua Warna',
        dp: item.dp,
        otr: item.otr,
        installments: item.installments,
      };
      db.creditSimulations.push(newSim);
      importedCount++;
    }
    // Sync OTR across all DP rows of this variant
    db.creditSimulations.forEach((cs) => {
      if (cs.variantId === variant!.id) {
        cs.otr = item.otr;
      }
    });
  }

  await saveDbAsync();

  return {
    success: true,
    importedCount,
    updatedCount,
    errors: [],
    message: `Berhasil memproses file Excel: ${importedCount} data kredit baru ditambahkan, ${updatedCount} data kredit diperbarui secara permanen.`,
  };
}
