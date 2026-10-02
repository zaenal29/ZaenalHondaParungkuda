import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getDb,
  saveDbAsync,
  resetDbToDefaultAsync,
  initCloudDatabase,
  getUploadByIdAsync,
  getPublicBootstrapData,
  generateExcelTemplateBuffer,
  generateBackupExcelBuffer,
  importCreditsFromExcelBuffer,
  buildDefaultCreditForVariant,
  buildDefaultCreditsForVariant,
} from './database/store.ts';
import { CreditSimulation, DatabaseState, MotorModel, MotorVariant } from './src/types/index.ts';

function createVariantWithDefaults(
  db: DatabaseState,
  model: MotorModel,
  variantName: string,
  otrPrice = 19000000,
  idxOffset = 0
): MotorVariant {
  const cleanName = String(variantName || `${model.name} Standar`).trim();
  const id = `var-${Date.now()}-${idxOffset}-${Math.random().toString(36).slice(2, 6)}`;
  const safeOtr = Number(otrPrice) > 0 ? Number(otrPrice) : 19000000;
  const newVariant: MotorVariant = {
    id,
    modelId: model.id,
    name: cleanName,
    code: cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
    otrPrice: safeOtr,
    status: 'READY',
    promoBadge: 'Tersedia Kredit & Cash',
    isActive: true,
  };
  db.motorVariants.push(newVariant);

  db.motorSpecs.push({
    id: `spec-${id}`,
    variantId: id,
    engineType: '4-Langkah, eSP',
    displacement: '110 - 160 cc',
    transmission: 'Otomatis, V-Matic',
    maxPower: '-',
    maxTorque: '-',
    dimension: '-',
    weight: '-',
    tankCapacity: '4,2 - 5,5 Liter',
    frameType: 'eSAF / Double Cradle',
    brakeSystem: cleanName.toUpperCase().includes('ABS')
      ? 'Anti-Lock Braking System (ABS)'
      : 'Combi Brake System (CBS)',
    tireSize: 'Tubeless',
    batteryType: 'MF 12V - 5Ah',
    features: 'Full LED Headlight, Digital Panel Meter',
    extraNotes: 'Garansi Rangka 5 Tahun Resmi Honda',
  });

  const params = new URLSearchParams({
    model: model.name,
    variant: newVariant.name,
    color: 'Merah',
    hex: '#DC2626',
    sec: '#18181B',
    cat: model.category,
  });

  db.motorColors.push({
    id: `col-${Date.now()}-${idxOffset}-${Math.random().toString(36).slice(2, 6)}`,
    variantId: id,
    name: 'Merah',
    hexCode: '#DC2626',
    secondaryHexCode: '#18181B',
    imageUrl: `/api/motor-studio?${params.toString()}`,
    isDefault: true,
  });

  db.creditSimulations.push(...buildDefaultCreditsForVariant(newVariant));
  return newVariant;
}
import {
  verifyPassword,
  hashPassword,
  signJwt,
  requireAdmin,
  AuthenticatedRequest,
} from './src/lib/auth.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON bodies up to 50MB for base64 image & Excel uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize DB from persistent cloud storage (Firestore) on server start
  await initCloudDatabase();

  // =====================================================================
  // 1. DYNAMIC STUDIO MOTORCYCLE RENDERER (COLOR-SPECIFIC VISUALS)
  // =====================================================================
  app.get('/api/motor-studio', (req, res) => {
    const model = String(req.query.model || 'Honda');
    const variant = String(req.query.variant || 'CBS');
    const color = String(req.query.color || 'Merah');
    const hex = String(req.query.hex || '#DC2626');
    const sec = String(req.query.sec || '#18181B');
    const cat = String(req.query.cat || 'Matic');

    const safePrimary = /^#[0-9A-Fa-f]{3,8}$/.test(hex) ? hex : '#DC2626';
    const safeSecondary = /^#[0-9A-Fa-f]{3,8}$/.test(sec) ? sec : '#18181B';
    const isLight = ['#ffffff', '#f8fafc', '#fef3c7', '#f5f5dc'].includes(safePrimary.toLowerCase());
    const bodyStroke = isLight ? '#94A3B8' : '#0F172A';

    const escapeXml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <radialGradient id="studioBg" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="65%" stop-color="#F1F5F9"/>
          <stop offset="100%" stop-color="#E2E8F0"/>
        </radialGradient>
        <linearGradient id="bodyPaint" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${safePrimary}"/>
          <stop offset="68%" stop-color="${safePrimary}"/>
          <stop offset="100%" stop-color="${safeSecondary}"/>
        </linearGradient>
        <linearGradient id="trimPaint" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#1E293B"/>
          <stop offset="100%" stop-color="#0F172A"/>
        </linearGradient>
      </defs>

      <!-- Studio Backdrop -->
      <rect width="800" height="600" fill="url(#studioBg)"/>
      <line x1="0" y1="455" x2="800" y2="455" stroke="#CBD5E1" stroke-width="1.5"/>
      <path d="M 110 455 Q 400 415 690 455" fill="none" stroke="${isLight ? '#DC2626' : safePrimary}" stroke-width="2.5" opacity="0.35"/>

      <!-- Floor Shadow -->
      <ellipse cx="400" cy="458" rx="245" ry="18" fill="#0F172A" opacity="0.18"/>
      <ellipse cx="400" cy="458" rx="180" ry="10" fill="#0F172A" opacity="0.24"/>

      <!-- Rear Wheel -->
      <g transform="translate(225, 378)">
        <circle cx="0" cy="0" r="76" fill="#0F172A"/>
        <circle cx="0" cy="0" r="56" fill="#334155"/>
        <circle cx="0" cy="0" r="46" fill="#E2E8F0"/>
        <circle cx="0" cy="0" r="18" fill="#1E293B"/>
        <line x1="-45" y1="0" x2="45" y2="0" stroke="#1E293B" stroke-width="7"/>
        <line x1="0" y1="-45" x2="0" y2="45" stroke="#1E293B" stroke-width="7"/>
        <line x1="-32" y1="-32" x2="32" y2="32" stroke="#1E293B" stroke-width="6"/>
      </g>

      <!-- Front Wheel -->
      <g transform="translate(575, 378)">
        <circle cx="0" cy="0" r="76" fill="#0F172A"/>
        <circle cx="0" cy="0" r="56" fill="#334155"/>
        <circle cx="0" cy="0" r="46" fill="#E2E8F0"/>
        <circle cx="0" cy="0" r="27" fill="none" stroke="#94A3B8" stroke-width="5" stroke-dasharray="10 6"/>
        <circle cx="0" cy="0" r="15" fill="#DC2626"/>
        <line x1="-45" y1="0" x2="45" y2="0" stroke="#1E293B" stroke-width="7"/>
        <line x1="0" y1="-45" x2="0" y2="45" stroke="#1E293B" stroke-width="7"/>
        <line x1="32" y1="-32" x2="-32" y2="32" stroke="#1E293B" stroke-width="6"/>
      </g>

      <!-- CVT & Exhaust -->
      <path d="M 155 378 L 300 378 L 315 342 L 150 338 Z" fill="#1E293B"/>
      <path d="M 250 364 L 135 316 L 126 332 L 242 382 Z" fill="#334155" stroke="#475569" stroke-width="2"/>
      <!-- Rear Suspension -->
      <line x1="215" y1="295" x2="205" y2="365" stroke="#DC2626" stroke-width="10" stroke-linecap="round"/>

      <!-- Underbody & Step Floor -->
      <path d="M 272 368 L 488 368 L 522 272 L 455 272 L 422 338 L 315 338 Z" fill="url(#trimPaint)"/>

      <!-- Rear Fairing in Selected Color -->
      <path d="M 150 254 Q 245 222 368 258 L 342 338 L 182 316 Z" fill="url(#bodyPaint)" stroke="${bodyStroke}" stroke-width="2.5"/>
      <!-- Graphic Stripe -->
      <path d="M 185 274 L 335 286 L 325 304 L 195 288 Z" fill="${safeSecondary}" opacity="0.82"/>

      <!-- Dual Ergonomic Seat -->
      <path d="M 172 246 Q 250 208 318 235 Q 365 250 390 245 L 368 272 L 168 262 Z" fill="#0F172A"/>
      <path d="M 172 246 L 125 232 L 136 248 L 172 258 Z" fill="#334155"/>

      <!-- Front Fairing & Aero Cowl in Selected Color -->
      <path d="M 432 340 L 486 170 L 558 188 L 592 274 L 508 360 Z" fill="url(#bodyPaint)" stroke="${bodyStroke}" stroke-width="2.5"/>
      <!-- Front Fender in Selected Color -->
      <path d="M 515 322 Q 578 290 634 336 L 608 354 Q 566 322 522 344 Z" fill="url(#bodyPaint)" stroke="${bodyStroke}" stroke-width="2"/>

      <!-- Front Telescopic Fork -->
      <line x1="518" y1="265" x2="575" y2="378" stroke="#475569" stroke-width="14" stroke-linecap="round"/>

      <!-- LED Headlight -->
      <polygon points="558,210 590,260 546,266" fill="#E0F2FE" stroke="#0284C7" stroke-width="2"/>

      <!-- Handlebar & Visor -->
      <path d="M 465 172 L 528 130 L 546 166 L 490 180 Z" fill="#0F172A" opacity="0.9"/>
      <line x1="444" y1="160" x2="488" y2="166" stroke="#0F172A" stroke-width="8" stroke-linecap="round"/>
      <circle cx="442" cy="132" r="12" fill="#1E293B"/>
      <line x1="450" y1="142" x2="466" y2="162" stroke="#334155" stroke-width="4"/>

      <!-- Top Left Studio Typography -->
      <g transform="translate(46, 52)">
        <text x="0" y="0" font-family="sans-serif" font-size="12" font-weight="700" fill="#DC2626" letter-spacing="1.5">PT SELAMAT LESTARI MANDIRI · ${escapeXml(cat.toUpperCase())}</text>
        <text x="0" y="32" font-family="sans-serif" font-size="26" font-weight="800" fill="#0F172A">${escapeXml(model)} — ${escapeXml(variant)}</text>
        <text x="0" y="56" font-family="sans-serif" font-size="15" font-weight="600" fill="#475569">Warna Terpilih: ${escapeXml(color)}</text>
      </g>

      <!-- Bottom Right Color Chip -->
      <g transform="translate(575, 510)">
        <rect x="0" y="0" width="180" height="44" rx="10" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
        <circle cx="24" cy="22" r="12" fill="${safePrimary}" stroke="#0F172A" stroke-width="1.5"/>
        <text x="46" y="27" font-family="sans-serif" font-size="13" font-weight="700" fill="#0F172A">${escapeXml(color.slice(0, 16))}</text>
      </g>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  });

  // Serve uploaded images stored in DB / Cloud Firestore
  app.get('/api/uploads/:id', async (req, res) => {
    try {
      const item = await getUploadByIdAsync(req.params.id);
      if (!item) {
        return res.status(404).send('Image not found');
      }
      const matches = item.dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).send('Invalid image encoding');
      }
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(buffer);
    } catch (err) {
      console.error('Error serving upload:', err);
      res.status(500).send('Failed to load image');
    }
  });

  // =====================================================================
  // 2. PUBLIC ENDPOINTS
  // =====================================================================
  app.get('/api/bootstrap', (_req, res) => {
    try {
      const data = getPublicBootstrapData();
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.json(data);
    } catch (err) {
      console.error('Error loading bootstrap data:', err);
      res.status(500).json({ error: 'Terjadi kesalahan saat memuat data website.' });
    }
  });

  // Requirement 11 & 41: Exact Credit Simulation Database Lookup (1 data per Type, independent of color)
  app.get('/api/credit-lookup', (req, res) => {
    try {
      const modelId = String(req.query.modelId || '');
      const variantId = String(req.query.variantId || '');
      const dp = Number(req.query.dp || 0);
      const tenor = String(req.query.tenor || '');

      if (!variantId || !tenor) {
        return res.status(400).json({
          found: false,
          message: 'Silakan lengkapi pilihan Tipe Motor dan Tenor terlebih dahulu.',
        });
      }

      const db = getDb();

      // Match by variantId (all colors in one type have identical DP, OTR, and Tenor installments)
      const matchedRow = db.creditSimulations.find(
        (cs) =>
          cs.variantId === variantId &&
          (!modelId || cs.modelId === modelId) &&
          (!dp || cs.dp === dp)
      ) || db.creditSimulations.find((cs) => cs.variantId === variantId);

      if (!matchedRow || !matchedRow.installments[tenor] || matchedRow.installments[tenor] <= 0) {
        return res.json({
          found: false,
          message: 'Simulasi untuk kombinasi tersebut belum tersedia. Silakan hubungi kami melalui WhatsApp.',
        });
      }

      return res.json({
        found: true,
        dp: matchedRow.dp,
        otr: matchedRow.otr,
        tenor: Number(tenor),
        installment: matchedRow.installments[tenor],
      });
    } catch (err) {
      console.error('Credit lookup error:', err);
      res.status(500).json({
        found: false,
        message: 'Terjadi kesalahan saat mencari simulasi kredit. Silakan coba lagi.',
      });
    }
  });

  // Download Excel Template (Public/Admin accessible so admin can download easily)
  app.get('/api/template-excel', (_req, res) => {
    try {
      const buffer = generateExcelTemplateBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Template_Kredit_Honda_Parungkuda.xlsx"');
      res.send(buffer);
    } catch (err) {
      console.error('Failed to generate template Excel:', err);
      res.status(500).json({ error: 'Gagal membuat file template Excel.' });
    }
  });

  // =====================================================================
  // 3. AUTHENTICATION ENDPOINTS
  // =====================================================================
  app.post('/api/auth/login', (req, res) => {
    try {
      const username = String(req.body?.username || '').trim();
      const password = String(req.body?.password || '');

      if (!username || !password) {
        return res.status(400).json({ error: 'User ID dan Password wajib diisi.' });
      }

      const db = getDb();
      const user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
        return res.status(401).json({ error: 'User ID atau Password salah. Silakan periksa kembali.' });
      }

      const token = signJwt({ sub: user.id, username: user.username, role: user.role });
      return res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Terjadi kesalahan saat proses login.' });
    }
  });

  app.get('/api/auth/me', requireAdmin, (req: AuthenticatedRequest, res) => {
    res.json({
      user: {
        id: req.adminUser!.sub,
        username: req.adminUser!.username,
        role: req.adminUser!.role,
      },
    });
  });

  app.put('/api/auth/credentials', requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const newUsername = String(req.body?.newUsername || '').trim();
      const newPassword = String(req.body?.newPassword || '');

      if (!newUsername || newUsername.length < 3) {
        return res.status(400).json({ error: 'User ID baru minimal harus 3 karakter.' });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password baru minimal harus 6 karakter.' });
      }

      const db = getDb();
      const user = db.users[0];
      const { hash, salt } = hashPassword(newPassword);
      user.username = newUsername;
      user.passwordHash = hash;
      user.salt = salt;
      await saveDbAsync();

      const token = signJwt({ sub: user.id, username: user.username, role: user.role });
      res.json({
        message: 'Kredensial Admin berhasil diperbarui secara permanen.',
        token,
        user: { id: user.id, username: user.username, role: user.role },
      });
    } catch (err) {
      console.error('Update credentials error:', err);
      res.status(500).json({ error: 'Gagal memperbarui kredensial Admin.' });
    }
  });

  // =====================================================================
  // 4. PROTECTED ADMIN ENDPOINTS
  // =====================================================================

  // Image Upload Endpoint (JPG, JPEG, PNG, WEBP validation with high capacity support)
  app.post('/api/admin/upload', requireAdmin, async (req, res) => {
    try {
      const { filename, mimeType, dataUrl } = req.body || {};
      if (!dataUrl || typeof dataUrl !== 'string') {
        return res.status(400).json({ error: 'Foto gagal diupload: data gambar kosong.' });
      }

      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/avif',
        'image/gif',
      ];
      const detectedMime = String(mimeType || 'image/webp').toLowerCase();
      if (!allowedMimeTypes.includes(detectedMime) && !detectedMime.startsWith('image/')) {
        return res.status(400).json({
          error: 'Format gambar tidak didukung. Gunakan file JPG, JPEG, PNG, atau WEBP.',
        });
      }

      // Check approximate size (limit 25MB)
      const commaIdx = dataUrl.indexOf(',');
      const base64Length = commaIdx >= 0 ? dataUrl.length - (commaIdx + 1) : dataUrl.length;
      const sizeInBytes = (base64Length * 3) / 4;
      if (sizeInBytes > 25 * 1024 * 1024) {
        return res.status(400).json({
          error: 'Ukuran file gambar terlalu besar. Maksimal 25 MB.',
        });
      }

      const db = getDb();
      const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      db.uploads.push({
        id,
        filename: String(filename || 'image.webp'),
        mimeType: detectedMime,
        dataUrl,
        createdAt: new Date().toISOString(),
      });
      await saveDbAsync();

      res.json({
        url: `/api/uploads/${id}`,
        message: 'Gambar berhasil diupload dan disimpan permanen.',
      });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Foto gagal diupload. Silakan coba lagi.' });
    }
  });

  // Site Settings Update
  app.put('/api/admin/settings', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      db.siteSettings = {
        ...db.siteSettings,
        ...req.body,
      };
      await saveDbAsync();
      res.json({ siteSettings: db.siteSettings, message: 'Pengaturan website berhasil disimpan secara permanen.' });
    } catch (err) {
      console.error('Save settings error:', err);
      res.status(500).json({ error: 'Gagal menyimpan pengaturan website.' });
    }
  });

  // Motor Models CRUD (with support for Jumlah Tipe & Nama Tipe creation/editing)
  app.post('/api/admin/models', requireAdmin, async (req, res) => {
    try {
      const { name, category, tagline, description, isFeatured, variants } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: 'Nama model motor wajib diisi.' });
      }
      const db = getDb();
      const id = `model-${Date.now()}`;
      const slug = String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const newModel: MotorModel = {
        id,
        brand: 'Honda',
        name: String(name).trim(),
        slug,
        category: category || 'Matic',
        tagline: String(tagline || '').trim(),
        description: String(description || '').trim(),
        isFeatured: Boolean(isFeatured ?? true),
        sortOrder: db.motorModels.length + 1,
      };
      db.motorModels.push(newModel);

      // Create initial types (variants) if provided
      if (Array.isArray(variants) && variants.length > 0) {
        variants.forEach((vItem: any, idx: number) => {
          const rawName = typeof vItem === 'string' ? vItem : vItem?.name;
          const vName = String(rawName || '').trim() || `${newModel.name} Tipe ${idx + 1}`;
          const vOtr = Number(vItem?.otrPrice) > 0 ? Number(vItem.otrPrice) : 19000000;
          createVariantWithDefaults(db, newModel, vName, vOtr, idx);
        });
      }

      await saveDbAsync();
      res.json({ model: newModel, message: 'Model motor beserta tipe berhasil ditambahkan secara permanen.' });
    } catch (err) {
      console.error('Add model error:', err);
      res.status(500).json({ error: 'Gagal menambahkan model motor.' });
    }
  });

  app.put('/api/admin/models/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const modelId = req.params.id;
      const idx = db.motorModels.findIndex((m) => m.id === modelId);
      if (idx === -1) return res.status(404).json({ error: 'Model motor tidak ditemukan.' });

      const { variants, ...modelFields } = req.body || {};

      db.motorModels[idx] = {
        ...db.motorModels[idx],
        ...modelFields,
        id: modelId,
      };
      const updatedModel = db.motorModels[idx];

      // If variants list is included, synchronize the model's types (count & names)
      if (Array.isArray(variants)) {
        const existingModelVariants = db.motorVariants.filter((v) => v.modelId === modelId);
        const usedExistingIds = new Set<string>();
        const keptVariantIds = new Set<string>();

        variants.forEach((vItem: any, vIdx: number) => {
          const rawName = typeof vItem === 'string' ? vItem : vItem?.name;
          const cleanName = String(rawName || '').trim() || `${updatedModel.name} Tipe ${vIdx + 1}`;
          const requestedId = typeof vItem === 'object' && vItem?.id ? String(vItem.id) : '';

          let targetVar = requestedId
            ? existingModelVariants.find((ev) => ev.id === requestedId && !usedExistingIds.has(ev.id))
            : undefined;

          if (!targetVar && vIdx < existingModelVariants.length) {
            const positionalCandidate = existingModelVariants[vIdx];
            if (positionalCandidate && !usedExistingIds.has(positionalCandidate.id)) {
              targetVar = positionalCandidate;
            }
          }

          if (targetVar) {
            usedExistingIds.add(targetVar.id);
            keptVariantIds.add(targetVar.id);
            targetVar.name = cleanName;
            targetVar.code = cleanName.toUpperCase().replace(/[^A-Z0-9]+/g, '-');
            if (vItem?.otrPrice !== undefined && Number(vItem.otrPrice) > 0) {
              targetVar.otrPrice = Number(vItem.otrPrice);
              db.creditSimulations.forEach((cs) => {
                if (cs.variantId === targetVar!.id) {
                  cs.otr = targetVar!.otrPrice;
                }
              });
            }
            if (!db.creditSimulations.some((cs) => cs.variantId === targetVar!.id)) {
              db.creditSimulations.push(...buildDefaultCreditsForVariant(targetVar));
            }
          } else {
            const defaultOtr =
              Number(vItem?.otrPrice) > 0
                ? Number(vItem.otrPrice)
                : existingModelVariants[0]?.otrPrice || 19000000;
            const created = createVariantWithDefaults(db, updatedModel, cleanName, defaultOtr, vIdx);
            keptVariantIds.add(created.id);
          }
        });

        // Remove any variants of this model that were removed when reducing Jumlah Tipe
        const removedVariantIds = existingModelVariants
          .filter((ev) => !keptVariantIds.has(ev.id))
          .map((ev) => ev.id);

        if (removedVariantIds.length > 0) {
          db.motorVariants = db.motorVariants.filter((v) => !removedVariantIds.includes(v.id));
          db.motorColors = db.motorColors.filter((c) => !removedVariantIds.includes(c.variantId));
          db.motorImages = db.motorImages.filter((img) => !removedVariantIds.includes(img.variantId));
          db.motorSpecs = db.motorSpecs.filter((s) => !removedVariantIds.includes(s.variantId));
          db.creditSimulations = db.creditSimulations.filter(
            (cs) => !removedVariantIds.includes(cs.variantId)
          );
        }
      }

      await saveDbAsync();
      res.json({
        model: updatedModel,
        message: 'Data model motor dan jumlah/nama tipe berhasil diperbarui secara permanen.',
      });
    } catch (err) {
      console.error('Update model error:', err);
      res.status(500).json({ error: 'Gagal memperbarui model motor.' });
    }
  });

  app.delete('/api/admin/models/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const modelId = req.params.id;
      const variantIds = db.motorVariants.filter((v) => v.modelId === modelId).map((v) => v.id);

      db.motorModels = db.motorModels.filter((m) => m.id !== modelId);
      db.motorVariants = db.motorVariants.filter((v) => v.modelId !== modelId);
      db.motorColors = db.motorColors.filter((c) => !variantIds.includes(c.variantId));
      db.motorImages = db.motorImages.filter((img) => !variantIds.includes(img.variantId));
      db.motorSpecs = db.motorSpecs.filter((s) => !variantIds.includes(s.variantId));
      db.creditSimulations = db.creditSimulations.filter((cs) => cs.modelId !== modelId);
      await saveDbAsync();
      res.json({ message: 'Model motor beserta varian terkait berhasil dihapus secara permanen.' });
    } catch (err) {
      console.error('Delete model error:', err);
      res.status(500).json({ error: 'Gagal menghapus model motor.' });
    }
  });

  // Motor Variants CRUD
  app.post('/api/admin/variants', requireAdmin, async (req, res) => {
    try {
      const { modelId, name, code, otrPrice, status, promoBadge } = req.body || {};
      if (!modelId || !name || !otrPrice) {
        return res.status(400).json({ error: 'Model, Nama Tipe, dan Harga OTR wajib diisi.' });
      }
      const db = getDb();
      const model = db.motorModels.find((m) => m.id === modelId);
      if (!model) return res.status(404).json({ error: 'Model motor tidak ditemukan.' });

      const id = `var-${Date.now()}`;
      const newVariant = {
        id,
        modelId,
        name: String(name).trim(),
        code: String(code || name).toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
        otrPrice: Number(otrPrice),
        status: (status === 'INDENT' ? 'INDENT' : 'READY') as 'READY' | 'INDENT',
        promoBadge: String(promoBadge || '').trim(),
        isActive: true,
      };
      db.motorVariants.push(newVariant);

      // Create default spec & default color so variant is immediately usable
      db.motorSpecs.push({
        id: `spec-${id}`,
        variantId: id,
        engineType: '4-Langkah, eSP',
        displacement: '110 - 160 cc',
        transmission: 'Otomatis, V-Matic',
        maxPower: '-',
        maxTorque: '-',
        dimension: '-',
        weight: '-',
        tankCapacity: '4,2 - 5,5 Liter',
        frameType: 'eSAF / Double Cradle',
        brakeSystem: 'Combi Brake System (CBS)',
        tireSize: 'Tubeless',
        batteryType: 'MF 12V - 5Ah',
        features: 'Full LED Headlight, Digital Panel Meter',
        extraNotes: 'Garansi Rangka 5 Tahun Resmi Honda',
      });

      const params = new URLSearchParams({
        model: model.name,
        variant: newVariant.name,
        color: 'Merah',
        hex: '#DC2626',
        sec: '#18181B',
        cat: model.category,
      });

      db.motorColors.push({
        id: `col-${Date.now()}`,
        variantId: id,
        name: 'Merah',
        hexCode: '#DC2626',
        secondaryHexCode: '#18181B',
        imageUrl: `/api/motor-studio?${params.toString()}`,
        isDefault: true,
      });

      db.creditSimulations.push(...buildDefaultCreditsForVariant(newVariant));

      await saveDbAsync();
      res.json({ variant: newVariant, message: 'Tipe/Varian motor berhasil ditambahkan secara permanen.' });
    } catch (err) {
      console.error('Add variant error:', err);
      res.status(500).json({ error: 'Gagal menambahkan tipe motor.' });
    }
  });

  app.put('/api/admin/variants/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const idx = db.motorVariants.findIndex((v) => v.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Tipe motor tidak ditemukan.' });

      const updatedOtr = req.body.otrPrice !== undefined ? Number(req.body.otrPrice) : db.motorVariants[idx].otrPrice;
      db.motorVariants[idx] = {
        ...db.motorVariants[idx],
        ...req.body,
        otrPrice: updatedOtr,
        id: req.params.id,
      };

      // Sync OTR in creditSimulations for this variant
      if (req.body.otrPrice !== undefined) {
        db.creditSimulations.forEach((cs) => {
          if (cs.variantId === req.params.id) {
            cs.otr = updatedOtr;
          }
        });
      }

      await saveDbAsync();
      res.json({ variant: db.motorVariants[idx], message: 'Tipe motor berhasil diperbarui secara permanen.' });
    } catch (err) {
      console.error('Update variant error:', err);
      res.status(500).json({ error: 'Gagal memperbarui tipe motor.' });
    }
  });

  app.delete('/api/admin/variants/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const varId = req.params.id;
      db.motorVariants = db.motorVariants.filter((v) => v.id !== varId);
      db.motorColors = db.motorColors.filter((c) => c.variantId !== varId);
      db.motorImages = db.motorImages.filter((img) => img.variantId !== varId);
      db.motorSpecs = db.motorSpecs.filter((s) => s.variantId !== varId);
      db.creditSimulations = db.creditSimulations.filter((cs) => cs.variantId !== varId);
      await saveDbAsync();
      res.json({ message: 'Tipe motor berhasil dihapus secara permanen.' });
    } catch (err) {
      console.error('Delete variant error:', err);
      res.status(500).json({ error: 'Gagal menghapus tipe motor.' });
    }
  });

  // Motor Specs Update
  app.put('/api/admin/specs/:variantId', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const variantId = req.params.variantId;
      const idx = db.motorSpecs.findIndex((s) => s.variantId === variantId);
      if (idx === -1) {
        const newSpec = {
          id: `spec-${variantId}`,
          variantId,
          engineType: '',
          displacement: '',
          transmission: '',
          maxPower: '',
          maxTorque: '',
          dimension: '',
          weight: '',
          tankCapacity: '',
          frameType: '',
          brakeSystem: '',
          tireSize: '',
          batteryType: '',
          features: '',
          extraNotes: '',
          ...req.body,
        };
        db.motorSpecs.push(newSpec);
        await saveDbAsync();
        return res.json({ spec: newSpec, message: 'Spesifikasi motor berhasil disimpan secara permanen.' });
      }
      db.motorSpecs[idx] = {
        ...db.motorSpecs[idx],
        ...req.body,
        variantId,
      };
      await saveDbAsync();
      res.json({ spec: db.motorSpecs[idx], message: 'Spesifikasi motor berhasil diperbarui secara permanen.' });
    } catch (err) {
      console.error('Update spec error:', err);
      res.status(500).json({ error: 'Gagal menyimpan spesifikasi motor.' });
    }
  });

  // Motor Colors CRUD
  app.post('/api/admin/colors', requireAdmin, async (req, res) => {
    try {
      const { variantId, name, hexCode, secondaryHexCode, imageUrl, isDefault } = req.body || {};
      if (!variantId || !name) {
        return res.status(400).json({ error: 'Tipe motor dan nama warna wajib diisi.' });
      }
      const db = getDb();
      const variant = db.motorVariants.find((v) => v.id === variantId);
      if (!variant) return res.status(404).json({ error: 'Tipe motor tidak ditemukan.' });
      const model = db.motorModels.find((m) => m.id === variant.modelId);

      const safeHex = hexCode || '#DC2626';
      const safeSec = secondaryHexCode || '#18181B';
      const params = new URLSearchParams({
        model: model?.name || 'Honda',
        variant: variant.name,
        color: String(name).trim(),
        hex: safeHex,
        sec: safeSec,
        cat: model?.category || 'Matic',
      });

      const finalImageUrl =
        imageUrl && String(imageUrl).trim()
          ? String(imageUrl).trim()
          : `/api/motor-studio?${params.toString()}`;

      if (isDefault) {
        db.motorColors.forEach((c) => {
          if (c.variantId === variantId) c.isDefault = false;
        });
      }

      const newColor = {
        id: `col-${Date.now()}`,
        variantId,
        name: String(name).trim(),
        hexCode: safeHex,
        secondaryHexCode: safeSec,
        imageUrl: finalImageUrl,
        isDefault: Boolean(isDefault),
      };
      db.motorColors.push(newColor);
      await saveDbAsync();
      res.json({ color: newColor, message: 'Warna motor berhasil ditambahkan secara permanen.' });
    } catch (err) {
      console.error('Add color error:', err);
      res.status(500).json({ error: 'Gagal menambahkan warna motor.' });
    }
  });

  app.put('/api/admin/colors/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const idx = db.motorColors.findIndex((c) => c.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Warna tidak ditemukan.' });

      const targetVariantId = db.motorColors[idx].variantId;
      if (req.body.isDefault) {
        db.motorColors.forEach((c) => {
          if (c.variantId === targetVariantId) c.isDefault = false;
        });
      }

      db.motorColors[idx] = {
        ...db.motorColors[idx],
        ...req.body,
        id: req.params.id,
      };
      await saveDbAsync();
      res.json({ color: db.motorColors[idx], message: 'Data warna & foto berhasil diperbarui secara permanen.' });
    } catch (err) {
      console.error('Update color error:', err);
      res.status(500).json({ error: 'Gagal memperbarui warna motor.' });
    }
  });

  app.delete('/api/admin/colors/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const colId = req.params.id;
      db.motorColors = db.motorColors.filter((c) => c.id !== colId);
      db.creditSimulations = db.creditSimulations.filter((cs) => cs.colorId !== colId);
      await saveDbAsync();
      res.json({ message: 'Warna motor berhasil dihapus secara permanen.' });
    } catch (err) {
      console.error('Delete color error:', err);
      res.status(500).json({ error: 'Gagal menghapus warna motor.' });
    }
  });

  // Tenors CRUD
  app.post('/api/admin/tenors', requireAdmin, async (req, res) => {
    try {
      const months = Number(req.body?.months || 0);
      if (!months || months <= 0 || months > 120) {
        return res.status(400).json({ error: 'Jumlah bulan tenor tidak valid.' });
      }
      const db = getDb();
      if (db.tenors.some((t) => t.months === months)) {
        return res.status(400).json({ error: `Tenor ${months} bulan sudah terdaftar.` });
      }
      const newTenor = {
        id: `tenor-${months}`,
        months,
        label: String(req.body?.label || `${months} Bulan`),
        isActive: true,
      };
      db.tenors.push(newTenor);
      await saveDbAsync();
      res.json({ tenor: newTenor, message: `Tenor ${months} bulan berhasil ditambahkan secara permanen.` });
    } catch (err) {
      console.error('Add tenor error:', err);
      res.status(500).json({ error: 'Gagal menambahkan tenor.' });
    }
  });

  app.put('/api/admin/tenors/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const idx = db.tenors.findIndex((t) => t.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Tenor tidak ditemukan.' });
      db.tenors[idx] = {
        ...db.tenors[idx],
        ...req.body,
        id: req.params.id,
      };
      await saveDbAsync();
      res.json({ tenor: db.tenors[idx], message: 'Tenor berhasil diperbarui secara permanen.' });
    } catch (err) {
      console.error('Update tenor error:', err);
      res.status(500).json({ error: 'Gagal memperbarui tenor.' });
    }
  });

  app.delete('/api/admin/tenors/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      db.tenors = db.tenors.filter((t) => t.id !== req.params.id);
      await saveDbAsync();
      res.json({ message: 'Tenor berhasil dihapus secara permanen.' });
    } catch (err) {
      console.error('Delete tenor error:', err);
      res.status(500).json({ error: 'Gagal menghapus tenor.' });
    }
  });

  // Batch Update Credit Simulations for a Variant (Multiple DP options: 1 to 10+ rows per Tipe Motor)
  app.put('/api/admin/credits/variant/:variantId', requireAdmin, async (req, res) => {
    try {
      const variantId = req.params.variantId;
      const { otr, dpRows } = req.body || {};
      if (!variantId || !Array.isArray(dpRows) || dpRows.length === 0) {
        return res.status(400).json({ error: 'Pilih Tipe Motor dan minimal 1 baris pilihan DP.' });
      }

      const db = getDb();
      const variant = db.motorVariants.find((v) => v.id === variantId);
      if (!variant) {
        return res.status(404).json({ error: 'Tipe motor tidak ditemukan.' });
      }

      const safeOtr = Number(otr) > 0 ? Number(otr) : variant.otrPrice;
      variant.otrPrice = safeOtr;

      // Deduplicate by DP and sort ascending (smaller DP to larger DP)
      const byDp = new Map<number, CreditSimulation>();
      dpRows.slice(0, 15).forEach((row: any, idx: number) => {
        const dpVal = Number(row?.dp);
        if (!dpVal || dpVal <= 0) return;
        const cleanedInstallments: Record<string, number> = {};
        if (row?.installments && typeof row.installments === 'object') {
          for (const [k, v] of Object.entries(row.installments)) {
            const num = Number(v);
            if (num > 0) {
              cleanedInstallments[String(k)] = num;
            }
          }
        }
        const rowId =
          row?.id && String(row.id).trim()
            ? String(row.id).trim()
            : `cred-${variantId}-dp-${dpVal}-${idx}`;

        byDp.set(dpVal, {
          id: rowId,
          modelId: variant.modelId,
          variantId,
          colorId: 'ALL',
          colorName: 'Semua Warna',
          dp: dpVal,
          otr: safeOtr,
          installments: cleanedInstallments,
        });
      });

      if (byDp.size === 0) {
        return res.status(400).json({ error: 'Masukkan minimal 1 nominal Pilihan DP yang valid.' });
      }

      const newVariantCredits = Array.from(byDp.values()).sort((a, b) => a.dp - b.dp);

      // Replace creditSimulations for this variantId while preserving order of other variants
      const otherCredits = db.creditSimulations.filter((cs) => cs.variantId !== variantId);
      db.creditSimulations = [...otherCredits, ...newVariantCredits];

      await saveDbAsync();
      res.json({
        credits: newVariantCredits,
        message: `Berhasil menyimpan ${newVariantCredits.length} pilihan DP & angsuran untuk tipe ${variant.name} secara permanen.`,
      });
    } catch (err) {
      console.error('Batch update variant credits error:', err);
      res.status(500).json({ error: 'Gagal menyimpan daftar pilihan DP.' });
    }
  });

  // Manual Credit Simulations CRUD (Multiple DP options per Tipe Motor — berlaku untuk semua warna di tipe tersebut)
  app.post('/api/admin/credits', requireAdmin, async (req, res) => {
    try {
      const { modelId, variantId, dp, otr, installments } = req.body || {};
      if (!variantId || !dp || !otr) {
        return res.status(400).json({ error: 'Tipe Motor, DP, dan OTR wajib diisi.' });
      }
      const db = getDb();
      const variant = db.motorVariants.find((v) => v.id === variantId);
      const resolvedModelId = variant?.modelId || modelId || '';
      const dpNum = Number(dp);
      const otrNum = Number(otr);

      // Sync variant OTR price and all DP rows of this variant so OTR is consistent
      if (variant && otrNum > 0) {
        variant.otrPrice = otrNum;
      }
      db.creditSimulations.forEach((cs) => {
        if (cs.variantId === variantId && otrNum > 0) {
          cs.otr = otrNum;
        }
      });

      const existingIdx = db.creditSimulations.findIndex(
        (cs) => cs.variantId === variantId && cs.dp === dpNum
      );

      if (existingIdx !== -1) {
        db.creditSimulations[existingIdx] = {
          ...db.creditSimulations[existingIdx],
          modelId: resolvedModelId,
          variantId,
          colorId: 'ALL',
          colorName: 'Semua Warna',
          dp: dpNum,
          otr: otrNum,
          installments: installments || {},
        };
        await saveDbAsync();
        return res.json({
          credit: db.creditSimulations[existingIdx],
          message: 'Pilihan DP & angsuran untuk tipe motor ini berhasil diperbarui secara permanen.',
        });
      }

      const newCredit: CreditSimulation = {
        id: `cred-${variantId}-dp-${dpNum}`,
        modelId: resolvedModelId,
        variantId,
        colorId: 'ALL',
        colorName: 'Semua Warna',
        dp: dpNum,
        otr: otrNum,
        installments: installments || {},
      };
      db.creditSimulations.push(newCredit);
      await saveDbAsync();
      res.json({ credit: newCredit, message: 'Pilihan DP baru berhasil ditambahkan secara permanen.' });
    } catch (err) {
      console.error('Add credit error:', err);
      res.status(500).json({ error: 'Gagal menyimpan data kredit.' });
    }
  });

  app.put('/api/admin/credits/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const idx = db.creditSimulations.findIndex((cs) => cs.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Data kredit tidak ditemukan.' });

      const targetVariantId = req.body.variantId || db.creditSimulations[idx].variantId;
      const variant = db.motorVariants.find((v) => v.id === targetVariantId);
      const updatedOtr = Number(req.body.otr ?? db.creditSimulations[idx].otr);
      const updatedDp = Number(req.body.dp ?? db.creditSimulations[idx].dp);

      if (variant && updatedOtr > 0) {
        variant.otrPrice = updatedOtr;
      }

      db.creditSimulations[idx] = {
        ...db.creditSimulations[idx],
        ...req.body,
        modelId: variant?.modelId || req.body.modelId || db.creditSimulations[idx].modelId,
        variantId: targetVariantId,
        dp: updatedDp,
        otr: updatedOtr,
        colorId: 'ALL',
        colorName: 'Semua Warna',
        id: req.params.id,
      };

      // Sync OTR across all DP options of this variant
      db.creditSimulations.forEach((cs) => {
        if (cs.variantId === targetVariantId && updatedOtr > 0) {
          cs.otr = updatedOtr;
        }
      });

      // Deduplicate only if another row has the exact same variantId AND dp
      const updatedRecord = db.creditSimulations[idx];
      db.creditSimulations = db.creditSimulations.filter(
        (cs) =>
          cs.variantId !== targetVariantId ||
          cs.dp !== updatedDp ||
          cs.id === updatedRecord.id
      );

      await saveDbAsync();
      res.json({
        credit: updatedRecord,
        message: 'Data pilihan DP & angsuran berhasil diperbarui secara permanen.',
      });
    } catch (err) {
      console.error('Update credit error:', err);
      res.status(500).json({ error: 'Gagal memperbarui data kredit.' });
    }
  });

  app.delete('/api/admin/credits/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      db.creditSimulations = db.creditSimulations.filter((cs) => cs.id !== req.params.id);
      await saveDbAsync();
      res.json({ message: 'Data kredit berhasil dihapus secara permanen.' });
    } catch (err) {
      console.error('Delete credit error:', err);
      res.status(500).json({ error: 'Gagal menghapus data kredit.' });
    }
  });

  // Excel Import & Export Backup
  app.post('/api/admin/credits/import-excel', requireAdmin, async (req, res) => {
    try {
      const { base64Data } = req.body || {};
      if (!base64Data || typeof base64Data !== 'string') {
        return res.status(400).json({
          success: false,
          importedCount: 0,
          updatedCount: 0,
          errors: [{ row: 1, message: 'File Excel belum dipilih atau kosong.' }],
          message: 'File Excel kosong.',
        });
      }
      const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const result = await importCreditsFromExcelBuffer(buffer);
      res.status(result.success ? 200 : 400).json(result);
    } catch (err) {
      console.error('Excel import error:', err);
      res.status(500).json({
        success: false,
        importedCount: 0,
        updatedCount: 0,
        errors: [{ row: 1, message: 'Terjadi kesalahan saat membaca file Excel.' }],
        message: 'Format Excel tidak sesuai template.',
      });
    }
  });

  app.get('/api/admin/credits/export-excel', requireAdmin, (_req, res) => {
    try {
      const buffer = generateBackupExcelBuffer();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Backup_Katalog_Kredit_Honda_Parungkuda.xlsx"');
      res.send(buffer);
    } catch (err) {
      console.error('Backup Excel error:', err);
      res.status(500).json({ error: 'Gagal mengekspor backup Excel.' });
    }
  });

  // Promos CRUD
  app.post('/api/admin/promos', requireAdmin, async (req, res) => {
    try {
      const { title, description, period, highlightText, imageUrl, whatsappText, linkUrl, isActive } = req.body || {};
      if (!title || !description) {
        return res.status(400).json({ error: 'Judul dan deskripsi promo wajib diisi.' });
      }
      const db = getDb();
      const newPromo = {
        id: `promo-${Date.now()}`,
        title: String(title).trim(),
        description: String(description).trim(),
        period: String(period || 'Periode Terbatas').trim(),
        highlightText: String(highlightText || 'Promo Spesial Honda').trim(),
        imageUrl: String(imageUrl || '/src/assets/images/motor_matic_sporty_red_1790867362954.jpg'),
        whatsappText: String(whatsappText || `Assalamualaikum Pak Zaenal, saya ingin info promo: ${title}`),
        linkUrl: String(linkUrl || '#simulasi'),
        isActive: Boolean(isActive ?? true),
        createdAt: new Date().toISOString(),
      };
      db.promos.unshift(newPromo);
      await saveDbAsync();
      res.json({ promo: newPromo, message: 'Promo berhasil ditambahkan secara permanen.' });
    } catch (err) {
      console.error('Add promo error:', err);
      res.status(500).json({ error: 'Gagal menambahkan promo.' });
    }
  });

  app.put('/api/admin/promos/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const idx = db.promos.findIndex((p) => p.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Promo tidak ditemukan.' });
      db.promos[idx] = {
        ...db.promos[idx],
        ...req.body,
        id: req.params.id,
      };
      await saveDbAsync();
      res.json({ promo: db.promos[idx], message: 'Promo berhasil diperbarui secara permanen.' });
    } catch (err) {
      console.error('Update promo error:', err);
      res.status(500).json({ error: 'Gagal memperbarui promo.' });
    }
  });

  app.delete('/api/admin/promos/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      db.promos = db.promos.filter((p) => p.id !== req.params.id);
      await saveDbAsync();
      res.json({ message: 'Promo berhasil dihapus secara permanen.' });
    } catch (err) {
      console.error('Delete promo error:', err);
      res.status(500).json({ error: 'Gagal menghapus promo.' });
    }
  });

  // Articles (Tips & Panduan) CRUD
  app.post('/api/admin/articles', requireAdmin, async (req, res) => {
    try {
      const { title, category, summary, content, imageUrl, publishedDate, isPublished } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ error: 'Judul dan isi artikel wajib diisi.' });
      }
      const db = getDb();
      const slug = String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const newArticle = {
        id: `art-${Date.now()}`,
        title: String(title).trim(),
        slug,
        category: String(category || 'Tips & Panduan').trim(),
        summary: String(summary || String(content).slice(0, 140) + '...').trim(),
        content: String(content).trim(),
        imageUrl: String(imageUrl || '/src/assets/images/hero_honda_showroom_1790867348852.jpg'),
        publishedDate: String(publishedDate || new Date().toISOString().slice(0, 10)),
        isPublished: Boolean(isPublished ?? true),
      };
      db.articles.unshift(newArticle);
      await saveDbAsync();
      res.json({ article: newArticle, message: 'Artikel panduan berhasil ditambahkan secara permanen.' });
    } catch (err) {
      console.error('Add article error:', err);
      res.status(500).json({ error: 'Gagal menambahkan artikel.' });
    }
  });

  app.put('/api/admin/articles/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const idx = db.articles.findIndex((a) => a.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Artikel tidak ditemukan.' });
      db.articles[idx] = {
        ...db.articles[idx],
        ...req.body,
        id: req.params.id,
      };
      await saveDbAsync();
      res.json({ article: db.articles[idx], message: 'Artikel berhasil diperbarui secara permanen.' });
    } catch (err) {
      console.error('Update article error:', err);
      res.status(500).json({ error: 'Gagal memperbarui artikel.' });
    }
  });

  app.delete('/api/admin/articles/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      db.articles = db.articles.filter((a) => a.id !== req.params.id);
      await saveDbAsync();
      res.json({ message: 'Artikel berhasil dihapus secara permanen.' });
    } catch (err) {
      console.error('Delete article error:', err);
      res.status(500).json({ error: 'Gagal menghapus artikel.' });
    }
  });

  // Testimonials CRUD
  app.post('/api/admin/testimonials', requireAdmin, async (req, res) => {
    try {
      const {
        customerName,
        customerLocation,
        motorName,
        handoverDate,
        caption,
        customerPhotoUrl,
        handoverPhotoUrl,
        isPublished,
      } = req.body || {};
      if (!customerName || !motorName || !caption) {
        return res.status(400).json({ error: 'Nama konsumen, motor, dan keterangan testimoni wajib diisi.' });
      }
      const db = getDb();
      const photo = String(handoverPhotoUrl || customerPhotoUrl || '/src/assets/images/dealer_showroom_handover_1790867406762.jpg');
      const newTestimonial = {
        id: `testi-${Date.now()}`,
        customerName: String(customerName).trim(),
        customerLocation: String(customerLocation || 'Sukabumi').trim(),
        motorName: String(motorName).trim(),
        handoverDate: String(handoverDate || new Date().toISOString().slice(0, 10)),
        caption: String(caption).trim(),
        customerPhotoUrl: String(customerPhotoUrl || photo),
        handoverPhotoUrl: photo,
        isPublished: Boolean(isPublished ?? true),
      };
      db.testimonials.unshift(newTestimonial);
      await saveDbAsync();
      res.json({ testimonial: newTestimonial, message: 'Testimoni serah terima berhasil ditambahkan secara permanen.' });
    } catch (err) {
      console.error('Add testimonial error:', err);
      res.status(500).json({ error: 'Gagal menambahkan testimoni.' });
    }
  });

  app.put('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      const idx = db.testimonials.findIndex((t) => t.id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Testimoni tidak ditemukan.' });
      db.testimonials[idx] = {
        ...db.testimonials[idx],
        ...req.body,
        id: req.params.id,
      };
      await saveDbAsync();
      res.json({ testimonial: db.testimonials[idx], message: 'Testimoni berhasil diperbarui secara permanen.' });
    } catch (err) {
      console.error('Update testimonial error:', err);
      res.status(500).json({ error: 'Gagal memperbarui testimoni.' });
    }
  });

  app.delete('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
    try {
      const db = getDb();
      db.testimonials = db.testimonials.filter((t) => t.id !== req.params.id);
      await saveDbAsync();
      res.json({ message: 'Testimoni berhasil dihapus secara permanen.' });
    } catch (err) {
      console.error('Delete testimonial error:', err);
      res.status(500).json({ error: 'Gagal menghapus testimoni.' });
    }
  });

  // Reset Demo Data
  app.post('/api/admin/reset-demo', requireAdmin, async (_req, res) => {
    try {
      await resetDbToDefaultAsync();
      res.json({ message: 'Data demo berhasil dikembalikan ke pengaturan awal.' });
    } catch (err) {
      console.error('Reset demo error:', err);
      res.status(500).json({ error: 'Gagal mereset data demo.' });
    }
  });

  // =====================================================================
  // 5. VITE DEV MIDDLEWARE / PRODUCTION STATIC ASSETS
  // =====================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/src/assets', express.static(path.join(process.cwd(), 'src', 'assets')));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zaenal Abidin Honda Parungkuda server running on http://localhost:${PORT}`);
  });
}

startServer();
