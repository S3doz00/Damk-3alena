import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Gender = "male" | "female";

export interface DonorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  nationalId: string;
  bloodType: BloodType | null;
  gender: Gender;
  dateOfBirth: string;
  phone: string;
  city: string;
  weightKg?: number;
  lastDonationDate: string | null;
  isEligible: boolean;
  totalDonations: number;
  avatarInitials: string;
  latitude?: number;
  longitude?: number;
}

export interface Donation {
  id: string;
  date: string;
  hospitalName: string;
  hospitalCity: string;
  bloodType: BloodType;
  units: number;
  status: "completed" | "scheduled" | "cancelled";
}

export interface Appointment {
  id: string;
  fileNumber: string;
  hospitalId: string;
  hospitalName: string;
  hospitalAddress: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
  bloodType: BloodType;
  notes?: string;
}

export interface Notification {
  id: string;
  type: "shortage" | "campaign" | "eligibility" | "reminder";
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  urgency: "low" | "medium" | "high" | "critical";
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  phone: string;
  workingHours: string;
  bloodNeeds: { type: string; level: "critical" | "low" | "moderate" | "adequate" }[];
}

interface AppContextType {
  profile: DonorProfile | null;
  donations: Donation[];
  appointments: Appointment[];
  notifications: Notification[];
  facilities: Facility[];
  isOnboarded: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  session: Session | null;
  setProfile: (p: DonorProfile) => Promise<void>;
  updateProfile: (updates: Partial<DonorProfile>) => Promise<void>;
  addDonation: (d: Donation) => void;
  addAppointment: (a: Appointment) => Promise<string>;
  cancelAppointment: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  completeOnboarding: () => void;
  signUp: (
    phone: string,
    password: string,
    profileData: {
      firstName: string;
      lastName: string;
      nationalId: string;
      bloodType: BloodType;
      gender: Gender;
      dateOfBirth: string;
      city?: string;
      weightKg?: number;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  unreadCount: number;
  refreshProfile: () => Promise<void>;
  refreshAppointments: () => Promise<void>;
  refreshFacilities: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// Convert "DD/MM/YYYY" → "YYYY-MM-DD" (PostgreSQL DATE format)
function convertDOB(dob: string): string {
  const parts = dob.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dob; // already ISO or unknown format
}

// Convert phone to fake email for Supabase Auth
function phoneToEmail(phone: string): string {
  return `${phone.replace(/[^0-9]/g, "")}@damk3alena.app`;
}

function generateFileNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `#${num}`;
}

function mapAppointmentStatus(dbStatus: string): "upcoming" | "completed" | "cancelled" {
  switch (dbStatus) {
    case "booked": return "upcoming";
    case "completed": return "completed";
    case "cancelled": return "cancelled";
    case "no_show": return "cancelled";
    default: return "upcoming";
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<DonorProfile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  // ─── Auth listener ───────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        setIsLoggedIn(true);
        loadUserData(s.user.id).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        setIsLoggedIn(true);
        loadUserData(s.user.id);
      } else {
        setIsLoggedIn(false);
        setIsOnboarded(false);
        setProfileState(null);
        setDonations([]);
        setAppointments([]);
        setNotifications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Facilities (public, load once) ──────────────────────────────────────
  useEffect(() => {
    loadFacilities();
  }, []);

  async function loadFacilities() {
    const { data: facs } = await supabase
      .from("facilities")
      .select("*")
      .order("name");

    if (!facs) return;

    const { data: inv } = await supabase.from("facility_inventory").select("*");

    const mapped: Facility[] = facs.map((f: any) => {
      const facilityInv = (inv || []).filter((i: any) => i.facility_id === f.id);
      const bloodNeeds = facilityInv.map((i: any) => ({
        type: i.blood_type,
        level: i.units <= 3 ? "critical" as const
          : i.units <= 8 ? "low" as const
          : i.units <= 15 ? "moderate" as const
          : "adequate" as const,
      }));
      return {
        id: f.id,
        name: f.name,
        type: f.type,
        address: f.address || "",
        city: f.city || "",
        region: f.region || "",
        latitude: f.latitude,
        longitude: f.longitude,
        phone: f.phone || "",
        workingHours: f.working_hours || "",
        bloodNeeds,
      };
    });

    setFacilities(mapped);
  }

  // ─── Load user data ───────────────────────────────────────────────────────
  async function loadUserData(authId: string) {
    try {
      const { data: userRow } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .single();

      if (!userRow) {
        setIsLoading(false);
        return;
      }

      const { data: donorRow } = await supabase
        .from("donors")
        .select("*")
        .eq("user_id", userRow.id)
        .single();

      if (donorRow) {
        setIsOnboarded(true);
        const p: DonorProfile = {
          id: donorRow.id,
          userId: userRow.id,
          firstName: userRow.first_name,
          lastName: userRow.last_name,
          name: `${userRow.first_name} ${userRow.last_name}`,
          nationalId: donorRow.national_id,
          bloodType: donorRow.blood_type,
          gender: donorRow.gender as Gender,
          dateOfBirth: donorRow.birth_date,
          phone: userRow.phone || "",
          city: donorRow.city || donorRow.location_name || "",
          weightKg: donorRow.weight_kg ? Number(donorRow.weight_kg) : undefined,
          lastDonationDate: donorRow.last_donation || null,
          isEligible: donorRow.is_eligible ?? true,
          totalDonations: donorRow.total_donations ?? 0,
          avatarInitials: (userRow.first_name[0] + userRow.last_name[0]).toUpperCase(),
          latitude: donorRow.latitude,
          longitude: donorRow.longitude,
        };
        setProfileState(p);

        await loadAppointments(donorRow.id, donorRow.blood_type);
        await loadDonations(donorRow.id);
        await loadNotifications(donorRow.id);
      }
      // If no donor row: user created but hasn't completed onboarding — isOnboarded stays false
    } catch (err) {
      console.error("Error loading user data:", err);
    }
    setIsLoading(false);
  }

  async function loadAppointments(donorId: string, bloodType: string) {
    const { data } = await supabase
      .from("appointments")
      .select("*, facilities(name, address, city)")
      .eq("donor_id", donorId)
      .order("appointment_date", { ascending: false })
      .limit(20);

    if (data) {
      setAppointments(data.map((a: any) => ({
        id: a.id,
        fileNumber: a.ticket_code || generateFileNumber(),
        hospitalId: a.facility_id,
        hospitalName: a.facilities?.name || "Unknown Hospital",
        hospitalAddress: a.facilities?.address || "",
        date: a.appointment_date,
        time: a.appointment_time,
        status: mapAppointmentStatus(a.status),
        bloodType: bloodType as BloodType,
        notes: a.notes,
      })));
    }
  }

  async function loadDonations(donorId: string) {
    const { data } = await supabase
      .from("donation_records")
      .select("*, facilities(name, city)")
      .eq("donor_id", donorId)
      .order("donation_date", { ascending: false })
      .limit(20);

    if (data) {
      setDonations(data.map((d: any) => ({
        id: d.id,
        date: d.donation_date,
        hospitalName: d.facilities?.name || "Unknown",
        hospitalCity: d.facilities?.city || "",
        bloodType: d.blood_type,
        units: d.units || 1,
        status: "completed",
      })));
    }
  }

  async function loadNotifications(donorId: string) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("donor_id", donorId)
      .order("sent_at", { ascending: false })
      .limit(30);

    if (data) {
      setNotifications(data.map((n: any) => ({
        id: n.id,
        type: n.type || "shortage",
        title: n.title,
        body: n.body,
        timestamp: n.sent_at,
        read: n.is_read ?? false,
        urgency: n.urgency || "medium",
      })));
    }
  }

  // ─── Auth methods ─────────────────────────────────────────────────────────

  const signUp = async (
    phone: string,
    password: string,
    profileData: {
      firstName: string;
      lastName: string;
      nationalId: string;
      bloodType: BloodType;
      gender: Gender;
      dateOfBirth: string;
      city?: string;
      weightKg?: number;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanPhone = phone.replace(/\s/g, "");
      const fakeEmail = phoneToEmail(cleanPhone);

      // 1. Sign up — pass metadata so trigger can populate users row
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password,
        options: {
          data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: cleanPhone,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          return { success: false, error: "An account with this phone number already exists." };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "Registration failed. Please try again." };
      }

      // 2. Wait for trigger to create the users row (up to 5 retries)
      let userRow: any = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, 800 + attempt * 500));
        const { data } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", authData.user.id)
          .single();
        if (data) {
          userRow = data;
          break;
        }
      }

