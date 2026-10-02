# Security Specification: Zaenal Abidin Honda Parungkuda Persistent Cloud Store

## 1. Data Invariants

1. **Default-Deny Catch-All**: Any path not explicitly matched (`/dealer_store/{sectionId}`, `/dealer_uploads/{chunkId}`, `/admins/{adminId}`) is unconditionally denied for all reads and writes.
2. **No Collection Scraping (`list` Denied)**: Enumeration via `list` queries is strictly disabled (`allow list: if false;`) across all collections. Only targeted single-document `get` requests with valid IDs (`isValidId`) are permitted.
3. **Path Variable & ID Hardening**: Document IDs (`sectionId`, `chunkId`, `adminId`) must be strings of 1–128 characters matching `^[a-zA-Z0-9_\-]+$`.
4. **Strict Schema & Shadow-Field Prevention**: Every `create` and `update` operation must pass its entity validation helper (`isValidDealerStoreSection`, `isValidDealerUploadChunk`, `isValidAdminProfile`) enforcing exact `hasAll` and `hasOnly` key allowlists and string/map size bounds.
5. **Immutable Identity Keys**: On updates to `/dealer_store/{sectionId}`, `sectionKey` is immutable (`incoming().sectionKey == existing().sectionKey`), and only `['payload', 'syncToken', 'updatedAt']` may be modified. On updates to `/dealer_uploads/{chunkId}`, `uploadId`, `chunkIndex`, and `createdAt` are immutable.
6. **Authorized Write Gate**: Writes to `/dealer_store/{sectionId}` and `/dealer_uploads/{chunkId}` require either a verified administrator (`request.auth.token.email_verified == true` and bootstrapped admin email / `/admins/{uid}` record) or the backend server's cryptographic sync token (`hasServerSyncToken(incoming())`).
7. **PII Isolation in `/admins/{adminId}`**: Reading `/admins/{adminId}` is restricted strictly to the document owner (`request.auth.uid == adminId`) or a verified administrator.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Shadow Field Injection on `dealer_store`)**: Includes an undeclared `isAdmin: true` field alongside valid `DealerStoreSection` fields. Rejected by `data.keys().hasOnly(...)`.
2. **Payload 2 (Unauthorized Write Without Sync Token or Admin Auth)**: Attempts to write to `/dealer_store/siteSettings` with `syncToken: "invalid-token-123456"` and `request.auth == null`. Rejected by `hasServerSyncToken` and `isAdmin()`.
3. **Payload 3 (ID Poisoning / Oversized Document ID)**: Targets `/dealer_store/invalid$id!with@special#chars` or a 500-character ID. Rejected by `isValidId(sectionId)`.
4. **Payload 4 (Section Key Mismatch)**: Targets `/dealer_store/siteSettings` with `sectionKey: "motorModels"`. Rejected by `data.sectionKey == sectionId`.
5. **Payload 5 (Immutable Field Mutation on Update)**: Attempts to change `sectionKey` during an `update` on `/dealer_store/siteSettings`. Rejected by `incoming().sectionKey == existing().sectionKey` and `affectedKeys().hasOnly(...)`.
6. **Payload 6 (Denial of Wallet / Oversized Upload Chunk)**: Attempts to write a 900,000-character `data` string to `/dealer_uploads/chunk_1`. Rejected by `data.data.size() <= 700000`.
7. **Payload 7 (Invalid Chunk Index Type/Bounds)**: Sends `chunkIndex: -1` or `chunkIndex: "0"` to `/dealer_uploads/chunk_1`. Rejected by `data.chunkIndex is int && data.chunkIndex >= 0 && data.chunkIndex <= 50`.
8. **Payload 8 (Collection Scraping via `list` on `dealer_store`)**: Executes a collection-wide `getDocs(collection(db, 'dealer_store'))`. Rejected by `allow list: if false;`.
9. **Payload 9 (Email Spoofing on Admin Check)**: Authenticates with `email: "ciwanguncity1705@gmail.com"` but `email_verified: false`. Rejected by `request.auth.token.email_verified == true`.
10. **Payload 10 (Self-Assigned Admin Privilege Escalation)**: A non-admin user attempts to create `/admins/attacker_uid` with `role: "admin"`. Rejected because only verified admins can write to `/admins/{adminId}`.
11. **Payload 11 (PII Leak on `/admins/{adminId}`)**: A signed-in non-owner user attempts to `get` `/admins/other_user_uid`. Rejected by `isOwner(adminId) || isAdmin()`.
12. **Payload 12 (Value Poisoning on Update)**: Updates `/dealer_store/siteSettings` where `payload` is a string instead of a `map`. Rejected because `isValidDealerStoreSection(incoming(), sectionId)` wraps the entire `allow update` block.
