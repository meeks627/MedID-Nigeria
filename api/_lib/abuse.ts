import fs from "fs";
import path from "path";
import { SecurityAlert, StaffRole } from "./types";

const IS_VERCEL = process.env.VERCEL === "1";
const ALERTS_FILE_PATH = IS_VERCEL ? "/tmp/medid-security-alerts.json" : path.join(process.cwd(), "medid-security-alerts.json");

let alertsStore: SecurityAlert[] = [];

// Seed baseline alerts to demonstrate reviewing capabilities
const SEED_ALERTS: SecurityAlert[] = [
  {
    id: "ALERT-0001",
    timestamp: "2026-07-15T09:12:44.000Z",
    ruleId: "RULE_EXCESSIVE_LOOKUPS",
    severity: "MEDIUM",
    actorId: "CLERK1",
    actorName: "Ibrahim Musa",
    actorRole: "RECORDS_CLERK",
    hospitalId: "LUTH",
    patientMedID: "MD38281726",
    description: "Unusual Patient Lookup Velocity: 8 patient demographic queries in under 60 seconds.",
    status: "REVIEWED",
    reviewedBy: "Alhaji Tunde Bakare (Security Officer)",
    reviewNotes: "Investigated: Patient batch intake during morning clinic rush. Legitimate workflow confirmed.",
    reviewedAt: "2026-07-15T11:00:00.000Z",
  }
];

export function loadAlerts(): void {
  try {
    if (IS_VERCEL && !fs.existsSync(ALERTS_FILE_PATH)) {
      const rootAlerts = path.join(process.cwd(), "medid-security-alerts.json");
      if (fs.existsSync(rootAlerts)) {
        const dir = path.dirname(ALERTS_FILE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(rootAlerts, ALERTS_FILE_PATH);
      }
    }
    if (fs.existsSync(ALERTS_FILE_PATH)) {
      alertsStore = JSON.parse(fs.readFileSync(ALERTS_FILE_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load alerts from disk:", e);
  }

  if (alertsStore.length === 0) {
    alertsStore = [...SEED_ALERTS];
    saveAlerts();
  }
}

export function saveAlerts(): void {
  try {
    const dir = path.dirname(ALERTS_FILE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(ALERTS_FILE_PATH, JSON.stringify(alertsStore, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save alerts to disk:", e);
  }
}

export function createSecurityAlert(params: {
  ruleId: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
  hospitalId: string;
  patientMedID?: string;
  description: string;
}): SecurityAlert {
  const alertId = `ALERT-${String(alertsStore.length + 1).padStart(4, "0")}`;
  const timestamp = new Date().toISOString();

  const newAlert: SecurityAlert = {
    id: alertId,
    timestamp,
    ruleId: params.ruleId,
    severity: params.severity,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    hospitalId: params.hospitalId,
    patientMedID: params.patientMedID,
    description: params.description,
    status: "PENDING_REVIEW",
  };

  alertsStore.unshift(newAlert); // Newest first
  saveAlerts();
  return newAlert;
}

export function getSecurityAlerts(hospitalId?: string): SecurityAlert[] {
  if (hospitalId && hospitalId !== "LUTH") {
    return alertsStore.filter((a) => a.hospitalId === hospitalId);
  }
  return alertsStore;
}

export function reviewSecurityAlert(
  alertId: string,
  reviewerName: string,
  notes: string,
  newStatus: "REVIEWED" | "DISMISSED" = "REVIEWED"
): SecurityAlert | null {
  const alert = alertsStore.find((a) => a.id === alertId);
  if (!alert) return null;

  alert.status = newStatus;
  alert.reviewedBy = reviewerName;
  alert.reviewNotes = notes;
  alert.reviewedAt = new Date().toISOString();

  saveAlerts();
  return alert;
}

// Rule triggers mapping
export function triggerRuleAlert(ruleId: string, details: {
  actorId: string;
  actorName: string;
  actorRole: StaffRole;
  hospitalId: string;
  patientMedID?: string;
  customMsg?: string;
}): SecurityAlert {
  switch (ruleId) {
    case "RULE_CLERK_CLINICAL_ACCESS":
      return createSecurityAlert({
        ruleId,
        severity: "CRITICAL",
        actorId: details.actorId,
        actorName: details.actorName,
        actorRole: details.actorRole,
        hospitalId: details.hospitalId,
        patientMedID: details.patientMedID,
        description: `UNAUTHORIZED ACCESS INCIDENT: Records Clerk ${details.actorName} (${details.actorId}) attempted direct retrieval of confidential clinical EHR records for patient ${details.patientMedID || "Unknown"}. Request was blocked by policy enforcement.`,
      });

    case "RULE_OFF_DUTY_ACCESS":
      return createSecurityAlert({
        ruleId,
        severity: "MEDIUM",
        actorId: details.actorId,
        actorName: details.actorName,
        actorRole: details.actorRole,
        hospitalId: details.hospitalId,
        patientMedID: details.patientMedID,
        description: `POLICY VIOLATION: Clinician ${details.actorName} attempted clinical chart query while marked OFF_DUTY. Shift authorization required.`,
      });

    case "RULE_EMERGENCY_OVERRIDE":
      return createSecurityAlert({
        ruleId,
        severity: "HIGH",
        actorId: details.actorId,
        actorName: details.actorName,
        actorRole: details.actorRole,
        hospitalId: details.hospitalId,
        patientMedID: details.patientMedID,
        description: `EMERGENCY BREAK-GLASS: Clinician ${details.actorName} declared an emergency override for patient ${details.patientMedID}. Reason: ${details.customMsg || "Unspecified"}. Time-limited 15-minute access window opened. Mandatory audit review required.`,
      });

    case "RULE_TAMPER_DETECTED":
      return createSecurityAlert({
        ruleId,
        severity: "CRITICAL",
        actorId: details.actorId,
        actorName: details.actorName,
        actorRole: details.actorRole,
        hospitalId: details.hospitalId,
        description: `AUDIT INTEGRITY ALERT: Verification engine detected cryptographic hash mismatch or broken chain link. Tampering detected!`,
      });

    default:
      return createSecurityAlert({
        ruleId,
        severity: "LOW",
        actorId: details.actorId,
        actorName: details.actorName,
        actorRole: details.actorRole,
        hospitalId: details.hospitalId,
        patientMedID: details.patientMedID,
        description: details.customMsg || "Security policy violation detected.",
      });
  }
}

// Initialize on module load
loadAlerts();
