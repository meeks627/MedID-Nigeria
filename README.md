# 🩺 MedID Nigeria

> **One Identity. Every Hospital. Better Care.**

MedID is an AI-powered National Healthcare Identity & Interoperability Platform that enables healthcare providers to securely identify patients and retrieve medical records across participating hospitals using a single Medical ID.

Unlike traditional Electronic Health Record (EHR) systems, MedID does **not** replace hospital software. Instead, it acts as a secure identity and interoperability layer that connects existing hospital systems, enabling continuity of care while hospitals remain owners of their patient records.

---

## 🚀 Live Demo

🌐 **Application**

https://med-id-nigeria-3ucs.vercel.app/

### 🔑 Demo Credentials

| Role | ID / Email | Password / PIN |
|------|-----------|----------------|
| 🏥 Hospital Admin | `LUTH` | `ADMIN123` |
| 👨‍⚕️ Doctor | `james.bello@luth.org` | License: `MDN-2015-8831` |
| 👤 Patient | `MD38281726` (Sarah Johnson) | PIN: `1234` |

> You can also **register new** hospitals, doctors, and patients directly inside the app.

---

## 📖 How to Explore MedID

MedID supports three primary user roles.

### 🏥 1. Hospital Administrator

Register a new hospital or log in as an existing administrator.

Responsibilities include:

- Register clinicians
- Manage doctors
- View hospital activity
- Monitor access logs
- Manage Emergency Override Codes

---

### 👨‍⚕️ 2. Doctor

Doctors can:

- Search patients using Medical ID
- Access patient records
- View AI Clinical Briefs
- Chat with the AI Medical Assistant
- Review medical history
- Perform Emergency Access through fingerprint simulation

---

### 👤 3. Patient

Patients can:

- Register with their NIN (simulated)
- Receive a unique Medical ID
- View their profile
- Track which clinicians have accessed their records

---

## 🚑 Demo Workflow

### Routine Consultation

1. Register or log in as a Hospital Administrator.
2. Register a Doctor.
3. Register a Patient.
4. Log in as the Doctor.
5. Search using the patient's Medical ID.
6. Review the AI Clinical Brief.
7. Ask follow-up questions using the AI Assistant.

---

### Emergency Consultation

1. Select **Fingerprint Identification**.
2. Simulate patient identification via NIN-linked biometrics.
3. Enter the Hospital Emergency Override Code.
4. Retrieve the emergency medical record.
5. Review the AI Clinical Brief before treatment.

---

## ✨ Features

- National Medical ID Generation
- Hospital Registration
- Doctor Registration
- Patient Registration
- AI Clinical Brief
- AI Medical Assistant
- Emergency Fingerprint Access (Simulated)
- NIN-linked Identity (Simulated)
- Hospital Access Logs
- Role-Based Authentication
- QR Code Support
- Multi-Hospital Architecture
- Audit Logging

---

## 🛠 Tech Stack

- Next.js
- React
- Tailwind CSS
- FastAPI
- PostgreSQL / SQLite
- Gemini API
- Vercel

---

## ⚠ Disclaimer

MedID is a Proof of Concept demonstrating how a national healthcare identity and interoperability platform could operate in Nigeria.

NIN verification, fingerprint authentication, hospital integrations, notifications, and interoperability workflows are currently simulated for demonstration purposes.

---

## 🌍 Vision

We envision a future where every Nigerian has a secure, portable medical identity that enables authorized healthcare professionals to access the right information at the right time—improving continuity of care, reducing medical errors, and ultimately saving lives.
