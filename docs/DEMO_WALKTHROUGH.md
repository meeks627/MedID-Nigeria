# MedID Nigeria — NiTDA Hackathon Live Demonstration Walkthrough

This document outlines the step-by-step judge demonstration script for **Track C — Health & Medical Systems (C1: Safe Access to Patient Records)**.

---

## 🎭 Scene-by-Scene Demonstration Guide

### SCENE 1: Legitimate Routine Clinical Access
**Objective**: Show that an authorized doctor on duty can discover a patient, retrieve records within their authorized scope, and trigger an immutable audit event.

1. Navigate to the MedID home launcher and select **Clinician & Staff Portal**.
2. Select **Dr. James Bello** (or log in with `james.bello@luth.org`).
3. Confirm shift status displays **`🟢 ON DUTY`** (Ward 4 - Acute Care, LUTH).
4. In **Routine Consultation Search**, enter Medical ID: `MD38281726` (Sarah Johnson) and click **Search Patient**.
5. Demographic discovery succeeds with verified national identity.
6. Click **Retrieve Permitted Records**.
7. The chart opens displaying:
   - Permitted Section Badges: `[IDENTITY_ADMIN]`, `[EMERGENCY_CRITICAL]`, `[ROUTINE_CLINICAL]`.
   - Longitudinal diagnoses (Iron Deficiency Anemia, Asthma, Meniscus Tear).
   - AI Clinical Brief synthesizing the authorized records in under 20 seconds.
8. Show that an append-only audit event was created with decision `ALLOW`.

---

### SCENE 2: Real-Time Abuse Detection (Target Hackathon Abuse Scenario)
**Objective**: Demonstrate that a Records Clerk attempting to access confidential clinical history is immediately blocked, an audit event is logged, and a real-time security alert is created.

1. Sign out of Dr. Bello's account.
2. In the Clinician & Staff portal, click the demo persona button for **Ibrahim Musa** (Records Clerk, Health Records & Registration).
3. Log in as Ibrahim Musa.
4. Search for patient `MD38281726` (Sarah Johnson).
5. Demographic search succeeds (permitted for clerk registration workflows).
6. Now click **Retrieve Permitted Records** (attempting to view clinical history).
7. **Expected Result**:
   - Access is immediately **blocked with HTTP 403 Forbidden**.
   - Red visual banner appears:
     $$\text{"403 FORBIDDEN: Records clerks are strictly restricted to demographic management and cannot inspect patient clinical history."}$$
   - Shows triggering rule: `RULE_CLERK_CLINICAL_ACCESS`.
   - Displays notice: *"Unavoidable Audit Block & Real-time Alert Dispatched"*.
8. Jump to the **Security & Audit Console** (top quick jump).
9. Under **Abuse Detection Alerts**, show the new **`CRITICAL`** severity alert:
   - Offender: Ibrahim Musa (`CLERK1`).
   - Incident: Direct retrieval of confidential clinical EHR records for patient `MD38281726`.
   - Status: `PENDING_REVIEW`.
10. Click **Investigate**, document security notes, and click **Mark as Reviewed & Commit to Audit**.

---

### SCENE 3: Governed Break-Glass Emergency Access
**Objective**: Demonstrate that in an acute emergency, a clinician can break glass immediately, receive scoped emergency-critical data, and be subject to a strict 15-minute countdown and mandatory audit.

1. In Clinician Portal, log in as **Dr. James Bello** (or Nurse Chidinma Eze).
2. In the emergency box, click **Scan Biometrics & Discover Identity**.
3. Biometric simulation matches the unconscious patient to **Sarah Johnson** (`MD38281726`).
4. Select the emergency justification reason: **"Acute Anaphylaxis / Respiratory Collapse"**.
5. Enter Hospital Emergency Override Code: `LUTH-9988`.
6. Click **Authorize Break-Glass Access**.
7. **Expected Result**:
   - Red flashing banner engages: **`🚨 EMERGENCY BREAK-GLASS ACTIVE: 14:59 REMAINING`**.
   - Chart displays **Emergency Scope Only**: allergies (Asthma / Penicillin allergy flags) and acute meds.
   - Longitudinal routine notes omitted per emergency policy.
   - High-priority security alert is logged.
   - Click **Revoke Now** to demonstrate early revocation.

---

### SCENE 4: Cryptographic Audit Chain Verification & Tamper Demonstration
**Objective**: Prove that the audit trail is cryptographically chained and independently detects any database tampering.

1. Navigate to the **Security & Audit Console**.
2. View the **Cryptographic Audit Chain** tab.
3. Show that the chain is **`VERIFIED VALID`** with all blocks sequentially linked from Genesis (`AUDIT-000000`) to Head via SHA-256 digests.
4. Click **Simulate Tampering Attack (Judge Demo)**.
   - This silently modifies a test block's payload without recalculating its cryptographic hash.
5. Verification immediately fails with a red warning:
   $$\text{"Cryptographic Verification Failed: Integrity Compromised!"}$$
   $$\text{"Cryptographic digest failure at event AUDIT-000001 (Index #1). Block payload altered post-signature."}$$
6. Click **Restore Pristine Chain** to return to green verified status.
7. Show that 365-day retention lock is active per NDPA guidelines.

---

### SCENE 5: Downtime Resilience & Offline Reconciliation
**Objective**: Demonstrate safe degradation and recovery during a facility network/power blackout.

1. In the Security Console (or top bar), click **Simulate Blackout / Network Outage**.
2. Global high-contrast amber warning banner activates across all screens.
3. Switch to Clinician Portal and attempt to retrieve records:
   - Server returns **HTTP 503 Service Unavailable**.
   - Shows guidance: *"Follow Form MD-DT-01 Paper Emergency Protocol"*.
4. Click **View Form MD-DT-01 Paper SOP** to inspect the manual clinical protocol.
5. In Security Console, show that offline emergency actions are buffered in the bounded queue.
6. Click **Restore Online Services** and click **Reconcile Queued Records**.
7. The offline actions are committed into the cryptographic hash chain with `isOfflineReconciled: true` while preserving original local event times.

---

### SCENE 6: Hospital Administrator Workspace Isolation
**Objective**: Show that hospital administrators can manage facility clinicians and emergency keys, but are strictly prohibited from viewing patient clinical charts.

1. Jump to the **Hospital Admin Portal**.
2. Log in with `LUTH` / `ADMIN123`.
3. Admin can:
   - Register new doctors and toggle active clinician status.
   - Rotate hospital emergency override keys.
   - View operational access log statistics.
4. Show that administrative endpoints **strictly deny clinical record queries**. Administrative privilege does not grant clinical voyeurism.
