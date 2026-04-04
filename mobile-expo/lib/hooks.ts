import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Hospital } from "@/constants/hospitals";
import type { UrgentCase, UrgencyLevel } from "@/constants/urgent";

/**
 * Fetch facilities + their inventory from Supabase, mapped to the Hospital shape.
 */
export function useHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHospitals();
  }, []);

  async function loadHospitals() {
    const [facRes, invRes] = await Promise.all([
      supabase.from("facilities").select("*").order("name"),
      supabase.from("facility_inventory").select("facility_id, blood_type, units"),
    ]);

    if (facRes.data) {
      const invMap = new Map<string, { type: string; units: number }[]>();
      for (const row of invRes.data || []) {
        if (!invMap.has(row.facility_id)) invMap.set(row.facility_id, []);
        invMap.get(row.facility_id)!.push({ type: row.blood_type, units: row.units });
      }

      const mapped: Hospital[] = facRes.data.map((f: any) => {
        const inv = invMap.get(f.id) || [];
        const bloodNeeds = inv.map((i) => ({
          type: i.type,
          level: unitsToLevel(i.units),
        }));

        return {
          id: f.id,
          name: f.name,
          address: f.address || "",
          city: f.city || "",
          phone: f.phone || "",
          distance: 0, // Calculated client-side with user location
          bloodNeeds,
          coordinates: { lat: f.latitude, lng: f.longitude },
          openHours: f.working_hours || "8:00 AM - 6:00 PM",
          availableSlots: generateTimeSlots(),
        };
      });

      setHospitals(mapped);
    }
    setLoading(false);
  }

  return { hospitals, loading, refresh: loadHospitals };
}

/**
 * Fetch open blood_requests from Supabase, mapped to UrgentCase shape.
 */
export function useUrgentCases() {
  const [cases, setCases] = useState<UrgentCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases() {
    const { data } = await supabase
      .from("blood_requests")
      .select("*, facilities(name, city, latitude, longitude)")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      const mapped: UrgentCase[] = data.map((r: any) => ({
        id: r.id,
        patientName: r.patient_name || "Unknown Patient",
        fileNumber: r.patient_file_no || `#${Math.floor(100000 + Math.random() * 900000)}`,
        hospitalName: r.facilities?.name || "Unknown Hospital",
        hospitalId: r.facility_id,
        city: r.facilities?.city || "Amman",
        distanceKm: 0, // Calculated client-side
        bloodType: r.blood_type,
        urgency: mapUrgency(r.urgency),
        cause: r.cause || r.notes || "Blood needed",
        unitsNeeded: r.units_needed || 1,
        postedAt: r.created_at,
      }));
      setCases(mapped);
    }
    setLoading(false);
  }

  return { cases, loading, refresh: loadCases };
}

function mapUrgency(dbUrgency: string): UrgencyLevel {
  switch (dbUrgency) {
    case "critical": return "critical";
    case "urgent": return "urgent";
    default: return "pending";
  }
}

function unitsToLevel(units: number): "critical" | "low" | "moderate" | "adequate" {
  if (units <= 5) return "critical";
  if (units <= 10) return "low";
  if (units <= 20) return "moderate";
  return "adequate";
}

function generateTimeSlots(): string[] {
  return ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"];
}

/**
 * Calculate distance between two coordinates using Haversine formula.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
