import React, { useState, useRef, useEffect } from "react";
import { 
  Shield, Heart, Search, CheckCircle2, AlertCircle, 
  ArrowLeft, Lock, Mail, Users, FileText, Check, 
  AlertTriangle, Fingerprint, Sparkles, Send, Brain, 
  RefreshCw, Activity, Scan, UserCheck, ShieldAlert, Key,
  Unlock, Clock, Eye, Pill, Microscope, Stethoscope,
  ClipboardList, ShieldCheck, X, Building2, Phone, Calendar, LogOut
} from "lucide-react";
import { Doctor, Encounter, StaffRole, DutyStatus } from "../types";

interface DoctorPortalProps {
  onBack: () => void;
}

// Verified Pre-configured Accounts for all 6 Healthcare Roles + Security
const ROLE_ACCOUNTS = [
  {
    role: "DOCTOR" as StaffRole,
    title: "Attending Doctor",
    name: "Dr. James Bello",
    email: "james.bello@luth.org",
    licenseNumber: "MDN-2015-8831",
    hospital: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Internal Medicine",
    ward: "Ward 4 - Acute Care",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    icon: Stethoscope,
    scopeDesc: "Full access: Longitudinal clinical history, diagnoses, lab results, prescriptions, and MedID AI assistant."
  },
  {
    role: "NURSE" as StaffRole,
    title: "Triage & Acute Nurse",
    name: "Nurse Chidinma Eze",
    email: "chidinma.eze@luth.org",
    licenseNumber: "NUR-2020-5519",
    hospital: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Emergency Bay",
    ward: "Trauma Bay A",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Heart,
    scopeDesc: "Clinical triage: Patient vitals, critical allergy alerts, emergency notes, and MAR administration history."
  },
  {
    role: "LAB_TECH" as StaffRole,
    title: "Pathology Lab Tech",
    name: "Emmanuel Okafor, MLS",
    email: "emmanuel.okafor@luth.org",
    licenseNumber: "MLS-2018-4421",
    hospital: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Pathology & Clinical Chemistry",
    ward: "Central Diagnostic Lab",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Microscope,
    scopeDesc: "Laboratory access: Pathology orders, blood chemistry panels, specimen reports. Clinical diagnoses restricted."
  },
  {
    role: "PHARMACIST" as StaffRole,
    title: "Clinical Pharmacist",
    name: "Pharm. Zainab Ahmed",
    email: "zainab.ahmed@luth.org",
    licenseNumber: "PCN-2017-9102",
    hospital: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Pharmacy Services",
    ward: "Central Dispensary",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: Pill,
    scopeDesc: "Pharmacy dispensing: Active prescriptions, dosage/frequencies, drug interaction flags, and acute allergy profile."
  },
  {
    role: "RECORDS_CLERK" as StaffRole,
    title: "Records & Admissions Clerk",
    name: "Ibrahim Musa",
    email: "ibrahim.musa@luth.org",
    licenseNumber: "REC-REG-2022",
    hospital: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Health Records & Registration",
    ward: "Admissions Front Desk",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    icon: ClipboardList,
    scopeDesc: "Demographics only: Patient NIN verification, registration index, emergency contact. ZERO access to clinical charts."
  },
  {
    role: "HOSPITAL_ADMIN" as StaffRole,
    title: "Facility Administrator",
    name: "LUTH Hospital Admin",
    email: "admin@luth.org",
    licenseNumber: "ADM-LUTH-2019",
    hospital: "LUTH",
    hospitalName: "Lagos University Teaching Hospital (LUTH)",
    department: "Executive Management",
    ward: "Administration Wing",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    icon: Building2,
    scopeDesc: "Administrative purview: Facility key rotation, clinician credentialing, audit verification. Patient charts blocked."
  }
];

