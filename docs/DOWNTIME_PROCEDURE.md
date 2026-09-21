# MedID Nigeria — Downtime & Low-Connectivity Operational Procedure

## 1. Context: Nigerian Infrastructure Realities
Hospitals across Nigeria frequently face power cuts, unstable internet, or temporary outages of national identity and third-party EHR adapters. MedID provides a robust, testable **Downtime Mode** ensuring that clinical staff can maintain emergency care without creating security backdoors or losing accountability.

---

## 2. High-Availability Status Matrix

MedID continuously monitors the operational status of four core dependencies:
1. **MedID Core API Gateway**: Status of local trust node.
2. **Hospital Record Adapter**: Connectivity to local hospital EHR database (e.g. LUTH, LASUTH).
3. **National NIN Provider**: NIMC identity verification directory hub.
4. **Audit Chain Sync Sink**: Destination for append-only audit replication.

---

## 3. Standard Operating Procedure: Form MD-DT-01 (Clinical Emergency Fallback)

When national network or grid failure occurs:

```
+-------------------------------------------------------------------------------+
|                      FEDERAL MINISTRY OF HEALTH, NIGERIA                      |
|                  FACILITY DOWNTIME EMERGENCY LOG (FORM MD-DT-01)              |
+-------------------------------------------------------------------------------+
| Date: _______________   Time: __________   Facility Code: ___________________ |
| Attending Clinician: ____________________  MDCN License No: _________________ |
| Patient Identified via: [ ] Physical MedID Card  [ ] NIN Slip  [ ] Family Decl|
| Patient Name: ___________________________  MedID (if known): ________________ |
| Clinical Presentation: ______________________________________________________ |
| Known Drug Allergies (Reported): ____________________________________________ |
| Critical Interventions Administered: ________________________________________ |
| Clinician Signature: ____________________  Supervisor Witness: ______________ |
+-------------------------------------------------------------------------------+
```

### Mandatory Staff Steps:
1. **Physical Identity Verification**: Inspect physical MedID Card, National Identity Slip (NIN), or physical hospital card.
2. **Physical Emergency Records**: Retrieve local paper emergency register in the Emergency Bay.
3. **Record Clinical Actions**: Log all administered drugs, fluids, and clinical observations on Form MD-DT-01.
4. **Local Event Buffering**: Record emergency events into the MedID local bounded queue.
5. **Delayed Cryptographic Reconciliation**: Once power and fiber connections resume, click "Reconcile Queued Records" to commit events into the append-only SHA-256 chain, preserving the original offline timestamp with an explicit `isOfflineReconciled` flag.

---

## 4. Testing & Demonstration
The system includes an interactive outage toggle:
- In the **Security & Audit Console** (or top bar), click **"Simulate Blackout / Network Outage"**.
- The interface immediately displays the high-contrast amber Downtime Warning.
- Remote record discovery endpoints return HTTP 503 with downtime guidance.
- Emergency actions can be buffered into the local queue.
- Re-enabling connectivity enables 1-click cryptographic reconciliation.
