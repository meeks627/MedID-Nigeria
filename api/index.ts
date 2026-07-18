import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const DATA_FILE = path.join("/tmp", "medid-data.json");

function loadPersistentData(): { hospitals: any[]; adminPasswords: Record<string, string> } {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load persistent data:", e);
  }
  return { hospitals: [], adminPasswords: {} };
}

function savePersistentData(data: { hospitals: any[]; adminPasswords: Record<string, string> }) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data), "utf-8");
  } catch (e) {
    console.error("Failed to save persistent data:", e);
  }
}

export const app = express();
app.use(express.json());

let ai: GoogleGenAI | null = null;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "medid-app",
        },
      },
    });
  } catch (err) {
    console.error("Failed to initialize Gemini API:", err);
  }
}

interface Encounter {
  date: string;
  doctorName: string;
  department: string;
  visitType: "Routine" | "Emergency" | "Inpatient" | "Specialist";
  diagnoses: string[];
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  laboratoryResults: { test: string; result: string; unit: string; range: string }[];
  scans: { type: string; findings: string; imageLink?: string }[];
  summary: string;
}

interface HospitalEHR {
  patients: {
    [medID: string]: {
      name: string;
      dob: string;
      gender: string;
      encounters: Encounter[];
    };
  };
}

const EHR_DATABASES: { [hospitalId: string]: HospitalEHR } = {
  LUTH: {
    patients: {
      MD38281726: {
        name: "Sarah Johnson",
        dob: "1988-04-12",
        gender: "Female",
        encounters: [
          {
            date: "2026-05-10",
            doctorName: "Dr. James Bello",
            department: "Internal Medicine",
            visitType: "Routine",
            diagnoses: ["Iron Deficiency Anemia", "Mild Vitamin D Deficiency"],
            medications: [
              { name: "Ferrous Sulfate", dosage: "325mg", frequency: "Once daily", duration: "3 months" },
              { name: "Vitamin D3", dosage: "1000 IU", frequency: "Once daily", duration: "2 months" },
            ],
            laboratoryResults: [
              { test: "Hemoglobin", result: "10.4", unit: "g/dL", range: "12.0 - 15.5" },
              { test: "Serum Iron", result: "45", unit: "mcg/dL", range: "50 - 170" },
              { test: "25-Hydroxy Vitamin D", result: "24", unit: "ng/mL", range: "30 - 100" },
            ],
            scans: [],
            summary: "Patient complained of moderate fatigue and occasional dizziness. Lab results confirm iron deficiency. Prescribed supplements and advised dietary modifications rich in iron.",
          },
        ],
      },
      MD77441199: {
        name: "David Kalu",
        dob: "1975-11-22",
        gender: "Male",
        encounters: [
          {
            date: "2026-06-01",
            doctorName: "Dr. James Bello",
            department: "Endocrinology",
            visitType: "Routine",
            diagnoses: ["Type 2 Diabetes Mellitus", "Essential Hypertension"],
            medications: [
              { name: "Metformin", dosage: "500mg", frequency: "Twice daily with meals", duration: "Ongoing" },
              { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", duration: "Ongoing" },
            ],
            laboratoryResults: [
              { test: "HbA1c", result: "7.2", unit: "%", range: "< 5.7%" },
              { test: "Fasting Blood Glucose", result: "142", unit: "mg/dL", range: "70 - 100" },
              { test: "Serum Creatinine", result: "0.9", unit: "mg/dL", range: "0.7 - 1.3" },
            ],
            scans: [],
            summary: "Routine quarterly follow-up for diabetes. Patient reports fair compliance with diet but occasional missed medications. Glucose levels are moderately elevated.",
          },
        ],
      },
    },
  },
  LASUTH: {
    patients: {
      MD38281726: {
        name: "Sarah Johnson",
        dob: "1988-04-12",
        gender: "Female",
        encounters: [
          {
            date: "2025-11-18",
            doctorName: "Dr. Helen Shitta",
            department: "Pulmonology",
            visitType: "Emergency",
            diagnoses: ["Acute Asthma Exacerbation", "Allergic Rhinitis"],
            medications: [
              { name: "Albuterol Inhaler (Ventolin)", dosage: "2 puffs", frequency: "Every 4 hours as needed", duration: "Ongoing" },
              { name: "Prednisone", dosage: "40mg", frequency: "Once daily in the morning", duration: "5 days" },
              { name: "Montelukast", dosage: "10mg", frequency: "Once daily at night", duration: "30 days" },
            ],
            laboratoryResults: [
              { test: "SpO2 (Room Air)", result: "91", unit: "%", range: "95 - 100" },
              { test: "Arterial pH", result: "7.41", unit: "", range: "7.35 - 7.45" },
            ],
            scans: [
              { type: "Chest X-Ray", findings: "Hyperinflation of the lungs, no consolidations or active infiltrates." },
            ],
            summary: "Presented with severe wheezing, shortness of breath, and chest tightness triggering after high pollen exposure. Responsive to nebulized albuterol in emergency bay. Discharged with oral steroids and an updated asthma action plan.",
          },
        ],
      },
    },
  },
  Evercare: {
    patients: {
      MD38281726: {
        name: "Sarah Johnson",
        dob: "1988-04-12",
        gender: "Female",
        encounters: [
          {
            date: "2026-03-05",
            doctorName: "Dr. Amara Obi",
            department: "Orthopedics",
            visitType: "Specialist",
            diagnoses: ["Left Knee Medial Meniscus Tear (Grade II)"],
            medications: [
              { name: "Ibuprofen", dosage: "400mg", frequency: "Three times daily as needed", duration: "7 days" },
            ],
            laboratoryResults: [],
            scans: [
              { type: "Knee MRI (Left)", findings: "Linear signal intensity in the posterior horn of the medial meniscus extending to the inferior articular surface. Consistent with Grade II tear. Minimal joint effusion." },
            ],
            summary: "Presented following an acute twisting injury during recreational tennis. Reports localized medial pain and mild locking. Examination demonstrates joint line tenderness. Recommended conservative management with physical therapy and bracing.",
          },
        ],
      },
      MD44118822: {
        name: "Chioma Adeleke",
        dob: "1993-08-30",
        gender: "Female",
        encounters: [
          {
            date: "2026-01-14",
            doctorName: "Dr. Amara Obi",
            department: "General Surgery",
            visitType: "Emergency",
            diagnoses: ["Acute Appendicitis", "Penicillin Allergy Alert"],
            medications: [
              { name: "Acetaminophen", dosage: "1000mg", frequency: "Every 6 hours as needed", duration: "5 days" },
              { name: "Ciprofloxacin", dosage: "500mg", frequency: "Twice daily", duration: "7 days" },
            ],
            laboratoryResults: [
              { test: "WBC Count", result: "14.2", unit: "10^3/uL", range: "4.5 - 11.0" },
            ],
            scans: [
              { type: "Abdominal Ultrasound", findings: "Non-compressible, blind-ending tubular structure in the right lower quadrant measuring 8mm in diameter. Surrounding inflammatory fluid. Diagnostic of acute appendicitis." },
            ],
            summary: "Presented with classic migratory right lower quadrant abdominal pain, nausea, and low-grade fever. Severe Penicillin allergy noted (history of anaphylaxis). Patient underwent successful uncomplicated laparoscopic appendectomy. Post-operative course unremarkable.",
          },
        ],
      },
    },
  },
};

interface PatientProfile {
  medID: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  nin: string;
  pin: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  linkedHospitals: string[];
}

const REGISTRY_PATIENTS: PatientProfile[] = [
  {
    medID: "MD38281726",
    name: "Sarah Johnson",
    dob: "1988-04-12",
    gender: "Female",
    phone: "+234-803-555-1122",
    email: "sarah.j@example.com",
    address: "12, Admiralty Way, Lekki Phase 1, Lagos",
    nin: "12345678901",
    pin: "1234",
    emergencyContact: {
      name: "Michael Johnson",
      relationship: "Spouse",
      phone: "+234-805-555-0199",
    },
    linkedHospitals: ["LUTH", "LASUTH", "Evercare"],
  },
  {
    medID: "MD77441199",
    name: "David Kalu",
    dob: "1975-11-22",
    gender: "Male",
    phone: "+234-812-444-9988",
    email: "david.kalu@example.com",
    address: "45, Gbagada Expressway, Lagos",
    nin: "98765432109",
    pin: "5678",
    emergencyContact: {
      name: "Linda Kalu",
      relationship: "Sister",
      phone: "+234-803-111-2222",
    },
    linkedHospitals: ["LUTH"],
  },
  {
    medID: "MD44118822",
    name: "Chioma Adeleke",
    dob: "1993-08-30",
    gender: "Female",
    phone: "+234-706-999-8811",
    email: "chioma.adeleke@example.com",
    address: "7, Toyin Street, Ikeja, Lagos",
    nin: "55566677788",
    pin: "2468",
    emergencyContact: {
      name: "Babatunde Adeleke",
      relationship: "Father",
      phone: "+234-802-333-4444",
    },
    linkedHospitals: ["Evercare"],
  },
];

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  department: string;
  hospitalId: string;
  enabled: boolean;
}

