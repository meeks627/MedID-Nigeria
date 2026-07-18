# MedID – National Healthcare Identity & Interoperability Platform

> **One identity. Every hospital. Better care.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Table of Contents

- [About MedID](#about-medid)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Key Features](#key-features)
- [Screens / Modules](#screens--modules)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Demo Credentials](#demo-credentials)
- [Demo Workflow](#demo-workflow)
- [Security Model](#security-model)
- [AI Features](#ai-features)
- [Current MVP Scope](#current-mvp-scope)
- [Future Roadmap](#future-roadmap)
- [Repository Structure](#repository-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Contributing](#contributing)
- [License](#license)
- [Disclaimer](#disclaimer)
- [Vision](#vision)

---

## About MedID

MedID is a **national healthcare identity and interoperability platform** purpose-built for Nigeria and emerging healthcare ecosystems. It is **not** an Electronic Health Record (EHR) system. Hospitals remain the sole owners of their medical records.

Instead, MedID provides:

| Layer | Role |
|---|---|
| **National Healthcare Identity** | Every patient receives a unique, portable Medical ID (MedID) |
| **Patient Authentication** | PIN-secured access to personal health identity |
| **Hospital Authentication** | Institutional accounts with password-protected admin dashboards |
| **Doctor Authentication** | License-verified clinician credentials across hospitals |
| **Interoperability** | Cross-institutional record access via the MedID identity layer |
| **AI Clinical Intelligence** | Automatic clinical brief generation and intelligent chart querying |
| **Emergency Access** | Fingerprint simulation and emergency override code workflows |
| **Audit Logging** | Every access event is recorded for compliance and transparency |

---

## Problem Statement

Healthcare in Nigeria is fragmented:

- **Duplicate testing** — patients repeat lab work at every hospital because prior results are inaccessible
- **Inaccessible records** — paper records are lost; digital records are locked inside isolated hospital systems
- **Poor continuity of care** — specialists lack visibility into prior diagnoses, medications, and allergies
- **Emergency delays** — critical treatment decisions are made without medical history, especially for unconscious patients
- **Medical errors** — unknown drug allergies and contraindications lead to preventable adverse events

Patients carry no portable medical identity, and no interoperability layer exists between Nigeria's thousands of public and private healthcare facilities.

---

## Solution

MedID solves these problems by introducing a **national identity layer** that sits above existing hospital systems:

| Mechanism | How It Works |
|---|---|
| **Unique Medical ID** | Every patient receives a MedID number (e.g., `MD38281726`) at registration, linked to their National Identity Number (NIN) |
| **Identity Layer** | Hospitals, doctors, and patients authenticate through MedID's centralized identity service |
| **Interoperability** | Authorized clinicians retrieve a patient's consolidated encounter history from any MedID-connected hospital |
| **AI Clinical Brief** | A one-click clinical summary distils years of records into a 20-second actionable brief |
| **AI Medical Assistant** | Clinicians ask natural-language questions about the patient's chart; the AI answers strictly from retrieved records |
| **Emergency Access** | Simulated biometric fingerprint matching + hospital emergency override codes enable rapid access for unconscious or critical patients |
| **Hospital Network** | Each hospital registers independently, receives a MedID Hospital ID, and manages its own doctors and patients within an isolated workspace |

---

## Key Features

| Feature | Description |
|---|---|
| **Patient Registration** | NIN-linked registration generates a unique MedID; PIN-secured login |
| **Hospital Registration** | Hospitals join the MedID network, receive a unique Hospital ID (`HSP000001`) and an Emergency Override Code |
| **Doctor Registration** | Hospital administrators register clinicians with license numbers; accounts can be enabled or disabled |
| **Hospital Administrator Dashboard** | Manage doctors, view visited patients, rotate emergency override codes, and review access logs |
| **Medical ID Search** | Doctor portal lookup by MedID with cross-hospital record availability |
| **Emergency Fingerprint Workflow** | Simulated fingerprint scanning matches a patient and triggers emergency record retrieval with an override code |
| **AI Clinical Brief** | Automated, clinically prioritized summary of all encounters across hospitals |
| **AI Medical Assistant** | Natural-language Q&A about patient records (strictly from retrieved data, no hallucination) |
| **Audit Logs** | Every record access is logged with doctor, patient, purpose, type, and duration |
| **Hospital Access Logs** | Administrators can view all accesses to their hospital's patient records |
| **Role-Based Authentication** | Separate portals for patients, doctors, and hospital administrators; all passwords/PINs are bcrypt-hashed |
| **QR Code Support** | Patient profile includes a QR code for quick MedID scanning |
| **NIN-linked Registration** | National Identity Number prevents duplicate registrations (simulated verification) |
| **Emergency Override Code** | Each hospital has a unique emergency code; can be rotated by the administrator |
| **Multi-Hospital Architecture** | Each hospital operates as an isolated node with its own doctors, patients, and access logs |

---

## Screens / Modules

### Patient Portal

Patients register with their NIN, set a PIN, and log in to view their MedID profile, linked hospitals, and access history. QR code display enables quick scanning by clinicians.

### Doctor Portal

Clinicians log in with email and license number. The portal provides:
- **MedID Search** — side-by-side search by MedID or simulated biometric fingerprint
- **AI Clinical Brief** — one-click generation of a consolidated clinical summary
- **AI Medical Assistant** — interactive Q&A about the patient's chart
- **Emergency Access** — fingerprint scan simulation + emergency override code for critical situations
- **Retrieved Records** — cross-hospital encounter history presented in a timeline

### Hospital Administrator Portal

Hospital administrators authenticate with their MedID Hospital ID and password. The dashboard provides:
- **Register Clinicians** — add and manage doctors with license verification
- **Visited Patients** — view patients who have been treated at the hospital
- **Emergency Override** — view and rotate the hospital's emergency override code
- **Access Logs** — audit every record access within the hospital domain
- **Monthly Statistics** — usage analytics including consultations and emergency overrides

### Emergency Access

When a patient arrives unconscious or without identification, a clinician can:
1. Initiate an emergency fingerprint scan (simulated)
2. The system matches the biometric against the patient registry
3. Display the matched patient's identity
4. Prompt for the hospital's Emergency Override Code
5. On successful code entry, retrieve the patient's complete record history

### AI Assistant

The AI Clinical Assistant provides:
- **Clinical Brief** — auto-generated summary formatted for a 20-second review
- **Medical Q&A** — doctors ask questions like "What allergies does this patient have?" or "List current medications"
- **Timeline Analysis** — chronological presentation of encounters from all hospitals
- **Record Summarization** — prioritized clinical information focusing on immediate management

### AI Clinical Brief

The brief is structured into clean sections:
- Patient Snapshot
- Critical Alerts (allergies, high-risk conditions)
- Active Conditions
- Current Medications
- Latest Significant Encounter
- Clinical Risks
- Immediate Clinical Considerations
- Emergency Contact

### Hospital Registration

New hospitals can self-register directly from the administrator login screen. The registration form collects:
- Hospital details (name, type, license number)
- Contact information (email, phone, address)
- Administrator details (name, position, NIN, password)
- Existing EHR system selection (Helium Health, Interswitch eClinic, OpenMRS, Bahmni, Epic, Cerner, Custom, or None)

On submission, a simulated verification sequence runs, and the hospital receives a unique MedID Hospital ID (`HSP000001`+) and Emergency Override Code (`MDEM-XXXX`).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MEDID PLATFORM                               │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Patient      │  │  Doctor      │  │  Hospital                │  │
│  │  Portal       │  │  Portal      │  │  Admin Portal            │  │
│  │  (React SPA)  │  │  (React SPA) │  │  (React SPA)             │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                      │                   │
│         └─────────────────┴──────────────────────┘                   │
│                            │                                         │
│                    ┌───────┴───────┐                                 │
│                    │  Express API  │                                 │
│                    │  (Serverless) │                                 │
│                    └───────┬───────┘                                 │
│                            │                                         │
│              ┌─────────────┼─────────────┐                           │
│              │             │             │                           │
│     ┌────────┴───┐  ┌──────┴──────┐  ┌──┴────────┐                  │
│     │  Identity  │  │   JSON DB  │  │  Gemini AI │                  │
│     │  & Auth    │  │  (/tmp)    │  │  (Opt.)    │                  │
│     └────────────┘  └────────────┘  └───────────┘                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  LUTH        │    │  LASUTH      │    │  Evercare    │
│  (EHR Owner) │    │  (EHR Owner) │    │  (EHR Owner) │
│  ┌─────────┐  │    │  ┌─────────┐  │    │  ┌─────────┐  │
│  │Patients │  │    │  │Patients │  │    │  │Patients │  │
│  │Encounte │  │    │  │Encounte │  │    │  │Encounte │  │
│  └─────────┘  │    │  └─────────┘  │    │  └─────────┘  │
└──────────────┘    └──────────────┘    └──────────────┘
```

Hospitals own their Electronic Health Records. MedID acts as the **identity and interoperability layer**, allowing clinicians to discover and access a patient's records across institutions through a unified query interface. The AI Clinical Brief and Medical Assistant operate on the retrieved records, not on the original EHR databases.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript 5.7, Vite 6 |
| **Styling** | Tailwind CSS 4, Lucide React (icons), Framer Motion |
| **Backend** | Express 5 (Node.js), TypeScript |
| **Database** | JSON file persistence (`/tmp/medid-db.json`), bcryptjs for password hashing |
| **Authentication** | bcryptjs-hashed passwords and PINs; role-based portals (Patient, Doctor, Admin) |
| **AI** | Google Gemini API (with deterministic rule-based fallback) |
| **Deployment** | Vercel (frontend + serverless API functions) |
| **Runtime** | Node.js (Vercel serverless) / tsx (local development) |

---

## Demo Credentials

| Role | Identifier | Password / PIN |
|---|---|---|
| **Hospital Admin** | `LUTH` | `ADMIN123` |
| **Hospital Admin** | `LASUTH` | `ADMIN123` |
| **Hospital Admin** | `Evercare` | `ADMIN123` |
| **Doctor** | `james.bello@luth.org` | License: `MDN-2015-8831` |
| **Doctor** | `helen.shitta@lasuth.gov` | License: `MDN-2012-4112` |
| **Doctor** | `amara.obi@evercare.com` | License: `MDN-2018-9122` |
| **Patient** | `MD38281726` (Sarah Johnson) | PIN: `1234` |
| **Patient** | `MD77441199` (David Kalu) | PIN: `5678` |
| **Patient** | `MD44118822` (Chioma Adeleke) | PIN: `2468` |

Users can also register **new hospitals**, **new clinicians**, and **new patients** directly from the application.

---

## Demo Workflow

### Hospital Registration
1. Navigate to the Hospital Admin Portal
2. Click **Register Hospital**
3. Complete the multi-section form (Hospital Details, Contact, Administrator Info, EHR)
4. Submit — the simulated verification sequence runs
5. Receive your **MedID Hospital ID** (`HSP000001+`) and **Emergency Override Code**
6. Click **Continue to Login** and sign in with your Hospital ID and password

### Doctor Login
1. From the Doctor Portal, enter email and license number
2. Access the search dashboard, AI Clinical Brief, and emergency tools
3. View your hospital affiliation

### Patient Registration
1. From the Patient Portal, complete the NIN-linked registration form
2. Receive a unique **MedID** and set a PIN
3. Log in with MedID + PIN to view profile and access history

### Routine Consultation
1. Doctor logs in and enters the patient's MedID
2. System displays patient identity and cross-hospital record availability
3. Doctor selects a purpose and retrieves records
4. AI Clinical Brief is automatically available
5. Doctor can ask follow-up questions via the AI Medical Assistant

### Emergency Consultation
1. Doctor initiates **Emergency Identification** (simulated fingerprint scan)
2. System matches biometric data to a patient in the registry
3. Doctor enters the hospital's **Emergency Override Code**
4. System grants access and retrieves the patient's full record history
5. Emergency access is logged separately for compliance

### AI Clinical Brief
1. After retrieving a patient's records, click **Generate AI Brief**
2. System produces a structured clinical summary (Patient Snapshot, Critical Alerts, Active Conditions, Medications, etc.)
3. Brief is formatted for a 20-second clinical review
4. Doctor can click **Re-analyze** to regenerate the brief

### AI Assistant
1. With patient records loaded, type a clinical question (e.g., "What are the current medications?")
2. AI responds using only the retrieved records — no hallucination
3. The assistant is constrained to the patient's actual chart data

### Hospital Administration
1. Login with Hospital ID and password
2. **Register Clinicians** — add doctors with name, email, license, and department
3. **Toggle Doctor Status** — enable or disable clinician accounts
4. **View Patients** — see patients treated at the hospital
5. **Rotate Emergency Code** — generate a new override code
6. **Access Logs** — audit all record accesses
7. **Statistics** — view interoperability metrics and usage patterns

---

## Security Model

| Principle | Implementation |
|---|---|
| **Role-Based Access Control** | Three distinct portals: Patient, Doctor, Hospital Administrator — each with separate authentication and capabilities |
| **Authentication** | All passwords and PINs are hashed using bcryptjs (salt rounds: 10) |
| **Emergency Override** | Each hospital has a unique override code; administrators can rotate it; in production it would rotate automatically every 14 days |
| **Audit Logs** | Every record access (routine and emergency) is logged with doctor identity, patient ID, purpose, and timestamp |
| **Hospital Ownership of Records** | EHR data remains with each hospital; MedID only accesses it through authenticated queries |
| **NIN-linked Identity** | National Identity Number prevents duplicate patient registrations (simulated verification) |
| **Biometric Identification** | Simulated fingerprint and facial recognition for emergency scenarios |
| **Database Authentication** | All authentication queries the persisted database, not hardcoded credentials |
| **Password Hashing** | bcryptjs with 10 salt rounds for all admin passwords and patient PINs |

---

## AI Features

| Feature | Description |
|---|---|
| **Clinical Brief Generation** | AI produces a structured, prioritized clinical summary from multi-hospital records |
| **Medical Question Answering** | Clinicians ask natural-language questions; AI answers strictly from retrieved records |
| **Timeline Analysis** | Records are organized chronologically across institutions |
| **Record Summarization** | Key clinical information is extracted and prioritized for rapid review |
| **Context-Aware Responses** | AI adapts answers based on the specific patient's chart data |

The AI operates with a strict "no-hallucination" constraint — it will only answer from the provided records and will explicitly state when information is unavailable. The system falls back to a deterministic rule-based engine when the Gemini API is unavailable or unconfigured.

---

## Current MVP Scope

| Status | Components |
|---|---|
| **Implemented** | Patient registration & login, Doctor registration & login, Hospital registration & login, MedID search, Record retrieval, AI Clinical Brief, AI Medical Assistant, Audit logging, Hospital admin dashboard, Emergency override code rotation, QR code display |
| **Simulated** | NIN verification, Biometric fingerprint matching, SMS/email notifications, OTP delivery, Ministry of Health record checks, Hospital license number verification |
| **Future Work** | Real FHIR interoperability, Live NIN/Biometric API integration, Insurance integration, Laboratory/pharmacy systems, Mobile application, Patient consent workflows, Government health data APIs |

---

## Future Roadmap

- **FHIR Interoperability** — HL7 FHIR-compliant API for real EHR integration
- **Real NIN Verification** — Integration with Nigeria's National Identity Management Commission (NIMC)
- **Real Biometric Authentication** — Hardware fingerprint scanners and facial recognition
- **Insurance Integration** — National Health Insurance Scheme (NHIS) and private HMOs
- **Laboratory Integration** — Direct lab order and result delivery through the platform
- **Pharmacy Integration** — E-prescription routing to partner pharmacies
- **Government APIs** — National Population Commission, Medical and Dental Council of Nigeria
- **National Rollout** — Scalable infrastructure for country-wide deployment
- **Mobile Application** — Patient and clinician mobile apps with offline support
- **Patient Consent Workflows** — Granular consent management for record sharing
- **Consolidated Timeline** — Better visualization of longitudinal patient data

---

## Repository Structure

```
medid-v4/
├── api/
│   └── index.ts              # Express API — routes, auth, AI, database
├── public/
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── App.tsx            # Main application with routing
│   │   ├── PatientPortal.tsx  # Patient registration & login
│   │   ├── DoctorPortal.tsx   # Doctor search, AI brief, emergency access
│   │   ├── AdminPortal.tsx    # Hospital admin dashboard
│   │   ├── LandingPage.tsx    # Portal selection / hero
│   │   └── QRCodeSection.tsx  # QR code display component
│   ├── App.css                # Global styles
│   ├── main.tsx               # Entry point
│   ├── types.ts               # Shared TypeScript interfaces
│   └── vite-env.d.ts          # Vite type definitions
├── server.ts                  # Local dev server (Express + Vite middleware)
├── index.html                 # HTML shell
├── vercel.json                # Vercel deployment configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── package.json
└── README.md
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/meeks627/MedID-Nigeria.git
cd MedID-Nigeria

# Install dependencies
npm install

# Set up environment (optional — app works without AI features)
cp .env.example .env
# Edit .env with your Gemini API key (if desired)

# Start the development server
npm run dev

# Open http://localhost:3000
```

The development server runs both the Express API and the Vite dev server on a single port (3000).

### Production Build

```bash
# Build frontend
npm run build

# Full build (frontend + API bundle)
npm run build:full
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | No | Google Gemini API key for AI features. If omitted, the system uses a deterministic rule-based fallback |

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/patient/register` | Register a new patient (NIN-linked) |
| `POST` | `/api/patient/login` | Patient login with MedID + PIN |
| `POST` | `/api/patient/recover` | Recover MedID via NIN |
| `POST` | `/api/doctor/login` | Doctor login with email |
| `POST` | `/api/admin/login` | Hospital admin login with ID + password |
| `POST` | `/api/admin/register` | Register a new hospital |
| `GET` | `/api/admin/hospitals` | List all registered hospitals |
| `GET` | `/api/admin/:id/doctors` | List doctors at a hospital |
| `POST` | `/api/admin/:id/doctors/register` | Register a new doctor |
| `POST` | `/api/admin/doctors/toggle` | Enable/disable a doctor |
| `GET` | `/api/admin/:id/patients` | List patients seen at a hospital |
| `GET` | `/api/admin/:id/logs` | Access logs for a hospital |
| `POST` | `/api/admin/:id/emergency-code/rotate` | Rotate emergency override code |
| `GET` | `/api/doctor/search-patient` | Look up patient by MedID |
| `POST` | `/api/doctor/retrieve-records` | Retrieve patient records |
| `POST` | `/api/doctor/emergency-biometric-match` | Simulate biometric patient match |
| `POST` | `/api/doctor/emergency-retrieve` | Emergency record retrieval |
| `POST` | `/api/gemini/clinical-brief` | Generate AI Clinical Brief |
| `POST` | `/api/gemini/chat` | AI Medical Assistant Q&A |

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Disclaimer

This project is currently a **Proof of Concept (PoC)**.

The following features are **simulated** for demonstration purposes and do not integrate with real external systems:

- Government identity verification (NIN)
- Biometric fingerprint and facial recognition
- SMS and email notifications
- One-time password delivery
- Ministry of Health record checks
- Hospital license number verification

The following are **not implemented** and would require production-grade infrastructure:

- Real FHIR-compliant EHR interoperability
- Live National Identity Management Commission (NIMC) integration
- Production-scale database (current persistence uses a JSON file per warm instance)
- Hardware biometric reader integration
- Insurance and payment systems

In a production deployment, all simulated services would be replaced with real API integrations, and the JSON file store would be replaced with a PostgreSQL or equivalent database.

---

## Vision

> We envision a future where every Nigerian can walk into any hospital with a single secure medical identity, enabling authorized clinicians to access the right information at the right time, improving continuity of care and saving lives.

MedID is designed to be interoperable by default, complementary to existing EHR systems, and built for the realities of healthcare delivery in emerging economies. It prioritizes patient safety, clinical efficiency, and national-scale identity management — not replacing hospitals, but connecting them.

---

<p align="center">
  <sub>Built for the Nigerian healthcare ecosystem — connecting hospitals, empowering clinicians, and putting patients at the center of their care journey.</sub>
</p>
