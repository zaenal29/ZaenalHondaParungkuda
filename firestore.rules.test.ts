/**
 * Firestore Security Rules Verification Suite ("Dirty Dozen" Payloads)
 * Verifies that all 12 adversarial payloads defined in security_spec.md
 * are rejected with PERMISSION_DENIED by firestore.rules.
 */

export interface SecurityTestPayload {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: {
    uid?: string;
    email?: string;
    email_verified?: boolean;
  } | null;
  payload?: Record<string, unknown>;
  existingData?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestPayload[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on dealer_store',
    collection: 'dealer_store',
    docId: 'siteSettings',
    operation: 'create',
    auth: null,
    payload: {
      sectionKey: 'siteSettings',
      payload: { siteName: 'Honda' },
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      updatedAt: '2026-10-01T18:00:00.000Z',
      isVerified: true, // Ghost field
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unauthorized Write Without Valid Sync Token or Admin Auth',
    collection: 'dealer_store',
    docId: 'siteSettings',
    operation: 'create',
    auth: null,
    payload: {
      sectionKey: 'siteSettings',
      payload: { siteName: 'Hacked' },
      syncToken: 'wrong-sync-token-000000',
      updatedAt: '2026-10-01T18:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'ID Poisoning with Special Characters',
    collection: 'dealer_store',
    docId: 'bad$id!@#',
    operation: 'create',
    auth: null,
    payload: {
      sectionKey: 'bad$id!@#',
      payload: {},
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      updatedAt: '2026-10-01T18:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Section Key Path Mismatch',
    collection: 'dealer_store',
    docId: 'siteSettings',
    operation: 'create',
    auth: null,
    payload: {
      sectionKey: 'motorModels',
      payload: {},
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      updatedAt: '2026-10-01T18:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Immutable Field Mutation on Update',
    collection: 'dealer_store',
    docId: 'siteSettings',
    operation: 'update',
    auth: null,
    existingData: {
      sectionKey: 'siteSettings',
      payload: { siteName: 'Old' },
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      updatedAt: '2026-10-01T17:00:00.000Z',
    },
    payload: {
      sectionKey: 'differentKey',
      payload: { siteName: 'New' },
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      updatedAt: '2026-10-01T18:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Denial of Wallet Oversized Upload Chunk (>700KB)',
    collection: 'dealer_uploads',
    docId: 'upload-1_0',
    operation: 'create',
    auth: null,
    payload: {
      uploadId: 'upload-1',
      chunkIndex: 0,
      mimeType: 'image/jpeg',
      filename: 'test.jpg',
      data: 'A'.repeat(700001),
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      createdAt: '2026-10-01T18:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Invalid Negative Chunk Index',
    collection: 'dealer_uploads',
    docId: 'upload-1_0',
    operation: 'create',
    auth: null,
    payload: {
      uploadId: 'upload-1',
      chunkIndex: -1,
      mimeType: 'image/jpeg',
      filename: 'test.jpg',
      data: 'base64data',
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      createdAt: '2026-10-01T18:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Collection Scraping via list Query',
    collection: 'dealer_store',
    docId: '*',
    operation: 'list',
    auth: { uid: 'user-1', email: 'user@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Email Spoofing with Unverified Admin Email',
    collection: 'dealer_store',
    docId: 'siteSettings',
    operation: 'delete',
    auth: {
      uid: 'spoof-uid',
      email: 'ciwanguncity1705@gmail.com',
      email_verified: false,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Self-Assigned Admin Privilege Escalation',
    collection: 'admins',
    docId: 'attacker-uid',
    operation: 'create',
    auth: {
      uid: 'attacker-uid',
      email: 'attacker@example.com',
      email_verified: true,
    },
    payload: {
      uid: 'attacker-uid',
      email: 'attacker@example.com',
      role: 'admin',
      createdAt: '2026-10-01T18:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'PII Leak on admins Collection by Non-Owner',
    collection: 'admins',
    docId: 'admin-uid-1',
    operation: 'get',
    auth: {
      uid: 'random-user-uid',
      email: 'random@example.com',
      email_verified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Value Poisoning on Update (payload is string instead of map)',
    collection: 'dealer_store',
    docId: 'siteSettings',
    operation: 'update',
    auth: null,
    existingData: {
      sectionKey: 'siteSettings',
      payload: { siteName: 'Old' },
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      updatedAt: '2026-10-01T17:00:00.000Z',
    },
    payload: {
      sectionKey: 'siteSettings',
      payload: 'not-a-map-value',
      syncToken: 'zaenal-honda-parungkuda-cloud-sync-2026',
      updatedAt: '2026-10-01T18:00:00.000Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
