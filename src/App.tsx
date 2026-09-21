import React, { useState, useEffect } from "react";
import PortalLauncher from "./components/PortalLauncher";
import PatientPortal from "./components/PatientPortal";
import AdminPortal from "./components/AdminPortal";
import DoctorPortal from "./components/DoctorPortal";
import SecurityPortal from "./components/SecurityPortal";
import { UserType, DowntimeState } from "./types";
import { Shield, WifiOff, AlertTriangle, RefreshCw, FileText, CheckCircle2 } from "lucide-react";

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<UserType>(null);
  const [downtime, setDowntime] = useState<DowntimeState | null>(null);
  const [showSopModal, setShowSopModal] = useState(false);

  useEffect(() => {
    fetchDowntime();
    const interval = setInterval(fetchDowntime, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchDowntime = async () => {
    try {
      const res = await fetch("/api/downtime/status");
      if (res.ok) {
        const data = await res.json();
        setDowntime(data);
      }
    } catch (e) {
      // Offline fallback
    }
  };

  const handleSelectPortal = (portal: "PATIENT" | "DOCTOR" | "ADMIN" | "SECURITY") => {
    setCurrentPortal(portal);
  };

  const handleBackToLauncher = () => {
    setCurrentPortal(null);
  };

  return (
    <div className="font-sans antialiased text-slate-900 min-h-screen flex flex-col justify-between" id="medid-v4-app">
      
      {/* National System Product Header & Portal Selector */}
      <div className="bg-slate-900 text-slate-300 text-[11px] border-b border-slate-800 py-2 px-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2.5">
            <span className="bg-teal-600 text-white px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider">
              Federal Ministry of Health
            </span>
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>MedID Nigeria</span>
              <span className="text-slate-400 font-normal text-[10px] hidden sm:inline">&bull; National Health Information Exchange</span>
            </span>
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono">Gateways Active</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-slate-400 text-[10px]">Active Portal:</span>
            <button
              onClick={() => setCurrentPortal("DOCTOR")}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                currentPortal === "DOCTOR" ? "bg-teal-600 text-white shadow-sm" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Clinician & Staff
            </button>
            <button
              onClick={() => setCurrentPortal("SECURITY")}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                currentPortal === "SECURITY" ? "bg-teal-700 text-white shadow-sm" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Security & Audit
            </button>
            <button
              onClick={() => setCurrentPortal("ADMIN")}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                currentPortal === "ADMIN" ? "bg-teal-600 text-white shadow-sm" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Hospital Admin
            </button>
            <button
              onClick={() => setCurrentPortal("PATIENT")}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                currentPortal === "PATIENT" ? "bg-teal-600 text-white shadow-sm" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Patient Portal
            </button>
            {currentPortal !== null && (
              <button
                onClick={handleBackToLauncher}
                className="px-2.5 py-1 bg-slate-700/80 hover:bg-slate-600 text-slate-200 rounded-md text-[10px] font-semibold ml-1"
              >
                Home Launcher
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global High-Contrast Downtime Warning Banner */}
      {downtime?.isOutageActive && (
        <div className="bg-amber-500 text-slate-950 px-6 py-2 shadow-md flex items-center justify-between text-xs font-bold animate-pulse sticky top-8 z-40">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>DOWNTIME MODE ACTIVE: Simulated Network / Power Outage. Remote EHR Access Restricted.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSopModal(true)}
                className="bg-slate-950 text-white hover:bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-colors flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                <span>View Form MD-DT-01 Paper SOP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Portals Router */}
      <div className="flex-1">
        {currentPortal === null && (
          <PortalLauncher onSelectPortal={handleSelectPortal} />
        )}
        
        {currentPortal === "PATIENT" && (
          <PatientPortal onBack={handleBackToLauncher} />
        )}
        
        {currentPortal === "DOCTOR" && (
          <DoctorPortal onBack={handleBackToLauncher} />
        )}
        
        {currentPortal === "ADMIN" && (
          <AdminPortal onBack={handleBackToLauncher} />
        )}

        {currentPortal === "SECURITY" && (
          <SecurityPortal onBack={handleBackToLauncher} />
        )}
      </div>

      {/* Offline SOP Modal */}
      {showSopModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-slate-800 animate-fade-in border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Standard Operating Procedure: Form MD-DT-01</h3>
                  <p className="text-[11px] text-slate-500">Clinical Guidelines for Facility Network & Power Downtime</p>
                </div>
              </div>
              <button
                onClick={() => setShowSopModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <strong>Attention Treating Clinician:</strong> The national interoperability backbone and hospital record adapters are temporarily unreachable. All care decisions must proceed under the following manual protocol:
              </div>

              <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                <li><strong>Identity Confirmation:</strong> Verify patient physical MedID Card, National Identity Slip (NIN), or physical hospital card.</li>
                <li><strong>Physical Emergency Record:</strong> Locate local paper chart or manual emergency intake book in Emergency Bay.</li>
                <li><strong>Log Clinical Intervention:</strong> Record date, time, attending doctor license number, emergency medications administered, and clinical justification on Form MD-DT-01.</li>
                <li><strong>Delayed Reconciliation:</strong> Upon power/connectivity restoration, input manual encounter numbers into MedID for cryptographic hash chaining reconciliation.</li>
              </ol>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSopModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                Understood &bull; Close SOP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
