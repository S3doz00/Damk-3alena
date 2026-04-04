export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  distance: number;
  bloodNeeds: {
    type: string;
    level: "critical" | "low" | "moderate" | "adequate";
  }[];
  coordinates: { lat: number; lng: number };
  openHours: string;
  availableSlots: string[];
}

export const HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "King Hussein Medical Center",
    address: "Queen Alia Street, Amman",
    city: "Amman",
    phone: "+962 6 568 0131",
    distance: 2.3,
    bloodNeeds: [
      { type: "O-", level: "critical" },
      { type: "B-", level: "low" },
      { type: "A+", level: "moderate" },
      { type: "O+", level: "adequate" },
    ],
    coordinates: { lat: 31.9539, lng: 35.9106 },
    openHours: "24/7",
    availableSlots: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"],
  },
  {
    id: "h2",
    name: "Jordan University Hospital",
    address: "University of Jordan Campus, Amman",
    city: "Amman",
    phone: "+962 6 535 1450",
    distance: 4.1,
    bloodNeeds: [
      { type: "AB-", level: "critical" },
      { type: "A-", level: "low" },
      { type: "B+", level: "moderate" },
    ],
    coordinates: { lat: 31.9736, lng: 35.8710 },
    openHours: "8:00 AM - 8:00 PM",
    availableSlots: ["08:00", "09:00", "10:00", "13:00", "14:00", "17:00"],
  },
  {
    id: "h3",
    name: "Al-Bashir Hospital",
    address: "Al-Bashir District, Amman",
    city: "Amman",
    phone: "+962 6 477 8111",
    distance: 5.7,
    bloodNeeds: [
      { type: "O+", level: "low" },
      { type: "A+", level: "low" },
      { type: "B-", level: "critical" },
    ],
    coordinates: { lat: 31.9419, lng: 35.9305 },
    openHours: "8:00 AM - 6:00 PM",
    availableSlots: ["08:30", "10:30", "11:30", "14:30", "15:30"],
  },
  {
    id: "h4",
    name: "Al-Hussein Blood Bank",
    address: "4th Circle, Amman",
    city: "Amman",
    phone: "+962 6 461 0090",
    distance: 3.8,
    bloodNeeds: [
      { type: "O-", level: "critical" },
      { type: "O+", level: "critical" },
      { type: "AB+", level: "moderate" },
      { type: "A-", level: "low" },
    ],
    coordinates: { lat: 31.9631, lng: 35.8776 },
    openHours: "7:00 AM - 7:00 PM",
    availableSlots: ["07:00", "08:00", "09:00", "10:00", "14:00", "15:00", "16:00"],
  },
  {
    id: "h5",
    name: "Islamic Hospital",
    address: "University Street, Amman",
    city: "Amman",
    phone: "+962 6 568 7070",
    distance: 6.2,
    bloodNeeds: [
      { type: "A+", level: "adequate" },
      { type: "B+", level: "adequate" },
      { type: "AB-", level: "low" },
    ],
    coordinates: { lat: 31.9762, lng: 35.8941 },
    openHours: "8:00 AM - 4:00 PM",
    availableSlots: ["08:00", "09:00", "10:00", "11:00", "13:00"],
  },
];

export const CAMPAIGNS = [
  {
    id: "c1",
    title: "Emergency Blood Drive",
    hospitalName: "King Hussein Medical Center",
    hospitalId: "h1",
    date: "2026-04-05",
    startTime: "09:00",
    endTime: "15:00",
    bloodTypesNeeded: ["O-", "O+", "B-"],
    description: "Emergency campaign to replenish critically low O- inventory. All eligible donors welcome.",
    urgency: "critical" as const,
    registeredCount: 42,
    targetCount: 100,
  },
  {
    id: "c2",
    title: "Monthly Blood Donation Day",
    hospitalName: "Jordan University Hospital",
    hospitalId: "h2",
    date: "2026-04-10",
    startTime: "08:00",
    endTime: "18:00",
    bloodTypesNeeded: ["All Types"],
    description: "Regular monthly donation drive. Refreshments provided. All blood types welcome.",
    urgency: "medium" as const,
    registeredCount: 28,
    targetCount: 80,
  },
  {
    id: "c3",
    title: "Ramadan Blood Drive",
    hospitalName: "Al-Bashir Hospital",
    hospitalId: "h3",
    date: "2026-04-15",
    startTime: "18:00",
    endTime: "22:00",
    bloodTypesNeeded: ["A+", "B+", "AB+"],
    description: "Evening campaign during Ramadan. Special arrangements for fasting donors after Iftar.",
    urgency: "medium" as const,
    registeredCount: 15,
    targetCount: 60,
  },
];
