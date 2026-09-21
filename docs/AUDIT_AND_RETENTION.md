# MedID Nigeria — Cryptographic Audit Trail & Retention Policy

## 1. Overview & Objectives
A central requirement for Hackathon Track C1 is that audit trails must remain **independently verifiable** even if the main application or database is compromised. MedID implements an append-only, SHA-256 hash-chained cryptographic ledger for all security-relevant healthcare access events.

---

## 2. Event Schema Specification

Each audit block contains the following canonical structure:

```typescript
interface AuditEvent {
  id: string;               // Sequential identifier (e.g. AUDIT-000015)
  timestamp: string;        // UTC ISO-8601 server timestamp
  eventType: string;        // Specific event category
  actorId: string;          // Staff ID or System ID
  actorName: string;        // Full name of actor
  actorRole: StaffRole;     // DOCTOR | NURSE | RECORDS_CLERK | HOSPITAL_ADMIN | etc.
  hospitalId: string;       // Facility identifier
  patientMedID?: string;    // Subject patient Medical ID
  action: string;           // RETRIEVE_RECORDS | EMERGENCY_OVERRIDE | etc.
  resource: string;         // Target resource
  decision: "ALLOW" | "DENY"; // PDP authorization outcome
  accessScope?: RecordSection[]; // Sections granted
  purpose?: string;         // Access clinical justification
  previousHash: string;     // 64-character SHA-256 hash of predecessor block
  currentHash: string;      // 64-character SHA-256 digest of this block + previousHash
  isOfflineReconciled?: boolean; // Flagged if committed from offline queue
  offlineTimestamp?: string; // Preserved local time during downtime
}
```

---

## 3. Cryptographic Hash Chaining Mechanism

1. **Genesis Anchor**:
   - The chain begins with block `AUDIT-000000`.
   - `previousHash = "0000000000000000000000000000000000000000000000000000000000000000"`.
2. **Block Hashing**:
   - The payload fields are serialized into a deterministic canonical JSON string.
   - The hash is computed using Node.js crypto:
     $$\text{currentHash} = \text{SHA-256}(\text{canonicalPayload} + \text{previousHash})$$
3. **Immutability Properties**:
   - Modifying any attribute of an event alters its hash.
   - Deleting an event breaks the predecessor pointer of the subsequent block.
   - Reordering events causes immediate hash link verification failure.

---

## 4. Verification Engine & Tamper Demonstration

The verification engine (`verifyAuditChain()`) validates the chain from Genesis to Head:
- Validates that Block 0 points to Genesis Anchor.
- Validates that Block $i$ has `previousHash` equal to Block $i-1$'s `currentHash`.
- Recomputes the SHA-256 digest for every block.

### Synthetic Tampering Demonstration Harness
For the NiTDA Hackathon presentation, MedID provides a controlled test endpoint:
- **`POST /api/audit/tamper-demo`**: Modifies the actor name and decision of a test block without recalculating cryptographic hashes.
- **`GET /api/audit/verify`**: Immediately flags:
  $$\text{"Cryptographic digest failure at event AUDIT-000001. Payload has been altered post-signature."}$$
- **`POST /api/audit/reset-tamper`**: Restores the pristine chain for continued operation.

---

## 5. Retention Policy & Storage Controls

- **Retention Lock Target**: 365 Days (1 Year).
- **NDPA Compliance**: Aligns with Nigeria Data Protection Act requirements for medical audit preservation.
- **Application Safeguards**: No delete or update APIs exist anywhere in the application. Ordinary hospital administrators and application founders cannot truncate or erase audit events through MedID.
- **Production Roadmap**: In full production deployment, the hash-chain head is periodically signed with an HSM private key and committed to an external write-once-read-many (WORM) cloud bucket (e.g. AWS S3 Object Lock or Azure Immutable Blob).
