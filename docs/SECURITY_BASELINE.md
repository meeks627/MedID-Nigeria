# MedID Nigeria — Security Baseline Report
**Date:** September 2026  
**Assessment Phase:** Pre-Transformation Baseline Analysis  
**Repository:** `medid-v4` (Vite + React 19 / Express Serverless)

---

## 1. Executive Summary
MedID Nigeria is a healthcare identity and interoperability layer connecting hospital electronic health record (EHR) systems across Nigeria. A comprehensive inspection of the codebase was conducted prior to implementing the NiTDA Hackathon (Track C1: Safe Access to Patient Records) security enhancements.

This document establishes the verified baseline of the application, distinguishing what was implemented, what was simulated, and what critical security vulnerabilities existed.

---

## 2. Component-by-Component Baseline Matrix

| Component | Status | Verified Capabilities | Baseline Vulnerabilities & Deficiencies |
| :--- | :--- | :--- | :--- |
| **Authentication** | Partially Implemented | Bcrypt password and PIN hashing (`SALT_ROUNDS=10`) for Admin and Patient logins. | No server-side session management or bearer tokens. Requests rely on client-provided IDs (`doctorId`, `hospitalId`). No individual accounts for nurses, clerks, or security officers. No brute-force rate limiting. |
| **Authorization & RBAC** | Vulnerable / Missing | Basic role checks at frontend layer. | Lack of a central Policy Enforcement Point. All-or-nothing data access. No hospital isolation enforced on record retrieval. Off-duty staff retain unrestricted access. |
| **Record Access & Scoping** | Insecure / Monolithic | Multi-hospital EHR data mocked in `EHR_DATABASES`. | All clinical records (diagnoses, medications, labs, imaging, summaries) returned in single unstructured payload. No section classification (e.g. Identity vs Emergency vs Routine vs Restricted). |
| **Emergency Break-Glass** | Simulated (Prototype) | Fingerprint scanner simulation; hospital override code verification. | Break-glass grants permanent access to entire longitudinal chart. No time limit or automatic expiration. No distinction between emergency-critical data and general clinical history. |
| **Audit Logging** | Insecure Flat List | `AUDIT_LOGS` array records access type, doctor, patient, hospital, timestamp. | Stored as standard JSON array. No cryptographic hash chaining. Vulnerable to silent deletion, reordering, and modification. No independent retention locking. |
| **Abuse Detection** | Missing | None. | No mechanism to detect unauthorized lookup patterns, clerk clinical queries, or rapid record scraping. |
| **Downtime Resilience** | Missing | None. | System fails completely during network/server outages. No offline emergency fallback protocol or event reconciliation queue. |
| **AI Features** | Implemented (Unsecured) | Gemini 3.5 Flash (`@google/genai`) clinical brief and chat with offline rule-based fallback. | Sends unredacted patient medical records to AI model without checking section-level authorization. No protection against prompt injection from clinical notes. |
| **Hospital Workspaces** | Partially Implemented | Admin portal registers hospitals and clinicians. | Hospital admins can view patient lists without audit trail. Cross-hospital boundary checks easily bypassed via direct API manipulation. |

---

## 3. Vulnerability Classification

### 3.1 Critical Severity: Lack of Backend Session Validation & IDOR
- **Finding:** In `/api/doctor/retrieve-records`, the endpoint accepted `{ medID, doctorId, purpose }`. It validated that `findDoctor(doctorId)` exists, but did not verify whether the caller actually authenticated as that doctor.
- **Risk:** Any caller could submit another doctor's ID and retrieve complete longitudinal medical records for any patient in the country.

### 3.2 High Severity: No Record Section Classification (All-or-Nothing Exposure)
- **Finding:** Every retrieval call pulled encounters across all hospitals (LUTH, LASUTH, Evercare) including psychiatric notes, acute injuries, and sensitive surgical summaries.
- **Risk:** Staff with non-clinical responsibilities (e.g., billing clerks or front-desk registrars) could view intimate clinical history without clinical justification.

### 3.3 High Severity: Unauditable & Mutable Audit Trail
- **Finding:** Audit records were stored as an unchained JSON array (`medid-db.json`) with no cryptographic checksums or previous-hash linkages.
- **Risk:** An attacker or administrator with file or database access could silently alter, remove, or inject audit entries without detection.

### 3.4 Medium Severity: Unbounded Emergency Override
- **Finding:** Once the hospital emergency override code (`LUTH-9988`) was entered, the resulting session had no expiry timestamp and lacked granular emergency data scoping.
- **Risk:** Emergency overrides could be reused indefinitely to access routine and non-urgent health records.

---

## 4. Remediation Directives
1. **Central Policy Engine & Session Layer**: Introduce cryptographically random session tokens, role-based and duty-based authorization, and central policy enforcement for all routes.
2. **Record Section Classification**: Classify patient charts into `IDENTITY_ADMIN`, `EMERGENCY_CRITICAL`, `ROUTINE_CLINICAL`, and `HIGHLY_RESTRICTED`.
3. **Cryptographic Tamper-Evident Audit Chain**: Implement SHA-256 block hash-chaining, append-only service guarantees, and verifiable integrity checks.
4. **Governed Break-Glass Workflow**: Enforce 15-minute time-limited emergency tokens, emergency-scoped clinical presentation, and mandatory security alerts.
5. **Real-Time Abuse Detection**: Detect and alert on unauthorized access attempts (specifically clerks querying clinical notes).
6. **Downtime Mode & Fallback SOP**: Provide high-contrast service status indicators, offline clinical protocols, and queued event reconciliation.