const REGISTRY_DOCTORS: Doctor[] = [
  {
    id: "DOC1",
    name: "Dr. James Bello",
    email: "james.bello@luth.org",
    phone: "+234-803-123-4567",
    licenseNumber: "MDN-2015-8831",
    department: "Internal Medicine",
    hospitalId: "LUTH",
    enabled: true,
  },
  {
    id: "DOC2",
    name: "Dr. Helen Shitta",
    email: "helen.shitta@lasuth.gov",
    phone: "+234-805-987-6543",
    licenseNumber: "MDN-2012-4112",
    department: "Pulmonology",
    hospitalId: "LASUTH",
    enabled: true,
  },
  {
    id: "DOC3",
    name: "Dr. Amara Obi",
    email: "amara.obi@evercare.com",
    phone: "+234-812-345-6789",
    licenseNumber: "MDN-2018-9122",
    department: "Orthopedics",
    hospitalId: "Evercare",
    enabled: true,
  },
];

interface HospitalProfile {
  id: string;
  name: string;
  address: string;
  emergencyOverrideCode: string;
  codeGeneratedAt: Date;
}

const REGISTRY_HOSPITALS: HospitalProfile[] = [
  {
    id: "LUTH",
    name: "Lagos University Teaching Hospital (LUTH)",
    address: "Ishaga Rd, Idi-Araba, Surulere, Lagos",
    emergencyOverrideCode: "LUTH-9988",
    codeGeneratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "LASUTH",
    name: "Lagos State University Teaching Hospital (LASUTH)",
    address: "1-5, Oba Akinjobi Rd, Ikeja, Lagos",
    emergencyOverrideCode: "LASU-1122",
    codeGeneratedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "Evercare",
    name: "Evercare Hospital Lekki",
    address: "Amity Rd, Lekki Phase 1, Lagos",
    emergencyOverrideCode: "EVER-7744",
    codeGeneratedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
];

interface AccessLog {
  id: string;
  date: string;
  time: string;
  hospital: string;
  doctor: string;
  patientName: string;
  patientMedID: string;
  purpose: string;
  accessType: "Approved" | "Emergency Access";
  duration: string;
  status: "Approved" | "Active" | "Completed";
}

const AUDIT_LOGS: AccessLog[] = [
  {
    id: "LOG1",
    date: "12 July 2026",
    time: "10:30 AM",
    hospital: "Lagos University Teaching Hospital (LUTH)",
    doctor: "Dr. James Bello",
    patientName: "Sarah Johnson",
    patientMedID: "MD38281726",
    purpose: "Routine Consultation",
    accessType: "Approved",
    duration: "15 minutes",
    status: "Approved",
  },
  {
    id: "LOG2",
    date: "14 July 2026",
    time: "02:15 AM",
    hospital: "Lagos State University Teaching Hospital (LASUTH)",
    doctor: "Dr. Helen Shitta",
    patientName: "Sarah Johnson",
    patientMedID: "MD38281726",
    purpose: "Acute Wheezing & Shortness of Breath",
    accessType: "Emergency Access",
    duration: "8 minutes",
    status: "Approved",
  },
];

const ADMIN_PASSWORDS: { [hospitalId: string]: string } = {
  LUTH: "ADMIN123",
  LASUTH: "ADMIN123",
  Evercare: "ADMIN123",
};

const persistentData = loadPersistentData();
const REGISTERED_HOSPITALS: HospitalProfile[] = persistentData.hospitals;
const REGISTERED_PASSWORDS: Record<string, string> = persistentData.adminPasswords;

let hospitalIdCounter = REGISTERED_HOSPITALS.length + 1;
let medIDCounter = 38281727;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/patient/register", (req, res) => {
  const { name, dob, gender, phone, email, address, nin, pin, emergencyContact } = req.body;

  if (!nin) {
    return res.status(400).json({ error: "NIN (National Identity Number) is mandatory. Registration is strictly blocked without NIN." });
  }

  const existingByNin = REGISTRY_PATIENTS.find((p) => p.nin === nin);
  if (existingByNin) {
    return res.status(400).json({ error: "A MedID profile is already linked to this NIN." });
  }

  const uniqueDigits = String(medIDCounter++);
  const medID = `MD${uniqueDigits}`;

  const newPatient: PatientProfile = {
    medID,
    name,
    dob,
    gender,
    phone,
    email,
    address,
    nin,
    pin: pin || "1234",
    emergencyContact: emergencyContact || { name: "", relationship: "", phone: "" },
    linkedHospitals: [],
  };

  REGISTRY_PATIENTS.push(newPatient);

  res.json({
    success: true,
    medID,
    patient: newPatient,
    notifications: {
      email: `[SIMULATED EMAIL SENT to ${email}]: Welcome to MedID. Your secure National Healthcare Identity Number is ${medID}. Keeps this safe.`,
      sms: `[SIMULATED SMS SENT to ${phone}]: MedID Registration Complete. ID: ${medID}. Access history is verifiable at any time.`,
    },
  });
});

