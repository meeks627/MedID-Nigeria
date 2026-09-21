# MedID Nigeria — Automated Security Testing Guide

## 1. Overview
MedID Nigeria includes an automated security and authorization test suite (`tests/security_suite.ts`) executable via `npm test`.

---

## 2. Running the Test Suite

```bash
npm test
```

Expected Output:
```
=================================================================
      MEDID NIGERIA — NITDA HACKATHON SECURITY TEST SUITE        
=================================================================

--- 1. Authentication & Session Management ---
  [PASS] Doctor authenticated and received bearer token
  [PASS] Invalid credentials rejected with 401 generic error
  [PASS] Session token verified and resolved to Dr. James Bello
  [PASS] Records Clerk authenticated successfully
  [PASS] Security Administrator authenticated successfully

--- 2. Central Authorization & Abuse Detection ---
  [PASS] Doctor on duty allowed to retrieve routine clinical sections
  [PASS] Records Clerk blocked from clinical history (403 Forbidden + RULE_CLERK_CLINICAL_ACCESS triggered)
  [PASS] Automated abuse alert created in real time with CRITICAL severity for Records Clerk violation
  [PASS] Records Clerk permitted to search demographics & registration index
  [PASS] Doctor marked OFF_DUTY is strictly blocked from accessing patient charts

--- 3. Governed Break-Glass Emergency Workflow ---
  [PASS] Emergency override without mandatory clinical justification rejected
  [PASS] Invalid hospital emergency override code rejected
  [PASS] Emergency access granted immediately with 15-minute time limit and emergency-scoped data

--- 4. Tamper-Evident Cryptographic Audit Chain ---
  [PASS] Audit chain verified cryptographically across blocks
  [PASS] Retention policy enforces 365-day immutability lock
  [PASS] Injected synthetic tampering into test audit event
  [PASS] Verification engine detected tampering: Cryptographic digest failure at event AUDIT-000001
  [PASS] Audit chain restored to untampered state
  [PASS] Re-verification succeeded post-restoration

--- 5. Downtime Resilience & Offline Reconciliation ---
  [PASS] Simulated outage mode activated
  [PASS] Remote EHR queries return 503 Service Unavailable during downtime with Form MD-DT-01 notice
  [PASS] Emergency action buffered in bounded offline queue
  [PASS] Reconciliation successfully committed 1 offline events into cryptographic chain

--- 6. AI Clinical Copilot Authorization ---
  [PASS] Records Clerk prohibited from using AI Clinical Brief to bypass access policies
  [PASS] Doctor authorized and received AI Clinical Brief

=================================================================
RESULTS: 25 / 25 TESTS PASSED
=================================================================
```

---

## 3. Type Checking & Production Build

Verify TypeScript compilation:
```bash
npm run lint
```

Execute Vite production bundle:
```bash
npm run build
```
Both commands must exit with code 0 without warnings or errors.
