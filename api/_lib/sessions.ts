import crypto from "crypto";
import { StaffUser, DutyStatus, StaffRole } from "./types";

interface SessionData {
  token: string;
  user: StaffUser;
  createdAt: number;
  expiresAt: number;
  lastActive: number;
  clientIp?: string;
  userAgent?: string;
}

// In-memory active session table
const sessions: Map<string, SessionData> = new Map();

// Rate limiting table: key -> timestamps[]
const rateLimitMap: Map<string, number[]> = new Map();

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

// Seed staff directory across all 6 healthcare facility roles + Compliance Directorate
export const SEED_STAFF_USERS: StaffUser[] = [
  {
    id: "DOC1",
    name: "Dr. James Bello",
    email: "james.bello@luth.org",
    role: "DOCTOR",
    hospitalId: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Internal Medicine",
    ward: "Ward 4 - Acute Care",
    wardId: "INTERNAL_MED_4B",
    licenseNumber: "MDN-2015-8831",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: true,
  },
  {
    id: "DOC2",
    name: "Dr. Helen Shitta",
    email: "helen.shitta@lasuth.gov",
    role: "DOCTOR",
    hospitalId: "LASUTH",
    hospitalName: "Lagos State University Teaching Hospital (LASUTH)",
    department: "Pulmonology",
    ward: "Ward 2 - Respiratory",
    wardId: "RESPIRATORY_2A",
    licenseNumber: "MDN-2012-4112",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: true,
  },
  {
    id: "DOC3",
    name: "Dr. Amara Obi",
    email: "amara.obi@evercare.com",
    role: "DOCTOR",
    hospitalId: "Evercare",
    hospitalName: "Evercare Hospital Lekki",
    department: "Orthopedics",
    ward: "Surgical Suite 3",
    wardId: "SURGERY_3",
    licenseNumber: "MDN-2018-9122",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: true,
  },
  {
    id: "NURSE1",
    name: "Nurse Chidinma Eze",
    email: "chidinma.eze@luth.org",
    role: "NURSE",
    hospitalId: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Emergency Bay",
    ward: "Trauma Bay A",
    wardId: "EMERGENCY_TRIAGE",
    licenseNumber: "NUR-2020-5519",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: true,
  },
  {
    id: "LAB1",
    name: "Emmanuel Okafor, MLS",
    email: "emmanuel.okafor@luth.org",
    role: "LAB_TECH",
    hospitalId: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Pathology & Clinical Chemistry",
    ward: "Central Diagnostic Lab",
    wardId: "PATHOLOGY_LAB",
    licenseNumber: "MLS-2018-4421",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: true,
  },
  {
    id: "PHARM1",
    name: "Pharm. Zainab Ahmed",
    email: "zainab.ahmed@luth.org",
    role: "PHARMACIST",
    hospitalId: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Pharmacy Services",
    ward: "Central Dispensary",
    wardId: "CENTRAL_DISPENSARY",
    licenseNumber: "PCN-2017-9102",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: true,
  },
  {
    id: "CLERK1",
    name: "Ibrahim Musa",
    email: "ibrahim.musa@luth.org",
    role: "RECORDS_CLERK",
    hospitalId: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Health Records & Registration",
    ward: "Front Desk & Patient Admissions",
    wardId: "PATIENT_ADMISSIONS",
    licenseNumber: "REC-REG-2022",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: false,
  },
  {
    id: "ADMIN1",
    name: "LUTH Hospital Admin",
    email: "admin@luth.org",
    role: "HOSPITAL_ADMIN",
    hospitalId: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Hospital Administration & Governance",
    ward: "Administrative Wing",
    wardId: "ADMIN_EXEC",
    licenseNumber: "ADM-LUTH-2019",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: true,
  },
  {
    id: "SEC1",
    name: "Alhaji Tunde Bakare",
    email: "security.officer@medid.gov.ng",
    role: "SECURITY_ADMIN",
    hospitalId: "LUTH",
    hospitalName: "National Health Information Security Directorate",
    department: "NDPA Security & Compliance Directorate",
    ward: "Compliance Operations",
    wardId: "COMPLIANCE_DIRECTORATE",
    licenseNumber: "FED-AUDIT-9921",
    dutyStatus: "ON_DUTY",
    enabled: true,
    mfaEnabled: true,
  }
];

let staffDirectory: StaffUser[] = [...SEED_STAFF_USERS];

export function getStaffDirectory(): StaffUser[] {
  return staffDirectory;
}

export function findStaffByEmail(email: string): StaffUser | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  // Support both official security.officer@medid.gov.ng and tunde.bakare@moh.gov.ng alias
  if (normalized === "tunde.bakare@moh.gov.ng") {
    return staffDirectory.find((s) => s.role === "SECURITY_ADMIN");
  }
  return staffDirectory.find((s) => s.email.toLowerCase() === normalized);
}

export function findStaffById(id: string): StaffUser | undefined {
  return staffDirectory.find((s) => s.id === id);
}

export function addStaffUser(user: StaffUser): void {
  staffDirectory.push(user);
}

export function createSession(user: StaffUser, durationMs: number = SESSION_TTL_MS): string {
  const token = `medid_sess_${crypto.randomBytes(24).toString("hex")}`;
  const now = Date.now();
  sessions.set(token, {
    token,
    user: { ...user },
    createdAt: now,
    expiresAt: now + durationMs,
    lastActive: now,
  });
  return token;
}

export function getSession(token: string): StaffUser | null {
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;

  const now = Date.now();
  if (now > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  // Refresh active user state in case duty status or enabled was updated
  const latestUser = findStaffById(session.user.id);
  if (latestUser) {
    if (!latestUser.enabled) {
      sessions.delete(token);
      return null;
    }
    session.user = { ...latestUser };
  }

  session.lastActive = now;
  return session.user;
}

export function revokeSession(token: string): boolean {
  return sessions.delete(token);
}

export function revokeAllUserSessions(userId: string): void {
  for (const [token, session] of sessions.entries()) {
    if (session.user.id === userId) {
      sessions.delete(token);
    }
  }
}

export function updateDutyStatus(userId: string, duty: DutyStatus): StaffUser | null {
  const staff = findStaffById(userId);
  if (!staff) return null;
  staff.dutyStatus = duty;

  // Update in existing active sessions
  for (const session of sessions.values()) {
    if (session.user.id === userId) {
      session.user.dutyStatus = duty;
    }
  }
  return staff;
}

/**
 * Sliding window rate-limiting helper
 * Returns false if rate limit exceeded
 */
export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxAttempts) {
    return false;
  }

  validTimestamps.push(now);
  rateLimitMap.set(key, validTimestamps);
  return true;
}