app.post("/api/patient/recover", (req, res) => {
  const { nin } = req.body;
  if (!nin) {
    return res.status(400).json({ error: "NIN is mandatory to recover your MedID." });
  }

  const patient = REGISTRY_PATIENTS.find((p) => p.nin === nin);
  if (!patient) {
    return res.status(404).json({ error: "No MedID associated with this NIN. Please register." });
  }

  res.json({
    success: true,
    medID: patient.medID,
    phone: patient.phone,
    email: patient.email,
    otpCode: "482019",
    otpSimulatedNotification: `[SIMULATED SMS to ${patient.phone}]: Your MedID verification code is 482019. Enter this code to retrieve your Medical ID.`,
  });
});

app.post("/api/patient/login", (req, res) => {
  const { medID, pin } = req.body;
  const patient = REGISTRY_PATIENTS.find((p) => p.medID === medID);

  if (!patient) {
    return res.status(404).json({ error: "MedID not found." });
  }

  if (patient.pin !== pin) {
    return res.status(401).json({ error: "Invalid PIN." });
  }

  const logs = AUDIT_LOGS.filter((l) => l.patientMedID === medID);
  res.json({
    success: true,
    patient: {
      medID: patient.medID,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      phone: patient.phone,
      email: patient.email,
      address: patient.address,
      emergencyContact: patient.emergencyContact,
    },
    accessHistory: logs,
  });
});

