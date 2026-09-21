import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Lock,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Eye,
  Server,
  WifiOff,
  Wifi,
  Database,
  Search,
  ExternalLink,
  History,
  AlertCircle,
  X,
  Check,
  Clock,
  Building2,
  UserCheck
} from "lucide-react";
import { AuditVerification, SecurityAlert, DowntimeState } from "../types";

interface SecurityPortalProps {
  onBack: () => void;
}

export default function SecurityPortal({ onBack }: SecurityPortalProps) {
  const [activeTab, setActiveTab] = useState<"INTEGRITY" | "ALERTS" | "DOWNTIME" | "ADAPTERS">("INTEGRITY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Audit state
  const [verification, setVerification] = useState<AuditVerification | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [tamperSimulated, setTamperSimulated] = useState(false);

  // Alerts state
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Downtime state
  const [downtime, setDowntime] = useState<DowntimeState | null>(null);
  const [downtimeToggling, setDowntimeToggling] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  // Filter logs search
  const [logSearchQuery, setLogSearchQuery] = useState("");

  // Load baseline data on mount
  useEffect(() => {
    fetchAuditStatus();
    fetchAlerts();
    fetchDowntimeStatus();
  }, []);

  const fetchAuditStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const [verifyRes, logsRes] = await Promise.all([
        fetch("/api/audit/verify"),
        fetch("/api/audit/logs")
      ]);
      const verifyData = await verifyRes.json();
      const logsData = await logsRes.json();
      setVerification(verifyData);
      setAuditLogs(Array.isArray(logsData) ? logsData.slice().reverse() : []);
      setTamperSimulated(verifyData.tamperDetected);
    } catch (err) {
      setError("Failed to reach audit verification service.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/security/alerts");
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Alerts fetch error:", err);
    }
  };

  const fetchDowntimeStatus = async () => {
    try {
      const res = await fetch("/api/downtime/status");
      const data = await res.json();
      setDowntime(data);
    } catch (err) {
      console.error("Downtime fetch error:", err);
    }
  };

  const handleInjectTamper = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/audit/tamper-demo", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTamperSimulated(true);
        setSuccess("Database record tampered. Re-running verification engine...");
        await fetchAuditStatus();
      } else {
        setError(data.error || "Failed to inject tamper demonstration.");
      }
    } catch (err) {
      setError("Network failure during tamper test.");
    }
  };

  const handleResetTamper = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/audit/reset-tamper", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setTamperSimulated(false);
        setSuccess("Audit chain restored to pristine cryptographic state.");
        await fetchAuditStatus();
      } else {
        setError(data.error || "Failed to reset chain.");
      }
    } catch (err) {
      setError("Network failure during chain restoration.");
    }
  };

  const handleReviewAlert = async () => {
    if (!selectedAlert) return;
    setReviewSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/security/alerts/${selectedAlert.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: reviewNotes || "Breach attempt investigated by Compliance Directorate. Security policy verified and enforced.",
          reviewedBy: "Alhaji Tunde Bakare (Chief Compliance Officer)",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Incident ${selectedAlert.id} investigated and adjudicated.`);
        setSelectedAlert(null);
        setReviewNotes("");
        fetchAlerts();
      } else {
        setError(data.error || "Failed to save alert review.");
      }
    } catch (err) {
      setError("Error submitting incident adjudication.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleToggleDowntime = async () => {
    setDowntimeToggling(true);
    setError("");
    try {
      const targetState = !downtime?.isOutageActive;
      const res = await fetch("/api/downtime/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOutageActive: targetState }),
      });
      const data = await res.json();
      if (res.ok) {
        setDowntime(data);
        setSuccess(`Downtime simulation mode ${targetState ? "ACTIVATED" : "DEACTIVATED"}.`);
        fetchAuditStatus();
      } else {
        setError(data.error || "Failed to toggle outage state.");
      }
    } catch (err) {
      setError("Network failure toggling downtime mode.");
    } finally {
      setDowntimeToggling(false);
    }
  };

  const handleReconcileOffline = async () => {
    setReconciling(true);
    setError("");
    try {
      const res = await fetch("/api/downtime/reconcile", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Reconciliation complete. ${data.reconciledCount} offline events committed to cryptographic chain.`);
        fetchDowntimeStatus();
        fetchAuditStatus();
      } else {
        setError(data.error || "Failed to reconcile offline queue.");
      }
    } catch (err) {
      setError("Network failure during offline reconciliation.");
    } finally {
      setReconciling(false);
    }
  };

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    if (!logSearchQuery) return true;
    const q = logSearchQuery.toLowerCase();
    return (
      log.id?.toLowerCase().includes(q) ||
      log.actorName?.toLowerCase().includes(q) ||
      log.actorRole?.toLowerCase().includes(q) ||
      log.eventType?.toLowerCase().includes(q) ||
      log.hospitalId?.toLowerCase().includes(q) ||
      log.purpose?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-sans text-slate-900" id="security-portal-root">
      
      {/* ─── Header: National Compliance & Security Directorate Console ─── */}
      <header className="bg-white border-b border-slate-200 py-4 px-8 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-slate-500 hover:text-slate-900 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              title="Return to Launcher"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="bg-slate-900 text-teal-400 p-2.5 rounded-2xl flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-black tracking-tight text-slate-900">
                  National Compliance & Security Directorate
                </span>
                <span className="px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold rounded-md uppercase font-mono">
                  NDPA Sec. 39 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Central Health Information Audit & Cryptographic Verification Console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-right hidden md:block">
              <span className="block text-xs font-bold text-slate-800">Alhaji Tunde Bakare</span>
              <span className="block text-[11px] text-slate-500 font-mono">Director of Healthcare Cyber Compliance</span>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span>Ledger Synchronized</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Governance Purpose Explainer Banner ─── */}
      <section className="bg-teal-900 text-white py-3.5 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs leading-relaxed">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-300 shrink-0" />
            <span>
              <strong>Regulatory Purpose & Authorized Audience:</strong> Designed for the National Data Protection Commission (NDPC), Hospital Chief Information Security Officers (CISOs), and Compliance Auditors to ensure absolute accountability over patient record access.
            </span>
          </div>
          <span className="font-mono text-[11px] text-teal-200 shrink-0">
            Retention Mandate: 365 Days WORM
          </span>
        </div>
      </section>

      {/* ─── Notification Banners ─── */}
      <div className="max-w-7xl mx-auto w-full px-8 pt-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 shadow-xs animate-fade-in mb-4">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="text-sm font-semibold">{error}</div>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs animate-fade-in mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-sm font-semibold">{success}</div>
          </div>
        )}
      </div>

      {/* ─── Main Content Body ─── */}
      <main className="max-w-7xl mx-auto px-8 py-4 flex-1 w-full space-y-6">

        {/* ── Tabs Navigation ── */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab("INTEGRITY")}
            className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "INTEGRITY"
                ? "border-teal-600 text-teal-700 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Cryptographic Audit Chain ({verification?.totalEvents || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("ALERTS")}
            className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "ALERTS"
                ? "border-teal-600 text-teal-700 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Security Incidents ({alerts.filter(a => a.status === "PENDING_REVIEW").length} Actionable)</span>
          </button>

          <button
            onClick={() => setActiveTab("DOWNTIME")}
            className={`px-6 py-3 text-sm font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "DOWNTIME"
                ? "border-teal-600 text-teal-700 font-black"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <WifiOff className="w-4 h-4" />
            <span>Downtime Resilience</span>
          </button>
        </div>

        {/* ─── TAB 1: CRYPTOGRAPHIC AUDIT CHAIN INTEGRITY ─── */}
        {activeTab === "INTEGRITY" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Top Status Card */}
            <div className={`p-6 rounded-3xl border shadow-sm transition-all ${
              verification?.tamperDetected
                ? "bg-rose-50 border-rose-300"
                : "bg-white border-slate-200"
            }`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    verification?.tamperDetected
                      ? "bg-rose-600 text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {verification?.tamperDetected ? <AlertTriangle className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-0.5 rounded-md text-xs font-bold uppercase font-mono ${
                        verification?.tamperDetected
                          ? "bg-rose-600 text-white"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {verification?.tamperDetected ? "Integrity Alert &bull; Verification Failed" : "100% Clinically Verified"}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Protocol: Secure Medical Ledger Chaining
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mt-2">
                      {verification?.tamperDetected
                        ? "Medical Ledger Provenance Mismatch Detected"
                        : "Immutable Longitudinal Clinical Audit Ledger"}
                    </h2>

                    <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
                      {verification?.tamperDetected
                        ? verification.failureReason
                        : `Every clinical access attempt across all hospitals is securely signed and chronologically chained to the genesis anchor. Altering any historical clinical record immediately invalidates subsequent provenance checksums.`}
                    </p>
                  </div>
                </div>

                {/* Demonstration & Verification Actions */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    onClick={fetchAuditStatus}
                    disabled={loading}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    <span>Verify Clinical Audit Trail</span>
                  </button>

                  {!verification?.tamperDetected ? (
                    <button
                      onClick={handleInjectTamper}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
                      title="Simulates unauthorized alteration of a clinical audit record"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Simulate Clinical Record Integrity Test</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleResetTamper}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Restore Secure Clinical Audit Trail</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-xs font-medium">Total Chained Blocks</span>
                  <span className="text-xl font-mono font-black text-slate-900 mt-0.5 block">
                    {verification?.totalEvents || 0} Blocks
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs font-medium">NDPA Retention Period</span>
                  <span className="text-xl font-mono font-black text-teal-700 mt-0.5 block">
                    365 Days (1 Year Lock)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs font-medium">Statutory Compliance</span>
                  <span className="text-xs font-bold text-emerald-700 mt-2 block">
                    NDPA Section 39 Verified
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs font-medium">Ledger Head Hash</span>
                  <span className="text-xs font-mono text-slate-600 truncate mt-1 block max-w-[200px]" title={verification?.headHash}>
                    {verification?.headHash ? `${verification.headHash.slice(0, 18)}...` : "Genesis Root"}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Stream Header & Search */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <History className="w-5 h-5 text-teal-600" />
                    <span>Cryptographic Block Stream & Access History</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Normal authorized accesses show as clean [DONE / ALLOWED]. Unauthorized attempts trigger security incident alerts.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter by Actor, Role, or Hospital..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500 w-64"
                  />
                </div>
              </div>

              {/* Event Cards Stream */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredLogs.map((log) => {
                  const isTamperedThis = verification?.tamperDetected && verification.tamperedEventId === log.id;
                  return (
                    <div
                      key={log.id}
                      className={`p-4 rounded-2xl border transition-all text-xs ${
                        isTamperedThis
                          ? "bg-rose-50 border-rose-500 shadow-md"
                          : "bg-slate-50/70 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {log.id}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{log.eventType}</span>
                          {log.isOfflineReconciled && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded border border-amber-300">
                              RECONCILED FROM OFFLINE
                            </span>
                          )}
                        </div>

                        {/* Status Badge: Clean DONE / ALLOWED for routine; DENIED for unauthorized */}
                        <div className="flex items-center gap-2">
                          {log.decision === "ALLOW" ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-bold text-xs flex items-center gap-1 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>DONE &bull; ALLOWED</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-bold text-xs flex items-center gap-1 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>DENIED &bull; FLAGGED TO SECURITY</span>
                            </span>
                          )}
                          <span className="text-slate-400 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Details Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 my-2">
                        <div>
                          <span className="text-slate-400">Actor: </span>
                          <strong className="text-slate-900">{log.actorName}</strong> ({log.actorRole})
                        </div>
                        <div>
                          <span className="text-slate-400">Facility: </span>
                          <strong className="text-slate-900">{log.hospitalId}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400">Patient Index: </span>
                          <strong className="font-mono text-teal-700">{log.patientMedID || "GLOBAL"}</strong>
                        </div>
                      </div>

                      {log.purpose && (
                        <div className="bg-white border border-slate-200/80 p-2.5 rounded-xl my-2 text-slate-700 text-xs">
                          <span className="font-semibold text-slate-500">Declared Purpose:</span> {log.purpose}
                        </div>
                      )}

                      {/* Cryptographic Link Hashes */}
                      <div className="bg-white border border-slate-200 p-2.5 rounded-xl font-mono text-[11px] text-slate-500 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Previous Hash:</span>
                          <span className="text-slate-600 truncate max-w-md">{log.previousHash}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Current Block Digest:</span>
                          <span className="text-teal-700 font-bold truncate max-w-md">{log.currentHash}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ─── TAB 2: INCIDENT QUEUE & ABUSE ALERTS ─── */}
        {activeTab === "ALERTS" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                    <span>Security Incident Queue & Automated Abuse Alerts</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Flagged strictly when unauthorized personnel attempt prohibited access (e.g. clerk viewing clinical charts or off-duty lookups).
                  </p>
                </div>

                <button
                  onClick={fetchAlerts}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Queue</span>
                </button>
              </div>

              {/* Alerts Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                    <tr>
                      <th className="p-3.5">Incident ID</th>
                      <th className="p-3.5">Policy Violated</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5">Actor Details</th>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Adjudication</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-teal-800">{alert.id}</td>
                        <td className="p-3.5 font-bold text-slate-900">{alert.ruleId}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                            alert.severity === "CRITICAL"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : alert.severity === "HIGH"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <strong className="text-slate-900 block">{alert.actorName}</strong>
                          <span className="text-slate-500 text-[11px]">{alert.actorRole} ({alert.hospitalId})</span>
                        </td>
                        <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                          {new Date(alert.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            alert.status === "PENDING_REVIEW"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {alert.status === "PENDING_REVIEW" ? "Pending Investigation" : "Adjudicated"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                              alert.status === "PENDING_REVIEW"
                                ? "bg-rose-600 hover:bg-rose-700 text-white"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            {alert.status === "PENDING_REVIEW" ? "Investigate Incident" : "View Record"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Investigation Modal */}
            {selectedAlert && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                    <div>
                      <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-xs font-mono font-bold rounded uppercase">
                        {selectedAlert.severity} Incident Investigation
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 mt-2">{selectedAlert.ruleId}</h3>
                      <span className="text-xs font-mono text-slate-400">Incident ID: {selectedAlert.id}</span>
                    </div>
                    <button
                      onClick={() => setSelectedAlert(null)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Offending Actor:</span>
                      <strong className="text-slate-900">{selectedAlert.actorName} ({selectedAlert.actorRole})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Facility ID:</span>
                      <strong className="text-slate-900">{selectedAlert.hospitalId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Patient MedID:</span>
                      <strong className="font-mono text-teal-700">{selectedAlert.patientMedID || "N/A"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Incident Description:</span>
                      <strong className="text-rose-700">{selectedAlert.description}</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Compliance Officer Adjudication Notes:
                    </label>
                    <textarea
                      rows={3}
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Enter legal findings, disciplinary notes, or administrative disposition under NDPA Section 39..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setSelectedAlert(null)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReviewAlert}
                      disabled={reviewSubmitting}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{reviewSubmitting ? "Submitting..." : "Adjudicate & Resolve Incident"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ─── TAB 3: DOWNTIME RESILIENCE & OFFLINE BUFFERING ─── */}
        {activeTab === "DOWNTIME" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <WifiOff className="w-6 h-6 text-amber-600" />
                    <span>Downtime Resilience & Offline Cryptographic Buffer</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Guarantees healthcare continuity during Nigerian power grid and telecommunication fiber blackouts.
                  </p>
                </div>

                <button
                  onClick={handleToggleDowntime}
                  disabled={downtimeToggling}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
                    downtime?.isOutageActive
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-amber-600 hover:bg-amber-700 text-white"
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${downtimeToggling ? "animate-spin" : ""}`} />
                  <span>{downtime?.isOutageActive ? "Simulate Grid Restoration" : "Simulate National Grid Outage"}</span>
                </button>
              </div>

              {/* Outage State Notice */}
              <div className={`p-5 rounded-2xl border text-sm leading-relaxed ${
                downtime?.isOutageActive
                  ? "bg-amber-50 border-amber-300 text-amber-950"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>Current Network Architecture Status: {downtime?.isOutageActive ? "OFFLINE BLACKOUT MODE" : "ONLINE CONNECTED"}</span>
                </div>
                <p>
                  When Nigerian clinics lose internet connectivity, emergency clinicians can still retrieve offline-cached emergency cards (blood type, severe drug allergies). Any break-glass action taken is buffered in a bounded local queue with local cryptographic SHA-256 signatures, ready for reconciliation.
                </p>
              </div>

              {/* Status Indicators Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Central Health Exchange</span>
                  <span className={`text-base font-black mt-1 block ${
                    downtime?.isOutageActive ? "text-amber-700" : "text-emerald-700"
                  }`}>
                    {downtime?.isOutageActive ? "DEGRADED (OFFLINE BUFFER)" : "ONLINE (CONNECTED)"}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hospital EHR Adapters</span>
                  <span className={`text-base font-black mt-1 block ${
                    downtime?.isOutageActive ? "text-rose-700" : "text-emerald-700"
                  }`}>
                    {downtime?.isOutageActive ? "SERVICE UNAVAILABLE (503)" : "ONLINE (ACTIVE)"}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Buffered Offline Events</span>
                  <span className="text-base font-black text-slate-900 mt-1 block font-mono">
                    {downtime?.queuedEventsCount || 0} Events Buffered
                  </span>
                </div>
              </div>

              {/* Reconciliation Controls */}
              {downtime?.queuedEventsCount ? (
                <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <strong className="text-sm font-bold text-teal-950 block">Pending Offline Actions Awaiting Ledger Reconciliation</strong>
                    <span className="text-xs text-teal-700">
                      {downtime.queuedEventsCount} emergency events buffered locally with cryptographic timestamps.
                    </span>
                  </div>
                  <button
                    onClick={handleReconcileOffline}
                    disabled={reconciling}
                    className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs transition-all shadow-sm shrink-0"
                  >
                    {reconciling ? "Reconciling..." : "Reconcile into National Ledger"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

      </main>

      {/* ─── Standardized Footer ─── */}
      <footer className="border-t border-slate-200 bg-white py-4 px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>National Health Information Security Directorate &bull; NDPA Section 39 Compliance Engine</span>
          <span className="font-mono text-teal-700 font-semibold">Ledger ID: FED-MOH-ROOT &bull; HSM Anchored</span>
        </div>
      </footer>

    </div>
  );
}
