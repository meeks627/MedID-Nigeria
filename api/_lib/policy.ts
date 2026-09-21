import { PolicyContext, PolicyDecision, RecordSection } from "./types";

/**
 * Central Policy Decision Point (PDP) for MedID Nigeria
 * Enforces Role-Based, Context-Aware (ABAC), and Duty-Bound access controls.
 * Implements Section 4 & 5 of the Safe Access to Patient Records architecture.
 */
export function evaluateAccess(ctx: PolicyContext): PolicyDecision {
  const { subject, action, requestedSections } = ctx;

  // 1. Account status validation
  if (!subject.enabled) {
    return {
      decision: "DENY",
      reason: "Account is disabled. Contact hospital administration.",
      permittedSections: [],
      alertTrigger: "RULE_DISABLED_ACCOUNT_ACCESS",
    };
  }

  // 2. Emergency Break-Glass Action
  if (action === "EMERGENCY_OVERRIDE") {
    if (subject.role !== "DOCTOR" && subject.role !== "NURSE") {
      return {
        decision: "DENY",
        reason: "Emergency break-glass access is strictly restricted to licensed clinical personnel.",
        permittedSections: [],
        alertTrigger: "RULE_UNAUTHORIZED_EMERGENCY_ATTEMPT",
      };
    }
    // Emergency access grants IDENTITY_ADMIN and EMERGENCY_CRITICAL immediately
    return {
      decision: "ALLOW",
      reason: "Emergency break-glass authorization approved. High-signal emergency records accessible.",
      permittedSections: ["IDENTITY_ADMIN", "EMERGENCY_CRITICAL"],
    };
  }

  // 3. Duty/Shift Status Requirement for Clinical Data Access
  const isClinicalAction = [
    "RETRIEVE_RECORDS",
    "GENERATE_AI_BRIEF",
    "AI_CHAT_QUERY",
  ].includes(action);

  if (isClinicalAction && subject.dutyStatus === "OFF_DUTY") {
    return {
      decision: "DENY",
      reason: "Access Denied: Clinician is currently marked OFF_DUTY. Shift activation is required for clinical access.",
      permittedSections: [],
      alertTrigger: "RULE_OFF_DUTY_ACCESS",
    };
  }

  // 4. Role-Specific Policy Evaluation

  // ── RECORDS CLERK ───────────────────────────────────────────
  if (subject.role === "RECORDS_CLERK") {
    if (action === "SEARCH_PATIENT") {
      return {
        decision: "ALLOW",
        reason: "Records Clerk permitted to search patient identity and demographic directory.",
        permittedSections: ["IDENTITY_ADMIN"],
      };
    }

    if (isClinicalAction) {
      return {
        decision: "DENY",
        reason: "Security Violation: Records clerks are strictly restricted to demographic management and cannot inspect patient clinical history.",
        permittedSections: [],
        alertTrigger: "RULE_CLERK_CLINICAL_ACCESS", // Targeted Hackathon Abuse Scenario
      };
    }

    return {
      decision: "DENY",
      reason: "Action not permitted for Records Clerk role.",
      permittedSections: [],
    };
  }

  // ── HOSPITAL ADMINISTRATOR ──────────────────────────────────
  if (subject.role === "HOSPITAL_ADMIN") {
    if (["MANAGE_STAFF", "VIEW_AUDIT_LOGS", "ADMIN_CREDENTIAL_MGMT"].includes(action)) {
      return {
        decision: "ALLOW",
        reason: "Hospital Administrator permitted to manage staff and inspect hospital operational logs.",
        permittedSections: [],
      };
    }

    if (isClinicalAction || action === "SEARCH_PATIENT") {
      return {
        decision: "DENY",
        reason: "Access Prohibited: Hospital administrators have administrative purview only and cannot view patient clinical charts.",
        permittedSections: [],
        alertTrigger: "RULE_ADMIN_CLINICAL_ACCESS_ATTEMPT",
      };
    }
  }

  // ── SECURITY ADMINISTRATOR ──────────────────────────────────
  if (subject.role === "SECURITY_ADMIN") {
    if (["VIEW_AUDIT_LOGS", "VERIFY_AUDIT", "VIEW_SECURITY_ALERTS"].includes(action)) {
      return {
        decision: "ALLOW",
        reason: "Security Compliance Officer authorized for audit verification and incident review.",
        permittedSections: [],
      };
    }

    if (isClinicalAction) {
      return {
        decision: "DENY",
        reason: "Security administrators cannot access clinical health contents.",
        permittedSections: [],
      };
    }
  }

  // ── LAB TECHNICIAN ──────────────────────────────────────────
  if (subject.role === "LAB_TECH") {
    if (action === "SEARCH_PATIENT") {
      return {
        decision: "ALLOW",
        reason: "Lab Technician permitted to search patient identity for laboratory accessioning.",
        permittedSections: ["IDENTITY_ADMIN"],
      };
    }

    if (action === "RETRIEVE_RECORDS") {
      return {
        decision: "ALLOW",
        reason: "Lab Technician authorized for laboratory pathology orders, specimen data, and test results.",
        permittedSections: ["IDENTITY_ADMIN", "LAB_PATHOLOGY"],
      };
    }

    return {
      decision: "DENY",
      reason: "Access Prohibited: Lab Technicians are restricted to laboratory pathology orders and results.",
      permittedSections: [],
      alertTrigger: "RULE_ROLE_SCOPE_VIOLATION",
    };
  }

  // ── PHARMACIST ──────────────────────────────────────────────
  if (subject.role === "PHARMACIST") {
    if (action === "SEARCH_PATIENT") {
      return {
        decision: "ALLOW",
        reason: "Pharmacist permitted to search patient identity for prescription dispensing.",
        permittedSections: ["IDENTITY_ADMIN"],
      };
    }

    if (action === "RETRIEVE_RECORDS") {
      return {
        decision: "ALLOW",
        reason: "Pharmacist authorized for prescription dispensing records, MAR history, and acute drug allergies.",
        permittedSections: ["IDENTITY_ADMIN", "EMERGENCY_CRITICAL", "PHARMACY_MAR"],
      };
    }

    return {
      decision: "DENY",
      reason: "Access Prohibited: Pharmacists are restricted to medication dispensing and allergy profiles.",
      permittedSections: [],
      alertTrigger: "RULE_ROLE_SCOPE_VIOLATION",
    };
  }

  // ── NURSE ───────────────────────────────────────────────────
  if (subject.role === "NURSE") {
    if (action === "SEARCH_PATIENT") {
      return {
        decision: "ALLOW",
        reason: "Nurse permitted to search patient demographics.",
        permittedSections: ["IDENTITY_ADMIN"],
      };
    }

    if (isClinicalAction) {
      return {
        decision: "ALLOW",
        reason: "Nurse on duty granted access to identity, emergency-critical care, and MAR sections.",
        permittedSections: ["IDENTITY_ADMIN", "EMERGENCY_CRITICAL", "PHARMACY_MAR"],
      };
    }
  }

  // ── DOCTOR ──────────────────────────────────────────────────
  if (subject.role === "DOCTOR") {
    if (action === "SEARCH_PATIENT") {
      return {
        decision: "ALLOW",
        reason: "Doctor permitted to discover patient record index.",
        permittedSections: ["IDENTITY_ADMIN"],
      };
    }

    if (isClinicalAction) {
      // Check if requested section contains HIGHLY_RESTRICTED
      const asksForRestricted = requestedSections?.includes("HIGHLY_RESTRICTED");
      if (asksForRestricted && !ctx.emergencyToken) {
        return {
          decision: "DENY",
          reason: "Access to Highly Restricted clinical notes requires explicit clinical escalation or break-glass authorization.",
          permittedSections: ["IDENTITY_ADMIN", "EMERGENCY_CRITICAL", "ROUTINE_CLINICAL"],
          alertTrigger: "RULE_UNAUTHORIZED_RESTRICTED_SECTION_ATTEMPT",
        };
      }

      return {
        decision: "ALLOW",
        reason: "Doctor on active duty authorized for comprehensive routine and emergency clinical sections.",
        permittedSections: [
          "IDENTITY_ADMIN",
          "EMERGENCY_CRITICAL",
          "ROUTINE_CLINICAL",
          "LAB_PATHOLOGY",
          "PHARMACY_MAR",
        ],
      };
    }
  }

  // Default catch-all denial
  return {
    decision: "DENY",
    reason: "No policy grants permission for the requested action.",
    permittedSections: [],
  };
}