app.post("/api/doctor/login", (req, res) => {
  const { email, licenseNumber } = req.body;
  const doctor = REGISTRY_DOCTORS.find((d) => d.email.toLowerCase() === email.toLowerCase());

  if (!doctor) {
    return res.status(404).json({ error: "Doctor credentials not found." });
  }

  if (!doctor.enabled) {
    return res.status(403).json({ error: "Your doctor account has been disabled by your hospital administrator." });
  }

  const hospital = REGISTRY_HOSPITALS.find((h) => h.id === doctor.hospitalId);

  res.json({
    success: true,
    doctor: {
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      licenseNumber: doctor.licenseNumber,
      department: doctor.department,
      hospitalId: doctor.hospitalId,
      hospitalName: hospital ? hospital.name : doctor.hospitalId,
    },
  });
});

app.post("/api/admin/login", (req, res) => {
  const { hospitalId, password } = req.body;
  let hospital = REGISTRY_HOSPITALS.find((h) => h.id === hospitalId);
  if (!hospital) {
    hospital = REGISTERED_HOSPITALS.find((h) => h.id === hospitalId);
  }

  if (!hospital) {
    return res.status(404).json({ error: "Hospital not registered on MedID platform." });
  }

  let expectedPassword = ADMIN_PASSWORDS[hospitalId];
  if (!expectedPassword) {
    expectedPassword = REGISTERED_PASSWORDS[hospitalId];
  }

  if (!expectedPassword || password !== expectedPassword) {
    return res.status(401).json({ error: "Invalid Hospital Administrator credentials." });
  }

  res.json({
    success: true,
    hospital: {
      id: hospital.id,
      name: hospital.name,
      address: hospital.address,
      emergencyOverrideCode: hospital.emergencyOverrideCode,
      codeGeneratedAt: hospital.codeGeneratedAt,
    },
  });
});

app.get("/api/admin/hospitals", (req, res) => {
  const allHospitals = [...REGISTRY_HOSPITALS, ...REGISTERED_HOSPITALS];
  const list = allHospitals.map((h) => ({ id: h.id, name: h.name }));
  res.json(list);
});

app.post("/api/admin/register", (req, res) => {
  const {
    hospitalName, hospitalType, registrationNumber,
    email, phone, website,
    country, state, city, address,
    adminName, adminPosition, adminEmail, adminPhone, adminNIN,
    password, ehrSystem, customEHR,
  } = req.body;

  if (!hospitalName || !registrationNumber || !adminName || !adminEmail || !password) {
    return res.status(400).json({ error: "Required fields missing." });
  }

  const existingReg = REGISTRY_HOSPITALS.find((h) => h.name === hospitalName);
  if (existingReg) {
    return res.status(409).json({ error: "This hospital is already registered on MedID." });
  }

  const idStr = String(hospitalIdCounter++).padStart(6, "0");
  const hospitalId = `HSP${idStr}`;

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const emergencyCode = `MDEM-${randomDigits}`;

  const newHospital: HospitalProfile = {
    id: hospitalId,
    name: hospitalName,
    address: `${address || ""}, ${city || ""}, ${state || ""}, ${country || "Nigeria"}`,
    emergencyOverrideCode: emergencyCode,
    codeGeneratedAt: new Date(),
  };

  REGISTERED_HOSPITALS.push(newHospital);
  REGISTERED_PASSWORDS[hospitalId] = password;

  savePersistentData({ hospitals: REGISTERED_HOSPITALS, adminPasswords: REGISTERED_PASSWORDS });

  res.json({
    success: true,
    hospitalId,
    hospitalName,
    emergencyOverrideCode: emergencyCode,
  });
});

app.get("/api/admin/:hospitalId/doctors", (req, res) => {
  const { hospitalId } = req.params;
  const docs = REGISTRY_DOCTORS.filter((d) => d.hospitalId === hospitalId);
  res.json(docs);
});