export default function DoctorPortal({ onBack }: DoctorPortalProps) {
  // Session & Authentication
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [dutyStatus, setDutyStatus] = useState<DutyStatus>("ON_DUTY");
  const [dutyToggling, setDutyToggling] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your staff email.");
      return;
    }
    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials.");
        return;
      }
      setSessionToken(data.sessionToken);
      setDutyStatus(data.user?.dutyStatus || "ON_DUTY");
      setActiveStaffUser(data.user);
      setIsLoggedIn(true);
    } catch (err) {
      setError("Failed to connect to authentication server.");
    }
  };

  // Workstation Lock (Shared terminal security)
  const [isStationLocked, setIsStationLocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [stationLockError, setStationLockError] = useState("");

  // Patient Search & Discovery
  const [searchMedID, setSearchMedID] = useState("MD38281726");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedPatient, setSearchedPatient] = useState<any | null>(null);

  // Consent & Verification
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [consentCode, setConsentCode] = useState("4488");
  const [consentModalOpen, setConsentModalOpen] = useState(false);

  // Emergency Break-Glass
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyStep, setEmergencyStep] = useState<"IDLE" | "SCANNING" | "CODE" | "ACTIVE">("IDLE");
  const [emergencyCode, setEmergencyCode] = useState("LUTH-9988");
  const [customReason, setCustomReason] = useState("Acute Anaphylaxis & Severe Respiratory Distress — Unresponsive in Trauma Bay");
  const [emergencySecondsLeft, setEmergencySecondsLeft] = useState(60);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [biometricScanProgress, setBiometricScanProgress] = useState(0);

  // Clinical Records & Views
  const [chartLoaded, setChartLoaded] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any | null>(null);
  const [retrievedRecords, setRetrievedRecords] = useState<{ [hospitalName: string]: Encounter[] }>({});
  const [permittedSections, setPermittedSections] = useState<string[]>([]);
  const [selectedHospitalTab, setSelectedHospitalTab] = useState<string>("");
  const [chartTab, setChartTab] = useState<"SUMMARY" | "AI_ASSISTANT" | "EXPLORER">("SUMMARY");

  // Detailed Encounter Dossier Modal
  const [selectedEncounterDossier, setSelectedEncounterDossier] = useState<{ encounter: Encounter; hospitalName: string } | null>(null);

  // Unauthorized Access Violation Modal (Hackathon Abuse Demonstration)
  const [abuseViolationModal, setAbuseViolationModal] = useState<{ open: boolean; reason: string; rule: string } | null>(null);

  // Patient Summary & MedID AI
  const [patientSummary, setPatientSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [activeStaffUser, setActiveStaffUser] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const activeUser = activeStaffUser || ROLE_ACCOUNTS[0];

  // Quick Clinical Questions
  const quickQuestions = [
    "What drug allergies does this patient have?",
    "Has the patient reacted badly to Penicillin or Amoxicillin?",
    "What medications is the patient currently prescribed?",
    "Show previous MRI or ultrasound scan findings.",
    "Is there any documented history of asthma or renal impairment?"
  ];

  // Standard Emergency Justification Presets
  const emergencyReasons = [
    "Acute Anaphylaxis & Severe Respiratory Distress — Unresponsive in Trauma Bay",
    "Unconscious trauma victim — Motor vehicle collision resuscitation",
    "Acute myocardial infarction with hemodynamic instability",
    "Comatose patient with acute hypoglycemia / unknown medication history",
    "Emergency surgery escalation — unable to obtain patient consent"
  ];

  // Countdown timer for Emergency Break-Glass (60s time-limited window)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isEmergencyActive && emergencySecondsLeft > 0) {
      timer = setInterval(() => {
        setEmergencySecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsEmergencyActive(false);
            setError("Emergency break-glass access window has expired (1-minute limit reached). Chart session locked.");
            setChartLoaded(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isEmergencyActive, emergencySecondsLeft]);

  // Initial login for selected role
  const authenticateRole = async (index: number) => {
    setSelectedRoleIndex(index);
    const target = ROLE_ACCOUNTS[index];
    setEmail(target.email);
    setLicenseNumber(target.licenseNumber);
    setError("");
    setSuccessMsg("");
    setChartLoaded(false);
    setSearchedPatient(null);

    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target.email }),
      });
      const data = await res.json();
      if (res.ok && data.sessionToken) {
        setSessionToken(data.sessionToken);
        setDutyStatus(data.user?.dutyStatus || "ON_DUTY");
      }
    } catch (e) {
      console.warn("Backend auth call fallback to direct session");
    }
  };

  // Toggle duty status
  const handleToggleDuty = async () => {
    setDutyToggling(true);
    setError("");
    const newStatus: DutyStatus = dutyStatus === "ON_DUTY" ? "OFF_DUTY" : "ON_DUTY";
    try {
      const res = await fetch("/api/auth/toggle-duty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ dutyStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setDutyStatus(data.dutyStatus || newStatus);
        setSuccessMsg(`Shift status updated to: ${newStatus}`);
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Failed to update shift duty status.");
      }
    } catch (e) {
      setDutyStatus(newStatus);
    } finally {
      setDutyToggling(false);
    }
  };

  // Lock Workstation Handler
  const handleLockWorkstation = () => {
    setIsStationLocked(true);
    setUnlockPin("");
    setStationLockError("");
  };

  const handleUnlockWorkstation = () => {
    if (unlockPin === "1234" || unlockPin.trim().length >= 4) {
      setIsStationLocked(false);
      setStationLockError("");
    } else {
      setStationLockError("Invalid security PIN. Please enter verified clinician PIN (Dev: 1234).");
    }
  };

  // Search Patient
  const handlePatientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSearchedPatient(null);
    setChartLoaded(false);
    if (!searchMedID.trim()) return;

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/doctor/search-patient?medID=${searchMedID.trim().toUpperCase()}`, {
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
      });
      const data = await res.json();
      setSearchLoading(false);
      if (!res.ok) {
        setError(data.error || "No patient match found in national identity directory.");
        return;
      }
      setSearchedPatient(data);
    } catch (err) {
      setSearchLoading(false);
      setError("Error calling national health index directory.");
    }
  };

  // Standard Record Retrieval with Role Enforcement
  const handleStandardRetrieval = async () => {
    if (!searchedPatient) return;
    setError("");
    setPatientSummary("");
    setChatMessages([]);

    // Abuse Check: Records Clerk trying to access clinical charts
    if (activeUser.role === "RECORDS_CLERK") {
      try {
        // Dispatch unauthorized clinical access attempt to backend to log security violation
        const abuseRes = await fetch("/api/doctor/retrieve-records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
          },
          body: JSON.stringify({
            medID: searchedPatient.medID,
            purpose: "Unauthorized Clinical Chart Access Attempt by Records Clerk",
          }),
        });
        const abuseData = await abuseRes.json();
        setAbuseViolationModal({
          open: true,
          reason: abuseData.error || "Access Denied: Records Clerks are legally restricted from viewing clinical histories and diagnoses under NDPA Section 37.",
          rule: "RULE_CLERK_CLINICAL_ACCESS"
        });
      } catch (e) {
        setAbuseViolationModal({
          open: true,
          reason: "Access Denied (403 Forbidden): Records Clerks are legally restricted from viewing clinical histories and diagnoses under NDPA Section 37.",
          rule: "RULE_CLERK_CLINICAL_ACCESS"
        });
      }
      return;
    }

    // Check duty status
    if (dutyStatus === "OFF_DUTY") {
      setError("Access Blocked: You are currently marked OFF_DUTY. Shift duty activation is required to access patient clinical records.");
      return;
    }

    try {
      const res = await fetch("/api/doctor/retrieve-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          medID: searchedPatient.medID,
          purpose: `Routine Consultation - ${activeUser.title} (${activeUser.name})`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to retrieve authorized records.");
        return;
      }
      setPatientInfo(data.patientInfo);
      setRetrievedRecords(data.retrievedRecords);
      setPermittedSections(data.permittedSections || []);
      const hospNames = Object.keys(data.retrievedRecords);
      if (hospNames.length > 0) setSelectedHospitalTab(hospNames[0]);
      setChartLoaded(true);
      setIsEmergencyActive(false);

      if (activeUser.role === "DOCTOR") {
        generatePatientSummary(data.patientInfo.name, data.retrievedRecords);
      }
    } catch (err) {
      setError("Failed to retrieve EHR charts from national exchange.");
    }
  };

  // Emergency Break-Glass Execution
  const handleTriggerBreakGlass = async () => {
    if (!emergencyCode.trim()) {
      setError("Please provide the Hospital Emergency Override Code.");
      return;
    }
    if (!customReason.trim()) {
      setError("A clinical emergency justification is legally mandatory for Break-Glass access.");
      return;
    }

    setError("");
    const targetMedID = searchedPatient?.medID || "MD38281726";
    const token = `EMG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await fetch("/api/doctor/emergency-retrieve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({
          emergencyToken: token,
          emergencyOverrideCode: emergencyCode.trim(),
          reason: customReason.trim(),
          medID: targetMedID,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Emergency override authorization failed.");
        return;
      }

      setEmergencyModalOpen(false);
      setPatientInfo(data.patientInfo);
      setRetrievedRecords(data.retrievedRecords);
      setPermittedSections(data.permittedSections || ["IDENTITY_ADMIN", "EMERGENCY_CRITICAL"]);
      const hospNames = Object.keys(data.retrievedRecords);
      if (hospNames.length > 0) setSelectedHospitalTab(hospNames[0]);
      setChartLoaded(true);
      setIsEmergencyActive(true);
      setEmergencySecondsLeft(60);

      generatePatientSummary(data.patientInfo.name, data.retrievedRecords);
    } catch (e) {
      setError("Failed to validate emergency break-glass credentials.");
    }
  };

  // Patient Summary Generation
  const generatePatientSummary = async (name: string, records: any) => {
    setSummaryLoading(true);
    setPatientSummary("");
    try {
      const response = await fetch("/api/gemini/clinical-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: name, retrievedRecords: records }),
      });
      const data = await response.json();
      setSummaryLoading(false);
      if (!response.ok) {
        setPatientSummary("Synthesized clinical summary currently unavailable.");
        return;
      }
      setPatientSummary(data.brief);
    } catch (err) {
      setSummaryLoading(false);
      setPatientSummary("Failed to contact clinical AI engine.");
    }
  };

  // MedID AI Chat Message Handler
  const handleSendChatMessage = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim() || !patientInfo) return;
    setError("");

    if (dutyStatus === "OFF_DUTY") {
      setError("AI queries blocked: Clinician is currently marked OFF_DUTY.");
      return;
    }

    const newMsg = { role: "user", content: textToSend };
    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientInfo.name,
          retrievedRecords,
          messages: updatedMessages,
        }),
      });
      const data = await response.json();
      setChatLoading(false);
      if (!response.ok) {
        setChatMessages([...updatedMessages, { role: "assistant", content: "MedID AI assistant is temporarily unreachable." }]);
        return;
      }
      setChatMessages([...updatedMessages, { role: "assistant", content: data.response }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setChatLoading(false);
      setChatMessages([...updatedMessages, { role: "assistant", content: "Error communicating with MedID AI clinical engine." }]);
    }
  };

  const parseSummarySections = (text: string) => {
    if (!text) return [];
    const lines = text.split("\n");
    const sections: { heading: string; content: string }[] = [];
    let currentHeading = "";
    let currentContent: string[] = [];
    for (const line of lines) {
      const trimmed = line.replace(/\*+/g, "").trim();
      if (/^(Patient Snapshot|Critical Alerts|Active Conditions|Current Medications|Latest Significant Encounter|Clinical Risks|Immediate Clinical Considerations|Emergency Contact)/i.test(trimmed)) {
        if (currentHeading) sections.push({ heading: currentHeading, content: currentContent.join("\n").trim() });
        currentHeading = trimmed;
        currentContent = [];
      } else {
        if (trimmed) currentContent.push(trimmed);
      }
    }
    if (currentHeading) sections.push({ heading: currentHeading, content: currentContent.join("\n").trim() });
    return sections;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="bg-teal-600 text-white p-3 rounded-2xl shadow-sm">
              <Stethoscope className="w-8 h-8" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-2xl font-black tracking-tight text-slate-900">
            Clinician & Staff Portal Sign In
          </h2>
          <p className="mt-2 text-center text-xs text-slate-600">
            Enter your official healthcare staff email and credentials to access the secure MedID exchange.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
            <form onSubmit={handleStaffLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Staff Email</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. james.bello@luth.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">License Number / Credential</label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. MDN-2015-8831"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none"
                >
                  Sign In to Console
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <button
                onClick={onBack}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Home Launcher</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-sans text-slate-900" id="doctor-portal-root">
      
      {/* ─── Workstation Lock Screen Overlay ─── */}
      {isStationLocked && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl space-y-6">
            <div className="w-20 h-20 mx-auto bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
              <Lock className="w-10 h-10" />
            </div>
            <div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 font-mono text-xs font-bold rounded-full uppercase tracking-wider">
                Workstation Locked
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-3">Shared Terminal Shield</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Active clinician session locked for <strong>{activeUser.name}</strong> ({activeUser.title}). Patient data protected under NDPA Section 37.
              </p>
            </div>

            {stationLockError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs font-medium text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{stationLockError}</span>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="password"
                placeholder="Enter 4-Digit Clinician PIN (e.g. 1234)"
                value={unlockPin}
                onChange={(e) => setUnlockPin(e.target.value)}
                className="w-full text-center tracking-widest text-lg font-mono py-3 px-4 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
              <button
                onClick={handleUnlockWorkstation}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-base py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Unlock className="w-5 h-5" />
                <span>Unlock Workstation</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Dev Fast Unlock: Enter <strong>1234</strong> or click button
            </p>
          </div>
        </div>
      )}

      {/* ─── Unauthorized Access Violation Modal (Abuse Detection Demo) ─── */}
      {abuseViolationModal?.open && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[90] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border-2 border-rose-400 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-mono text-xs font-bold rounded uppercase">
                  403 Forbidden &bull; Policy Breach Blocked
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Unauthorized Clinical Access Attempt</h3>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-rose-900 leading-relaxed space-y-2">
              <p className="font-bold">Automated Security Rule Enforced: {abuseViolationModal.rule}</p>
              <p>{abuseViolationModal.reason}</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Actor:</span>
                <strong className="text-slate-800">{activeUser.name} ({activeUser.title})</strong>
              </div>
              <div className="flex justify-between">
                <span>Security Incident Dispatched:</span>
                <strong className="text-rose-600 font-mono">INCIDENT-ALERT-CRITICAL</strong>
              </div>
              <div className="flex justify-between">
                <span>Action Taken:</span>
                <strong className="text-emerald-700">Access Denied & Flagged in Compliance Queue</strong>
              </div>
            </div>

            <button
              onClick={() => setAbuseViolationModal(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all"
            >
              Acknowledge & Return
            </button>
          </div>
        </div>
      )}

      {/* ─── Emergency Break-Glass Justification Modal ─── */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[80] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border-2 border-rose-400 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono text-xs font-bold rounded uppercase">
                    Governed Break-Glass Override
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">Emergency Record Access Declaration</h3>
                </div>
              </div>
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 leading-relaxed">
              <strong className="block font-bold mb-1">Legal & Regulatory Declaration Notice:</strong>
              Break-Glass emergency override bypasses standard patient consent for unconscious or acute trauma patients under NDPA Section 41. Every action is cryptographically anchored in the immutable audit ledger and generates a real-time compliance alert.
            </div>

            {/* Presets or Custom Input */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Select Clinical Justification Preset:</label>
              <div className="space-y-2 mb-3">
                {emergencyReasons.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCustomReason(r)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all ${
                      customReason === r
                        ? "bg-rose-50 border-rose-300 text-rose-900 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-bold text-slate-800 mb-1">Or Type Custom Emergency Justification:</label>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter detailed clinical circumstances justifying break-glass..."
                className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-slate-800">Hospital Emergency Override Code:</label>
                <span className="text-xs font-mono text-slate-500">LUTH Key: <strong>LUTH-9988</strong></span>
              </div>
              <input
                type="text"
                value={emergencyCode}
                onChange={(e) => setEmergencyCode(e.target.value)}
                className="w-full text-base font-mono font-bold tracking-wider p-3 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none uppercase"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEmergencyModalOpen(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerBreakGlass}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Authorize Break-Glass (60s)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detailed Encounter Dossier Modal ─── */}
      {selectedEncounterDossier && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-[85] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded uppercase">
                    {selectedEncounterDossier.encounter.visitType} Encounter
                  </span>
                  <span className="text-sm font-mono text-slate-500">{selectedEncounterDossier.encounter.date}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">
                  {selectedEncounterDossier.hospitalName} &bull; Clinical Encounter Dossier
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Attending Physician: <strong>{selectedEncounterDossier.encounter.doctorName}</strong> ({selectedEncounterDossier.encounter.department})
                </p>
              </div>
              <button
                onClick={() => setSelectedEncounterDossier(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Presentation Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Clinical Presentation & Summary</span>
              <p className="text-base text-slate-800 leading-relaxed font-serif italic">
                "{selectedEncounterDossier.encounter.summary}"
              </p>
            </div>

            {/* Diagnoses */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Confirmed Diagnoses</span>
              <div className="flex flex-wrap gap-2">
                {selectedEncounterDossier.encounter.diagnoses.map((diag, i) => (
                  <span key={i} className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-900 font-bold text-sm rounded-xl">
                    {diag}
                  </span>
                ))}
              </div>
            </div>

            {/* Medications Prescribed */}
            {selectedEncounterDossier.encounter.medications.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Medications Administered & Prescribed</span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                      <tr>
                        <th className="p-3">Drug Name</th>
                        <th className="p-3">Dosage</th>
                        <th className="p-3">Frequency</th>
                        <th className="p-3">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEncounterDossier.encounter.medications.map((m, i) => (
                        <tr key={i} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">{m.name}</td>
                          <td className="p-3 text-slate-700">{m.dosage}</td>
                          <td className="p-3 text-slate-700">{m.frequency}</td>
                          <td className="p-3 text-slate-700 font-medium">{m.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Laboratory Findings */}
            {selectedEncounterDossier.encounter.laboratoryResults.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Laboratory & Specimen Findings</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedEncounterDossier.encounter.laboratoryResults.map((lab, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{lab.test}</span>
                        <span className="text-xs text-slate-400">Normal Range: {lab.range}</span>
                      </div>
                      <span className="text-sm font-mono font-black text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
                        {lab.result} <span className="text-xs font-normal text-slate-500">{lab.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Radiology & Scans */}
            {selectedEncounterDossier.encounter.scans.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Diagnostic Imaging & Scans</span>
                <div className="space-y-3">
                  {selectedEncounterDossier.encounter.scans.map((scan, i) => (
                    <div key={i} className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Scan className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-indigo-950 text-sm">{scan.type}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed italic">
                        "{scan.findings}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>Cryptographic Anchor Verified &bull; SHA-256 Chained</span>
              <button
                onClick={() => setSelectedEncounterDossier(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm transition-all"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Top Navigation Header ─── */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              title="Return to Launcher"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-teal-600 text-white p-2 rounded-xl flex items-center justify-center shadow-sm">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-xl font-black tracking-tight text-slate-900">
                MedID <span className="text-teal-600">Clinician & Staff Console</span>
              </span>
              <span className="block text-xs text-slate-500 font-medium">Safe Patient Record Access Layer</span>
            </div>
          </div>

          {/* Active Clinician Profile & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                {activeUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="block text-xs font-black text-slate-900 leading-none">{activeUser.name}</span>
                <span className="block text-[11px] text-slate-500 font-medium">{activeUser.title} &bull; {activeUser.hospital}</span>
              </div>
            </div>

            {/* Duty Status Toggle */}
            <button
              onClick={handleToggleDuty}
              disabled={dutyToggling}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                dutyStatus === "ON_DUTY"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${dutyStatus === "ON_DUTY" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></div>
              <span>{dutyStatus === "ON_DUTY" ? "Active Shift (ON DUTY)" : "Off Shift (OFF DUTY)"}</span>
            </button>

            {/* Lock Workstation */}
            <button
              onClick={handleLockWorkstation}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title="Lock unattended terminal"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Terminal</span>
            </button>

            {/* Sign Out */}
            <button
              onClick={() => { setIsLoggedIn(false); setSessionToken(""); }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Role Scope Banner ─── */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-4">
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${activeUser.badgeColor}`}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              <strong>Access Scope for {activeUser.title}:</strong> {activeUser.scopeDesc}
            </span>
          </div>
          <span className="font-mono text-[11px] uppercase font-bold shrink-0 hidden md:inline-block">
            NDPA Access Tier: {activeUser.role}
          </span>
        </div>
      </div>

      {/* ─── Active Emergency Break-Glass Countdown Banner ─── */}
      {isEmergencyActive && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-3 animate-pulse">
          <div className="bg-rose-600 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5" />
              <div>
                <span className="font-bold text-sm">ACTIVE EMERGENCY BREAK-GLASS WINDOW</span>
                <span className="block text-xs text-rose-100">
                  Justification: {customReason} &bull; Audit Block anchored
                </span>
              </div>
            </div>
            <div className="bg-rose-800 px-4 py-1.5 rounded-xl text-right font-mono font-black text-base">
              00:{String(emergencySecondsLeft).padStart(2, "0")}s REMAINING
            </div>
          </div>
        </div>
      )}

      {/* ─── Notification / Alert Feedback ─── */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="text-sm font-semibold">{error}</div>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-sm font-semibold">{successMsg}</div>
          </div>
        )}
      </div>

      {/* ─── Main Content Body ─── */}
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full space-y-6">

        {/* ── Patient Search & Dual Authorization Card ── */}
        {!chartLoaded && (
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Header Description */}
            <div className="text-center max-w-2xl mx-auto mb-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Patient Discovery & Safe Access</h2>
              <p className="text-sm text-slate-600 mt-1">
                Lookup registered health records across national healthcare facilities with cryptographic policy verification.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* OPTION 1: Search by MedID / NIN */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-teal-100 text-teal-700 p-2 rounded-xl">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Patient Search (MedID or NIN)</h3>
                      <p className="text-xs text-slate-500">Voluntary discovery when patient or family provides identifier.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePatientSearch} className="flex gap-2 my-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="Enter Patient MedID (e.g. MD38281726)"
                        value={searchMedID}
                        onChange={(e) => setSearchMedID(e.target.value)}
                        className="pl-10 w-full rounded-2xl border border-slate-300 py-3 px-4 text-sm font-medium focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searchLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-xs shrink-0"
                    >
                      {searchLoading ? "Searching..." : "Search"}
                    </button>
                  </form>
                </div>

                {searchedPatient && (
                  <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50 mt-4 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[11px] uppercase font-bold text-slate-400">National Index Matched</span>
                        <h4 className="text-xl font-black text-slate-950 mt-0.5">{searchedPatient.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                          <span>MedID: <strong className="font-mono text-teal-700">{searchedPatient.medID}</strong></span>
                          <span>DOB: {searchedPatient.dob}</span>
                          <span>Gender: {searchedPatient.gender}</span>
                        </div>
                      </div>
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        <span>NIN Verified</span>
                      </div>
                    </div>

                    {/* Linked Hospital Nodes */}
                    <div>
                      <span className="text-[11px] uppercase font-bold text-slate-400 block mb-1.5">Linked Hospital EHR Nodes</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(searchedPatient.recordsAvailable).map(([hosp, available]) => (
                          <div
                            key={hosp}
                            className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
                              available ? "bg-teal-50 border-teal-200 text-teal-800" : "bg-slate-100 border-slate-200 text-slate-400"
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{hosp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Consent Notice & Retrieval Actions */}
                    <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-3 text-xs text-teal-900 leading-relaxed">
                      <strong>Safe Access Consent Requirement:</strong> Patient has provided identity code. Click below to retrieve role-scoped records under active clinician authorization.
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleStandardRetrieval}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Retrieve Authorized Records</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* OPTION 2: Governed Emergency Break-Glass */}
              <div className="bg-white border-2 border-rose-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-bl-2xl">
                  Break-Glass Override
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-rose-100 text-rose-700 p-2 rounded-xl">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Emergency Break-Glass Access</h3>
                      <p className="text-xs text-slate-500">Unconscious, comatose, or trauma resuscitation patients.</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center my-4">
                    <div className="w-16 h-16 mx-auto bg-rose-50 border-2 border-rose-200 rounded-full flex items-center justify-center text-rose-500 mb-3 shadow-inner">
                      <Fingerprint className="w-8 h-8" />
                    </div>
                    <span className="block text-sm font-bold text-slate-800">Emergency Biometric / Code Override</span>
                    <span className="block text-xs text-slate-500 mt-1">
                      Bypasses consent requirement for acute resuscitation. Requires clinical justification and hospital key.
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-600" />
                    <span>Time-limited 1-minute (60s) emergency window with immutable audit record.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEmergencyModalOpen(true)}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Declare Emergency & Break-Glass</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Active Patient Chart Hub ── */}
        {chartLoaded && patientInfo && (
          <div className="space-y-6 animate-fade-in" id="clinical-chart-hub">
            
            {/* Patient Master Information Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 text-xs font-bold rounded uppercase">
                    Active Patient Record
                  </span>
                  {isEmergencyActive ? (
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded uppercase flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Break-Glass Session (60s)</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded uppercase">
                      Authorized Routine Access
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-black text-slate-900 mt-1">{patientInfo.name}</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600 mt-2 font-medium">
                  <span>MedID: <strong className="font-mono text-teal-700">{patientInfo.medID}</strong></span>
                  <span>DOB: <strong>{patientInfo.dob}</strong></span>
                  <span>Gender: <strong>{patientInfo.gender}</strong></span>
                  {patientInfo.bloodGroup && <span>Blood Group: <strong className="text-rose-700">{patientInfo.bloodGroup}</strong></span>}
                  {patientInfo.genotype && <span>Genotype: <strong className="text-slate-800">{patientInfo.genotype}</strong></span>}
                </div>
              </div>

              {/* Emergency Contact & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs leading-relaxed max-w-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Emergency Contact</span>
                  <strong className="text-sm font-bold text-slate-900 block mt-0.5">
                    {patientInfo.emergencyContact?.name} ({patientInfo.emergencyContact?.relationship})
                  </strong>
                  <span className="text-slate-600 font-mono text-xs block">{patientInfo.emergencyContact?.phone}</span>
                </div>

                <button
                  onClick={() => { setChartLoaded(false); setPatientInfo(null); }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Close Chart
                </button>
              </div>
            </div>

            {/* ── Navigation Tabs across Views ── */}
            <div className="flex border-b border-slate-200 gap-2">
              <button
                onClick={() => setChartTab("SUMMARY")}
                className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                  chartTab === "SUMMARY"
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Patient Summary</span>
              </button>

              <button
                onClick={() => setChartTab("AI_ASSISTANT")}
                className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                  chartTab === "AI_ASSISTANT"
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Brain className="w-4 h-4 text-teal-600" />
                <span>MedID AI</span>
              </button>

              <button
                onClick={() => setChartTab("EXPLORER")}
                className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
                  chartTab === "EXPLORER"
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <Users className="w-4 h-4 text-teal-600" />
                <span>Hospital Explorer (Click for Full Dossier)</span>
              </button>
            </div>

            {/* ── TAB 1: PATIENT SUMMARY ── */}
            {chartTab === "SUMMARY" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Patient Longitudinal Summary</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Synthesized for rapid clinical decision making across all connected hospitals.</p>
                  </div>
                  {patientSummary && (
                    <button
                      onClick={() => generatePatientSummary(patientInfo.name, retrievedRecords)}
                      className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-synthesize</span>
                    </button>
                  )}
                </div>

                {summaryLoading ? (
                  <div className="space-y-4 py-8 animate-pulse">
                    <div className="h-5 bg-slate-100 rounded-xl w-1/3"></div>
                    <div className="space-y-2"><div className="h-4 bg-slate-100 rounded-xl w-full"></div><div className="h-4 bg-slate-100 rounded-xl w-5/6"></div></div>
                    <div className="h-5 bg-slate-100 rounded-xl w-1/4 pt-4"></div>
                    <div className="h-4 bg-slate-100 rounded-xl w-full"></div>
                  </div>
                ) : patientSummary ? (
                  <div className="space-y-6">
                    {parseSummarySections(patientSummary).map((section, idx) => (
                      <div key={idx} className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
                        <h4 className="font-bold text-base text-slate-900 mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                          <span>{section.heading}</span>
                        </h4>
                        <div className="text-sm text-slate-700 leading-relaxed pl-4 space-y-1">
                          {section.content.split("\n").map((line, i) => {
                            const clean = line.replace(/^[-•*]\s*/, "");
                            if (clean.startsWith("http")) return null;
                            return <p key={i}>{clean}</p>;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No summary generated. Click below to generate clinical synthesis.
                    <div className="mt-4">
                      <button
                        onClick={() => generatePatientSummary(patientInfo.name, retrievedRecords)}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all"
                      >
                        Generate Patient Summary
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: MedID AI CLINICAL ASSISTANT ── */}
            {chartTab === "AI_ASSISTANT" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[600px] animate-fade-in">
                <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-teal-600" />
                      <span>MedID AI &bull; Clinical Reasoning Assistant</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Grounded strictly in retrieved longitudinal records from LUTH, LASUTH, and Evercare.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-full font-mono uppercase">
                    EHR Bound
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-12 space-y-4 h-full flex flex-col justify-center">
                      <Brain className="w-12 h-12 text-slate-300 mx-auto" />
                      <div>
                        <h4 className="text-base font-bold text-slate-800">Ask Clinical Questions</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Query specific allergies, drug interaction alerts, surgical procedures, or past diagnostic scans.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto pt-2">
                        {quickQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendChatMessage(q)}
                            className="bg-slate-50 hover:bg-teal-50 hover:border-teal-200 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-700 transition-all text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            AI
                          </div>
                        )}
                        <div
                          className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-teal-600 text-white font-medium"
                              : "bg-slate-50 border border-slate-200 text-slate-800 font-sans"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))
                  )}

                  {chatLoading && (
                    <div className="flex gap-3 justify-start items-center text-slate-400 text-xs">
                      <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs animate-pulse">
                        AI
                      </div>
                      <span className="animate-pulse">Consulting patient EHR longitudinal charts...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                  className="flex gap-2 pt-2 border-t border-slate-100"
                >
                  <input
                    type="text"
                    placeholder="Ask MedID AI about allergies, scans, encounters..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-300 py-3 px-4 text-sm focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}

            {/* ── TAB 3: HOSPITAL EXPLORER (CLICKABLE ENCOUNTERS DOSSIER) ── */}
            {chartTab === "EXPLORER" && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in" id="ehr-explorer-panel">
                
                {/* Hospital Adapter Selector */}
                <div className="col-span-1 bg-white border border-slate-200 rounded-3xl p-4 h-fit space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
                    Connected Hospital Nodes
                  </span>
                  {Object.keys(retrievedRecords).map((hosp) => (
                    <button
                      key={hosp}
                      onClick={() => setSelectedHospitalTab(hosp)}
                      className={`w-full text-left p-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between ${
                        selectedHospitalTab === hosp
                          ? "bg-teal-50 text-teal-800 border border-teal-200 shadow-xs"
                          : "text-slate-700 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <span>{hosp}</span>
                      <span className="text-xs font-mono font-normal text-slate-400">
                        {retrievedRecords[hosp].length} enc
                      </span>
                    </button>
                  ))}
                </div>

                {/* Encounters Feed */}
                <div className="col-span-1 md:col-span-3 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-teal-600" />
                        <span>{selectedHospitalTab} Encounter Stream</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click any encounter box to open the full detailed clinical dossier.
                      </p>
                    </div>
                  </div>

                  {selectedHospitalTab && retrievedRecords[selectedHospitalTab] ? (
                    <div className="space-y-4">
                      {retrievedRecords[selectedHospitalTab].map((enc, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedEncounterDossier({ encounter: enc, hospitalName: selectedHospitalTab })}
                          className="border-2 border-slate-200 hover:border-teal-500 rounded-2xl p-5 hover:bg-teal-50/20 transition-all bg-white cursor-pointer group shadow-xs hover:shadow-md"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-slate-100 pb-3 mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                                  Encounter Date: {enc.date}
                                </span>
                                <span className="bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold uppercase">
                                  {enc.visitType}
                                </span>
                              </div>
                              <span className="block text-slate-500 text-xs mt-0.5 font-medium">
                                Attending: {enc.doctorName} &bull; {enc.department}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-teal-600 font-bold text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                              <Eye className="w-4 h-4" />
                              <span>View Full Dossier &rarr;</span>
                            </div>
                          </div>

                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Diagnoses</span>
                              <div className="flex flex-wrap gap-1.5">
                                {enc.diagnoses.map((d, dIdx) => (
                                  <span key={dIdx} className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                              <span>Summary: <em className="text-slate-700 font-serif">"{enc.summary.slice(0, 100)}..."</em></span>
                              <span className="font-bold text-teal-600">Inspect Complete Record</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No encounters recorded for this hospital node.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* ─── Standardized Footer ─── */}
      <footer className="border-t border-slate-200 bg-white py-4 px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>MedID Safe Access Layer &bull; HSM Cryptographic Ledger Anchor</span>
          <span className="font-mono text-teal-700 font-semibold">Node Status: Verified &bull; NDPA Sec. 39 Compliant</span>
        </div>
      </footer>

    </div>
  );
}
