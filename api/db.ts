import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const DB_PATH =
  process.env.VERCEL === "1"
    ? "/tmp/medid-db.json"
    : path.join(process.cwd(), "medid-db.json");

interface StoredCounter {
  hospitalId: number;
  doctorId: number;
  patientMedId: number;
  logId: number;
}

interface StoredData {
  adminPasswords: Record<string, string>;
  patientPins: Record<string, string>;
  hospitals: any[];
  doctors: any[];
  patients: any[];
  logs: any[];
  counters: StoredCounter;
}

function getDefaultData(): StoredData {
  return {
    adminPasswords: {},
    patientPins: {},
    hospitals: [],
    doctors: [],
    patients: [],
    logs: [],
    counters: { hospitalId: 1, doctorId: 1, patientMedId: 38281727, logId: 1 },
  };
}

let data: StoredData = getDefaultData();

export function initDb(): void {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      data = { ...getDefaultData(), ...parsed };
      return;
    }
  } catch (e) {
    console.error("DB load failed, using defaults:", e);
  }
}

export function saveDb(): void {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data), "utf-8");
  } catch (e) {
    console.error("DB save failed:", e);
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return password === hash;
  }
}

export function hashPin(pin: string): string {
  return bcrypt.hashSync(pin, SALT_ROUNDS);
}

export function verifyPin(pin: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(pin, hash);
  } catch {
    return pin === hash;
  }
}

export function setSeedAdminPassword(id: string, pw: string): void {
  if (!data.adminPasswords[id]) {
    data.adminPasswords[id] = hashPassword(pw);
  }
}

export function setAdminPassword(id: string, pw: string): void {
  data.adminPasswords[id] = hashPassword(pw);
  saveDb();
}

export function getAdminPassword(id: string): string | undefined {
  return data.adminPasswords[id];
}

export function setPatientPin(medID: string, pin: string): void {
  data.patientPins[medID] = hashPin(pin);
  saveDb();
}

export function getPatientPin(medID: string): string | undefined {
  return data.patientPins[medID];
}

export function getHospitals(): any[] {
  return data.hospitals;
}

export function addHospital(h: any): void {
  data.hospitals.push(h);
  saveDb();
}

export function findHospital(id: string): any | undefined {
  return data.hospitals.find((h: any) => h.id === id);
}

export function updateHospital(id: string, updates: any): void {
  const idx = data.hospitals.findIndex((h: any) => h.id === id);
  if (idx !== -1) {
    data.hospitals[idx] = { ...data.hospitals[idx], ...updates };
    saveDb();
  }
}

export function getDoctors(): any[] {
  return data.doctors;
}

export function addDoctor(d: any): void {
  data.doctors.push(d);
  saveDb();
}

export function findDoctor(id: string): any | undefined {
  return data.doctors.find((d: any) => d.id === id);
}

export function findDoctorByEmail(email: string): any | undefined {
  return data.doctors.find(
    (d: any) => d.email.toLowerCase() === email.toLowerCase()
  );
}

export function toggleDoctor(id: string): any | undefined {
  const doc = data.doctors.find((d: any) => d.id === id);
  if (doc) {
    doc.enabled = !doc.enabled;
    saveDb();
  }
  return doc;
}

export function getDoctorsByHospital(hospitalId: string): any[] {
  return data.doctors.filter((d: any) => d.hospitalId === hospitalId);
}

export function getPatients(): any[] {
  return data.patients;
}

export function addPatient(p: any): void {
  data.patients.push(p);
  saveDb();
}

export function findPatient(medID: string): any | undefined {
  return data.patients.find((p: any) => p.medID === medID);
}

export function findPatientByNIN(nin: string): any | undefined {
  return data.patients.find((p: any) => p.nin === nin);
}

export function updatePatient(medID: string, updates: any): void {
  const idx = data.patients.findIndex((p: any) => p.medID === medID);
  if (idx !== -1) {
    data.patients[idx] = { ...data.patients[idx], ...updates };
    saveDb();
  }
}

export function getPatientsByHospital(hospitalId: string): any[] {
  return data.patients.filter(
    (p: any) =>
      p.linkedHospitals?.includes(hospitalId)
  );
}

export function getLogs(): any[] {
  return data.logs;
}

export function addLog(log: any): void {
  data.logs.push(log);
  saveDb();
}

export function getLogsByHospital(hospitalIdOrName: string): any[] {
  return data.logs.filter(
    (l: any) =>
      l.hospital?.includes(hospitalIdOrName) ||
      l.hospitalId === hospitalIdOrName
  );
}

export function getNextHospitalId(): string {
  const n = data.counters.hospitalId++;
  saveDb();
  return `HSP${String(n).padStart(6, "0")}`;
}

export function getNextDoctorId(): string {
  const n = data.counters.doctorId++;
  saveDb();
  return `DOC${n}`;
}

export function getNextLogId(): string {
  const n = data.counters.logId++;
  saveDb();
  return `LOG${n}`;
}

export function getNextMedID(): string {
  const n = data.counters.patientMedId++;
  saveDb();
  return `MD${n}`;
}