app.post("/api/admin/:hospitalId/doctors/register", (req, res) => {
  const { hospitalId } = req.params;
  const { name, email, phone, licenseNumber, department } = req.body;

  if (!name || !email || !licenseNumber) {
    return res.status(400).json({ error: "Missing required fields for doctor registration." });
  }

  const id = `DOC${REGISTRY_DOCTORS.length + 1}`;
  const newDoc: Doctor = {
    id,
    name,
    email,
    phone: phone || "",
    licenseNumber,
    department: department || "General Practice",
    hospitalId,
    enabled: true,
  };

  REGISTRY_DOCTORS.push(newDoc);
  res.json({ success: true, doctor: newDoc });
});

app.post("/api/admin/doctors/toggle", (req, res) => {
  const { doctorId } = req.body;
  const doc = REGISTRY_DOCTORS.find((d) => d.id === doctorId);

  if (!doc) {
    return res.status(404).json({ error: "Doctor not found." });
  }

  doc.enabled = !doc.enabled;
  res.json({ success: true, enabled: doc.enabled, doctor: doc });
});

app.post("/api/admin/:hospitalId/emergency-code/rotate", (req, res) => {
  const { hospitalId } = req.params;
  let hospital = REGISTRY_HOSPITALS.find((h) => h.id === hospitalId);
  if (!hospital) {
    hospital = REGISTERED_HOSPITALS.find((h) => h.id === hospitalId);
  }

  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found." });
  }

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const newCode = `${hospitalId.slice(0, 4).toUpperCase()}-${randomDigits}`;

  hospital.emergencyOverrideCode = newCode;
  hospital.codeGeneratedAt = new Date();

  if (REGISTERED_HOSPITALS.includes(hospital as any)) {
    savePersistentData({ hospitals: REGISTERED_HOSPITALS, adminPasswords: REGISTERED_PASSWORDS });
  }

  res.json({
    success: true,
    emergencyOverrideCode: newCode,
    codeGeneratedAt: hospital.codeGeneratedAt,
  });
});

app.get("/api/admin/:hospitalId/patients", (req, res) => {
  const { hospitalId } = req.params;
  const patients = REGISTRY_PATIENTS.filter((p) => {
    return p.linkedHospitals.includes(hospitalId) || (EHR_DATABASES[hospitalId]?.patients[p.medID] !== undefined);
  });
  res.json(patients);
});

app.get("/api/admin/:hospitalId/logs", (req, res) => {
  const { hospitalId } = req.params;
  let hospital = REGISTRY_HOSPITALS.find((h) => h.id === hospitalId);
  if (!hospital) {
    hospital = REGISTERED_HOSPITALS.find((h) => h.id === hospitalId);
  }
  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found." });
  }
  const logs = AUDIT_LOGS.filter((l) => l.hospital.includes(hospitalId) || l.hospital === hospital.name);
  res.json(logs);
});

app.get("/api/doctor/search-patient", (req, res) => {
  const { medID } = req.query;
  if (!medID) {
    return res.status(400).json({ error: "MedID is required." });
  }

  const patient = REGISTRY_PATIENTS.find((p) => p.medID === medID.toString().trim());
  if (!patient) {
    return res.status(404).json({ error: "Patient not found. Verify MedID formatting." });
  }

  const recordsAvailable: { [hospitalId: string]: boolean } = {};
  Object.keys(EHR_DATABASES).forEach((hosp) => {
    recordsAvailable[hosp] = EHR_DATABASES[hosp].patients[patient.medID] !== undefined;
  });

  res.json({
    name: patient.name,
    medID: patient.medID,
    dob: patient.dob,
    gender: patient.gender,
    recordsAvailable,
  });
});

app.post("/api/doctor/retrieve-records", (req, res) => {
  const { medID, doctorId, purpose } = req.body;

  if (!medID || !doctorId) {
    return res.status(400).json({ error: "Missing required query parameters." });
  }

  const patient = REGISTRY_PATIENTS.find((p) => p.medID === medID);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found." });
  }

  const doctor = REGISTRY_DOCTORS.find((d) => d.id === doctorId);
  if (!doctor) {
    return res.status(404).json({ error: "Doctor authentication invalid." });
  }

  const hospital = REGISTRY_HOSPITALS.find((h) => h.id === doctor.hospitalId);

  const retrievedRecords: { [hospitalName: string]: Encounter[] } = {};
  Object.keys(EHR_DATABASES).forEach((hospId) => {
    const hospRecord = EHR_DATABASES[hospId].patients[medID];
    if (hospRecord) {
      const hospitalName = REGISTRY_HOSPITALS.find((h) => h.id === hospId)?.name || hospId;
      retrievedRecords[hospitalName] = hospRecord.encounters;
    }
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });

  const newLog: AccessLog = {
    id: `LOG${AUDIT_LOGS.length + 1}`,
    date: dateStr,
    time: timeStr,
    hospital: hospital ? hospital.name : doctor.hospitalId,
    doctor: doctor.name,
    patientName: patient.name,
    patientMedID: patient.medID,
    purpose: purpose || "Routine Consultation",
    accessType: "Approved",
    duration: "10 minutes",
    status: "Completed",
  };
  AUDIT_LOGS.push(newLog);

  if (hospital && !patient.linkedHospitals.includes(hospital.id)) {
    patient.linkedHospitals.push(hospital.id);
  }

  res.json({
    success: true,
    patientInfo: {
      medID: patient.medID,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      emergencyContact: patient.emergencyContact,
    },
    retrievedRecords,
  });
});

