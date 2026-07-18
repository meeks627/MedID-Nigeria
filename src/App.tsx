import React, { useState } from "react";
import PortalLauncher from "./components/PortalLauncher";
import PatientPortal from "./components/PatientPortal";
import AdminPortal from "./components/AdminPortal";
import DoctorPortal from "./components/DoctorPortal";

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<"PATIENT" | "DOCTOR" | "ADMIN" | null>(null);

  const handleSelectPortal = (portal: "PATIENT" | "DOCTOR" | "ADMIN") => {
    setCurrentPortal(portal);
  };

  const handleBackToLauncher = () => {
    setCurrentPortal(null);
  };

  return (
    <div className="font-sans antialiased text-slate-900" id="medid-v4-app">
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
    </div>
  );
}
