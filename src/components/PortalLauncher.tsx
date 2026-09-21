import React from "react";
import { Shield, User, Heart, Building2, ChevronRight, Activity } from "lucide-react";

interface PortalLauncherProps {
  onSelectPortal: (portal: "PATIENT" | "DOCTOR" | "ADMIN" | "SECURITY") => void;
}

export default function PortalLauncher({ onSelectPortal }: PortalLauncherProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col justify-between animate-fade-in" id="portal-launcher">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-md flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-800">
                MedID <span className="text-teal-600">V4</span>
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-semibold tracking-wider rounded border border-slate-200 ml-2 hidden sm:inline-block">
                National Infrastructure
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            System Status: Active &bull; National Network Operational
          </div>
        </div>
      </header>

      {/* Main Hero and Options */}
      <main className="max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-4 leading-tight">
            Unified Healthcare Identity & <span className="text-teal-600">Record Interoperability</span>
          </h1>
          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            A secure national trust layer connecting independent hospital EHR systems. Verified NIN identity, role-based contextual access, break-glass emergency response, and tamper-evident audit logging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto w-full">
          {/* Patient Card */}
          <div
            id="launch-patient-portal"
            onClick={() => onSelectPortal("PATIENT")}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="bg-teal-50 text-teal-700 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-800 mb-2">Patient Portal</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Register with your NIN, download your digital MedID card, manage security PIN, and audit access history.
              </p>
            </div>
            <div className="flex items-center justify-between text-teal-600 font-bold text-xs pt-4 border-t border-slate-100 uppercase tracking-wider">
              <span>Access Identity</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Clinician & Staff Card */}
          <div
            id="launch-doctor-portal"
            onClick={() => onSelectPortal("DOCTOR")}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="bg-teal-50 text-teal-700 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-800 mb-2">Clinician & Staff</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Role-based access for Doctors, Nurses, and Records Clerks. Shift duty management and governed break-glass emergency access.
              </p>
            </div>
            <div className="flex items-center justify-between text-teal-600 font-bold text-xs pt-4 border-t border-slate-100 uppercase tracking-wider">
              <span>Clinical Access</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Hospital Admin Card */}
          <div
            id="launch-admin-portal"
            onClick={() => onSelectPortal("ADMIN")}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="bg-teal-50 text-teal-700 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-800 mb-2">Hospital Admin</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Manage clinician credentials, ward assignments, rotating emergency override keys, and isolated hospital operational logs.
              </p>
            </div>
            <div className="flex items-center justify-between text-teal-600 font-bold text-xs pt-4 border-t border-slate-100 uppercase tracking-wider">
              <span>Facility Admin</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Security & Audit Card */}
          <div
            id="launch-security-portal"
            onClick={() => onSelectPortal("SECURITY")}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="bg-teal-50 text-teal-700 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-800 mb-2">Security & Compliance</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-6">
                Cryptographic SHA-256 audit chain verification, live abuse alert review, and 365-day retention enforcement.
              </p>
            </div>
            <div className="flex items-center justify-between text-teal-600 font-bold text-xs pt-4 border-t border-slate-100 uppercase tracking-wider">
              <span>Security Console</span>
              <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="h-12 bg-slate-100 border-t border-slate-200 px-8 flex items-center justify-between text-[10px] text-slate-500 font-medium">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
            <span>Platform Node: NG-LAG-01 &bull; NIN Interoperability Layer v1.0.4</span>
          </div>
          <div>
            <span>© 2026 Helium Health National Identity Registry &bull; HSM Encrypted Connection</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