      if (!userRow) {
        return {
          success: false,
          error: "Account created but profile setup timed out. Please try logging in.",
        };
      }

      // 3. Insert donor profile (convert DD/MM/YYYY → YYYY-MM-DD)
      const { error: donorError } = await supabase.from("donors").insert({
        user_id: userRow.id,
        national_id: profileData.nationalId,
        blood_type: profileData.bloodType,
        gender: profileData.gender,
        birth_date: convertDOB(profileData.dateOfBirth),
        city: profileData.city || "Amman",
        weight_kg: profileData.weightKg || null,
        is_eligible: true,
        total_donations: 0,
      });

      if (donorError) {
        console.error("Donor insert error:", donorError);
        return {
          success: false,
          error: "Account created but could not save health info: " + donorError.message,
        };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Something went wrong." };
    }
  };

  const login = async (
    phone: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const cleanPhone = phone.replace(/\s/g, "");
      const fakeEmail = phoneToEmail(cleanPhone);

      const { error } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password,
      });

      if (error) {
        return { success: false, error: "Incorrect phone number or password." };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Something went wrong." };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsLoggedIn(false);
    setIsOnboarded(false);
    setProfileState(null);
    setAppointments([]);
    setDonations([]);
    setNotifications([]);
  };

  // ─── Profile methods ──────────────────────────────────────────────────────

  // setProfile: simple in-memory + DB update (kept for backward compat)
  const setProfile = async (p: DonorProfile) => {
    setProfileState(p);
    await supabase
      .from("users")
      .update({ first_name: p.firstName, last_name: p.lastName, phone: p.phone })
      .eq("id", p.userId);
    await supabase
      .from("donors")
      .update({
        blood_type: p.bloodType,
        city: p.city,
        national_id: p.nationalId,
        weight_kg: p.weightKg || null,
      })
      .eq("id", p.id);
  };

  // updateProfile: partial update — only changed fields are written to DB
  const updateProfile = async (updates: Partial<DonorProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    if (updates.firstName || updates.lastName) {
      updated.name = `${updated.firstName} ${updated.lastName}`;
      updated.avatarInitials = (updated.firstName[0] + updated.lastName[0]).toUpperCase();
    }
    setProfileState(updated);

    const userUpdates: any = {};
    const donorUpdates: any = {};

    if (updates.firstName) userUpdates.first_name = updates.firstName;
    if (updates.lastName) userUpdates.last_name = updates.lastName;
    if (updates.phone) userUpdates.phone = updates.phone;

    if (updates.city) donorUpdates.city = updates.city;
    if (updates.weightKg !== undefined) donorUpdates.weight_kg = updates.weightKg;
    if (updates.bloodType) donorUpdates.blood_type = updates.bloodType;
    if (updates.gender) donorUpdates.gender = updates.gender;
    if (updates.latitude !== undefined) donorUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) donorUpdates.longitude = updates.longitude;

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from("users").update(userUpdates).eq("id", profile.userId);
    }
    if (Object.keys(donorUpdates).length > 0) {
      await supabase.from("donors").update(donorUpdates).eq("id", profile.id);
    }
  };

  // ─── Appointment methods ──────────────────────────────────────────────────

  const addAppointment = async (a: Appointment): Promise<string> => {
    // Normalize "25 Apr 2026" → "2026-04-25"
    const MONTH_MAP: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    let isoDate = a.date;
    const dateParts = a.date.match(/(\d+)\s+(\w+)\s+(\d+)/);
    if (dateParts) {
      const day = dateParts[1].padStart(2, "0");
      const month = MONTH_MAP[dateParts[2]] || "01";
      const year = dateParts[3];
      isoDate = `${year}-${month}-${day}`;
    }

    // Normalize "09:00 AM" → "09:00:00"
    let time24 = a.time;
    const timeParts = a.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1]);
      const mins = timeParts[2];
      const ampm = timeParts[3].toUpperCase();
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      time24 = `${String(hours).padStart(2, "0")}:${mins}:00`;
    }

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        donor_id: profile?.id,
        facility_id: a.hospitalId,
        appointment_date: isoDate,
        appointment_time: time24,
        status: "booked",
        ticket_code: a.fileNumber,
        notes: a.notes || null,
      })
      .select()
      .single();

    if (!error && data) {
      setAppointments((prev) => [{ ...a, id: data.id }, ...prev]);
      return data.id;
    } else {
      console.error("Appointment insert error:", error);
      setAppointments((prev) => [a, ...prev]);
      return a.id;
    }
  };

  const cancelAppointment = async (id: string) => {
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" as const } : a))
    );
  };

  // ─── Notification methods ─────────────────────────────────────────────────

  const markNotificationRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = async () => {
    if (!profile) return;
    await supabase.from("notifications").update({ is_read: true }).eq("donor_id", profile.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ─── Misc ─────────────────────────────────────────────────────────────────

  const completeOnboarding = async () => {
    setIsOnboarded(true);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadUserData(session.user.id);
  };

  const refreshAppointments = async () => {
    if (!profile) return;
    await loadAppointments(profile.id, profile.bloodType || "O+");
  };

  const refreshFacilities = async () => {
    await loadFacilities();
  };

  const addDonation = (d: Donation) => {
    setDonations((prev) => [d, ...prev]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        profile,
        donations,
        appointments,
        notifications,
        facilities,
        isOnboarded,
        isLoggedIn,
        isLoading,
        session,
        setProfile,
        updateProfile,
        addDonation,
        addAppointment,
        cancelAppointment,
        markNotificationRead,
        markAllNotificationsRead,
        completeOnboarding,
        signUp,
        login,
        logout,
        unreadCount,
        refreshProfile,
        refreshAppointments,
        refreshFacilities,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function generateAppointmentFileNumber() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `#${num}`;
}
