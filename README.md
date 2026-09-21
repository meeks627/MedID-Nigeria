# 🩺 MedID Nigeria

> **One Identity. Every Hospital. Better Care.**  
> **NiTDA Hackathon — Track C (Health & Medical Systems) — Challenge C1: Safe Access to Patient Records**

MedID is an AI-assisted National Healthcare Identity, Contextual Authorization, and Interoperability Platform for Nigeria. Unlike traditional Electronic Health Record (EHR) systems, MedID does **not** replace hospital software. Instead, it acts as a secure identity, access governance, and tamper-evident audit layer that connects existing hospital systems while facilities remain owners of their patient records.

---

## 🏆 NiTDA Track C1 Capabilities Implemented

- 🛡️ **Central Authentication & Session Layer**: Cryptographically random bearer tokens (`crypto.randomBytes(24)`), brute-force rate-limiting, individual staff accounts, and server-side revocation.
- 🎯 **Contextual Policy Decision Point (PDP)**: Access permissions depend on staff role (Doctor, Nurse, Records Clerk, Hospital Admin, Security Admin), facility affiliation, assigned ward, and active shift duty status (`ON_DUTY` vs `OFF_DUTY`).
- 📂 **Record Section Classification**: Patient charts segregated into `IDENTITY_ADMIN`, `EMERGENCY_CRITICAL`, `ROUTINE_CLINICAL`, and `HIGHLY_RESTRICTED` sections with strict backend filtering.
- 🚨 **Real-Time Automated Abuse Detection**: Immediate detection, HTTP 403 blocking, and `CRITICAL` severity alerting when non-clinical personnel (e.g. Records Clerk) attempt to inspect clinical records.
- 🚑 **Governed Break-Glass Emergency Access**: Biometric match simulation, mandatory clinical reason, 15-minute live countdown timer, emergency-scoped clinical presentation, unavoidable audit logging, and explicit revocation.
- ⛓️ **Cryptographic Tamper-Evident Audit Chain**: SHA-256 block hash chaining anchored to an immutable Genesis Block (`AUDIT-000000`). Live verification engine detects block alterations, deletions, or reordering. Includes a 1-click test tampering attack harness for judges.
- 🔒 **365-Day Retention Lock**: Storage retention lock policy enforcing immutable log preservation aligned with the Nigeria Data Protection Act (NDPA).
- ⚡ **Downtime & Low-Connectivity Resilience**: Outage detection matrix, simulated blackout mode, Form MD-DT-01 Emergency Offline Standard Operating Procedure, bounded local queue, and post-restoration reconciliation.
- 🤖 **Secured AI Clinical Copilot**: Gemini AI Clinical Brief and chatbot grounded strictly in authorized chart sections, preventing data exfiltration and prompt injection.

---

## 🔑 Demo Personas & Credentials

| Role | Name & Affiliation | Email / ID | Credential | Key Test Scenario |
|:---|:---|:---|:---|:---|
| 👨‍⚕️ **Doctor** | Dr. James Bello (LUTH) | `james.bello@luth.org` | License: `MDN-2015-8831` | Routine consultation, duty shift toggle, emergency break-glass |
| 🩺 **Nurse** | Nurse Chidinma Eze (LUTH) | `chidinma.eze@luth.org` | License: `NUR-2020-5519` | Emergency-critical and triage notes access |
| 📋 **Records Clerk** | Ibrahim Musa (LUTH) | `ibrahim.musa@luth.org` | Credential: `REC-REG-2022` | **Abuse Test**: Demographics search allowed; clinical chart retrieval blocked (403) |
| 🏥 **Hospital Admin**| LUTH Administration | `LUTH` | Password: `ADMIN123` | Clinician management, emergency key rotation (no clinical access) |
| 🛡️ **Security Officer**| Alhaji Tunde Bakare | `security.officer@medid.gov.ng` | Session Bearer | Cryptographic audit chain verification, tamper demo, abuse alert review |
| 👤 **Patient** | Sarah Johnson | `MD38281726` | PIN: `1234` | NIN-linked identity card, immutable access audit history |

---

## 🧪 Automated Testing & Verification

Run the comprehensive 25-point automated security test suite:
```bash
npm test
```

Run TypeScript compilation check:
```bash
npm run lint
```

Build production bundle:
```bash
npm run build
```

---

## 📚 Technical Documentation

- 📄 [Security Baseline Report](docs/SECURITY_BASELINE.md)
- 🏗️ [Technical Architecture Specification](docs/ARCHITECTURE.md)
- 🔐 [Access Control & Authorization Model](docs/ACCESS_CONTROL.md)
- ⛓️ [Cryptographic Audit & Retention Policy](docs/AUDIT_AND_RETENTION.md)
- 🚑 [Governed Break-Glass Emergency Access](docs/EMERGENCY_ACCESS.md)
- ⚡ [Downtime & Low-Connectivity Operational Procedure](docs/DOWNTIME_PROCEDURE.md)
- 🎭 [Judge Live Demonstration Walkthrough Guide](docs/DEMO_WALKTHROUGH.md)
- 🧪 [Automated Security Testing Guide](docs/TESTING.md)

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Lucide Icons, Framer Motion
- **Backend**: Express 4, Node.js 22, Vercel Serverless Function architecture
- **Security & Crypto**: SHA-256 block hash chaining, Bcrypt password/PIN hashing, crypto random sessions
- **AI**: Google GenAI SDK (`@google/genai`) with Gemini 2.5 Flash and offline rule-based clinical fallback
- **Persistence**: JSON-backed local storage (`medid-db.json`) and `/tmp` filesystem on Vercel
