import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Gender = "male" | "female";

export interface DonorProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  nationalId: string;
  email: string;
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
  setProfile: (p: DonorProfile) => void;
  updateProfile: (updates: Partial<DonorProfile>) => void;
  addDonation: (d: Donation) => void;
  addAppointment: (a: Appointment) => Promise<string>;
  cancelAppointment: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  completeOnboarding: () => void;
  signUp: (
    email: string,
    password: string,
    profileData: {
      firstName: string;
      lastName: string;
      phone: string;
      nationalId: string;
      bloodType: BloodType;
      gender: Gender;
      dateOfBirth: string;
      city: string;
      weightKg?: number;
    }
  ) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
  verifySignupOtp: (
    email: string,
    token: string
  ) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  unreadCount: number;
  refreshFacilities: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfileState] = useState<DonorProfile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Store pending signup profile data for OTP verification flow
  const pendingSignupRef = useRef<{
    authUserId: string;
    profileData: {
      firstName: string;
      lastName: string;
      phone: string;
      nationalId: string;
      bloodType: BloodType;
      gender: Gender;
      dateOfBirth: string;
      city: string;
      weightKg?: number;
    };
  } | null>(null);

  // Track whether we're in a password recovery flow — skip auto-login redirect
  const isRecoveringPasswordRef = useRef(false);

  // ─── Listen to auth state ──────────────────────────────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        setIsLoggedIn(true);
        loadUserData(s.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      // During password recovery, Supabase creates a session but the user
      // still needs to set a new password — don't mark as logged in yet
      if (event === "PASSWORD_RECOVERY") {
        isRecoveringPasswordRef.current = true;
        setSession(s);
        return;
      }

      // After the user updates their password, clear the recovery flag
      if (event === "USER_UPDATED" && isRecoveringPasswordRef.current) {
        isRecoveringPasswordRef.current = false;
        // Sign out so they can log in fresh with the new password
        supabase.auth.signOut();
        return;
      }

      setSession(s);
      if (s) {
        setIsLoggedIn(true);
        loadUserData(s.user.id);
      } else {
        setIsLoggedIn(false);
        setProfileState(null);
        setDonations([]);
        setAppointments([]);
        setNotifications([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Load facilities (public) ──────────────────────────────────────
  useEffect(() => {
    loadFacilities();
  }, []);

  async function loadFacilities() {
    const { data: facs } = await supabase
      .from("facilities")
      .select("*")
      .order("name");

    if (!facs) return;

    // Get inventory for all facilities
    const { data: inv } = await supabase
      .from("facility_inventory")
      .select("*");

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

  // ─── Load user data ────────────────────────────────────────────────
  async function loadUserData(authId: string) {
    try {
      // Get user row
      const { data: userRow } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", authId)
        .single();

      if (!userRow) {
        setIsLoading(false);
        return;
      }

      // Get donor row
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
          email: userRow.email || "",
          bloodType: donorRow.blood_type,
          gender: donorRow.gender,
          dateOfBirth: donorRow.birth_date,
          phone: userRow.phone || "",
          city: donorRow.city || "",
          weightKg: donorRow.weight_kg ? Number(donorRow.weight_kg) : undefined,
          lastDonationDate: donorRow.last_donation || null,
          isEligible: donorRow.is_eligible ?? true,
          totalDonations: donorRow.total_donations ?? 0,
          avatarInitials: (userRow.first_name[0] + userRow.last_name[0]).toUpperCase(),
          latitude: donorRow.latitude,
          longitude: donorRow.longitude,
        };
        setProfileState(p);

        // Load appointments
        await loadAppointments(donorRow.id);

        // Load donations
        await loadDonations(donorRow.id);

        // Load notifications
        await loadNotifications(donorRow.id);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
    setIsLoading(false);
  }

  async function loadAppointments(donorId: string) {
    // Purge expired 'booked' appointments (date in the past, never completed).
    // Best-effort — if RLS blocks DELETE, we still filter them out of local state below.
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("appointments")
      .delete()
      .eq("donor_id", donorId)
      .eq("status", "booked")
      .lt("appointment_date", today);

    const { data } = await supabase
      .from("appointments")
      .select("*, facilities(name, address)")
      .eq("donor_id", donorId)
      .order("appointment_date", { ascending: false });

    if (data) {
      const mapped: Appointment[] = data
        .map((a: any) => ({
          id: a.id,
          fileNumber: a.ticket_code || `#${a.id.slice(0, 6).toUpperCase()}`,
          hospitalId: a.facility_id,
          hospitalName: a.facilities?.name || "Unknown",
          hospitalAddress: a.facilities?.address || "",
          date: a.appointment_date,
          time: a.appointment_time,
          status: a.status === "booked" ? "upcoming" : a.status,
          bloodType: profile?.bloodType || "O+",
        }))
        // Safety net: drop any past 'upcoming' appointments that survived the DELETE
        // (e.g. RLS denied, offline, or clock skew).
        .filter((a) => !(a.status === "upcoming" && a.date < today));
      setAppointments(mapped);
    }
  }

  async function loadDonations(donorId: string) {
    const { data } = await supabase
      .from("donation_records")
      .select("*, facilities(name, city)")
      .eq("donor_id", donorId)
      .order("donation_date", { ascending: false });

    if (data) {
      const mapped: Donation[] = data.map((d: any) => ({
        id: d.id,
        date: d.donation_date,
        hospitalName: d.facilities?.name || "Unknown",
        hospitalCity: d.facilities?.city || "",
        bloodType: d.blood_type,
        units: d.units,
        status: "completed",
      }));
      setDonations(mapped);
    }
  }

  async function loadNotifications(donorId: string) {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("donor_id", donorId)
      .order("sent_at", { ascending: false });

    if (data) {
      const mapped: Notification[] = data.map((n: any) => ({
        id: n.id,
        type: n.type || "shortage",
        title: n.title,
        body: n.body,
        timestamp: n.sent_at,
        read: n.is_read ?? false,
        urgency: n.urgency || "medium",
      }));
      setNotifications(mapped);
    }
  }

  // ─── Auth methods ──────────────────────────────────────────────────

  const signUp = async (
    email: string,
    password: string,
    profileData: {
      firstName: string;
      lastName: string;
      phone: string;
      nationalId: string;
      bloodType: BloodType;
      gender: Gender;
      dateOfBirth: string;
      city: string;
      weightKg?: number;
    }
  ): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> => {
    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phone,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "Sign up failed. Please try again." };
      }

      // If email confirmation is enabled, user won't have a session yet
      if (!authData.session && !authData.user.confirmed_at) {
        pendingSignupRef.current = { authUserId: authData.user.id, profileData };
        return { success: true, needsVerification: true };
      }

      // 2. Wait for trigger to create user row — retry up to 5 times
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
        return { success: false, error: "Account created but profile setup timed out. Please try logging in." };
      }

      // 3. Update user row with phone
      await supabase
        .from("users")
        .update({ phone: profileData.phone })
        .eq("id", userRow.id);

      // 4. Create donor profile (upsert to handle retries)
      const { error: donorError } = await supabase.from("donors").upsert({
        user_id: userRow.id,
        national_id: profileData.nationalId,
        blood_type: profileData.bloodType,
        gender: profileData.gender,
        birth_date: profileData.dateOfBirth,
        city: profileData.city,
        weight_kg: profileData.weightKg || null,
      }, { onConflict: "user_id" });

      if (donorError) {
        console.error("Donor insert error:", donorError);
        return { success: false, error: "Account created but could not save health info: " + donorError.message };
      }

      // Load profile now that all records exist
      await loadUserData(authData.user.id);
      return { success: true };
    } catch (err: any) {
      console.error("Signup error:", err);
      return { success: false, error: err.message || "Something went wrong." };
    }
  };

  const verifySignupOtp = async (
    email: string,
    token: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (otpError) {
        return { success: false, error: otpError.message };
      }

      if (!data.user) {
        return { success: false, error: "Verification failed. Please try again." };
      }

      const pending = pendingSignupRef.current;
      if (!pending) {
        // No pending data — user might have restarted, just log them in
        await loadUserData(data.user.id);
        return { success: true };
      }

      // Complete profile setup: wait for trigger to create user row
      let userRow: any = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        await new Promise((r) => setTimeout(r, 800 + attempt * 500));
        const { data: row } = await supabase
          .from("users")
          .select("id")
          .eq("auth_id", data.user.id)
          .single();
        if (row) {
          userRow = row;
          break;
        }
      }

      if (!userRow) {
        return { success: false, error: "Verified but profile setup timed out. Please try logging in." };
      }

      // Update user row with phone
      await supabase
        .from("users")
        .update({ phone: pending.profileData.phone })
        .eq("id", userRow.id);

      // Check for national_id collision on a DIFFERENT user before insert
      const { data: existingDonor } = await supabase
        .from("donors")
        .select("user_id")
        .eq("national_id", pending.profileData.nationalId)
        .maybeSingle();

      if (existingDonor && existingDonor.user_id !== userRow.id) {
        return {
          success: false,
          error: "This national ID is already registered to another account. Please log in with your existing account instead.",
        };
      }

      // Create donor profile (upsert to handle retries for same user)
      const { error: donorError } = await supabase.from("donors").upsert({
        user_id: userRow.id,
        national_id: pending.profileData.nationalId,
        blood_type: pending.profileData.bloodType,
        gender: pending.profileData.gender,
        birth_date: pending.profileData.dateOfBirth,
        city: pending.profileData.city,
        weight_kg: pending.profileData.weightKg || null,
      }, { onConflict: "user_id" });

      if (donorError) {
        console.error("Donor insert error after OTP:", donorError);
        if (donorError.code === "23505" && donorError.message.includes("national_id")) {
          return {
            success: false,
            error: "This national ID is already registered. Please log in with your existing account.",
          };
        }
        return { success: false, error: "Verified but could not save profile: " + donorError.message };
      }

      pendingSignupRef.current = null;
      await loadUserData(data.user.id);
      return { success: true };
    } catch (err: any) {
      console.error("OTP verify error:", err);
      return { success: false, error: err.message || "Something went wrong." };
    }
  };

  const login = async (
    identifier: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      let email = identifier;

      // If identifier doesn't contain @, treat as phone number
      if (!identifier.includes("@")) {
        // Normalize: strip spaces, ensure +962 prefix
        let phone = identifier.replace(/[\s\-()]/g, "");
        if (!phone.startsWith("+962")) {
          phone = "+962" + phone.replace(/^0+/, "");
        }
        // Look up email by phone from users table
        const { data, error: lookupError } = await supabase
          .from("users")
          .select("email")
          .eq("phone", phone)
          .limit(1)
          .single();

        if (lookupError || !data?.email) {
          return { success: false, error: "No account found with this phone number." };
        }
        email = data.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
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

  // ─── CRUD methods ──────────────────────────────────────────────────

  const setProfile = async (p: DonorProfile) => {
    setProfileState(p);
  };

  const updateProfile = async (updates: Partial<DonorProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    if (updates.firstName || updates.lastName) {
      updated.name = `${updated.firstName} ${updated.lastName}`;
      updated.avatarInitials = (updated.firstName[0] + updated.lastName[0]).toUpperCase();
    }
    setProfileState(updated);

    // Update in Supabase
    const userUpdates: any = {};
    const donorUpdates: any = {};

    if (updates.firstName) userUpdates.first_name = updates.firstName;
    if (updates.lastName) userUpdates.last_name = updates.lastName;
    if (updates.phone) userUpdates.phone = updates.phone;
    if (updates.email) userUpdates.email = updates.email;

    if (updates.city) donorUpdates.city = updates.city;
    if (updates.weightKg !== undefined) donorUpdates.weight_kg = updates.weightKg;
    if (updates.bloodType) donorUpdates.blood_type = updates.bloodType;
    if (updates.gender) donorUpdates.gender = updates.gender;

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from("users").update(userUpdates).eq("id", profile.userId);
    }
    if (Object.keys(donorUpdates).length > 0) {
      await supabase.from("donors").update(donorUpdates).eq("id", profile.id);
    }
  };

  const addDonation = (d: Donation) => {
    setDonations((prev) => [d, ...prev]);
  };

  const addAppointment = async (a: Appointment): Promise<string> => {
    // Convert human date "25 Apr 2026" to ISO "2026-04-25"
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

    // Convert "09:00 AM" to "09:00:00"
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

    // Insert into Supabase
    const { data, error } = await supabase.from("appointments").insert({
      donor_id: profile?.id,
      facility_id: a.hospitalId,
      appointment_date: isoDate,
      appointment_time: time24,
      ticket_code: a.fileNumber,
      status: "booked",
    }).select().single();

    if (!error && data) {
      const newAppointment = { ...a, id: data.id };
      setAppointments((prev) => [newAppointment, ...prev]);
      return data.id;
    } else {
      console.error("Appointment insert error:", error);
      // Fallback to local state
      setAppointments((prev) => [a, ...prev]);
      return a.id;
    }
  };

  const cancelAppointment = async (id: string) => {
    await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" as const } : a))
    );
  };

  const markNotificationRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = async () => {
    if (!profile) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("donor_id", profile.id);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const completeOnboarding = async () => {
    setIsOnboarded(true);
  };

  const refreshFacilities = async () => {
    await loadFacilities();
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
        verifySignupOtp,
        login,
        logout,
        unreadCount,
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
