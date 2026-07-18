# MedID V4 — National Healthcare Identity Platform

A simulated national healthcare identity and record interoperability platform for Nigeria. MedID provides a unified trust layer connecting independent hospital EHR systems via a single patient identity index.

**Live Demo:** https://med-id-nigeria-3ucs.vercel.app

---

## Portals

| Portal | Purpose |
|--------|---------|
| **Patient Portal** | Register with NIN, get a MedID, manage PIN, view access history |
| **Clinician Portal** | Search patients, retrieve interoperable records, emergency biometric override, AI clinical briefs & copilot |
| **Hospital Admin Portal** | Register clinicians, manage emergency override codes, view audit logs & stats |

---

## Test Credentials

### Patient Login
| Field | Value |
|-------|-------|
| MedID | `MD38281726` |
| PIN | `1234` |

### Doctor Login
| Field | Value |
|-------|-------|
| Email | `james.bello@luth.org` |
| License | `MDN-2015-8831` |

### Admin Login
| Field | Value |
|-------|-------|
| Hospital | `LUTH` (or `LASUTH`, `Evercare`) |
| Access Key | `ADMIN123` |

### Emergency Override Codes
| Hospital | Code |
|----------|------|
| LUTH | `LUTH-9988` |
| LASUTH | `LASU-1122` |
| Evercare | `EVER-7744` |

---

## Run Locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

Visit **http://localhost:3000**

Set `GEMINI_API_KEY` in `.env` for AI features (optional — runs with offline fallback).

---

## Deploy

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new)

The `vercel.json` is pre-configured. Just connect your GitHub repo and deploy.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
- **Backend:** Node.js, Express 4 (in-memory mock data)
- **AI:** Google Gemini API (`@google/genai`) with offline fallback
- **Build:** Vite 6
- **Deployment:** Vercel (serverless)

---

## Architecture

```
[User] → React SPA (3 portals) → Express API → In-Memory Mock Databases
                                           ↕
                                 Google Gemini AI (optional)
```

All patient records, doctor registries, hospitals, and audit logs live in memory on the server. No real database is used — this is a prototype/demonstration.

Key design constraints:
- **NIN is mandatory** for patient registration
- **Patients never see clinical data** — only identity, card, and audit logs
- **Doctor consent model** — entering the MedID itself constitutes patient consent
- **Emergency bypass** requires hospital override code + biometric NIN match
- **Every access is audited** with timestamp, doctor, hospital, purpose, and type
