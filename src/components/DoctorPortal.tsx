import React, { useState, useEffect, useRef } from "react";
import { 
  Shield, Heart, Search, CheckCircle2, AlertCircle, 
  ArrowLeft, Lock, Mail, Users, FileText, Check, 
  AlertTriangle, Fingerprint, Sparkles, Send, Brain, 
  Dna, HelpCircle, Copy, Terminal, UserCheck, RefreshCw, Activity 
} from "lucide-react";
import { Doctor, PatientProfile, Encounter, AccessLog } from "../types";

interface DoctorPortalProps {
  onBack: () => void;
}

export default function DoctorPortal({ onBack }: DoctorPortalProps) {
  // Authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("james.bello@luth.org");
  const [licenseNumber, setLicenseNumber] = useState("MDN-2015-8831");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  // Patient Search & Selected State
  const [searchMedID, setSearchMedID] = useState("MD38281726");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchedPatient, setSearchedPatient] = useState<any | null>(null);

  // Emergency Mode state machine
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [emergencyStep, setEmergencyStep] = useState<"REASON" | "CODE" | "BIOMETRIC" | "SCANNING">("REASON");
  const [emergencyReason, setEmergencyReason] = useState("Unconscious trauma patient in emergency bay");
  const [emergencyCode, setEmergencyCode] = useState("");
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | "palm">("fingerprint");
  const [biometricSubject, setBiometricSubject] = useState("fingerprint_sarah"); // Default Sarah Johnson
  const [biometricScanProgress, setBiometricScanProgress] = useState(0);
  const [emergencyToken, setEmergencyToken] = useState("");

  // Loaded Chart Hub States
  const [chartLoaded, setChartLoaded] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any | null>(null);
  const [retrievedRecords, setRetrievedRecords] = useState<{ [hospitalName: string]: Encounter[] }>({});
  
  // Loaded Chart Tab Views
  const [chartTab, setChartTab] = useState<"BRIEF" | "CHAT" | "EXPLORER">("BRIEF");
  const [selectedHospitalTab, setSelectedHospitalTab] = useState<string>("");

  // AI Assistant States
  const [aiBrief, setAiBrief] = useState("");
  const [aiBriefLoading, setAiBriefLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick questions helpers
  const quickQuestions = [
    "What drug allergies does this patient have?",
    "Has the patient reacted badly to Amoxicillin?",
    "What medications is the patient currently taking?",
    "Show previous MRI or scan findings.",
    "Has this patient ever had renal disease?"
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !licenseNumber) {
      setError("Please input clinical credentials.");
      return;
    }

    try {
      const response = await fetch("/api/doctor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, licenseNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Access Denied.");
        return;
      }

      setDoctor(data.doctor);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Doctor login error:", err);
      setError("Failed to authenticate. Check server connection.");
    }
  };

  const handlePatientSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSearchedPatient(null);
    setChartLoaded(false);

    if (!searchMedID) return;

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/doctor/search-patient?medID=${searchMedID.trim().toUpperCase()}`);
      const data = await response.json();
      setSearchLoading(false);

      if (!response.ok) {
        setError(data.error || "No patient match found.");
        return;
      }
      setSearchedPatient(data);
    } catch (err) {
      setSearchLoading(false);
      setError("Error calling record discovery directory.");
    }
  };

  // NORMAL CONSULTATION FLOW
  const handleNormalRetrieval = async () => {
    if (!searchedPatient || !doctor) return;
    setError("");
    setAiBrief("");
    setChatMessages([]);

    try {
      const response = await fetch("/api/doctor/retrieve-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medID: searchedPatient.medID,
          doctorId: doctor.id,
          purpose: "Routine Consultation",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to retrieve index records.");
        return;
      }

      setPatientInfo(data.patientInfo);
      setRetrievedRecords(data.retrievedRecords);
      
      // Auto-select first hospital tab
      const hospNames = Object.keys(data.retrievedRecords);
      if (hospNames.length > 0) {
        setSelectedHospitalTab(hospNames[0]);
      }

      setChartLoaded(true);
      generateClinicalBrief(data.patientInfo.name, data.retrievedRecords);
    } catch (err) {
      setError("Failed to retrieve EHR charts.");
    }
  };

  // EMERGENCY FLOW
  const triggerEmergencyWorkflow = () => {
    setEmergencyActive(true);
    setEmergencyStep("REASON");
    setEmergencyCode("");
    // Pre-seed matching profiles for smooth simulation demo
    if (biometricType === "fingerprint") {
      setBiometricSubject("fingerprint_sarah"); // Sarah Johnson
    }
  };

  const submitEmergencyReason = () => {
    if (!emergencyReason) {
      setError("Please describe the emergency context.");
      return;
    }
    setError("");
    setEmergencyStep("CODE");
  };

  const submitEmergencyCode = () => {
    if (!emergencyCode) {
      setError("Please enter your Hospital Emergency Override Code.");
      return;
    }
    setError("");
    setEmergencyStep("BIOMETRIC");
  };

  const triggerBiometricScanSimulation = () => {
    setEmergencyStep("SCANNING");
    setBiometricScanProgress(0);
    setError("");

    // Interval to simulate high-fidelity scan
    const interval = setInterval(() => {
      setBiometricScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completeEmergencyRetrieval();
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  const completeEmergencyRetrieval = async () => {
    if (!doctor) return;
    try {
      // 1. Resolve biometric identity match on server
      const matchRes = await fetch("/api/doctor/emergency-biometric-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          biometricType,
          scanData: biometricSubject,
          reason: emergencyReason,
          doctorId: doctor.id,
        }),
      });
      const matchData = await matchRes.json();
      if (!matchRes.ok) {
        setError(matchData.error || "Biometric validation failed.");
        setEmergencyActive(false);
        return;
      }

      // 2. Fetch full charts bypass with credentials
      const retrieveRes = await fetch("/api/doctor/emergency-retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emergencyToken: matchData.emergencyToken,
          emergencyOverrideCode: emergencyCode,
          reason: emergencyReason,
          medID: matchData.patientMatched.medID,
          doctorId: doctor.id,
        }),
      });

      const retrieveData = await retrieveRes.json();
      if (!retrieveRes.ok) {
        setError(retrieveData.error || "Emergency bypass retrieval failed.");
        setEmergencyActive(false);
        return;
      }

      setPatientInfo(retrieveData.patientInfo);
      setRetrievedRecords(retrieveData.retrievedRecords);
      
      const hospNames = Object.keys(retrieveData.retrievedRecords);
      if (hospNames.length > 0) {
        setSelectedHospitalTab(hospNames[0]);
      }

      // Settle active displays
      setEmergencyActive(false);
      setChartLoaded(true);
      generateClinicalBrief(retrieveData.patientInfo.name, retrieveData.retrievedRecords);
    } catch (err) {
      setError("Emergency chart extraction failed.");
      setEmergencyActive(false);
    }
  };

  // AI BRIEF GENERATOR CALL
  const generateClinicalBrief = async (name: string, records: any) => {
    setAiBriefLoading(true);
    setAiBrief("");
    try {
      const response = await fetch("/api/gemini/clinical-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: name, retrievedRecords: records }),
      });
      const data = await response.json();
      setAiBriefLoading(false);
      if (!response.ok) {
        setAiBrief("Error synthesizing clinical brief.");
        return;
      }
      setAiBrief(data.brief);
    } catch (err) {
      setAiBriefLoading(false);
      setAiBrief("Failed to contact clinical AI engine.");
    }
  };

  // AI CHATBOT MESSAGING
  const handleSendChatMessage = async (overrideText?: string) => {
    const textToSend = overrideText || chatInput;
    if (!textToSend.trim() || !patientInfo) return;

    setError("");
    const newMsg = { role: "user", content: textToSend };
    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setChatInput("");
    setChatLoading(true);

    // Scroll to bottom
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
        setChatMessages([...updatedMessages, { role: "assistant", content: "AI clinical copilot is currently unreachable." }]);
        return;
      }

      setChatMessages([...updatedMessages, { role: "assistant", content: data.response }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setChatLoading(false);
      setChatMessages([...updatedMessages, { role: "assistant", content: "Error communicating with Gemini intelligence." }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between" id="doctor-portal-root">
      
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              onClick={isLoggedIn ? () => setIsLoggedIn(false) : onBack}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-teal-600 text-white p-2 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                MedID <span className="text-teal-600">Clinician Portal</span>
              </span>
            </div>
          </div>
          {isLoggedIn && doctor && (
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <span className="block text-xs font-bold text-slate-800">{doctor.name}</span>
                <span className="block text-[10px] font-mono text-slate-500">{doctor.hospitalName} ({doctor.department})</span>
              </div>
              <button
                onClick={() => {
                  setIsLoggedIn(false);
                  setChartLoaded(false);
                  setSearchedPatient(null);
                }}
                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1 w-full flex flex-col justify-center">
        
        {/* Errors Block */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start space-x-3 max-w-lg mx-auto w-full mb-6 animate-fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* CLINICIAN LOGIN */}
        {!isLoggedIn && (
          <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-slate-900">Clinical Verification</h2>
              <p className="text-sm text-slate-500 mt-1">Please authenticate with your verified platform login.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" id="doctor-login-form">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Hospital Affiliated Email</label>
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
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Clinician Council License No.</label>
                  <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-mono border border-teal-100">Dev Lic: MDN-2015-8831</span>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="MDN-XXXX-XXXX"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="doctor-login-submit"
                className="w-full bg-teal-600 text-white font-bold text-sm py-3 px-4 rounded-xl hover:bg-teal-700 transition-colors shadow-sm focus:outline-none"
              >
                Verify Clinician Access
              </button>
            </form>
          </div>
        )}

        {/* LOGGED IN ACTIVE CLINICAL SCREEN */}
        {isLoggedIn && doctor && (
          <div className="space-y-8">
            
            {/* If chart isn't loaded yet: Search Patient screen */}
            {!chartLoaded && (
              <div className="max-w-2xl mx-auto w-full space-y-6">
                
                {/* Search Bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-display font-bold text-slate-900 text-base mb-2">Patient Registry Discovery</h3>
                  <p className="text-xs text-slate-500 mb-6">Enter a secure MedID to discover where active hospital records are indexed across the platform.</p>
                  
                  <form onSubmit={handlePatientSearch} className="flex flex-col sm:flex-row gap-3" id="patient-search-form">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Enter Patient MedID (e.g. MD38281726)"
                        value={searchMedID}
                        onChange={(e) => setSearchMedID(e.target.value)}
                        className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      id="patient-search-submit"
                      className="bg-slate-950 text-white font-bold text-sm py-2.5 px-6 rounded-xl hover:bg-slate-850 transition-colors shrink-0"
                    >
                      {searchLoading ? "Searching Index..." : "Search Patient"}
                    </button>
                  </form>
                </div>

                {/* Patient Search Outcome Display */}
                {searchedPatient && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in" id="search-outcome-card">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Demographic Profile Matched</span>
                        <h4 className="text-xl font-display font-extrabold text-slate-950 mt-1">{searchedPatient.name}</h4>
                        <span className="block text-xs font-mono font-bold text-teal-750 mt-1">{searchedPatient.medID}</span>
                        <span className="block text-xs text-slate-500 mt-1">DOB: {searchedPatient.dob} | Gender: {searchedPatient.gender}</span>
                      </div>
                      <div className="bg-teal-50 text-teal-800 border border-teal-200 rounded-lg p-2 flex items-center space-x-1.5 text-xs font-bold">
                        <UserCheck className="w-4 h-4 shrink-0" />
                        <span>Identity Validated</span>
                      </div>
                    </div>

                    {/* Checkmarks representation of hosting hospitals */}
                    <div>
                      <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">EHR Interoperable Indexes</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {Object.entries(searchedPatient.recordsAvailable).map(([hosp, hasRecord]) => (
                          <div key={hosp} className="flex items-center space-x-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                            <div className={`p-1 rounded-full ${hasRecord ? "bg-teal-100 text-teal-700" : "bg-slate-200 text-slate-400"}`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-bold text-slate-800">{hosp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Standard Consent or Emergency override actions */}
                    <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
                      <button
                        type="button"
                        onClick={triggerEmergencyWorkflow}
                        id="emergency-access-override-btn"
                        className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs py-2.5 px-5 rounded-xl transition-colors flex items-center justify-center space-x-2 animate-pulse"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Emergency Access Override</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleNormalRetrieval}
                        id="retrieve-records-btn"
                        className="bg-teal-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl hover:bg-teal-700 transition-colors shadow-sm flex items-center justify-center space-x-2"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Retrieve Interoperable Record</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* EMERGENCY SCREEN overlay modal wrapper */}
                {emergencyActive && (
                  <div className="bg-white border-2 border-rose-600 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in relative overflow-hidden">
                    <div className="bg-rose-600 text-white p-4 -mx-6 -mt-6 flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-white animate-pulse" />
                        <span className="font-display font-extrabold text-sm tracking-wider uppercase">Critical Emergency Override Mode</span>
                      </div>
                      <button onClick={() => setEmergencyActive(false)} className="text-white/80 hover:text-white text-xs font-bold">
                        Cancel
                      </button>
                    </div>

                    {emergencyStep === "REASON" && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">1. Specify Emergency Reason *</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Enter severe clinical justification..."
                            value={emergencyReason}
                            onChange={(e) => setEmergencyReason(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-rose-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={submitEmergencyReason}
                            className="bg-rose-600 text-white font-semibold text-xs py-2 px-5 rounded-lg hover:bg-rose-700"
                          >
                            Proceed to Security Verification
                          </button>
                        </div>
                      </div>
                    )}

                    {emergencyStep === "CODE" && (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-700 uppercase">2. Institutional Override Credentials *</label>
                            <span className="text-[10px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                              Current hospital code (e.g. LUTH-9988)
                            </span>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Enter Emergency Override Code"
                            value={emergencyCode}
                            onChange={(e) => setEmergencyCode(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-rose-500 focus:outline-none font-mono tracking-wider"
                          />
                        </div>
                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={() => setEmergencyStep("REASON")}
                            className="text-xs font-semibold text-slate-500 hover:underline"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={submitEmergencyCode}
                            className="bg-rose-600 text-white font-semibold text-xs py-2 px-5 rounded-lg hover:bg-rose-700"
                          >
                            Proceed to Biometric Simulation
                          </button>
                        </div>
                      </div>
                    )}

                    {emergencyStep === "BIOMETRIC" && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-3">
                            3. Select NIN-Linked Biometric Scan Template
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div 
                              onClick={() => { setBiometricType("fingerprint"); setBiometricSubject("fingerprint_sarah"); }}
                              className={`p-4 border rounded-xl cursor-pointer text-center space-y-2 transition-all ${
                                biometricType === "fingerprint" ? "border-rose-600 bg-rose-50" : "border-slate-200"
                              }`}
                            >
                              <Fingerprint className="w-8 h-8 text-rose-600 mx-auto" />
                              <span className="block text-xs font-bold">Fingerprint Scan</span>
                              <span className="block text-[9px] text-slate-400">Matches Sarah Johnson</span>
                            </div>

                            <div 
                              onClick={() => { setBiometricType("face"); setBiometricSubject("face_chioma"); }}
                              className={`p-4 border rounded-xl cursor-pointer text-center space-y-2 transition-all ${
                                biometricType === "face" ? "border-rose-600 bg-rose-50" : "border-slate-200"
                              }`}
                            >
                              <Dna className="w-8 h-8 text-rose-600 mx-auto" />
                              <span className="block text-xs font-bold">Facial Biometric</span>
                              <span className="block text-[9px] text-slate-400">Matches Chioma Adeleke</span>
                            </div>

                            <div 
                              onClick={() => { setBiometricType("palm"); setBiometricSubject("fingerprint_david"); }}
                              className={`p-4 border rounded-xl cursor-pointer text-center space-y-2 transition-all ${
                                biometricType === "palm" ? "border-rose-600 bg-rose-50" : "border-slate-200"
                              }`}
                            >
                              <Users className="w-8 h-8 text-rose-600 mx-auto" />
                              <span className="block text-xs font-bold">Palm Scan</span>
                              <span className="block text-[9px] text-slate-400">Matches David Kalu</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between border-t border-slate-100 pt-4">
                          <button
                            type="button"
                            onClick={() => setEmergencyStep("CODE")}
                            className="text-xs font-semibold text-slate-500 hover:underline"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={triggerBiometricScanSimulation}
                            id="simulate-biometric-scan-btn"
                            className="bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs py-2 px-5 rounded-lg flex items-center space-x-1.5"
                          >
                            <Terminal className="w-4 h-4" />
                            <span>Simulate Biometric Scan</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {emergencyStep === "SCANNING" && (
                      <div className="text-center py-12 space-y-6">
                        <div className="relative inline-block">
                          {/* Pulsing glow ring scanner */}
                          <div className="w-24 h-24 rounded-full bg-rose-50 border-4 border-rose-600 animate-pulse flex items-center justify-center">
                            <Fingerprint className="w-12 h-12 text-rose-600" />
                          </div>
                          <div className="absolute inset-0 border-4 border-rose-300 rounded-full animate-ping opacity-25"></div>
                        </div>

                        <div className="max-w-xs mx-auto space-y-2">
                          <span className="block text-sm font-bold text-slate-800">Reading Biometric NIN Vectors...</span>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-rose-600 h-2 rounded-full transition-all duration-200" style={{ width: `${biometricScanProgress}%` }}></div>
                          </div>
                          <span className="block text-[10px] font-mono text-slate-400">NIMC-Match: {biometricScanProgress}% complete</span>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}

            {/* CHART RETRIEVED: ACTIVE HUB */}
            {chartLoaded && patientInfo && (
              <div className="space-y-6 animate-fade-in" id="clinical-chart-hub">
                
                {/* Patient Summary Header bar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-teal-50 text-teal-850 font-mono text-xs font-bold px-2 py-0.5 rounded border border-teal-100">
                        National Patient Record
                      </span>
                      <span className="text-slate-400 font-medium text-xs">Active Session</span>
                    </div>
                    <h2 className="font-display text-2xl font-black text-slate-900 mt-2">{patientInfo.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                      <span>ID: <strong className="font-mono text-teal-700">{patientInfo.medID}</strong></span>
                      <span>DOB: {patientInfo.dob}</span>
                      <span>Gender: {patientInfo.gender}</span>
                    </div>
                  </div>

                  {/* Emergency contact box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed max-w-xs">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Emergency Contact</span>
                    <span className="block font-semibold text-slate-800 mt-0.5">
                      {patientInfo.emergencyContact?.name} ({patientInfo.emergencyContact?.relationship})
                    </span>
                    <span className="block text-slate-600 font-mono mt-0.5">{patientInfo.emergencyContact?.phone}</span>
                  </div>
                </div>

                {/* Dashboard Tabs bar */}
                <div className="flex border-b border-slate-200 gap-1.5" id="clinical-tabs">
                  <button
                    onClick={() => setChartTab("BRIEF")}
                    className={`px-5 py-2.5 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                      chartTab === "BRIEF" 
                        ? "border-teal-600 text-teal-600 font-bold" 
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>AI Clinical Brief</span>
                  </button>

                  <button
                    onClick={() => setChartTab("CHAT")}
                    className={`px-5 py-2.5 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                      chartTab === "CHAT" 
                        ? "border-teal-600 text-teal-600 font-bold" 
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <Brain className="w-4 h-4 text-teal-600" />
                    <span>AI Clinical Copilot</span>
                  </button>

                  <button
                    onClick={() => setChartTab("EXPLORER")}
                    className={`px-5 py-2.5 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
                      chartTab === "EXPLORER" 
                        ? "border-teal-600 text-teal-600 font-bold" 
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <Users className="w-4 h-4 text-teal-500" />
                    <span>EHR Hospital Explorer</span>
                  </button>
                </div>

                {/* TAB VIEW 1: AI CLINICAL BRIEF */}
                {chartTab === "BRIEF" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 animate-fade-in" id="ai-brief-panel">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="font-display font-extrabold text-lg text-slate-900">Clinician AI Briefing</h3>
                        <p className="text-xs text-slate-500 mt-1">Interoperability records compiled by Gemini for 20-second clinical review.</p>
                      </div>
                      
                      {aiBrief && (
                        <button
                          onClick={() => generateClinicalBrief(patientInfo.name, retrievedRecords)}
                          className="text-xs font-bold text-teal-600 hover:underline flex items-center space-x-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Re-analyze</span>
                        </button>
                      )}
                    </div>

                    {aiBriefLoading ? (
                      <div className="space-y-4 py-8 animate-pulse">
                        <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-100 rounded w-full"></div>
                          <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                        </div>
                        <div className="h-4 bg-slate-100 rounded w-1/4 pt-4"></div>
                        <div className="h-3 bg-slate-100 rounded w-full"></div>
                      </div>
                    ) : aiBrief ? (
                      <div className="text-sm leading-relaxed text-slate-800 whitespace-pre-line prose max-w-none">
                        {aiBrief}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        No clinical briefing generated. Click Re-analyze to initiate AI synthesis.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB VIEW 2: AI CLINICAL COPILOT (CHATBOT) */}
                {chartTab === "CHAT" && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[500px] animate-fade-in" id="ai-chat-panel">
                    
                    {/* Header bar */}
                    <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-900">EHR Clinical Copilot</h4>
                        <p className="text-[10px] text-slate-400">Zero-hallucination engine. Responses are strictly locked to retrieved charts.</p>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                        Strict EHR Reference Model
                      </div>
                    </div>

                    {/* Chat Messages flow */}
                    <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-8 space-y-4 h-full flex flex-col justify-center">
                          <Brain className="w-10 h-10 text-slate-300 mx-auto" />
                          <div>
                            <span className="block text-slate-800 font-semibold text-xs">Query this Patient's Dynamic Chart</span>
                            <span className="block text-slate-400 text-[11px] mt-1">Select a quick question tag or input any clinical query.</span>
                          </div>
                          
                          {/* Quick Inquiry Tags */}
                          <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto pt-2">
                            {quickQuestions.map((q) => (
                              <button
                                key={q}
                                onClick={() => {
                                  setChatInput(q);
                                  handleSendChatMessage(q);
                                }}
                                className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700 py-1.5 px-3 rounded-full text-left transition-all"
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {chatMessages.map((m, idx) => (
                            <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-md rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                m.role === "user" 
                                  ? "bg-slate-900 text-white" 
                                  : "bg-slate-100 text-slate-800 border border-slate-200"
                              }`}>
                                <p className="whitespace-pre-line">{m.content}</p>
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-slate-100 text-slate-500 rounded-2xl px-4 py-2.5 text-xs flex items-center space-x-2 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
                                <span>Gemini scanning records...</span>
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef}></div>
                        </div>
                      )}
                    </div>

                    {/* Chat Form */}
                    <form 
                      onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} 
                      className="flex gap-2 border-t border-slate-100 pt-3"
                    >
                      <input
                        type="text"
                        placeholder="Ask clinical chatbot (e.g. 'What dosage of Ferrous Sulfate is patient taking?')"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-300 py-2 px-3 text-xs focus:outline-none focus:border-teal-500"
                      />
                      <button
                        type="submit"
                        className="bg-slate-950 text-white font-bold text-xs py-2 px-4 rounded-xl hover:bg-slate-850 transition-colors shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>

                  </div>
                )}

                {/* TAB VIEW 3: EHR HOSPITAL ADAPTER EXPLORER */}
                {chartTab === "EXPLORER" && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in" id="ehr-explorer-panel">
                    
                    {/* Inner left Hospital tabs */}
                    <div className="col-span-1 bg-white border border-slate-200 rounded-xl p-3 h-fit space-y-1">
                      <span className="block text-[9px] uppercase font-bold text-slate-400 px-3 py-1 mb-2">Hospital Adapters</span>
                      {Object.keys(retrievedRecords).map((hosp) => (
                        <button
                          key={hosp}
                          onClick={() => setSelectedHospitalTab(hosp)}
                          className={`w-full text-left p-2.5 rounded-lg text-xs font-semibold transition-colors ${
                            selectedHospitalTab === hosp ? "bg-teal-50 text-teal-700 border border-teal-100 animate-fade-in" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          {hosp}
                        </button>
                      ))}
                    </div>

                    {/* Inner right records viewer */}
                    <div className="col-span-1 md:col-span-3 bg-white border border-slate-200 rounded-xl p-6">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-5">
                        <Activity className="w-4 h-4 text-teal-600" />
                        <h4 className="font-display font-extrabold text-sm text-slate-900">{selectedHospitalTab} Adapter feed</h4>
                      </div>

                      {selectedHospitalTab && retrievedRecords[selectedHospitalTab] ? (
                        <div className="space-y-6">
                          {retrievedRecords[selectedHospitalTab].map((enc, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors bg-white">
                              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-slate-100 pb-2 mb-3 text-xs">
                                <div>
                                  <span className="font-bold text-slate-800">Encounter Date: {enc.date}</span>
                                  <span className="block text-slate-500 text-[10px] mt-0.5">Clinician: {enc.doctorName} &bull; {enc.department}</span>
                                </div>
                                <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold">
                                  {enc.visitType}
                                </span>
                              </div>

                              <div className="space-y-4 text-xs">
                                <div>
                                  <span className="block text-[9px] uppercase font-bold text-slate-400">Diagnoses</span>
                                  <span className="font-semibold text-slate-800 mt-1 block">
                                    {enc.diagnoses.join(", ")}
                                  </span>
                                </div>

                                {enc.medications.length > 0 && (
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Medications Prescribed</span>
                                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                                      {enc.medications.map((med, mIdx) => (
                                        <li key={mIdx}>
                                          <strong className="text-slate-800">{med.name}</strong> - {med.dosage} ({med.frequency}) for {med.duration}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {enc.laboratoryResults.length > 0 && (
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1.5">Laboratory Findings</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {enc.laboratoryResults.map((lab, lIdx) => (
                                        <div key={lIdx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex justify-between items-center">
                                          <div>
                                            <span className="block font-medium text-slate-800">{lab.test}</span>
                                            <span className="text-[9px] text-slate-400">Ref: {lab.range}</span>
                                          </div>
                                          <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded">
                                            {lab.result} <span className="text-[9px] text-slate-500 font-normal">{lab.unit}</span>
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {enc.scans.length > 0 && (
                                  <div>
                                    <span className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Diagnostic Imaging / Scans</span>
                                    {enc.scans.map((scan, sIdx) => (
                                      <div key={sIdx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1">
                                        <span className="block font-semibold text-slate-800">{scan.type}</span>
                                        <p className="text-slate-600 leading-relaxed italic">"{scan.findings}"</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="pt-2 border-t border-slate-100">
                                  <span className="block text-[9px] uppercase font-bold text-slate-400">Encounter Summary</span>
                                  <p className="text-slate-600 leading-relaxed mt-1 italic">"{enc.summary}"</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          No hospital adapters selected or matching records found.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Back button to search */}
                <div className="flex justify-start">
                  <button
                    onClick={() => {
                      setChartLoaded(false);
                      setPatientInfo(null);
                      setAiBrief("");
                      setChatMessages([]);
                    }}
                    className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Close Chart & Return to Search
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 mt-8">
        <span>National Health Interoperability Node Connected securely</span>
      </footer>
    </div>
  );
}
