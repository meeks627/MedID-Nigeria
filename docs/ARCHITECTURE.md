# MedID Nigeria — Technical Architecture Specification

## 1. System Overview
MedID Nigeria is a national healthcare identity, secure record-access, and interoperability platform built for the Nigerian healthcare ecosystem. Rather than replacing hospital electronic health record (EHR) systems, MedID acts as an authoritative identity verification, contextual authorization, and tamper-evident audit trust layer connecting independent healthcare facilities.

---

## 2. Layered Architectural Diagram

```
+---------------------------------------------------------------------------------+
|                               PRESENTATION LAYER                                |
|  React 19 SPA • Tailwind CSS 4 • Vite 6 • Lucide Icons • Responsive Layout      |
|  - Patient Portal (NIN registration, digital card, access history)              |
|  - Clinician & Staff Portal (Doctors, Nurses, Records Clerks, Duty Management)  |
|  - Hospital Admin Portal (Clinician credentialing, rotating override codes)     |
|  - Security & Audit Console (Cryptographic verification, live abuse alerts)     |
+---------------------------------------------------------------------------------+
                                      |
                                      | HTTPS (Bearer Session Tokens)
                                      v
+---------------------------------------------------------------------------------+
|                             API & SECURITY GATEWAY                              |
|  Node.js / Express 4 Gateway (Vercel Serverless Function & Local Daemon)        |
|  - Rate-Limiting Sliding Window Engine                                          |
|  - Cryptographic Session Store (crypto.randomBytes tokens with 2h TTL)          |
|  - Shift & Duty Status Controller (ON_DUTY / OFF_DUTY)                          |
+---------------------------------------------------------------------------------+
                                      |
                                      v
+---------------------------------------------------------------------------------+
|                     CENTRAL POLICY DECISION POINT (PDP)                         |
|  Evaluates Subject, Role, Affiliation, Ward, Duty, Action, Resource, & Context  |
|  Produces Auditable Decision: ALLOW or DENY with explicit reason & alerts       |
+---------------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+----------------------------------+     +----------------------------------------+
|      POLICY ENFORCEMENT POINT    |     |          AUDIT ENGINE & ALERTS         |
|  - Record Section Filter         |     |  - Append-Only SHA-256 Hash Chain      |
|    * IDENTITY_ADMIN              |     |  - Genesis Anchor at AUDIT-000000      |
|    * EMERGENCY_CRITICAL          |     |  - Real-Time Abuse Detection Engine    |
|    * ROUTINE_CLINICAL            |     |  - 365-Day Immutability Retention Lock |
|    * HIGHLY_RESTRICTED           |     |  - Verification & Tamper Detection     |
+----------------------------------+     +----------------------------------------+
         |                                                         |
         v                                                         v
+----------------------------------+     +----------------------------------------+
|   HOSPITAL RECORD ADAPTER LAYER  |     |        DOWNTIME & RESILIENCE LAYER     |
|  - LUTH Adapter (REST v1.2)      |     |  - High-Availability Status Matrix     |
|  - LASUTH Adapter (OpenMRS/FHIR) |     |  - Bounded Local Emergency Event Queue |
|  - Evercare Adapter (FHIR R4)    |     |  - Form MD-DT-01 Paper Emergency SOP   |
|  - Isolated Hospital Workspaces  |     |  - Post-Restoration Event Reconciler   |
+----------------------------------+     +----------------------------------------+
```

---

## 3. Core Subsystems

### 3.1 Authentication & Session Management (`api/sessions.ts`)
- **Individual Credentials**: Every staff member has an individual account with designated email, clinical license, role, department, ward, and hospital ID.
- **Session Tokens**: Cryptographically random 48-character hex tokens generated via `crypto.randomBytes(24)` stored in an in-memory session table with 2-hour inactivity expiration.
- **Brute-Force Protection**: In-memory sliding-window rate limiter restricting authentication to 5 attempts per 60 seconds per account.
- **Duty/Shift Tracking**: Dynamic duty status (`ON_DUTY` / `OFF_DUTY`) attached to each session. Off-duty staff are strictly blocked from clinical data access.

### 3.2 Central Authorization Policy (`api/policy.ts`)
- **Policy Decision Point (PDP)**: Every request to patient search, record retrieval, emergency override, and AI brief generation passes through `evaluateAccess(policyContext)`.
- **Granular Classification**: Segregates records into:
  1. `IDENTITY_ADMIN`: Demographics, NIN, emergency contacts.
  2. `EMERGENCY_CRITICAL`: Documented severe allergies, acute alerts, critical emergency medications.
  3. `ROUTINE_CLINICAL`: Longitudinal diagnoses, routine prescriptions, outpatient lab results, imaging notes.
  4. `HIGHLY_RESTRICTED`: Sensitive notes requiring explicit clinical escalation.

### 3.3 Cryptographic Tamper-Evident Audit Chain (`api/audit.ts`)
- **SHA-256 Hash Chaining**: Every event links to its predecessor:
  $$\text{currentHash} = \text{SHA-256}(\text{canonicalPayload} + \text{previousHash})$$
- **Genesis Anchor**: Seeded with genesis block `AUDIT-000000` with 64 zero-hex predecessor.
- **Append-Only Enforcement**: Service exposes strictly append operations. No update, edit, or delete endpoints exist in the application.
- **Verification Engine**: `verifyAuditChain()` walks the chain from Genesis to Head, verifying every block hash and link.
- **Retention Lock**: Configured with a 365-day immutability lock compliant with the Nigeria Data Protection Act (NDPA).

### 3.4 Automated Abuse Detection Engine (`api/abuse.ts`)
- Evaluates denied access requests and anomalous patterns in real time.
- Generates structured `SecurityAlert` incidents with severities (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- Provides dedicated review workflow for security officers with immutable outcome logging.

### 3.5 Downtime & Low-Connectivity Resilience (`api/downtime.ts`)
- Monitors status of MedID Core, Hospital Record Adapters, NIN Provider, and Audit Sink.
- Features simulated outage mode for demonstrations.
- Directs staff to Form MD-DT-01 paper protocol during outages.
- Buffers emergency actions into a bounded local queue and reconciles them into the cryptographic chain post-restoration.