app.post("/api/doctor/emergency-biometric-match", (req, res) => {
  const { biometricType, scanData, reason, doctorId } = req.body;
  let selectedPatient = REGISTRY_PATIENTS[0];
  if (scanData === "fingerprint_david") {
    selectedPatient = REGISTRY_PATIENTS[1];
  } else if (scanData === "face_chioma") {
    selectedPatient = REGISTRY_PATIENTS[2];
  }

  res.json({
    success: true,
    message: "Biometric NIN simulation successful.",
    patientMatched: {
      medID: selectedPatient.medID,
      name: selectedPatient.name,
      dob: selectedPatient.dob,
      gender: selectedPatient.gender,
    },
    emergencyToken: `EMERGENCY-TOKEN-${Math.floor(100000 + Math.random() * 900000)}`,
  });
});

app.post("/api/doctor/emergency-retrieve", (req, res) => {
  const { emergencyToken, emergencyOverrideCode, reason, medID, doctorId } = req.body;

  if (!emergencyOverrideCode || !medID || !doctorId) {
    return res.status(400).json({ error: "Missing emergency credentials or Patient MedID." });
  }

  const doctor = REGISTRY_DOCTORS.find((d) => d.id === doctorId);
  if (!doctor) {
    return res.status(404).json({ error: "Doctor credentials invalid." });
  }

  const hospital = REGISTRY_HOSPITALS.find((h) => h.id === doctor.hospitalId);
  if (!hospital) {
    return res.status(404).json({ error: "Hospital admin profile missing." });
  }

  if (hospital.emergencyOverrideCode !== emergencyOverrideCode) {
    return res.status(401).json({ error: "Invalid Hospital Emergency Override Code. Please consult your Hospital Admin." });
  }

  const patient = REGISTRY_PATIENTS.find((p) => p.medID === medID);
  if (!patient) {
    return res.status(404).json({ error: "Patient MedID invalid." });
  }

  const retrievedRecords: { [hospitalName: string]: Encounter[] } = {};
  Object.keys(EHR_DATABASES).forEach((hospId) => {
    const hospRecord = EHR_DATABASES[hospId].patients[medID];
    if (hospRecord) {
      const hospitalName = REGISTRY_HOSPITALS.find((h) => h.id === hospId)?.name || hospId;
      retrievedRecords[hospitalName] = hospRecord.encounters;
    }
  });

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });

  const emergencyLog: AccessLog = {
    id: `LOG${AUDIT_LOGS.length + 1}`,
    date: dateStr,
    time: timeStr,
    hospital: hospital.name,
    doctor: doctor.name,
    patientName: patient.name,
    patientMedID: patient.medID,
    purpose: `EMERGENCY OVERRIDE: ${reason || "Unconscious patient rescue"}`,
    accessType: "Emergency Access",
    duration: "15 minutes",
    status: "Completed",
  };
  AUDIT_LOGS.push(emergencyLog);

  res.json({
    success: true,
    patientInfo: {
      medID: patient.medID,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      emergencyContact: patient.emergencyContact,
    },
    retrievedRecords,
  });
});

function formatRecordsForContext(patientName: string, records: { [hospitalName: string]: Encounter[] }): string {
  let output = `PATIENT: ${patientName}\n\n`;
  Object.entries(records).forEach(([hosp, encounters]) => {
    output += `--- HOSPITAL: ${hosp} ---\n`;
    if (encounters.length === 0) {
      output += "No encounters recorded here.\n\n";
      return;
    }
    encounters.forEach((enc, idx) => {
      output += `Encounter #${idx + 1} (${enc.date}) by ${enc.doctorName} [${enc.department} - ${enc.visitType}]\n`;
      output += `  Diagnoses: ${enc.diagnoses.join(", ")}\n`;
      output += `  Active Medications:\n`;
      if (enc.medications.length > 0) {
        enc.medications.forEach((med) => {
          output += `    - ${med.name} (${med.dosage}, ${med.frequency}, for ${med.duration})\n`;
        });
      } else {
        output += `    - None\n`;
      }
      output += `  Lab Results:\n`;
      if (enc.laboratoryResults.length > 0) {
        enc.laboratoryResults.forEach((lab) => {
          output += `    - ${lab.test}: ${lab.result} ${lab.unit} (Ref: ${lab.range})\n`;
        });
      } else {
        output += `    - None\n`;
      }
      output += `  Scans:\n`;
      if (enc.scans.length > 0) {
        enc.scans.forEach((scan) => {
          output += `    - ${scan.type}: ${scan.findings}\n`;
        });
      } else {
        output += `    - None\n`;
      }
      output += `  Summary: ${enc.summary}\n\n`;
    });
  });
  return output;
}