/**
 * Filters raw hospital encounters according to permitted record sections
 */
export function filterRecordsBySections(
  records: Record<string, any[]>,
  permittedSections: RecordSection[]
): Record<string, any[]> {
  const allowEmergency = permittedSections.includes("EMERGENCY_CRITICAL");
  const allowRoutine = permittedSections.includes("ROUTINE_CLINICAL");
  const allowLab = permittedSections.includes("LAB_PATHOLOGY");
  const allowPharmacy = permittedSections.includes("PHARMACY_MAR");
  const allowRestricted = permittedSections.includes("HIGHLY_RESTRICTED");

  const filtered: Record<string, any[]> = {};

  for (const [hospitalName, encounters] of Object.entries(records)) {
    filtered[hospitalName] = encounters.map((enc) => {
      // If neither routine nor emergency nor lab nor pharmacy is permitted, strip all clinical content
      if (!allowEmergency && !allowRoutine && !allowLab && !allowPharmacy) {
        return {
          date: enc.date,
          doctorName: enc.doctorName,
          department: enc.department,
          visitType: enc.visitType,
          summary: "[REDACTED - INSUFFICIENT SECTION PERMISSIONS]",
          diagnoses: ["[REDACTED]"],
          medications: [],
          laboratoryResults: [],
          scans: [],
        };
      }

      // If Lab Tech role (only lab pathology permitted)
      if (allowLab && !allowRoutine && !allowEmergency && !allowPharmacy) {
        return {
          date: enc.date,
          doctorName: enc.doctorName,
          department: enc.department,
          visitType: enc.visitType,
          summary: `[PATHOLOGY & LAB VIEW] ${enc.department || "Clinical Laboratory"}`,
          diagnoses: ["[RESTRICTED - LAB TECHNICIAN ROLE]"],
          medications: [],
          laboratoryResults: enc.laboratoryResults || [],
          scans: enc.scans || [],
        };
      }

      // If Pharmacist role (only pharmacy & allergy permitted)
      if (allowPharmacy && !allowRoutine && !allowLab) {
        return {
          date: enc.date,
          doctorName: enc.doctorName,
          department: enc.department,
          visitType: enc.visitType,
          summary: `[PHARMACY & MAR VIEW] Medication profile for encounter ${enc.date}`,
          diagnoses: enc.diagnoses ? enc.diagnoses.filter((d: string) => /allergy|anaphylaxis/i.test(d)) : [],
          medications: enc.medications || [],
          laboratoryResults: [],
          scans: [],
        };
      }

      // If only emergency-critical is permitted (e.g. Nurse or Break-Glass emergency)
      if (allowEmergency && !allowRoutine) {
        return {
          date: enc.date,
          doctorName: enc.doctorName,
          department: enc.department,
          visitType: enc.visitType,
          // Extract only allergy/emergency alerts from diagnoses
          diagnoses: (enc.diagnoses || []).filter((d: string) => 
            /allergy|anaphylaxis|asthma|penicillin|emergency|shock|arrest/i.test(d)
          ),
          // Extract only critical emergency meds
          medications: (enc.medications || []).filter((m: any) =>
            /inhaler|albuterol|epinephrine|insulin|prednisone/i.test(m.name || m)
          ),
          laboratoryResults: (enc.laboratoryResults || []).filter((l: any) =>
            /spo2|ph|glucose|hemoglobin/i.test(l.test || "")
          ),
          scans: [],
          summary: `[EMERGENCY VIEW] ${(enc.summary || "").slice(0, 120)}...`,
        };
      }

      // Full routine + emergency (excluding highly restricted unless authorized)
      return {
        ...enc,
        summary: allowRestricted 
          ? enc.summary 
          : (enc.summary || "").replace(/\[RESTRICTED:[^\]]+\]/g, "[RESTRICTED SECTION OMITTED]"),
      };
    });
  }

  return filtered;
}

export const filterRecordSections = filterRecordsBySections;
