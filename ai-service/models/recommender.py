"""
Donor recommendation engine.
Weighted scoring function that matches donors to blood requests.
"""

import math


# Blood type compatibility matrix (donor -> can donate to)
COMPATIBILITY = {
    'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],  # universal donor
    'O+':  ['O+', 'A+', 'B+', 'AB+'],
    'A-':  ['A-', 'A+', 'AB-', 'AB+'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B-', 'B+', 'AB-', 'AB+'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
}


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two coordinates."""
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def is_compatible(donor_type: str, request_type: str) -> bool:
    """Check if donor blood type is compatible with request."""
    return request_type in COMPATIBILITY.get(donor_type, [])


def compute_donor_score(
    donor: dict,
    request_blood_type: str,
    facility_lat: float,
    facility_lng: float,
) -> dict | None:
    """
    Score a single donor for a blood request.

    Args:
        donor: {blood_type, latitude, longitude, is_eligible, total_donations, last_donation}
        request_blood_type: The blood type needed
        facility_lat/facility_lng: Hospital coordinates

    Returns:
        {donor_id, score, distance_km, is_eligible, blood_compatible, reasoning} or None
    """
    score = 0.0
    reasons = []

    # Blood type compatibility (max 40 points)
    exact_match = donor['blood_type'] == request_blood_type
    compatible = is_compatible(donor['blood_type'], request_blood_type)

    if exact_match:
        score += 40
        reasons.append(f"Exact blood type match ({donor['blood_type']})")
    elif compatible:
        score += 20
        reasons.append(f"Compatible donor ({donor['blood_type']} -> {request_blood_type})")
    else:
        return None  # Incompatible, skip

    # Eligibility (max 25 points)
    if not donor.get('is_eligible', False):
        return None  # Not eligible, skip
    score += 25
    reasons.append("Eligible to donate")

    # Proximity (max 20 points)
    distance = haversine_km(
        donor.get('latitude', 0), donor.get('longitude', 0),
        facility_lat, facility_lng
    )
    if distance <= 5:
        score += 20
        reasons.append(f"{distance:.1f}km away (very close)")
    elif distance <= 15:
        score += 15
        reasons.append(f"{distance:.1f}km away (nearby)")
    elif distance <= 30:
        score += 10
        reasons.append(f"{distance:.1f}km away (moderate)")
    elif distance <= 50:
        score += 5
        reasons.append(f"{distance:.1f}km away")
    else:
        reasons.append(f"{distance:.1f}km away (far)")

    # Donation history / reliability (max 15 points)
    total = donor.get('total_donations', 0)
    if total >= 5:
        score += 15
        reasons.append(f"Highly reliable ({total} donations)")
    elif total >= 3:
        score += 10
        reasons.append(f"Regular donor ({total} donations)")
    elif total >= 1:
        score += 5
        reasons.append(f"Has donated before ({total} donations)")
    else:
        reasons.append("First-time donor")

    return {
        'donor_id': donor['donor_id'],
        'score': round(score, 1),
        'distance_km': round(distance, 1),
        'is_eligible': True,
        'blood_compatible': True,
        'reasoning': '. '.join(reasons)
    }


def recommend_donors(
    request_blood_type: str,
    facility_lat: float,
    facility_lng: float,
    donors: list[dict],
    top_n: int = 20,
) -> list[dict]:
    """
    Rank and return the best donor matches for a blood request.

    Args:
        request_blood_type: Blood type needed
        facility_lat/facility_lng: Hospital coordinates
        donors: List of donor dicts
        top_n: Number of recommendations to return

    Returns:
        Sorted list of top recommendations.
    """
    scored = []
    for donor in donors:
        result = compute_donor_score(donor, request_blood_type, facility_lat, facility_lng)
        if result is not None:
            scored.append(result)

    # Sort by score descending
    scored.sort(key=lambda x: x['score'], reverse=True)
    return scored[:top_n]
