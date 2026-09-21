# MedID Nigeria — Access Control & Authorization Model

## 1. Overview
MedID Nigeria enforces a combination of **Role-Based Access Control (RBAC)** and **Attribute-Based Contextual Access Control (ABAC)**. Authorization decisions are made centrally on the backend by the Policy Decision Point (PDP) and enforced before any clinical or administrative payload is returned.

---

## 2. Staff Roles & Permissions Matrix

| Staff Role | Demographics Search (`SEARCH_PATIENT`) | Emergency Scope (`EMERGENCY_CRITICAL`) | Routine Clinical (`ROUTINE_CLINICAL`) | Highly Restricted (`HIGHLY_RESTRICTED`) | Staff Credentialing (`MANAGE_STAFF`) | Audit & Incident Review (`VIEW_AUDIT`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **DOCTOR (On Duty)** | **ALLOW** | **ALLOW** | **ALLOW** | Escalation / Break-Glass | DENY | DENY |
| **DOCTOR (Off Duty)**| **ALLOW** | DENY (403) | DENY (403) | DENY (403) | DENY | DENY |
| **NURSE (On Duty)**  | **ALLOW** | **ALLOW** | DENY (403) | DENY (403) | DENY | DENY |
| **RECORDS CLERK**    | **ALLOW** | DENY (403)* | DENY (403)* | DENY (403)* | DENY | DENY |
| **HOSPITAL ADMIN**   | DENY (403) | DENY (403) | DENY (403) | DENY (403) | **ALLOW** | **ALLOW** (Facility only) |
| **SECURITY ADMIN**   | DENY (403) | DENY (403) | DENY (403) | DENY (403) | DENY | **ALLOW** (Full system) |
| **PATIENT**          | Own Card only | Own Contact only | DENY (Patient-facing) | DENY | DENY | Own Access History only |

*\*Attempting clinical retrieval triggers a `CRITICAL` severity incident (`RULE_CLERK_CLINICAL_ACCESS`) and generates an unavoidable cryptographic audit entry.*

---

## 3. Contextual Attributes Evaluated

1. **Authentication Token**: Must resolve to a valid, non-expired server session.
2. **Account Status**: Disabled accounts are immediately blocked from all endpoints.
3. **Duty Status (`dutyStatus`)**:
   - `ON_DUTY`: Clinician is actively on shift in designated ward. Clinical queries allowed.
   - `OFF_DUTY`: Clinician is off duty. All clinical record queries are blocked with `403 Forbidden`.
4. **Facility Isolation**: Hospital administrators are restricted strictly to their hospital workspace.
5. **Purpose Specification**: Clinical requests must supply an explicit purpose (e.g., Routine Consultation, Pre-Operative Assessment, Emergency Override).

---

## 4. Record Section Classification

- **`IDENTITY_ADMIN`**:
  - Contains: Full Name, Date of Birth, Gender, Address, Phone, Email, Emergency Contact, Linked Hospital IDs.
  - Permitted Roles: Records Clerks, Nurses, Doctors, Patients (own profile).
- **`EMERGENCY_CRITICAL`**:
  - Contains: Documented severe allergies, adverse reactions, high-risk flags, acute medications (e.g. Inhalers, Insulin, Epinephrine), critical vitals (SpO2, Blood Glucose).
  - Permitted Roles: Doctors, Nurses on duty, Emergency Break-Glass responders.
- **`ROUTINE_CLINICAL`**:
  - Contains: Longitudinal diagnoses (e.g. Iron Deficiency Anemia, Type 2 Diabetes), routine prescriptions, outpatient lab results, imaging scans, and routine encounter notes.
  - Permitted Roles: Doctors on active duty.
- **`HIGHLY_RESTRICTED`**:
  - Contains: Sensitive psychiatric findings, genetic markers, or specialist notes requiring explicit clinical break-glass or patient consent escalation.
  - Permitted Roles: Requires explicit break-glass authorization.
