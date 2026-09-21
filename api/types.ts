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
  hospitalName?: string;
  department?: string;
  ward?: string;
  wardId?: string;
  licenseNumber?: string;
  dutyStatus: DutyStatus;
  enabled: boolean;
  mfaEnabled?: boolean;
}

export type RecordSection = 
  | "IDENTITY_ADMIN"       // Demographics, NIN, Registration
  | "EMERGENCY_CRITICAL"   // Blood type, severe allergies, acute alerts
  | "ROUTINE_CLINICAL"     // Diagnoses, clinical history, physician notes
  | "LAB_PATHOLOGY"        // Lab test orders, blood panels, specimens
  | "PHARMACY_MAR"         // Prescriptions, dosage, MAR dispensing
  | "HIGHLY_RESTRICTED";   // Psychiatric notes, genetic data, sensitive escalations

export type PolicyAction = 
  | "SEARCH_PATIENT" 
  | "RETRIEVE_RECORDS" 
  | "EMERGENCY_OVERRIDE" 
  | "GENERATE_AI_BRIEF" 
  | "AI_CHAT_QUERY"
  | "MANAGE_STAFF"
  | "VIEW_AUDIT_LOGS"
  | "VERIFY_AUDIT"
  | "VIEW_SECURITY_ALERTS"
  | "ADMIN_CREDENTIAL_MGMT"
  | "INITIALIZE_IMMUTABLE_LOG"
  | string;

export interface PolicyContext {
  subject: StaffUser;
  patientMedID?: string;
  action: PolicyAction;
  resource?: string;
  requestedSections?: RecordSection[];
  purpose?: string;
  isEmergency?: boolean;
  emergencyToken?: string;
}

export interface PolicyDecision {
  decision: "ALLOW" | "DENY";
  reason: string;
  permittedSections: RecordSection[];
  alertTrigger?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: number | string;
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
  hospitalId: string;
  patientMedID?: string;
  action: PolicyAction;
  eventType: string;
  decision: "ALLOW" | "DENY";
  purpose?: string;
  resource?: string;
  accessScope?: string[];
  offlineTimestamp?: number | string;
  details?: Record<string, any>;
  previousHash: string;
  currentHash: string;
  signature?: string;
  isOfflineReconciled?: boolean;
}

export interface SecurityAlert {
  id: string;
  timestamp: number | string;
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
  reviewedAt?: number | string;
}

export interface DowntimeState {
  isOutageActive: boolean;
  outageStartTime?: number | string;
  outageStartedAt?: number | string;
  outageReason?: string;
  medIdCoreStatus?: "ONLINE" | "DEGRADED" | "OFFLINE" | string;
  ehrAdapterStatus?: "ONLINE" | "DEGRADED" | "OFFLINE" | "CONNECTED" | "UNAVAILABLE" | string;
  ninProviderStatus?: "ONLINE" | "DEGRADED" | "OFFLINE" | "REACHABLE" | "TIMEOUT" | string;
  auditSinkStatus?: "ONLINE" | "DEGRADED" | "OFFLINE" | "SYNCING" | "BUFFERED_LOCAL" | string;
  queuedEventsCount?: number;
  cachedEmergencyCardsCount?: number;
}
