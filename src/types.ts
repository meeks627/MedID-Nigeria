export interface Encounter {
  date: string;
  doctorName: string;
  department: string;
  visitType: "Routine" | "Emergency" | "Inpatient" | "Specialist";
  diagnoses: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  laboratoryResults: {
    test: string;
    result: string;
    unit: string;
    range: string;
  }[];
  scans: {
    type: string;
    findings: string;
    imageLink?: string;
  }[];
  summary: string;
}

export interface PatientProfile {
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

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  department: string;
  hospitalId: string;
  hospitalName?: string;
  enabled: boolean;
}

export interface HospitalProfile {
  id: string;
  name: string;
  address: string;
  emergencyOverrideCode: string;
  codeGeneratedAt: string;
}

export interface AccessLog {
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

export type UserType = "PATIENT" | "DOCTOR" | "ADMIN" | "SECURITY" | null;

export type StaffRole = 
  | "DOCTOR" 
  | "NURSE" 
  | "LAB_TECH"
  | "PHARMACIST"
  | "RECORDS_CLERK" 
  | "HOSPITAL_ADMIN" 
  | "SECURITY_ADMIN" 
  | "PATIENT";

export type DutyStatus = "ON_DUTY" | "OFF_DUTY";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  hospitalId: string;
  hospitalName: string;
  department: string;
  ward?: string;
  dutyStatus: DutyStatus;
  licenseNumber?: string;
  enabled: boolean;
}

export type RecordSection = 
  | "IDENTITY_ADMIN" 
  | "EMERGENCY_CRITICAL" 
  | "ROUTINE_CLINICAL" 
  | "LAB_PATHOLOGY"
  | "PHARMACY_MAR"
  | "HIGHLY_RESTRICTED";

export interface SecurityAlert {
  id: string;
  timestamp: string;
  ruleId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
  hospitalId: string;
  patientMedID?: string;
  description: string;
  status: "PENDING_REVIEW" | "REVIEWED" | "DISMISSED";
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface AuditVerification {
  valid: boolean;
  totalEvents: number;
  genesisHash: string;
  headHash: string;
  lastVerifiedAt: string;
  tamperDetected: boolean;
  tamperedIndex?: number;
  tamperedEventId?: string;
  failureReason?: string;
  retentionPeriodDays: number;
  independentCheckpointStatus: string;
}

export interface DowntimeState {
  isOutageActive: boolean;
  medIdCoreStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  ehrAdapterStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  ninProviderStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  auditSinkStatus: "ONLINE" | "DEGRADED" | "OFFLINE";
  queuedEventsCount: number;
}

