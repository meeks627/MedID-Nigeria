import React, { useState, useEffect } from "react";
import { 
  Shield, Building2, UserPlus, Users, Key, FileText, 
  BarChart3, RefreshCw, AlertCircle, CheckCircle2, 
  ArrowLeft, EyeOff, Check, Ban, Activity, Landmark,
  Loader2, Globe, Mail, Phone, MapPin, User, BookOpen,
  ExternalLink, ClipboardList
} from "lucide-react";
import { Doctor, PatientProfile, AccessLog, HospitalProfile } from "../types";

interface AdminPortalProps {
  onBack: () => void;
}

const VERIFICATION_STEPS = [
  "Verifying Hospital Registration Number...",
  "Checking Ministry of Health records...",
  "Creating Hospital Profile...",
  "Generating MedID Hospital ID...",
  "Creating Administrator Account...",
];

type ViewState = "LOGIN" | "REGISTER" | "VERIFYING" | "SUCCESS" | "DASHBOARD";

export default function AdminPortal({ onBack }: AdminPortalProps) {
  // Top-level view state
  const [view, setView] = useState<ViewState>("LOGIN");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login state
  const [hospitalId, setHospitalId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration form state
  const [reg, setReg] = useState({
    hospitalName: "",
    hospitalType: "Public",
    registrationNumber: "",
    email: "",
    phone: "",
    website: "",
    country: "Nigeria",
    state: "",
    city: "",
    address: "",
    adminName: "",
    adminPosition: "",
    adminEmail: "",
    adminPhone: "",
    adminNIN: "",
    password: "",
    confirmPassword: "",
    ehrSystem: "None",
    customEHR: "",
  });
  const [isCustomHospitalType, setIsCustomHospitalType] = useState(false);
  const [isCustomEHR, setIsCustomEHR] = useState(false);

  // Verification state
  const [verificationStep, setVerificationStep] = useState(0);
  const [regResult, setRegResult] = useState<{ hospitalId: string; hospitalName: string; emergencyCode: string } | null>(null);
  const [localHospitals, setLocalHospitals] = useState<{ id: string; name: string; address: string; emergencyOverrideCode: string; codeGeneratedAt: string; password: string }[]>([]);

  // Dashboard state
  const [hospital, setHospital] = useState<HospitalProfile | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [visitedPatients, setVisitedPatients] = useState<PatientProfile[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [activeTab, setActiveTab] = useState<"DOCTORS" | "PATIENTS" | "EMERGENCY" | "LOGS" | "STATS">("DOCTORS");

  // Registration states for Doctor (dashboard)
  const [newDocName, setNewDocName] = useState("");
  const [newDocEmail, setNewDocEmail] = useState("");
  const [newDocPhone, setNewDocPhone] = useState("");
  const [newDocLicense, setNewDocLicense] = useState("");
  const [newDocDept, setNewDocDept] = useState("General Practice");
  const [isCustomDept, setIsCustomDept] = useState(false);

  const updateReg = (field: string, value: string) => setReg(prev => ({ ...prev, [field]: value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!hospitalId || !loginPassword) {
      setError("Please enter your Hospital ID and password.");
      return;
    }

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId, password: loginPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setHospital(data.hospital);
        setView("DASHBOARD");
        fetchResources(hospitalId);
        return;
      }
    } catch (err) {
      // Server unavailable, fall through to local check
    }

    // Fallback: check locally registered hospitals
    const localMatch = localHospitals.find(h => h.id === hospitalId && h.password === loginPassword);
    if (localMatch) {
      setHospital({
        id: localMatch.id,
        name: localMatch.name,
        address: localMatch.address,
        emergencyOverrideCode: localMatch.emergencyOverrideCode,
        codeGeneratedAt: localMatch.codeGeneratedAt,
      });
      setView("DASHBOARD");
      fetchResources(hospitalId);
      return;
    }

    setError("Authentication failed. Check your Hospital ID and password.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reg.hospitalName || !reg.registrationNumber || !reg.adminName || !reg.adminEmail || !reg.password) {
      setError("Please complete all required fields.");
      return;
    }
    if (reg.password !== reg.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setView("VERIFYING");
    setVerificationStep(0);
    setRegResult(null);

    for (let i = 0; i < VERIFICATION_STEPS.length; i++) {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      setVerificationStep(i + 1);
    }

    // Generate Hospital ID locally (HSP000001, HSP000002, ...)
    const nextId = localHospitals.length + 1;
    const idStr = String(nextId).padStart(6, "0");
    const hospitalId = `HSP${idStr}`;
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const emergencyCode = `MDEM-${randomDigits}`;

    const newHospital = {
      id: hospitalId,
      name: reg.hospitalName,
      address: `${reg.address || ""}, ${reg.city || ""}, ${reg.state || ""}, ${reg.country || "Nigeria"}`,
      emergencyOverrideCode: emergencyCode,
      codeGeneratedAt: new Date().toISOString(),
      password: reg.password,
    };

    setLocalHospitals(prev => [...prev, newHospital]);

    // Fire-and-forget to server for persistence
    fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hospitalName: reg.hospitalName,
        hospitalType: reg.hospitalType,
        registrationNumber: reg.registrationNumber,
        email: reg.email,
        phone: reg.phone,
        website: reg.website,
        country: reg.country,
        state: reg.state,
        city: reg.city,
        address: reg.address,
        adminName: reg.adminName,
        adminPosition: reg.adminPosition,
        adminEmail: reg.adminEmail,
        adminPhone: reg.adminPhone,
        adminNIN: reg.adminNIN,
        password: reg.password,
        ehrSystem: reg.ehrSystem,
        customEHR: reg.customEHR,
      }),
    }).catch(() => {});

    setRegResult({ hospitalId, hospitalName: reg.hospitalName, emergencyCode });
    setView("SUCCESS");
  };

  const fetchResources = async (id: string) => {
    try {
      // Fetch Doctors
      const resDocs = await fetch(`/api/admin/${id}/doctors`);
      const dataDocs = await resDocs.json();
      setDoctors(dataDocs);

      // Fetch Visited Patients
      const resPats = await fetch(`/api/admin/${id}/patients`);
      const dataPats = await resPats.json();
      setVisitedPatients(dataPats);

      // Fetch Audit Logs
      const resLogs = await fetch(`/api/admin/${id}/logs`);
      const dataLogs = await resLogs.json();
      setAccessLogs(dataLogs);
    } catch (err) {
      console.error("Failed to sync resources:", err);
    }
  };

  const handleRegisterDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newDocName || !newDocEmail || !newDocLicense) {
      setError("Please complete all required doctor credentials.");
      return;
    }

    try {
      const response = await fetch(`/api/admin/${hospitalId}/doctors/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocName,
          email: newDocEmail,
          phone: newDocPhone,
          licenseNumber: newDocLicense,
          department: newDocDept,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to register clinician.");
        return;
      }

      setSuccess(`Doctor ${newDocName} registered successfully in MedID national index.`);
      setDoctors([...doctors, data.doctor]);
      
      // Clear Inputs
      setNewDocName("");
      setNewDocEmail("");
      setNewDocPhone("");
      setNewDocLicense("");
      setNewDocDept("General Practice");
      setIsCustomDept(false);
    } catch (err) {
      setError("Failed to register clinician.");
    }
  };

  const handleToggleDoctor = async (doctorId: string) => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/admin/doctors/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Toggle failed.");
        return;
      }

      setDoctors(doctors.map((d) => (d.id === doctorId ? { ...d, enabled: data.enabled } : d)));
      setSuccess(`Clinician account status toggled. Verification is synchronized.`);
    } catch (err) {
      setError("Failed to process action.");
    }
  };

  const handleRotateEmergencyCode = async () => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/admin/${hospitalId}/emergency-code/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Rotation failed.");
        return;
      }

      if (hospital) {
        setHospital({
          ...hospital,
          emergencyOverrideCode: data.emergencyOverrideCode,
          codeGeneratedAt: data.codeGeneratedAt,
        });
      }
      setSuccess("Emergency Override credentials successfully rotated. Highly secure 14-day cycle refreshed.");
    } catch (err) {
      setError("Failed to rotate code.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between" id="admin-portal-root">
      
      {/* Header Banner */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              onClick={view === "DASHBOARD" ? () => setView("LOGIN") : onBack}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-teal-600 text-white p-2 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                MedID <span className="text-teal-600">Hospital Admin Portal</span>
              </span>
            </div>
          </div>
          {view === "DASHBOARD" && hospital && (
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <span className="block text-[10px] font-mono font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                  {hospital.id} Domain
                </span>
              </div>
              <button
                onClick={() => setView("LOGIN")}
                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Exit Domain
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1 w-full flex flex-col justify-center">
        
        {/* Errors & Success Messages */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start space-x-3 max-w-lg mx-auto w-full mb-6 animate-fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start space-x-3 max-w-lg mx-auto w-full mb-6 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* AUTH FLOW: LOGIN, REGISTER, VERIFYING, SUCCESS */}
        {view !== "DASHBOARD" && (
          <>
            {/* LOGIN VIEW */}
            {view === "LOGIN" && (
              <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center mb-8">
                  <div className="bg-teal-600 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-900">Hospital Administrator Login</h2>
                  <p className="text-sm text-slate-500 mt-1">Access the MedID National Hospital Network.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5" id="admin-login-form">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Hospital ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LUTH, HSP000001"
                      value={hospitalId}
                      onChange={(e) => setHospitalId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Enter your MedID Hospital ID or short code.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter administrator password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    id="admin-login-submit"
                    className="w-full bg-teal-600 text-white font-medium text-sm py-3 px-4 rounded-xl hover:bg-teal-700 transition-colors shadow-sm focus:outline-none"
                  >
                    Sign In
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                  <p className="text-xs text-slate-500 mb-3">Don't have a MedID Hospital Account?</p>
                  <button
                    onClick={() => { setView("REGISTER"); setError(""); }}
                    className="text-sm font-bold text-teal-600 hover:text-teal-800 hover:underline transition-colors"
                  >
                    Register Hospital
                  </button>
                </div>
              </div>
            )}

            {/* REGISTER VIEW */}
            {view === "REGISTER" && (
              <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center mb-6">
                  <h2 className="font-display text-2xl font-bold text-slate-900">Hospital Registration</h2>
                  <p className="text-sm text-slate-500 mt-1">Register your hospital to join the MedID National Healthcare Network.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                  {/* HOSPITAL DETAILS */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-4">
                      <Building2 className="w-4 h-4 text-teal-600" />
                      <span>Hospital Details</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hospital Name *</label>
                        <input type="text" required placeholder="e.g. Lagos University Teaching Hospital" value={reg.hospitalName} onChange={(e) => updateReg("hospitalName", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hospital Type *</label>
                        <select value={isCustomHospitalType ? "Other" : reg.hospitalType} onChange={(e) => { if (e.target.value === "Other") { setIsCustomHospitalType(true); updateReg("hospitalType", "Other"); } else { setIsCustomHospitalType(false); updateReg("hospitalType", e.target.value); } }} className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm focus:outline-none focus:border-teal-500 bg-white">
                          <option value="Public">Public</option>
                          <option value="Private">Private</option>
                          <option value="Teaching Hospital">Teaching Hospital</option>
                          <option value="Specialist Hospital">Specialist Hospital</option>
                          <option value="Primary Health Centre">Primary Health Centre</option>
                          <option value="Diagnostic Centre">Diagnostic Centre</option>
                          <option value="Other">Other</option>
                        </select>
                        {isCustomHospitalType && (
                          <input type="text" placeholder="Specify hospital type" value={reg.hospitalType === "Other" ? "" : reg.hospitalType} onChange={(e) => updateReg("hospitalType", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500 bg-white mt-2" />
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hospital Registration / License Number *</label>
                        <input type="text" required placeholder="e.g. LAG-HSP-001245" value={reg.registrationNumber} onChange={(e) => updateReg("registrationNumber", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                        <p className="text-[10px] text-slate-400 mt-1">This is the hospital's unique identifier before joining MedID.</p>
                      </div>
                    </div>
                  </div>

                  {/* HOSPITAL CONTACT */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-4">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      <span>Hospital Contact</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Official Email *</label>
                        <input type="email" required placeholder="admin@hospital.gov" value={reg.email} onChange={(e) => updateReg("email", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Official Phone Number *</label>
                        <input type="tel" required placeholder="+234-800-..." value={reg.phone} onChange={(e) => updateReg("phone", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Website</label>
                        <input type="url" placeholder="https://hospital.ng" value={reg.website} onChange={(e) => updateReg("website", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Country</label>
                        <select value={reg.country} onChange={(e) => updateReg("country", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm focus:outline-none focus:border-teal-500 bg-white">
                          <option value="Nigeria">Nigeria</option>
                          <option value="Ghana">Ghana</option>
                          <option value="Kenya">Kenya</option>
                          <option value="South Africa">South Africa</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">State *</label>
                        <input type="text" required placeholder="e.g. Lagos" value={reg.state} onChange={(e) => updateReg("state", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">City</label>
                        <input type="text" placeholder="e.g. Ikeja" value={reg.city} onChange={(e) => updateReg("city", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Address *</label>
                        <input type="text" required placeholder="Street, building, landmark" value={reg.address} onChange={(e) => updateReg("address", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                    </div>
                  </div>

                  {/* ADMIN INFO */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-4">
                      <User className="w-4 h-4 text-teal-600" />
                      <span>Administrator Information</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                        <input type="text" required placeholder="e.g. Dr. Adebayo Ogunlesi" value={reg.adminName} onChange={(e) => updateReg("adminName", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Position / Title</label>
                        <input type="text" placeholder="e.g. Chief Medical Director" value={reg.adminPosition} onChange={(e) => updateReg("adminPosition", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Official Email *</label>
                        <input type="email" required placeholder="admin@hospital.gov" value={reg.adminEmail} onChange={(e) => updateReg("adminEmail", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                        <input type="tel" placeholder="+234-..." value={reg.adminPhone} onChange={(e) => updateReg("adminPhone", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">National ID / NIN</label>
                        <input type="text" placeholder="11-digit NIN (simulated)" value={reg.adminNIN} onChange={(e) => updateReg("adminNIN", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                        <p className="text-[10px] text-slate-400 mt-1">National Identity Number for MVP simulation.</p>
                      </div>
                      <div></div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Password *</label>
                        <input type="password" required placeholder="Create admin password" value={reg.password} onChange={(e) => updateReg("password", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Confirm Password *</label>
                        <input type="password" required placeholder="Confirm password" value={reg.confirmPassword} onChange={(e) => updateReg("confirmPassword", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500" />
                      </div>
                    </div>
                  </div>

                  {/* EXISTING EHR */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2 mb-4">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      <span>Existing EHR System</span>
                    </h3>
                    <div>
                      <select value={isCustomEHR ? "Custom" : reg.ehrSystem} onChange={(e) => { if (e.target.value === "Custom") { setIsCustomEHR(true); updateReg("ehrSystem", "Custom"); } else { setIsCustomEHR(false); updateReg("ehrSystem", e.target.value); } }} className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm focus:outline-none focus:border-teal-500 bg-white">
                        <option value="Helium Health">Helium Health</option>
                        <option value="Interswitch eClinic">Interswitch eClinic</option>
                        <option value="OpenMRS">OpenMRS</option>
                        <option value="Bahmni">Bahmni</option>
                        <option value="Epic">Epic</option>
                        <option value="Cerner">Cerner</option>
                        <option value="Custom">Custom</option>
                        <option value="None">None</option>
                      </select>
                      {isCustomEHR && (
                        <input type="text" placeholder="Specify EHR system" value={reg.customEHR} onChange={(e) => updateReg("customEHR", e.target.value)} className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500 bg-white mt-2" />
                      )}
                    </div>
                  </div>

                  {/* SUBMIT */}
                  <div className="flex justify-between items-center pt-2">
                    <button type="button" onClick={() => { setView("LOGIN"); setError(""); }} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
                      Back to Login
                    </button>
                    <button type="submit" className="bg-teal-600 text-white font-bold text-sm py-3 px-6 rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
                      Register Hospital on MedID
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* VERIFYING VIEW */}
            {view === "VERIFYING" && (
              <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                  </div>
                </div>
                <h2 className="font-display text-xl font-bold text-slate-900 mb-6">Registering Hospital...</h2>
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  {VERIFICATION_STEPS.map((step, i) => (
                    <div key={i} className={`flex items-center space-x-3 p-2 rounded-lg transition-all ${i < verificationStep ? "text-emerald-700" : i === verificationStep ? "text-teal-700 bg-teal-50" : "text-slate-400"}`}>
                      {i < verificationStep ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : i === verificationStep ? (
                        <Loader2 className="w-5 h-5 text-teal-600 animate-spin shrink-0" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0" />
                      )}
                      <span className="text-sm font-medium">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUCCESS VIEW */}
            {view === "SUCCESS" && regResult && (
              <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-slate-900">Hospital Successfully Connected to MedID</h2>
                  <p className="text-sm text-slate-500 mt-1">Your hospital is now part of the National Healthcare Network.</p>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 text-center space-y-4">
                  <div>
                    <span className="block text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">Your MedID Hospital ID</span>
                    <span className="block text-3xl font-mono font-extrabold tracking-wider text-teal-400 mt-1">
                      {regResult.hospitalId}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-4">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase">Emergency Override Code</span>
                    <span className="block text-lg font-mono font-bold text-amber-400 mt-1">
                      {regResult.emergencyCode}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-2">In production, this code rotates automatically every 14 days. You can regenerate it from Settings.</p>
                  </div>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-teal-800 mb-6">
                  <p className="font-medium">Use <strong>{regResult.hospitalId}</strong> together with your password to sign in.</p>
                  <p className="text-xs mt-2">A confirmation email has been simulated.</p>
                </div>

                <button
                  onClick={() => {
                    setHospitalId(regResult.hospitalId);
                    setLoginPassword("");
                    setError("");
                    setView("LOGIN");
                  }}
                  className="w-full bg-teal-600 text-white font-bold text-sm py-3 px-4 rounded-xl hover:bg-teal-700 transition-colors shadow-sm"
                >
                  Continue to Login
                </button>
              </div>
            )}
          </>
        )}

        {/* DASHBOARD WORKSPACE */}
        {view === "DASHBOARD" && hospital && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Controls */}
            <div className="col-span-1 bg-white border border-slate-200 rounded-2xl p-4 h-fit space-y-1.5 shadow-sm">
              <div className="p-3 bg-teal-50 rounded-xl mb-4 border border-teal-100">
                <span className="block text-[10px] font-bold tracking-wider text-teal-800 uppercase font-mono">Institutional Admin</span>
                <span className="block text-slate-900 font-bold font-display text-sm truncate mt-0.5">{hospital.name}</span>
                <span className="block text-[10px] text-slate-500 mt-1 leading-relaxed">Secure Node connected &bull; {hospital.address}</span>
              </div>

              <button
                onClick={() => setActiveTab("DOCTORS")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "DOCTORS" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Register Clinicians</span>
              </button>

              <button
                onClick={() => setActiveTab("PATIENTS")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "PATIENTS" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Visited Patients</span>
              </button>

              <button
                onClick={() => setActiveTab("EMERGENCY")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "EMERGENCY" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Emergency Override</span>
              </button>

              <button
                onClick={() => setActiveTab("LOGS")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "LOGS" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Access Logs</span>
              </button>

              <button
                onClick={() => setActiveTab("STATS")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "STATS" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Monthly Statistics</span>
              </button>
            </div>

            {/* Main Content Workspace */}
            <div className="col-span-1 lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              
              {/* DOCTORS TABS */}
              {activeTab === "DOCTORS" && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Manage Registered Clinicians</h2>
                    <p className="text-sm text-slate-500 mt-1">Register medical personnel on the MedID national directory or toggle credentials validation.</p>
                  </div>

                  {/* Add Doctor form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-950 mb-4 flex items-center space-x-2">
                      <UserPlus className="w-4 h-4 text-teal-600" />
                      <span>Register New Medical Practitioner</span>
                    </h3>
                    <form onSubmit={handleRegisterDoctor} className="grid grid-cols-1 md:grid-cols-2 gap-4" id="register-doctor-form">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Helen Shitta"
                          value={newDocName}
                          onChange={(e) => setNewDocName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Official Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="helen.shitta@lasuth.gov"
                          value={newDocEmail}
                          onChange={(e) => setNewDocEmail(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">License Number (Medical Council) *</label>
                        <input
                          type="text"
                          required
                          placeholder="MDN-2012-4112"
                          value={newDocLicense}
                          onChange={(e) => setNewDocLicense(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Department / Specialty *</label>
                        <select
                          value={isCustomDept ? "Other" : newDocDept}
                          onChange={(e) => {
                            if (e.target.value === "Other") {
                              setIsCustomDept(true);
                              setNewDocDept("Other");
                            } else {
                              setIsCustomDept(false);
                              setNewDocDept(e.target.value);
                            }
                          }}
                          className="w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm focus:outline-none focus:border-teal-500 bg-white"
                        >
                          <option value="General Practice">General Practice</option>
                          <option value="Internal Medicine">Internal Medicine</option>
                          <option value="Pulmonology">Pulmonology</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="General Surgery">General Surgery</option>
                          <option value="Emergency Medicine">Emergency Medicine</option>
                          <option value="Other">Other</option>
                        </select>
                        {isCustomDept && (
                          <input
                            type="text"
                            placeholder="Specify Specialty (e.g. Sports Medicine, Clinical Informatics)"
                            value={newDocDept === "Other" ? "" : newDocDept}
                            onChange={(e) => setNewDocDept(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500 bg-white mt-2"
                          />
                        )}
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                        <input
                          type="tel"
                          placeholder="+234-805-..."
                          value={newDocPhone}
                          onChange={(e) => setNewDocPhone(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 flex justify-end pt-2">
                        <button
                          type="submit"
                          id="register-doctor-submit"
                          className="bg-teal-600 text-white font-bold text-xs py-2 px-5 rounded-lg hover:bg-teal-700 transition-colors shadow"
                        >
                          Verify & Register Practitioner
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Doctors List */}
                  <div className="space-y-4">
                    <h3 className="font-display font-bold text-slate-900 text-sm">Active Clinician Registry</h3>
                    {doctors.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm border border-slate-200 rounded-xl">
                        No doctors currently registered on this hospital domain.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {doctors.map((doc) => (
                          <div key={doc.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-start hover:bg-slate-50 transition-colors bg-white">
                            <div>
                              <span className="font-bold text-slate-950 font-display text-sm">{doc.name}</span>
                              <span className="block text-xs text-slate-500 mt-1">{doc.department}</span>
                              <span className="block text-[10px] font-mono text-teal-700 mt-1 font-bold">Lic: {doc.licenseNumber}</span>
                              <span className="block text-[10px] text-slate-400 mt-0.5">{doc.email}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleToggleDoctor(doc.id)}
                              className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border flex items-center space-x-1 transition-all ${
                                doc.enabled 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200" 
                                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                              }`}
                            >
                              {doc.enabled ? (
                                <>
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3.5 h-3.5 shrink-0" />
                                  <span>Disabled</span>
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VISITED PATIENTS TAB */}
              {activeTab === "PATIENTS" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Visited Patient Directory</h2>
                    <p className="text-sm text-slate-500 mt-1">Patients whose identity registry lists encounters or visits to this health center.</p>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    {visitedPatients.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-sm">
                        No patient directories are currently associated with this hospital node.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {visitedPatients.map((pat) => (
                          <div key={pat.medID} className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 bg-white">
                            <div>
                              <span className="font-bold text-slate-900 text-sm">{pat.name}</span>
                              <span className="block text-xs font-mono font-bold text-teal-700 mt-1">{pat.medID}</span>
                              <span className="block text-xs text-slate-500 mt-0.5">DOB: {pat.dob} | Gender: {pat.gender}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 font-mono">
                              <Landmark className="w-4 h-4 text-teal-600" />
                              <span>Interoperability Linked</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EMERGENCY OVERRIDE MANAGEMENT */}
              {activeTab === "EMERGENCY" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Emergency Override Key Control</h2>
                    <p className="text-sm text-slate-500 mt-1">Hospitals own emergency credentials used to pull records in extreme crisis scenarios. This key should be rotated every 14 days for institutional safety compliance.</p>
                  </div>

                  <div className="border-t border-slate-100 pt-6 max-w-lg mx-auto">
                    <div className="bg-slate-900 border border-slate-200 rounded-2xl p-6 text-white text-center space-y-6 relative overflow-hidden">
                      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-5">
                        <Key className="w-48 h-48" />
                      </div>

                      <div>
                        <span className="block text-[10px] font-mono text-teal-400 font-bold uppercase tracking-widest">Active Hospital Override Code</span>
                        <div className="text-3xl font-mono font-extrabold tracking-wider text-teal-400 mt-2">
                          {hospital.emergencyOverrideCode}
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-slate-400">
                        <span>Generated: {new Date(hospital.codeGeneratedAt).toLocaleDateString()}</span>
                        <span className="bg-teal-950 text-teal-400 px-2.5 py-1 rounded font-bold uppercase text-[9px] tracking-wider border border-teal-800">
                          Valid (Rotate Recommended in 14 days)
                        </span>
                      </div>
                    </div>

                    <div className="mt-8 text-center">
                      <button
                        type="button"
                        onClick={handleRotateEmergencyCode}
                        id="rotate-override-code-btn"
                        className="bg-teal-600 text-white font-bold text-sm py-2.5 px-6 rounded-xl hover:bg-teal-700 transition-colors shadow-md inline-flex items-center space-x-2 focus:outline-none"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Rotate Emergency Override Code</span>
                      </button>
                      <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                        Refreshes security vectors instantly. Doctors in the critical ER bay must immediately use the new rotated credentials to bypass regular patient approval routines.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCESS LOGS (NO DIAGNOSIS/CLINICAL INFO) */}
              {activeTab === "LOGS" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Platform Access Metadata Logs</h2>
                    <p className="text-sm text-slate-500 mt-1">Audits record requests within this hospital node. In strict alignment with privacy directives, actual clinical details, medical chats, and diagnoses are NEVER stored or audited here.</p>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    {accessLogs.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 border border-slate-100 rounded-xl">
                        No accesses logged for this domain.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {accessLogs.map((log) => (
                          <div key={log.id} className="border border-slate-200 rounded-xl p-4 text-xs hover:bg-slate-50 transition-colors bg-white">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                              <span className="font-mono font-bold text-teal-700 uppercase">{log.id}</span>
                              <span className="text-slate-500">{log.date} &bull; {log.time}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 leading-relaxed text-slate-600">
                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Doctor</span>
                                <span className="font-semibold text-slate-800">{log.doctor}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Patient MedID</span>
                                <span className="font-mono font-semibold text-slate-800">{log.patientMedID}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Access Type</span>
                                <span className="font-semibold text-slate-800">{log.accessType}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">Duration & Status</span>
                                <span className="font-semibold text-slate-800">{log.duration} ({log.status})</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MONTHLY STATISTICS */}
              {activeTab === "STATS" && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Platform Analytics</h2>
                    <p className="text-sm text-slate-500 mt-1">Interoperability and access utilization trends on the MedID network.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-100 pt-6">
                    <div className="bg-[#F8FAFC] border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Interoperable Exchanges</span>
                      <span className="block text-3xl font-display font-extrabold text-teal-950 mt-1">
                        {accessLogs.length + 8}
                      </span>
                      <span className="block text-[10px] text-emerald-600 font-bold mt-2 flex items-center space-x-1">
                        <Activity className="w-3 h-3 animate-pulse" />
                        <span>+12.4% vs last month</span>
                      </span>
                    </div>

                    <div className="bg-[#F8FAFC] border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Registered Doctors</span>
                      <span className="block text-3xl font-display font-extrabold text-teal-950 mt-1">
                        {doctors.length}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-2">Verified licenses Active</span>
                    </div>

                    <div className="bg-[#F8FAFC] border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Emergency Overrides</span>
                      <span className="block text-3xl font-display font-extrabold text-teal-950 mt-1">
                        {accessLogs.filter((l) => l.accessType === "Emergency Access").length}
                      </span>
                      <span className="block text-[10px] text-rose-600 font-bold mt-2">Compliance verified</span>
                    </div>
                  </div>

                  {/* SVG Chart render */}
                  <div className="border border-slate-200 rounded-2xl p-6 bg-[#F8FAFC]">
                    <h3 className="font-display font-bold text-slate-900 text-sm mb-4">Weekly Access Patterns (Consultations vs Emergency Overrides)</h3>
                    <div className="h-48 w-full flex items-end justify-between px-4 pt-4 border-b border-l border-slate-200 bg-white rounded-lg">
                      {/* Simulated bar chart */}
                      <div className="w-1/6 flex flex-col items-center">
                        <div className="w-8 bg-teal-150 rounded-t-md h-12 relative group hover:bg-teal-200 transition-colors">
                          <div className="w-8 bg-rose-300 rounded-t-md h-4 absolute bottom-0"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2">Week 1</span>
                      </div>

                      <div className="w-1/6 flex flex-col items-center">
                        <div className="w-8 bg-teal-150 rounded-t-md h-20 relative group hover:bg-teal-200 transition-colors">
                          <div className="w-8 bg-rose-300 rounded-t-md h-6 absolute bottom-0"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2">Week 2</span>
                      </div>

                      <div className="w-1/6 flex flex-col items-center">
                        <div className="w-8 bg-teal-150 rounded-t-md h-16 relative group hover:bg-teal-200 transition-colors">
                          <div className="w-8 bg-rose-300 rounded-t-md h-8 absolute bottom-0"></div>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2">Week 3</span>
                      </div>

                      <div className="w-1/6 flex flex-col items-center">
                        <div className="w-8 bg-teal-600 rounded-t-md h-32 relative group hover:bg-teal-700 transition-colors">
                          <div className="w-8 bg-rose-500 rounded-t-md h-12 absolute bottom-0 animate-pulse"></div>
                        </div>
                        <span className="text-[10px] text-slate-800 font-bold mt-2">Week 4 (Current)</span>
                      </div>
                    </div>

                    <div className="flex space-x-6 justify-center mt-6 text-xs text-slate-500 font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-teal-600 rounded-sm"></div>
                        <span>Routine Consultation Exchanges</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-rose-500 rounded-sm"></div>
                        <span>Emergency Override Bypasses</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500 mt-8">
        <span>Helium Health Institutional Administrator Domain Connection</span>
      </footer>
    </div>
  );
}
