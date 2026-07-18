export interface Encounter {
  date: string;
  doctorName: string;
  department: string;
  visitType: "Routine" | "Emergency" | "Inpatient" | "Specialist";
  diagnoses: string[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  laboratoryResults: {
    test: string;
    result: string;
    unit: string;
    range: string;
  }[];
  scans: {
    type: string;
    findings: string;
    imageLink?: string;
  }[];
  summary: string;
}

export interface PatientProfile {
  medID: string;
  name: string;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  nin: string;
  pin: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  linkedHospitals: string[];
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  department: string;
  hospitalId: string;
  hospitalName?: string;
  enabled: boolean;
}

export interface HospitalProfile {
  id: string;
  name: string;
  address: string;
  emergencyOverrideCode: string;
  codeGeneratedAt: string;
}

export interface AccessLog {
  id: string;
  date: string;
  time: string;
  hospital: string;
  doctor: string;
  patientName: string;
  patientMedID: string;
  purpose: string;
  accessType: "Approved" | "Emergency Access";
  duration: string;
  status: "Approved" | "Active" | "Completed";
}

export type UserType = "PATIENT" | "DOCTOR" | "ADMIN" | null;
