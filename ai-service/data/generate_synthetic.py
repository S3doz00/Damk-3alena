"""
Generate synthetic blood donation data for training AI models.
3 years of weekly data for 20 facilities across 4 Jordanian regions.
Includes Ramadan effects, public holidays, and regionally-correlated emergency spikes.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

np.random.seed(42)

# ── Facilities ────────────────────────────────────────────────────────────────
FACILITIES = [
    # Amman (8)
    {'facility_idx': 0,  'name': 'King Hussein Medical Center',      'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 1,  'name': 'Jordan University Hospital',        'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 2,  'name': 'Al-Bashir Hospital',                'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 3,  'name': 'Amman Blood Bank',                  'region': 'amman',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 4,  'name': 'Islamic Hospital Amman',            'region': 'amman',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 5,  'name': 'Specialty Hospital Amman',          'region': 'amman',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 6,  'name': 'Amman East Clinic',                 'region': 'amman',    'size': 'small',  'facility_type': 'clinic'},
    {'facility_idx': 7,  'name': 'Amman West Clinic',                 'region': 'amman',    'size': 'small',  'facility_type': 'clinic'},
    # Irbid (4)
    {'facility_idx': 8,  'name': 'King Abdullah University Hospital',  'region': 'irbid',   'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 9,  'name': 'Irbid Blood Bank',                  'region': 'irbid',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 10, 'name': 'Princess Basma Hospital',           'region': 'irbid',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 11, 'name': 'Irbid North Clinic',                'region': 'irbid',    'size': 'small',  'facility_type': 'clinic'},
    # Zarqa (4)
    {'facility_idx': 12, 'name': 'Prince Hashem Military Hospital',   'region': 'zarqa',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 13, 'name': 'Zarqa Blood Bank',                  'region': 'zarqa',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 14, 'name': 'Zarqa Government Hospital',         'region': 'zarqa',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 15, 'name': 'Zarqa East Clinic',                 'region': 'zarqa',    'size': 'small',  'facility_type': 'clinic'},
    # Southern (4)
    {'facility_idx': 16, 'name': 'Aqaba Government Hospital',         'region': 'southern', 'size': 'small',  'facility_type': 'hospital'},
    {'facility_idx': 17, 'name': 'Karak Government Hospital',         'region': 'southern', 'size': 'small',  'facility_type': 'hospital'},
    {'facility_idx': 18, 'name': "Ma'an Government Hospital",         'region': 'southern', 'size': 'small',  'facility_type': 'hospital'},
    {'facility_idx': 19, 'name': 'Southern Blood Bank',               'region': 'southern', 'size': 'small',  'facility_type': 'blood_bank'},
]

# ── Blood types (Jordan-realistic distribution) ───────────────────────────────
BLOOD_TYPE_DIST = {
    'O+': 0.380, 'A+': 0.300, 'B+': 0.140, 'AB+': 0.060,
    'O-': 0.060, 'A-': 0.040, 'B-': 0.015, 'AB-': 0.005,
}
BLOOD_TYPES = list(BLOOD_TYPE_DIST.keys())

# ── Scale ─────────────────────────────────────────────────────────────────────
START_DATE = datetime(2022, 4, 1)
NUM_WEEKS  = 156   # 3 years

SIZE_MULTIPLIER = {'large': 2.0, 'medium': 1.0, 'small': 0.5}
TYPE_MULTIPLIER = {'hospital': 1.2, 'blood_bank': 1.0, 'clinic': 0.6}

# ── Ramadan periods (Gregorian approximate) ───────────────────────────────────
RAMADAN_PERIODS = [
    (datetime(2022, 4,  2), datetime(2022, 5,  1)),
    (datetime(2023, 3, 23), datetime(2023, 4, 21)),
    (datetime(2024, 3, 11), datetime(2024, 4,  9)),
    (datetime(2025, 3,  1), datetime(2025, 3, 29)),
]

# ── Jordanian public holidays ─────────────────────────────────────────────────
_HOLIDAY_DATES = [
    # 2022 — Eid Al-Fitr, Eid Al-Adha, Independence Day, Army Day
    '2022-05-02', '2022-05-03',
    '2022-07-09', '2022-07-10',
    '2022-05-25', '2022-06-10',
    # 2023
    '2023-04-21', '2023-04-22',
    '2023-06-28', '2023-06-29',
    '2023-05-25', '2023-06-10',
    # 2024
    '2024-04-10', '2024-04-11',
    '2024-06-17', '2024-06-18',
    '2024-05-25', '2024-06-10',
    # 2025
    '2025-03-30', '2025-03-31',
    '2025-06-07', '2025-06-08',
    '2025-05-25', '2025-06-10',
]
HOLIDAY_DATES = {datetime.strptime(d, '%Y-%m-%d') for d in _HOLIDAY_DATES}


def is_ramadan_week(dt: datetime) -> bool:
    """Return True if the given date falls within a Ramadan period."""
    for start, end in RAMADAN_PERIODS:
        if start <= dt <= end:
            return True
    return False


def is_holiday_week(dt: datetime) -> bool:
    """Return True if the week starting at dt contains a Jordanian public holiday."""
    week_end = dt + timedelta(days=6)
    current = dt
    while current <= week_end:
        if current in HOLIDAY_DATES:
            return True
        current += timedelta(days=1)
    return False


def generate_weekly_data() -> pd.DataFrame:
    """Generate 3 years of weekly blood donation/consumption data for 20 facilities."""
    rows = []

    # Pre-compute which weeks have a regional emergency spike
    regions = list({f['region'] for f in FACILITIES})
    region_spike_weeks: dict[str, set] = {r: set() for r in regions}
    rng = np.random.RandomState(42)
    for week_num in range(NUM_WEEKS):
        for region in regions:
            if rng.random() < 0.03:
                region_spike_weeks[region].add(week_num)

    for facility in FACILITIES:
        idx    = facility['facility_idx']
        size   = facility['size']
        ftype  = facility['facility_type']
        region = facility['region']

        size_mult = SIZE_MULTIPLIER[size]
        type_mult = TYPE_MULTIPLIER[ftype]

        # Starting inventory: 3 weeks of base stock per blood type
        inventory: dict[str, int] = {}
        for blood_type in BLOOD_TYPES:
            base = BLOOD_TYPE_DIST[blood_type] * 20 * size_mult * type_mult
            inventory[blood_type] = int(base * 3)

        fac_rng = np.random.RandomState(idx * 100)

        for week_num in range(NUM_WEEKS):
            week_start = START_DATE + timedelta(weeks=week_num)
            month   = week_start.month
            ramadan = is_ramadan_week(week_start)
            holiday = is_holiday_week(week_start)
            regional_spike = week_num in region_spike_weeks[region]

            # Seasonal demand factor
            seasonal = 1.0
            if month in [6, 7, 8]:  seasonal = 1.25   # summer emergencies
            elif month in [12, 1]:  seasonal = 1.15   # winter flu season
            elif ramadan:           seasonal = 0.95   # deferred elective surgery

            # Donation multiplier
            donation_factor = 1.0
            if ramadan:  donation_factor *= 0.70   # fasting reduces willingness
            if holiday:  donation_factor *= 0.60   # holiday closures

            for blood_type in BLOOD_TYPES:
                bt_weight   = BLOOD_TYPE_DIST[blood_type]
                base_demand = bt_weight * 20 * size_mult * type_mult

                donated  = max(1, int(base_demand * donation_factor * (1 + fac_rng.normal(0, 0.12))))

                demand_noise = fac_rng.normal(0, 0.18)
                consumed = max(1, int(base_demand * seasonal * (1 + demand_noise) * 1.05))

                # Emergency spikes
                if fac_rng.random() < 0.03:
                    consumed = int(consumed * fac_rng.uniform(1.5, 2.5))
                elif regional_spike:
                    consumed = int(consumed * 1.20)

                inventory[blood_type] = max(0, inventory[blood_type] + donated - consumed)

                rows.append({
                    'facility_idx':    idx,
                    'facility_id':     f"facility_{idx}",
                    'name':            facility['name'],
                    'region':          region,
                    'size':            size,
                    'facility_type':   ftype,
                    'blood_type':      blood_type,
                    'week_start':      week_start.strftime('%Y-%m-%d'),
                    'week_num':        week_num,
                    'month':           month,
                    'is_ramadan':      int(ramadan),
                    'is_holiday':      int(holiday),
                    'units_donated':   donated,
                    'units_consumed':  consumed,
                    'ending_inventory': inventory[blood_type],
                })

    return pd.DataFrame(rows)


def generate_donor_data(num_donors: int = 500) -> pd.DataFrame:
    """Generate synthetic donor profiles with realistic Jordanian coordinates."""
    rows = []
    cities       = ['Amman', 'Irbid', 'Zarqa', 'Salt', 'Aqaba', 'Karak', "Ma'an"]
    city_weights = [0.45, 0.15, 0.15, 0.08, 0.07, 0.05, 0.05]
    city_coords  = {
        'Amman':  (31.95, 35.91, 0.05),
        'Irbid':  (32.55, 35.85, 0.03),
        'Zarqa':  (32.07, 36.09, 0.03),
        'Salt':   (32.04, 35.73, 0.02),
        'Aqaba':  (29.53, 35.01, 0.02),
        'Karak':  (31.19, 35.70, 0.02),
        "Ma'an":  (30.20, 35.73, 0.02),
    }

    for i in range(num_donors):
        city = np.random.choice(cities, p=city_weights)
        lat_c, lng_c, spread = city_coords[city]

        blood_type      = np.random.choice(BLOOD_TYPES, p=list(BLOOD_TYPE_DIST.values()))
        total_donations = np.random.choice(
            [0, 1, 2, 3, 5, 8, 12],
            p=[0.30, 0.20, 0.15, 0.12, 0.10, 0.08, 0.05]
        )

        if total_donations > 0:
            days_since    = np.random.randint(10, 365)
            last_donation = (datetime.now() - timedelta(days=days_since)).strftime('%Y-%m-%d')
            is_eligible   = days_since >= 56
        else:
            last_donation = None
            is_eligible   = True

        rows.append({
            'donor_id':        f"donor_{i}",
            'blood_type':      blood_type,
            'gender':          np.random.choice(['male', 'female'], p=[0.65, 0.35]),
            'age':             np.random.randint(18, 60),
            'city':            city,
            'latitude':        lat_c + np.random.normal(0, spread),
            'longitude':       lng_c + np.random.normal(0, spread),
            'total_donations': total_donations,
            'last_donation':   last_donation,
            'is_eligible':     is_eligible,
        })

    return pd.DataFrame(rows)


if __name__ == '__main__':
    out_dir = os.path.dirname(__file__)

    print("Generating synthetic weekly donation data...")
    weekly_df   = generate_weekly_data()
    weekly_path = os.path.join(out_dir, 'synthetic_donations.csv')
    weekly_df.to_csv(weekly_path, index=False)
    print(f"  Saved {len(weekly_df):,} rows  →  {weekly_path}")
    print(f"  Facilities: 20 | Blood types: {len(BLOOD_TYPES)} | Weeks: {NUM_WEEKS} (3 years)")

    print("\nSaving facility metadata...")
    fac_df   = pd.DataFrame(FACILITIES)
    fac_path = os.path.join(out_dir, 'synthetic_facilities.csv')
    fac_df.to_csv(fac_path, index=False)
    print(f"  Saved {len(fac_df)} facilities  →  {fac_path}")

    print("\nGenerating synthetic donor data...")
    donor_df   = generate_donor_data(500)
    donor_path = os.path.join(out_dir, 'synthetic_donors.csv')
    donor_df.to_csv(donor_path, index=False)
    print(f"  Saved {len(donor_df)} donors  →  {donor_path}")

    print("\nDone!")