app.post("/api/gemini/clinical-brief", async (req, res) => {
  const { patientName, retrievedRecords } = req.body;

  if (!patientName || !retrievedRecords) {
    return res.status(400).json({ error: "Patient name and retrieved records context are required." });
  }

  const contextStr = formatRecordsForContext(patientName, retrievedRecords);

  const systemInstruction = `You are an expert AI Clinical Assistant powering MedID, a national health identity platform.
Your task is to generate a highly concise "AI Clinical Brief" from the retrieved medical records.
This is NOT a copy-paste summary. It must be written for doctors to read in under 20 seconds.
Only prioritize clinically relevant information. Focus on items changing immediate medical management or presenting safety risks.

You MUST follow this exact structure verbatim with bold Markdown headers:

**Patient Snapshot**
[Age, gender, active alerts. Keep to 1-2 sentences.]

**Critical Alerts**
[Allergies, high-risk conditions, severe adverse reactions. If none, write "None noted."]

**Active Conditions**
[Primary active diagnoses currently managed across hospitals.]

**Current Medications**
[Names, dosages, frequencies. Only include active treatments.]

**Latest Significant Encounter**
[A brief description of the most recent significant hospital visit, date, and core outcome.]

**Clinical Risks**
[Potential contraindications, disease progression signs, or critical follow-up items.]

**Immediate Clinical Considerations**
[Actionable, immediate suggestions or questions the treating doctor should ask the patient or address in today's consultation.]

**Emergency Contact**
[Name, Relationship, Phone number.]

Never include mock system jargon like "STATUS: LIVE" or credit lines. Use professional medical terminology.`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Generate a clinical briefing from the following hospital records:\n\n${contextStr}`,
        config: {
          systemInstruction,
          temperature: 0.1,
        },
      });

      return res.json({ brief: response.text });
    } catch (err) {
      console.error("Gemini API call failed:", err);
    }
  }

  console.log("Using backup rule-based AI Brief builder...");
  const briefText = generateSimulatedBrief(patientName, retrievedRecords);
  res.json({ brief: briefText, isSimulated: true });
});

app.post("/api/gemini/chat", async (req, res) => {
  const { patientName, retrievedRecords, messages } = req.body;

  if (!patientName || !retrievedRecords || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing records context or message logs." });
  }

  const contextStr = formatRecordsForContext(patientName, retrievedRecords);
  const userMessage = messages[messages.length - 1]?.content;

  const systemInstruction = `You are a strict clinical EHR query agent on the MedID platform.
Your ONLY source of information is the following retrieved hospital records for patient ${patientName}:

${contextStr}

Rule 1: Answer the doctor's query using ONLY the details found in the records above.
Rule 2: Never hallucinate or invent clinical details.
Rule 3: If the information does NOT exist in the retrieved records, you MUST say:
"No information available in the retrieved records."
Do not invent anything. Do not seek external knowledge.
Rule 4: Keep your answer highly professional, clinical, and directly relevant to the patient's care.`;

  if (ai) {
    try {
      const formattedContents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.1,
        },
      });

      return res.json({ response: response.text });
    } catch (err) {
      console.error("Gemini API call failed in chat:", err);
    }
  }

  const offlineAns = generateOfflineChatAnswer(userMessage, contextStr);
  res.json({ response: offlineAns, isSimulated: true });
});

