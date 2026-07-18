# 🩺 MedID Nigeria

> **One Identity. Every Hospital. Better Care.**

MedID is an AI-powered **National Healthcare Identity & Interoperability Platform** that enables authorized healthcare providers to securely access patient medical records across participating hospitals using a unique Medical ID.

Unlike traditional Electronic Health Record (EHR) systems, MedID does **not** replace hospital software. It acts as a secure identity and interoperability layer that connects existing hospital systems, improving continuity of care while ensuring hospitals remain owners of their data.

---

## 🚨 The Problem

Healthcare records are fragmented across hospitals, making it difficult for clinicians to access critical patient information during consultations and emergencies. This leads to duplicated tests, delayed treatment, medication errors, and poor continuity of care.

## 💡 Our Solution

MedID provides every patient with a unique Medical ID linked to a verified identity (simulated via NIN). Authorized clinicians can retrieve patient records across participating hospitals, while AI generates concise clinical briefings to support faster and safer decision-making.

---

## ✨ Features

- 🆔 National Medical ID generation
- 🏥 Hospital onboarding & administration
- 👨‍⚕️ Doctor portal
- 📋 AI Clinical Brief
- 🤖 AI Medical Assistant
- 🚑 Emergency fingerprint access (simulated)
- 🔐 Role-based authentication
- 📊 Audit & access logs
- 🔗 Multi-hospital interoperability (simulated)

---

## 🛠 Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL / SQLite (MVP)
- **AI:** Gemini API
- **Deployment:** Vercel

---

## 🧪 Demo Credentials

| Role | ID | Password/PIN |
|------|----|--------------|
| Hospital Admin | `HSP000001` | `MedID@2026` |
| Doctor | `DR000001` | `Doctor@2026` |
| Patient | `MD12345678` | `1234` |

> You can also register new hospitals, doctors, and patients directly within the application.

---

## 🏗 Architecture

```
           MedID Platform
  National Identity & Access Layer
                │
     ┌──────────┼──────────┐
     │          │          │
 Hospital A  Hospital B  Hospital C
     EHR         EHR         EHR
```

Hospitals retain ownership of their medical records. MedID securely connects them through a shared identity and interoperability layer.

---

## 🗺 Roadmap

- FHIR interoperability
- Live NIN verification
- Real biometric authentication
- Hospital API integrations
- Laboratory & pharmacy integration
- National deployment

---

## ⚠ Disclaimer

This project is a **Proof of Concept (PoC)**. NIN verification, fingerprint authentication, SMS/email notifications, and hospital integrations are currently simulated for demonstration purposes.

---

## 🌍 Vision

To create a future where every Nigerian has a secure, portable medical identity that enables authorized healthcare providers to access the right information at the right time—improving continuity of care and ultimately saving lives.
