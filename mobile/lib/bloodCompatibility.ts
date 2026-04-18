import type { BloodType } from "@/context/AppContext";

// Standard ABO/Rh donor → recipient compatibility.
// If a donor has type X, they can give to everyone listed under X.
// Rh-negative donors can give to both Rh+ and Rh- of their ABO group;
// Rh-positive donors can only give to Rh+ recipients.
// O- is the universal donor (only to O-/O+/A-/A+/B-/B+/AB-/AB+ = all).
// AB+ is the universal recipient (can receive from all).
const DONATES_TO: Record<BloodType, BloodType[]> = {
  "O-":  ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+":  ["O+", "A+", "B+", "AB+"],
  "A-":  ["A-", "A+", "AB-", "AB+"],
  "A+":  ["A+", "AB+"],
  "B-":  ["B-", "B+", "AB-", "AB+"],
  "B+":  ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// Can a donor of `donor` blood type give to a recipient needing `recipient` blood type?
export function canDonate(donor: BloodType | null | undefined, recipient: BloodType | string): boolean {
  if (!donor) return true; // unknown donor type — don't warn, we just don't know yet
  const list = DONATES_TO[donor];
  return list ? list.includes(recipient as BloodType) : false;
}

// Can this donor fulfill a request that accepts ANY of these blood types?
export function canDonateToAny(donor: BloodType | null | undefined, requested: (BloodType | string)[]): boolean {
  if (!donor) return true;
  if (!requested || requested.length === 0) return true;
  return requested.some((r) => canDonate(donor, r));
}

// Short warning text for a request the donor cannot fulfill.
// Use when displaying an incompatible request.
export function incompatibilityNote(donor: BloodType | null | undefined, requested: string[]): string | null {
  if (!donor) return null;
  if (canDonateToAny(donor, requested)) return null;
  const list = requested.join(", ");
  return `Your ${donor} blood is not compatible with this request (${list} needed).`;
}
