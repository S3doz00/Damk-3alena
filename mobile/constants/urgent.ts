export type UrgencyLevel = "critical" | "urgent" | "pending";

export interface UrgentCase {
  id: string;
  patientName: string;
  fileNumber: string;
  hospitalName: string;
  hospitalId: string;
  city: string;
  distanceKm: number;
  bloodType: string;
  urgency: UrgencyLevel;
  cause: string;
  unitsNeeded: number;
  postedAt: string;
}

export const URGENT_CASES: UrgentCase[] = [
  {
    id: "uc1",
    patientName: "Ahmad Khalil",
    fileNumber: "#482910",
    hospitalName: "King Hussein Medical Center",
    hospitalId: "df7e881b-abf8-438f-a873-d931f4ba181a",
    city: "Amman",
    distanceKm: 2.3,
    bloodType: "O-",
    urgency: "critical",
    cause: "Emergency Surgery",
    unitsNeeded: 3,
    postedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "uc2",
    patientName: "Lina Mansour",
    fileNumber: "#391847",
    hospitalName: "Al-Hussein Blood Bank",
    hospitalId: "d9bd7fd6-9996-4082-955f-8e23850ddac7",
    city: "Amman",
    distanceKm: 3.8,
    bloodType: "B-",
    urgency: "critical",
    cause: "Traffic Accident",
    unitsNeeded: 4,
    postedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: "uc3",
    patientName: "Yusuf Al-Rashid",
    fileNumber: "#557203",
    hospitalName: "Jordan University Hospital",
    hospitalId: "2bab8bf7-6772-465d-bb70-7fda693f58e3",
    city: "Amman",
    distanceKm: 4.1,
    bloodType: "AB-",
    urgency: "urgent",
    cause: "Organ Transplant",
    unitsNeeded: 2,
    postedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "uc4",
    patientName: "Sara Haddad",
    fileNumber: "#629034",
    hospitalName: "Al-Bashir Hospital",
    hospitalId: "c9c84892-19e9-4644-88e1-d48a3d77069f",
    city: "Amman",
    distanceKm: 5.7,
    bloodType: "A-",
    urgency: "urgent",
    cause: "Childbirth Complication",
    unitsNeeded: 2,
    postedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: "uc5",
    patientName: "Tariq Nasser",
    fileNumber: "#710482",
    hospitalName: "Prince Hamzah Hospital",
    hospitalId: "0f06d325-248a-42e9-aaf1-bec357ca845b",
    city: "Amman",
    distanceKm: 8.2,
    bloodType: "O+",
    urgency: "pending",
    cause: "Chronic Anemia",
    unitsNeeded: 1,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "uc6",
    patientName: "Rania Khalaf",
    fileNumber: "#834917",
    hospitalName: "Jordan University Hospital",
    hospitalId: "2bab8bf7-6772-465d-bb70-7fda693f58e3",
    city: "Amman",
    distanceKm: 4.1,
    bloodType: "B+",
    urgency: "pending",
    cause: "Leukemia Treatment",
    unitsNeeded: 2,
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];
