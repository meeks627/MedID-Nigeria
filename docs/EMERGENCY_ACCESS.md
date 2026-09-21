# MedID Nigeria — Governed Break-Glass Emergency Workflow

## 1. Context & Purpose
In emergency trauma and resuscitation scenarios, an unconscious patient cannot supply their Medical ID, PIN, or approval. Furthermore, emergency clinical decisions cannot be delayed by multi-step consent workflows. However, emergency access must remain **accountable, scoped, and time-limited** to prevent abuse.

---

## 2. Emergency Workflow Progression

```
[1. Patient Presentation] ──> Unconscious / Acute Collapse / Trauma
         |
         v
[2. Biometric Discovery]  ──> Simulated Fingerprint / Facial NIN Scan
         |
         v
[3. Patient Match]        ──> Identity Resolved (Name, DOB, MedID)
         |
         v
[4. Justification Entry]  ──> Mandatory Reason (e.g. Acute Anaphylaxis)
         |
         v
[5. Facility Override]    ──> Hospital Override Code Validated (LUTH-9988)
         |
         v
[6. Token Issuance]       ──> 15-Minute Time-Limited Emergency Grant
         |
         v
[7. Scoped Retrieval]     ──> Only IDENTITY_ADMIN + EMERGENCY_CRITICAL
         |
         +──> High-Priority Security Alert Dispatched (RULE_EMERGENCY_OVERRIDE)
         +──> Unavoidable Cryptographic Audit Block Appended
```

---

## 3. Core Safety Controls

1. **Mandatory Emergency Reason**:
   - The clinician must supply an explicit justification (e.g., "Acute Anaphylaxis / Respiratory Collapse", "Trauma / Unconscious Patient", "Cardiac Arrest / Resuscitation").
   - Requests with missing or trivial reasons are rejected with HTTP 400.

2. **15-Minute Time Limit & Live Countdown**:
   - The issued emergency grant includes an absolute expiration timestamp (`expiresAt = now + 15m`).
   - The UI features a real-time countdown clock with a red visual alert bar.
   - Upon expiration, the chart automatically locks, and subsequent retrieval requests are rejected.

3. **Restricted Emergency Scope**:
   - Unlike routine consultation, break-glass access **does not dump the full longitudinal medical history**.
   - Encounters are filtered strictly down to `EMERGENCY_CRITICAL` data:
     - Documented life-threatening drug allergies (e.g. Penicillin anaphylaxis).
     - Acute emergency alerts.
     - Active emergency medications (e.g. Albuterol inhalers, Epinephrine, Insulin).
     - Critical diagnostic scans and vital baseline labs.
   - Routine notes, non-urgent outpatient encounters, and sensitive specialized notes remain omitted.

4. **Explicit Revocation**:
   - The treating clinician or security officer can click "Revoke Now" at any point during the 15-minute window to immediately terminate access.

5. **Accountability & Alerting**:
   - Initiating emergency access creates an unavoidable `EMERGENCY_BREAK_GLASS_ACCESS` event on the cryptographic audit chain.
   - A `HIGH` severity Security Alert (`RULE_EMERGENCY_OVERRIDE`) is simultaneously dispatched to the Security Directorate review queue.
