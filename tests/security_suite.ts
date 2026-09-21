import http from "http";
import { app } from "../api/index";

async function runSecuritySuite() {
  console.log("=================================================================");
  console.log("      MEDID NIGERIA — NITDA HACKATHON SECURITY TEST SUITE        ");
  console.log("=================================================================\n");

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
      process.exitCode = 1;
    }
  }

  try {
    // ─── 1. AUTHENTICATION & SESSION TESTS ──────────────────────────────────
    console.log("--- 1. Authentication & Session Management ---");

    // Test 1.1: Valid Doctor Login
    const docLoginRes = await fetch(`${baseUrl}/api/auth/staff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "james.bello@luth.org" }),
    });
    const docLoginData = await docLoginRes.json();
    assert(docLoginRes.status === 200 && !!docLoginData.sessionToken, "Doctor authenticated and received bearer token");
    const doctorToken = docLoginData.sessionToken;

    // Test 1.2: Invalid Login Rejected
    const badLoginRes = await fetch(`${baseUrl}/api/auth/staff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent.user@fake.gov" }),
    });
    assert(badLoginRes.status === 401, "Invalid credentials rejected with 401 generic error");

    // Test 1.3: Active Session Resolution
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    });
    const sessionData = await sessionRes.json();
    assert(sessionRes.status === 200 && sessionData.user.id === "DOC1", "Session token verified and resolved to Dr. James Bello");

    // Test 1.4: Login Records Clerk
    const clerkLoginRes = await fetch(`${baseUrl}/api/auth/staff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ibrahim.musa@luth.org" }),
    });
    const clerkLoginData = await clerkLoginRes.json();
    assert(clerkLoginRes.status === 200 && clerkLoginData.user.role === "RECORDS_CLERK", "Records Clerk authenticated successfully");
    const clerkToken = clerkLoginData.sessionToken;

    // Test 1.5: Login Security Officer
    const secLoginRes = await fetch(`${baseUrl}/api/auth/staff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "security.officer@medid.gov.ng" }),
    });
    const secLoginData = await secLoginRes.json();
    assert(secLoginRes.status === 200 && secLoginData.user.role === "SECURITY_ADMIN", "Security Administrator authenticated successfully");
    const securityToken = secLoginData.sessionToken;

    // ─── 2. AUTHORIZATION & ABUSE DETECTION TESTS ──────────────────────────
    console.log("\n--- 2. Central Authorization & Abuse Detection ---");

    // Test 2.1: Doctor on Duty Retrieves Permitted Records
    const docRetrieveRes = await fetch(`${baseUrl}/api/doctor/retrieve-records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ medID: "MD38281726", purpose: "Routine Cardiology Review" }),
    });
    const docRetrieveData = await docRetrieveRes.json();
    const hasDiagnoses = Object.values(docRetrieveData.retrievedRecords).some((encs: any) =>
      encs.some((e: any) => e.diagnoses && e.diagnoses.length > 0)
    );
    assert(
      docRetrieveRes.status === 200 &&
      docRetrieveData.permittedSections.includes("ROUTINE_CLINICAL") &&
      hasDiagnoses,
      "Doctor on duty allowed to retrieve routine clinical sections"
    );

    // Test 2.2: Records Clerk Attempts Clinical Access (Hackathon Abuse Scenario)
    const clerkAbuseRes = await fetch(`${baseUrl}/api/doctor/retrieve-records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({ medID: "MD38281726", purpose: "Unauthorized snooping attempt" }),
    });
    const clerkAbuseData = await clerkAbuseRes.json();
    assert(
      clerkAbuseRes.status === 403 &&
      clerkAbuseData.decision === "DENY" &&
      clerkAbuseData.alertTrigger === "RULE_CLERK_CLINICAL_ACCESS",
      "Records Clerk blocked from clinical history (403 Forbidden + RULE_CLERK_CLINICAL_ACCESS triggered)"
    );

    // Test 2.3: Verify Security Alert Was Automatically Created
    const alertsRes = await fetch(`${baseUrl}/api/security/alerts`, {
      headers: { Authorization: `Bearer ${securityToken}` },
    });
    const alertsData = await alertsRes.json();
    const clerkAlert = alertsData.find((a: any) => a.ruleId === "RULE_CLERK_CLINICAL_ACCESS");
    assert(
      !!clerkAlert && clerkAlert.severity === "CRITICAL" && clerkAlert.actorId === "CLERK1",
      "Automated abuse alert created in real time with CRITICAL severity for Records Clerk violation"
    );

    // Test 2.4: Records Clerk Allowed Demographic Search Only
    const clerkSearchRes = await fetch(`${baseUrl}/api/doctor/search-patient?medID=MD38281726`, {
      headers: { Authorization: `Bearer ${clerkToken}` },
    });
    const clerkSearchData = await clerkSearchRes.json();
    assert(
      clerkSearchRes.status === 200 && clerkSearchData.name === "Sarah Johnson",
      "Records Clerk permitted to search demographics & registration index"
    );

    // Test 2.5: Shift / Duty Toggle: Doctor Going Off-Duty
    await fetch(`${baseUrl}/api/auth/toggle-duty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ dutyStatus: "OFF_DUTY" }),
    });

    const offDutyRes = await fetch(`${baseUrl}/api/doctor/retrieve-records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ medID: "MD38281726" }),
    });
    assert(
      offDutyRes.status === 403,
      "Doctor marked OFF_DUTY is strictly blocked from accessing patient charts"
    );

    // Re-enable duty for subsequent tests
    await fetch(`${baseUrl}/api/auth/toggle-duty`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ dutyStatus: "ON_DUTY" }),
    });

    // ─── 3. GOVERNED BREAK-GLASS EMERGENCY ACCESS TESTS ────────────────────
    console.log("\n--- 3. Governed Break-Glass Emergency Workflow ---");

    // Test 3.1: Emergency Missing Reason Rejected
    const noReasonRes = await fetch(`${baseUrl}/api/doctor/emergency-retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        emergencyOverrideCode: "LUTH-9988",
        medID: "MD38281726",
        reason: "",
      }),
    });
    assert(noReasonRes.status === 400, "Emergency override without mandatory clinical justification rejected");

    // Test 3.2: Emergency Invalid Override Code Rejected
    const badCodeRes = await fetch(`${baseUrl}/api/doctor/emergency-retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        emergencyOverrideCode: "WRONG-CODE",
        medID: "MD38281726",
        reason: "Patient unconscious with respiratory arrest",
      }),
    });
    assert(badCodeRes.status === 401, "Invalid hospital emergency override code rejected");

    // Test 3.3: Authorized Emergency Break-Glass Granted with Scoped View
    const emRes = await fetch(`${baseUrl}/api/doctor/emergency-retrieve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        emergencyToken: "EM-TOK-123456",
        emergencyOverrideCode: "LUTH-9988",
        medID: "MD38281726",
        reason: "Patient in anaphylactic shock following acute collapse",
      }),
    });
    const emData = await emRes.json();
    assert(
      emRes.status === 200 &&
      (emData.emergencyAccessGrant.durationMinutes === 1 || emData.emergencyAccessGrant.durationSeconds === 60) &&
      emData.permittedSections.includes("EMERGENCY_CRITICAL") &&
      !emData.permittedSections.includes("ROUTINE_CLINICAL"),
      "Emergency access granted immediately with 1-minute (60s) time limit and emergency-scoped data"
    );

    // ─── 4. CRYPTOGRAPHIC TAMPER-EVIDENT AUDIT TRAIL TESTS ─────────────────
    console.log("\n--- 4. Tamper-Evident Cryptographic Audit Chain ---");

    // Test 4.1: Initial Audit Chain Integrity Verification
    const verifyInitialRes = await fetch(`${baseUrl}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${securityToken}` },
    });
    const verifyInitialData = await verifyInitialRes.json();
    assert(
      verifyInitialRes.status === 200 &&
      verifyInitialData.valid === true &&
      !verifyInitialData.tamperDetected &&
      verifyInitialData.totalEvents > 0,
      `Audit chain verified cryptographically across ${verifyInitialData.totalEvents} blocks`
    );

    // Test 4.2: Retention Policy Confirmed
    const retentionRes = await fetch(`${baseUrl}/api/audit/retention`);
    const retentionData = await retentionRes.json();
    assert(
      retentionData.retentionPeriodDays >= 365 && retentionData.retentionLocked === true,
      "Retention policy enforces 365-day immutability lock"
    );

    // Test 4.3: Controlled Synthetic Tampering Attack
    const tamperRes = await fetch(`${baseUrl}/api/audit/tamper-demo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${securityToken}` },
    });
    const tamperData = await tamperRes.json();
    assert(tamperRes.status === 200 && !!tamperData.tampered.tamperedEventId, "Injected synthetic tampering into test audit event");

    // Test 4.4: Verification Engine Detects Compromised Integrity
    const verifyTamperedRes = await fetch(`${baseUrl}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${securityToken}` },
    });
    const verifyTamperedData = await verifyTamperedRes.json();
    assert(
      verifyTamperedData.valid === false &&
      verifyTamperedData.tamperDetected === true &&
      typeof verifyTamperedData.tamperedIndex === "number",
      `Verification engine detected tampering: ${verifyTamperedData.failureReason}`
    );

    // Test 4.5: Reset Chain to Untampered State
    const resetRes = await fetch(`${baseUrl}/api/audit/reset-tamper`, {
      method: "POST",
      headers: { Authorization: `Bearer ${securityToken}` },
    });
    assert(resetRes.status === 200, "Audit chain restored to untampered state");

    const reVerifyRes = await fetch(`${baseUrl}/api/audit/verify`, {
      headers: { Authorization: `Bearer ${securityToken}` },
    });
    const reVerifyData = await reVerifyRes.json();
    assert(reVerifyData.valid === true && !reVerifyData.tamperDetected, "Re-verification succeeded post-restoration");

    // ─── 5. DOWNTIME & LOW-CONNECTIVITY RESILIENCE TESTS ────────────────────
    console.log("\n--- 5. Downtime Resilience & Offline Reconciliation ---");

    // Test 5.1: Toggle Simulated Outage Active
    const outageOnRes = await fetch(`${baseUrl}/api/downtime/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    });
    const outageOnData = await outageOnRes.json();
    assert(outageOnData.downtime.isOutageActive === true, "Simulated outage mode activated");

    // Test 5.2: Remote Record Access Blocked During Outage
    const outageRetrieveRes = await fetch(`${baseUrl}/api/doctor/retrieve-records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({ medID: "MD38281726" }),
    });
    assert(
      outageRetrieveRes.status === 503,
      "Remote EHR queries return 503 Service Unavailable during downtime with Form MD-DT-01 notice"
    );

    // Test 5.3: Queue Offline Emergency Event
    const queueRes = await fetch(`${baseUrl}/api/downtime/offline-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorId: "DOC1",
        actorName: "Dr. James Bello",
        actorRole: "DOCTOR",
        hospitalId: "LUTH",
        patientMedID: "MD38281726",
        action: "OFFLINE_EMERGENCY_CONSULT",
        reason: "Offline trauma resuscitation per Form MD-DT-01",
      }),
    });
    const queueData = await queueRes.json();
    assert(queueRes.status === 200 && !!queueData.queued.localId, "Emergency action buffered in bounded offline queue");

    // Test 5.4: Restore Outage & Reconcile Events
    await fetch(`${baseUrl}/api/downtime/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });

    const reconcileRes = await fetch(`${baseUrl}/api/downtime/reconcile`, { method: "POST" });
    const reconcileData = await reconcileRes.json();
    assert(
      reconcileRes.status === 200 && reconcileData.reconciledCount >= 1,
      `Reconciliation successfully committed ${reconcileData.reconciledCount} offline events into cryptographic chain`
    );

    // ─── 6. AI CONTEXT RESTRICTION TESTS ───────────────────────────────────
    console.log("\n--- 6. AI Clinical Copilot Authorization ---");

    // Test 6.1: Records Clerk Blocked from AI Brief
    const clerkAiRes = await fetch(`${baseUrl}/api/gemini/clinical-brief`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({
        patientName: "Sarah Johnson",
        retrievedRecords: { LUTH: [] },
      }),
    });
    assert(clerkAiRes.status === 403, "Records Clerk prohibited from using AI Clinical Brief to bypass access policies");

    // Test 6.2: Doctor Authorized for AI Brief
    const docAiRes = await fetch(`${baseUrl}/api/gemini/clinical-brief`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${doctorToken}`,
      },
      body: JSON.stringify({
        patientName: "Sarah Johnson",
        retrievedRecords: docRetrieveData.retrievedRecords,
      }),
    });
    const docAiData = await docAiRes.json();
    assert(docAiRes.status === 200 && !!docAiData.brief, "Doctor authorized and received AI Clinical Brief");

  } finally {
    server.close();
  }

  console.log("\n=================================================================");
  console.log(`RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("=================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