function generateSimulatedBrief(patientName: string, retrievedRecords: { [hospitalName: string]: Encounter[] }): string {
  const diagnoses: string[] = [];
  const medications: string[] = [];
  let emergencyContact = "Michael Johnson (Spouse) - +234-805-555-0199";
  let criticalAlert = "None noted.";
  let latestEncounter = "No recent records.";

  if (patientName.toLowerCase().includes("sarah")) {
    criticalAlert = "None noted. History of acute asthma.";
    diagnoses.push("Iron Deficiency Anemia", "Mild Vitamin D Deficiency", "Acute Asthma Exacerbation", "Grade II Left Knee Medial Meniscus Tear");
    medications.push("Ferrous Sulfate 325mg (once daily)", "Vitamin D3 1000 IU (once daily)", "Albuterol Inhaler 2 puffs (as needed)", "Montelukast 10mg (once daily)");
    latestEncounter = "March 05, 2026: Specialist orthopedic consultation at Evercare for left knee Grade II meniscus tear.";
  } else if (patientName.toLowerCase().includes("chioma")) {
    criticalAlert = "PENICILLIN ALLERGY (History of Anaphylaxis) - CRITICAL SAFETY RISK";
    diagnoses.push("Acute Appendicitis (Laparoscopic appendectomy completed)");
    medications.push("Acetaminophen 1000mg (as needed)", "Ciprofloxacin 500mg (twice daily)");
    latestEncounter = "January 14, 2026: Emergency appendectomy at Evercare Hospital due to acute appendicitis. Discharged following successful laparoscopy.";
    emergencyContact = "Babatunde Adeleke (Father) - +234-802-333-4444";
  } else if (patientName.toLowerCase().includes("david")) {
    criticalAlert = "High Risk: Type 2 Diabetes & Hypertension.";
    diagnoses.push("Type 2 Diabetes Mellitus", "Essential Hypertension");
    medications.push("Metformin 500mg (twice daily with meals)", "Lisinopril 10mg (once daily)");
    latestEncounter = "June 01, 2026: Routine diabetes review at LUTH. Glucose mildly elevated, fair diet compliance.";
    emergencyContact = "Linda Kalu (Sister) - +234-803-111-2222";
  }

  return `**Patient Snapshot**
${patientName}, diagnosed with primary chronic conditions being managed. Currently stable but warrants routine safety review.

**Critical Alerts**
* **${criticalAlert}**

**Active Conditions**
${diagnoses.map((d) => `* ${d}`).join("\n")}

**Current Medications**
${medications.map((m) => `* ${m}`).join("\n")}

**Latest Significant Encounter**
${latestEncounter}

**Clinical Risks**
* Risk of asthmatic trigger in seasonal changes.
* Medication adherence needs monitoring (e.g. iron and vitamin supplement cycle checks).
* Meniscus healing progress requires active rehabilitation feedback.

**Immediate Clinical Considerations**
1. Assess fatigue index and confirm if iron therapy has improved Hb levels.
2. Verify asthma controller therapy compliance and check inhaler technique.
3. Review physical therapy plan for the left knee joint stability.

**Emergency Contact**
${emergencyContact}`;
}

function generateOfflineChatAnswer(userMsg: string, recordContext: string): string {
  const query = userMsg.toLowerCase();

  if (query.includes("allergy") || query.includes("allergies")) {
    if (recordContext.toLowerCase().includes("penicillin")) {
      return "The patient has a documented severe Penicillin allergy (History of Anaphylaxis). Avoid prescribing penicillin-class drugs.";
    }
    if (recordContext.toLowerCase().includes("asthma")) {
      return "No drug allergies are listed, but the patient has a history of allergic rhinitis and asthma triggered by pollen.";
    }
    return "No allergies are explicitly documented in the retrieved records.";
  }

  if (query.includes("medication") || query.includes("medicine") || query.includes("drug")) {
    if (recordContext.toLowerCase().includes("ferrous")) {
      return "The patient's current medications listed are:\n- Ferrous Sulfate (325mg once daily)\n- Vitamin D3 (1000 IU once daily)\n- Albuterol Inhaler (2 puffs every 4 hours as needed)\n- Montelukast (10mg once daily)";
    }
    if (recordContext.toLowerCase().includes("metformin")) {
      return "Current medications in record:\n- Metformin (500mg twice daily with meals)\n- Lisinopril (10mg once daily)";
    }
    if (recordContext.toLowerCase().includes("ciprofloxacin")) {
      return "Current medications in record:\n- Acetaminophen (1000mg as needed)\n- Ciprofloxacin (500mg twice daily)";
    }
  }

  if (query.includes("renal") || query.includes("kidney")) {
    return "No history of renal disease or kidney impairment is noted in the retrieved records. Creatinine levels are in normal ranges (0.9 mg/dL for David Kalu).";
  }

  if (query.includes("mri") || query.includes("scan") || query.includes("x-ray")) {
    if (recordContext.toLowerCase().includes("meniscus")) {
      return "Yes, there is an MRI of the Left Knee dated March 05, 2026. Findings: Linear signal intensity in the posterior horn of the medial meniscus extending to the inferior articular surface. Consistent with Grade II tear. Minimal joint effusion.";
    }
    if (recordContext.toLowerCase().includes("chest")) {
      return "A Chest X-Ray was performed on November 18, 2025. Findings: Hyperinflation of the lungs, no consolidations or active infiltrates.";
    }
  }

  if (query.includes("asthma")) {
    if (recordContext.toLowerCase().includes("asthma")) {
      return "The patient had an Acute Asthma Exacerbation visit to LASUTH on November 18, 2025. She was treated in the emergency room with nebulized albuterol and discharged with Ventolin and a 5-day course of oral Prednisone.";
    }
    return "No records of asthma are documented for this patient.";
  }

  return `Based on the retrieved medical records, the patient is currently stable. For detailed queries, please check specific encounters or consult with the primary specialist. (Note: Running in high-fidelity offline backup mode).`;
}

export default function handler(req: any, res: any) {
  app(req, res);
}
