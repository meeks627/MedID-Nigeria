import React, { useState } from "react";
import { 
  Shield, User, Lock, Phone, Mail, MapPin, 
  Fingerprint, CreditCard, RefreshCw, AlertCircle, 
  History, Settings, HelpCircle, LogOut, CheckCircle2, 
  ArrowLeft, Search 
} from "lucide-react";
import { PatientProfile, AccessLog } from "../types";

interface PatientPortalProps {
  onBack: () => void;
}

export default function PatientPortal({ onBack }: PatientPortalProps) {
  // Authentication & Register View States
  const [viewMode, setViewMode] = useState<"LOGIN" | "REGISTER" | "RECOVER" | "DASHBOARD">("LOGIN");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Registration Form States
  const [regName, setRegName] = useState("");
  const [regDob, setRegDob] = useState("");
  const [regGender, setRegGender] = useState("Female");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regAddress, setRegAddress] = useState("");
  const [regNin, setRegNin] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regEmergencyName, setRegEmergencyName] = useState("");
  const [regEmergencyRel, setRegEmergencyRel] = useState("");
  const [regEmergencyPhone, setRegEmergencyPhone] = useState("");
  
  // Login States
  const [loginMedID, setLoginMedID] = useState("");
  const [loginPin, setLoginPin] = useState("");
  
  // Recover States
  const [recoverNin, setRecoverNin] = useState("");
  const [simulatedOtp, setSimulatedOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [recoveredMedID, setRecoveredMedID] = useState("");
  
  // Active Logged In Session States
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [accessHistory, setAccessHistory] = useState<AccessLog[]>([]);
  const [activeTab, setActiveTab] = useState<"CARD" | "PROFILE" | "HISTORY" | "SETTINGS" | "SUPPORT">("CARD");
  
  // Simulation logs for SMS/Email
  const [simulatedNotification, setSimulatedNotification] = useState<string | null>(null);

  // Settings states
  const [newPin, setNewPin] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!loginMedID || !loginPin) {
      setError("Please enter your MedID and PIN.");
      return;
    }
    try {
      const response = await fetch("/api/patient/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medID: loginMedID.trim().toUpperCase(), pin: loginPin }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      setPatient(data.patient);
      setAccessHistory(data.accessHistory);
      setViewMode("DASHBOARD");
    } catch (err) {
      setError("Failed to connect to the authentication server.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSimulatedNotification(null);

    if (!regNin) {
      setError("NIN (National Identification Number) is strictly mandatory. Registration cannot proceed without a valid NIN.");
      return;
    }
    if (!regName || !regDob || !regPhone || !regEmail || !regAddress || !regPin) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      const response = await fetch("/api/patient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          dob: regDob,
          gender: regGender,
          phone: regPhone,
          email: regEmail,
          address: regAddress,
          nin: regNin,
          pin: regPin,
          emergencyContact: {
            name: regEmergencyName,
            relationship: regEmergencyRel,
            phone: regEmergencyPhone,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setSuccessMsg(`Registration complete! Your secure National MedID is ${data.medID}`);
      setLoginMedID(data.medID);
      setLoginPin(regPin);
      
      // Keep simulation logs to display
      if (data.notifications) {
        setSimulatedNotification(
          `${data.notifications.email}\n\n${data.notifications.sms}`
        );
      }
      
      // Clear forms
      setRegName(""); setRegDob(""); setRegPhone(""); setRegEmail(""); 
      setRegAddress(""); setRegNin(""); setRegPin(""); 
      setRegEmergencyName(""); setRegEmergencyRel(""); setRegEmergencyPhone("");
      setViewMode("LOGIN");
    } catch (err) {
      setError("Error connecting to the registration server.");
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!recoverNin) {
      setError("Please input your NIN.");
      return;
    }
    try {
      const response = await fetch("/api/patient/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin: recoverNin.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Recovery failed.");
        return;
      }
      setSimulatedOtp(data.otpCode);
      setRecoveredMedID(data.medID);
      setOtpSent(true);
      setSimulatedNotification(data.otpSimulatedNotification);
    } catch (err) {
      setError("Failed to reach server.");
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (enteredOtp !== simulatedOtp) {
      setError("Invalid security OTP code. Please check the simulated SMS broadcast.");
      return;
    }
    setSuccessMsg(`Identity verified! Recovered MedID: ${recoveredMedID}`);
    setLoginMedID(recoveredMedID);
    setViewMode("LOGIN");
    setOtpSent(false);
    setRecoverNin("");
    setEnteredOtp("");
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    
    const updatedPatient = { ...patient };
    if (newPin) {
      updatedPatient.pin = newPin;
      setNewPin("");
    }
    if (newAddress) {
      updatedPatient.address = newAddress;
      setNewAddress("");
    }
    setPatient(updatedPatient);
    setSuccessMsg("Profile and settings updated successfully in system directory.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between" id="patient-portal-root">
      {/* Platform Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              onClick={patient ? () => { setPatient(null); setViewMode("LOGIN"); } : onBack}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-teal-600 text-white p-2 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900">
                MedID <span className="text-teal-600">Patient Workspace</span>
              </span>
            </div>
          </div>
          {patient && (
            <button
              onClick={() => {
                setPatient(null);
                setViewMode("LOGIN");
              }}
              className="flex items-center space-x-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-1 w-full flex flex-col justify-center">
        
        {/* Alerts Block */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl flex items-start space-x-3 max-w-lg mx-auto w-full mb-6 animate-fade-in">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="bg-teal-50 border border-teal-200 text-teal-850 p-4 rounded-xl flex items-start space-x-3 max-w-lg mx-auto w-full mb-6 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{successMsg}</p>
          </div>
        )}

        {/* SMS/Email Broadcast Log Simulation */}
        {simulatedNotification && (
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl max-w-lg mx-auto w-full mb-6 font-mono text-xs shadow-lg border border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <span>System SMS/Email Gateway Broadcast Log</span>
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            </div>
            <p className="whitespace-pre-line leading-relaxed">{simulatedNotification}</p>
            <button 
              onClick={() => setSimulatedNotification(null)}
              className="mt-3 text-[10px] text-teal-400 font-bold hover:underline"
            >
              Close System Log
            </button>
          </div>
        )}

        {/* AUTH WORKFLOW */}
        {viewMode === "LOGIN" && (
          <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-slate-900">Sign In to MedID</h2>
              <p className="text-sm text-slate-500 mt-1">Access your credentials, QR code, and audit trail</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" id="patient-login-form">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">My MedID</label>
                <div className="relative">
                  <CreditCard className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="MD38281726"
                    value={loginMedID}
                    onChange={(e) => setLoginMedID(e.target.value)}
                    className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Access PIN</label>
                  <button 
                    type="button" 
                    onClick={() => setViewMode("RECOVER")}
                    className="text-xs font-bold text-teal-600 hover:underline"
                  >
                    Forgot PIN / MedID?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="4-digit PIN"
                    maxLength={6}
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    className="pl-10 w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="patient-login-submit"
                className="w-full bg-teal-600 text-white font-medium text-sm py-3 px-4 rounded-xl hover:bg-teal-700 transition-colors shadow-sm focus:outline-none"
              >
                Sign In
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
              New to MedID?{" "}
              <button 
                onClick={() => setViewMode("REGISTER")}
                id="patient-go-register"
                className="font-bold text-teal-600 hover:underline"
              >
                Register with your NIN
              </button>
            </div>
          </div>
        )}

        {viewMode === "REGISTER" && (
          <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="font-display text-2xl font-bold text-slate-900">National MedID Registration</h2>
              <p className="text-sm text-slate-500 mt-1">Identity validation is strictly integrated with the National Identification Number (NIN).</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6" id="patient-registration-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Critical Identity Validation */}
                <div className="col-span-1 md:col-span-2 bg-teal-50 border border-teal-100 p-4 rounded-xl flex items-start space-x-3">
                  <Fingerprint className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800">NIMC Database Synchronization</h4>
                    <p className="text-xs text-teal-600 mt-1 leading-relaxed">
                      A valid National Identification Number (NIN) is required by health directives. MedID will pull biometric verification vectors from federal databases.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">National Identity Number (NIN) *</label>
                  <input
                    type="text"
                    required
                    placeholder="11-digit NIN"
                    maxLength={11}
                    value={regNin}
                    onChange={(e) => setRegNin(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-teal-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Create Access PIN *</label>
                  <input
                    type="password"
                    required
                    placeholder="4-digit PIN"
                    maxLength={4}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name (As on NIN) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Johnson"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gender *</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+234-803..."
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Residential Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Current primary home address"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-3">Emergency Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Contact Full Name"
                        value={regEmergencyName}
                        onChange={(e) => setRegEmergencyName(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Relationship (e.g. Spouse)"
                        value={regEmergencyRel}
                        onChange={(e) => setRegEmergencyRel(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Contact Phone Number"
                        value={regEmergencyPhone}
                        onChange={(e) => setRegEmergencyPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setViewMode("LOGIN")}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="patient-register-submit"
                  className="bg-teal-600 text-white font-bold text-sm py-2.5 px-6 rounded-xl hover:bg-teal-700 transition-colors shadow-sm focus:outline-none"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === "RECOVER" && (
          <div className="max-w-md mx-auto w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-slate-900">Recover Medical ID</h2>
              <p className="text-sm text-slate-500 mt-1">Verify your identity using your mandatory NIN</p>
            </div>

            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">National Identity Number (NIN)</label>
                  <input
                    type="text"
                    required
                    maxLength={11}
                    placeholder="Enter 11-digit NIN"
                    value={recoverNin}
                    onChange={(e) => setRecoverNin(e.target.value.replace(/\D/g, ""))}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white font-bold text-sm py-2.5 px-4 rounded-xl hover:bg-teal-700 transition-colors shadow-sm focus:outline-none"
                >
                  Send OTP Verification Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Enter OTP verification code</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit OTP code"
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none text-center font-mono tracking-widest text-lg"
                  />
                  <span className="block text-xs text-slate-500 text-center mt-2">
                    Check the system log window above for the simulated OTP.
                  </span>
                </div>
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white font-bold text-sm py-2.5 px-4 rounded-xl hover:bg-teal-700 transition-colors shadow-sm focus:outline-none"
                >
                  Confirm OTP & Retrieve MedID
                </button>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
              <button 
                type="button"
                onClick={() => { setViewMode("LOGIN"); setOtpSent(false); }}
                className="font-bold text-teal-600 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* LOGGED IN DASHBOARD WORKSPACE */}
        {/* LOGGED IN DASHBOARD WORKSPACE */}
        {viewMode === "DASHBOARD" && patient && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Sidebar Controls */}
            <div className="col-span-1 bg-white border border-slate-200 rounded-2xl p-4 h-fit space-y-2 shadow-sm">
              <div className="p-3 bg-teal-50 rounded-xl mb-4 border border-teal-100">
                <span className="block text-[10px] font-bold tracking-wider text-teal-850 uppercase font-mono">Patient Verified</span>
                <span className="block text-slate-900 font-bold font-display text-base truncate mt-0.5">{patient.name}</span>
                <span className="block text-[11px] font-mono text-slate-500 mt-1">{patient.medID}</span>
              </div>

              <button
                onClick={() => setActiveTab("CARD")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "CARD" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>My MedID Card</span>
              </button>

              <button
                onClick={() => setActiveTab("PROFILE")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "PROFILE" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Demographic Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("HISTORY")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "HISTORY" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Record Access History</span>
              </button>

              <button
                onClick={() => setActiveTab("SETTINGS")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "SETTINGS" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => setActiveTab("SUPPORT")}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-semibold transition-colors ${
                  activeTab === "SUPPORT" ? "bg-teal-50 text-teal-700 border border-teal-100" : "text-slate-600 hover:bg-slate-50 border border-transparent"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Support</span>
              </button>
            </div>

            {/* Dashboard Content Workspace */}
            <div className="col-span-1 lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              
              {activeTab === "CARD" && (
                <div className="space-y-8 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">National Healthcare Identity Card</h2>
                    <p className="text-sm text-slate-500 mt-1">Present this secure identifier or QR code at participating hospitals for instant interoperable record access.</p>
                  </div>

                  {/* MedID Digital Identity Card Render */}
                  <div className="max-w-md mx-auto bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-850">
                    <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5">
                      <Fingerprint className="w-64 h-64 text-teal-500" />
                    </div>
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <Shield className="w-5 h-5 text-teal-400" />
                          <span className="font-display font-black text-sm tracking-widest uppercase">MEDID NIGERIA</span>
                        </div>
                        <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">National Health Exchange Portal</span>
                      </div>
                      <div className="bg-white/10 px-2 py-1 rounded text-[10px] font-mono tracking-widest uppercase text-teal-400 border border-white/5">
                        Active Verification
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</span>
                        <span className="text-lg font-display font-bold tracking-tight">{patient.name}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">National Medical ID</span>
                          <span className="font-mono text-sm font-bold tracking-wider text-teal-400">{patient.medID}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</span>
                          <span className="text-sm font-medium">{patient.dob}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 mt-6 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-400">
                      <span>NIN Linked: *******{patient.nin ? patient.nin.slice(-4) : "1234"}</span>
                      <span>Secure Token Layer v4</span>
                    </div>
                  </div>

                  {/* QR Code and Instructions */}
                  <div className="border-t border-slate-100 pt-8 max-w-md mx-auto text-center space-y-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl inline-block">
                      {/* CSS QR Code Simulation */}
                      <div className="w-40 h-40 bg-slate-900 p-2 rounded flex flex-wrap gap-1 mx-auto items-center justify-center relative shadow-sm">
                        <div className="absolute inset-2 bg-white flex items-center justify-center">
                          {/* Simulated high-quality QR grid */}
                          <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1 bg-white">
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-white"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-white"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black rounded-sm"></div>
                            <div className="bg-black rounded-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">Digital QR Token</span>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                        Clinicians can scan this token in emergency wards to securely verify your consent identity and request access tokens.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "PROFILE" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Demographic Profile</h2>
                    <p className="text-sm text-slate-500 mt-1">This information is synchronized with federal databases for identity reconciliation.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">Full Legal Name</span>
                      <span className="block font-medium text-slate-900 mt-1 text-sm">{patient.name}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">Date of Birth</span>
                      <span className="block font-medium text-slate-900 mt-1 text-sm">{patient.dob}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">Gender</span>
                      <span className="block font-medium text-slate-900 mt-1 text-sm">{patient.gender}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">National Identity Number (NIN)</span>
                      <span className="block font-mono font-bold text-teal-700 mt-1 text-sm">
                        Linked (*******{patient.nin ? patient.nin.slice(-4) : "1234"})
                      </span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">Primary Phone Number</span>
                      <span className="block font-medium text-slate-900 mt-1 text-sm">{patient.phone}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">Registered Email Address</span>
                      <span className="block font-medium text-slate-900 mt-1 text-sm">{patient.email}</span>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <span className="block text-xs font-bold uppercase text-slate-400 tracking-wider">Residential Address</span>
                      <span className="block font-medium text-slate-900 mt-1 text-sm">{patient.address}</span>
                    </div>
                  </div>

                  {/* Emergency Contact profile details */}
                  <div className="border-t border-slate-100 pt-6">
                    <h3 className="font-display font-bold text-slate-900 text-sm mb-4">Emergency Contact</h3>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</span>
                        <span className="block text-sm font-semibold text-slate-800 mt-0.5">{patient.emergencyContact?.name || "None Listed"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Relationship</span>
                        <span className="block text-sm font-semibold text-slate-800 mt-0.5">{patient.emergencyContact?.relationship || "None Listed"}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</span>
                        <span className="block text-sm font-semibold text-slate-800 mt-0.5">{patient.emergencyContact?.phone || "None Listed"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "HISTORY" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Record Access Audit Trail</h2>
                    <p className="text-sm text-slate-500 mt-1">To ensure absolute privacy, you can monitor exactly which doctors and hospitals have requested and viewed your medical charts.</p>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    {accessHistory.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                        <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <span className="block text-slate-500 text-sm">No record retrievals have been logged for your profile.</span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {accessHistory.map((log) => (
                          <div key={log.id} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors bg-white">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase border border-teal-100">
                                  {log.id}
                                </span>
                                <span className="text-xs text-slate-500">{log.date} at {log.time}</span>
                              </div>
                              <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                log.accessType === "Emergency Access" 
                                  ? "bg-rose-50 text-rose-700 border border-rose-100" 
                                  : "bg-teal-50 text-teal-750 border border-teal-200"
                              }`}>
                                {log.accessType}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed">
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Requesting Hospital</span>
                                <span className="font-semibold text-slate-800">{log.hospital}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Requesting Clinician</span>
                                <span className="font-semibold text-slate-800">{log.doctor}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-slate-400">Access Purpose</span>
                                <span className="text-slate-600 font-medium italic">"{log.purpose}"</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "SETTINGS" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">Patient Safety Settings</h2>
                    <p className="text-sm text-slate-500 mt-1">Configure security credentials and update contact details.</p>
                  </div>

                  <form onSubmit={handleUpdateSettings} className="border-t border-slate-100 pt-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Change Secure PIN</label>
                        <input
                          type="password"
                          placeholder="Enter new 4-digit PIN"
                          maxLength={4}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                          className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Update Residential Address</label>
                        <input
                          type="text"
                          placeholder="Enter new home address"
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-teal-600 text-white font-bold text-sm py-2 px-5 rounded-xl hover:bg-teal-700 transition-colors shadow-sm focus:outline-none"
                    >
                      Save Configuration
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "SUPPORT" && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="font-display text-xl font-bold text-slate-900">National Platform Support</h2>
                    <p className="text-sm text-slate-500 mt-1">Submit inquiries or report identity discrepancies directly to NIMC and federal health administrators.</p>
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 leading-relaxed">
                      <strong>Note:</strong> MedID is strictly an identity registry and record pointer system. Diagnoses, laboratory results, and other clinical charts belong entirely to the hospital that treated you. For inquiries concerning actual medical diagnoses, please contact the specific hospital's EHR admin directly.
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Support Subject</label>
                        <input
                          type="text"
                          placeholder="e.g., Identity detail mismatch"
                          className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Message Description</label>
                        <textarea
                          rows={4}
                          placeholder="Describe your issue in detail..."
                          className="w-full rounded-xl border border-slate-300 py-2 px-3 text-sm focus:outline-none focus:border-teal-500"
                        ></textarea>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSuccessMsg("Support ticket successfully created and dispatched to the platform team.");
                          setTimeout(() => setSuccessMsg(""), 4000);
                        }}
                        className="bg-teal-600 text-white font-bold text-sm py-2 px-5 rounded-xl hover:bg-teal-700 transition-colors"
                      >
                        Submit Ticket
                      </button>
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
        <span>National Health Exchange Hub (NIMH-Interoperability) &bull; Lekki, Lagos</span>
      </footer>
    </div>
  );
}
