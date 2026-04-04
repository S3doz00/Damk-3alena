# AI XGBoost Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the RandomForest forecaster with XGBoost quantile regression trained on 24,960 rows of Jordan-realistic synthetic data with Ramadan, holiday, and regional spike patterns.

**Architecture:** Rewrite `generate_synthetic.py` (20 facilities, 3 years, realistic seasonality), rewrite `forecaster.py` (XGBoost with 14 features, walk-forward validation, quantile confidence intervals), regenerate data and retrain. No changes to FastAPI endpoints or dashboard.

**Tech Stack:** Python 3.14, XGBoost 2.x, scikit-learn, pandas, numpy, pytest

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `ai-service/requirements.txt` | Modify | Add xgboost>=2.0, pytest |
| `ai-service/data/generate_synthetic.py` | Rewrite | 20 facilities, 3 years, Ramadan/holiday flags, regional spikes |
| `ai-service/models/forecaster.py` | Rewrite | XGBoost q10/q50/q90, 14 features, walk-forward split, facility lookup |
| `ai-service/tests/__init__.py` | Create | Empty — makes tests a package |
| `ai-service/tests/test_data_generation.py` | Create | Tests for synthetic data shape, Ramadan flag, holiday flag |
| `ai-service/tests/test_forecaster.py` | Create | Tests for train(), predict(), confidence interval ordering |
| `ai-service/AI_MODEL.md` | Create | Full model documentation |

---

## Task 1: Add Dependencies

**Files:**
- Modify: `ai-service/requirements.txt`

- [ ] **Step 1: Update requirements.txt**

Replace the file contents with:

```
fastapi==0.115.6
uvicorn==0.34.0
scikit-learn==1.6.1
pandas==2.2.3
numpy==2.2.1
pydantic==2.10.4
httpx==0.28.1
python-dotenv==1.0.1
xgboost>=2.0
pytest>=8.0
```

- [ ] **Step 2: Install in venv**

```bash
cd ai-service
source venv/bin/activate
pip install "xgboost>=2.0" "pytest>=8.0"
```

Expected output: `Successfully installed xgboost-...`

- [ ] **Step 3: Verify install**

```bash
python -c "import xgboost; print(xgboost.__version__)"
```

Expected: version string starting with `2.`

- [ ] **Step 4: Create tests package**

```bash
mkdir -p ai-service/tests
touch ai-service/tests/__init__.py
```

- [ ] **Step 5: Commit**

```bash
git add ai-service/requirements.txt ai-service/tests/__init__.py
git commit -m "feat(ai): add xgboost and pytest dependencies"
```

---

## Task 2: Write Tests for Data Generation

**Files:**
- Create: `ai-service/tests/test_data_generation.py`

- [ ] **Step 1: Write the tests**

Create `ai-service/tests/test_data_generation.py`:

```python
"""Tests for synthetic data generation."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pandas as pd
import pytest
from data.generate_synthetic import (
    generate_weekly_data,
    generate_donor_data,
    FACILITIES,
    BLOOD_TYPES,
    NUM_WEEKS,
    is_ramadan_week,
    is_holiday_week,
)


def test_weekly_data_row_count():
    df = generate_weekly_data()
    expected = len(FACILITIES) * len(BLOOD_TYPES) * NUM_WEEKS
    assert len(df) == expected, f"Expected {expected} rows, got {len(df)}"


def test_weekly_data_columns():
    df = generate_weekly_data()
    required = {
        'facility_idx', 'blood_type', 'week_start', 'week_num',
        'month', 'units_donated', 'units_consumed', 'ending_inventory',
        'is_ramadan', 'is_holiday', 'region', 'size', 'facility_type'
    }
    missing = required - set(df.columns)
    assert not missing, f"Missing columns: {missing}"


def test_ramadan_flag_exists():
    df = generate_weekly_data()
    assert df['is_ramadan'].sum() > 0, "No Ramadan weeks flagged"
    # Ramadan is roughly 4 weeks/year, 3 years = ~12 flagged weeks per facility+blood_type combo
    ramadan_weeks = df[df['is_ramadan'] == 1]['week_num'].nunique()
    assert ramadan_weeks >= 10, f"Expected >=10 Ramadan weeks, got {ramadan_weeks}"


def test_holiday_flag_exists():
    df = generate_weekly_data()
    assert df['is_holiday'].sum() > 0, "No holiday weeks flagged"


def test_blood_type_distribution():
    df = generate_weekly_data()
    # O+ should dominate (38% of base demand)
    by_type = df.groupby('blood_type')['units_consumed'].sum()
    assert by_type['O+'] > by_type['AB-'], "O+ should exceed AB- demand"
    assert by_type['O+'] > by_type['B+'], "O+ should exceed B+ demand"


def test_large_facilities_have_higher_demand():
    df = generate_weekly_data()
    large_avg = df[df['size'] == 'large']['units_consumed'].mean()
    small_avg = df[df['size'] == 'small']['units_consumed'].mean()
    assert large_avg > small_avg, "Large facilities should have higher average demand"


def test_ramadan_donations_lower():
    df = generate_weekly_data()
    ramadan_donations = df[df['is_ramadan'] == 1]['units_donated'].mean()
    normal_donations = df[df['is_ramadan'] == 0]['units_donated'].mean()
    assert ramadan_donations < normal_donations, "Ramadan should reduce donations"


def test_num_facilities():
    df = generate_weekly_data()
    assert df['facility_idx'].nunique() == 20


def test_num_weeks():
    df = generate_weekly_data()
    assert df['week_num'].max() == NUM_WEEKS - 1


def test_is_ramadan_week_function():
    from datetime import datetime
    # March 2024 is Ramadan 2024
    assert is_ramadan_week(datetime(2024, 3, 15)) is True
    # January 2024 is not Ramadan
    assert is_ramadan_week(datetime(2024, 1, 15)) is False


def test_is_holiday_week_function():
    from datetime import datetime
    # Independence Day 2024
    assert is_holiday_week(datetime(2024, 5, 25)) is True
    assert is_holiday_week(datetime(2024, 3, 1)) is False


def test_donor_data_shape():
    df = generate_donor_data(100)
    assert len(df) == 100
    required = {'donor_id', 'blood_type', 'latitude', 'longitude', 'is_eligible'}
    assert required.issubset(df.columns)
```

- [ ] **Step 2: Run tests — expect failure (functions not yet implemented)**

```bash
cd ai-service
source venv/bin/activate
python -m pytest tests/test_data_generation.py -v 2>&1 | head -30
```

Expected: ImportError or AttributeError — `is_ramadan_week` and `is_holiday_week` not yet defined.

- [ ] **Step 3: Commit failing tests**

```bash
git add ai-service/tests/test_data_generation.py
git commit -m "test(ai): add data generation tests (failing)"
```

---

## Task 3: Rewrite generate_synthetic.py

**Files:**
- Rewrite: `ai-service/data/generate_synthetic.py`

- [ ] **Step 1: Write the new generator**

Replace the entire contents of `ai-service/data/generate_synthetic.py`:

```python
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
    {'facility_idx': 0,  'name': 'King Hussein Medical Center',     'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 1,  'name': 'Jordan University Hospital',       'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 2,  'name': 'Al-Bashir Hospital',               'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 3,  'name': 'Amman Blood Bank',                 'region': 'amman',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 4,  'name': 'Islamic Hospital Amman',           'region': 'amman',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 5,  'name': 'Specialty Hospital Amman',         'region': 'amman',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 6,  'name': 'Amman East Clinic',                'region': 'amman',    'size': 'small',  'facility_type': 'clinic'},
    {'facility_idx': 7,  'name': 'Amman West Clinic',                'region': 'amman',    'size': 'small',  'facility_type': 'clinic'},
    # Irbid (4)
    {'facility_idx': 8,  'name': 'King Abdullah University Hospital', 'region': 'irbid',   'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 9,  'name': 'Irbid Blood Bank',                 'region': 'irbid',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 10, 'name': 'Princess Basma Hospital',          'region': 'irbid',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 11, 'name': 'Irbid North Clinic',               'region': 'irbid',    'size': 'small',  'facility_type': 'clinic'},
    # Zarqa (4)
    {'facility_idx': 12, 'name': 'Prince Hashem Military Hospital',  'region': 'zarqa',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 13, 'name': 'Zarqa Blood Bank',                 'region': 'zarqa',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 14, 'name': 'Zarqa Government Hospital',        'region': 'zarqa',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 15, 'name': 'Zarqa East Clinic',                'region': 'zarqa',    'size': 'small',  'facility_type': 'clinic'},
    # Southern (4)
    {'facility_idx': 16, 'name': 'Aqaba Government Hospital',        'region': 'southern', 'size': 'small',  'facility_type': 'hospital'},
    {'facility_idx': 17, 'name': 'Karak Government Hospital',        'region': 'southern', 'size': 'small',  'facility_type': 'hospital'},
    {'facility_idx': 18, "Ma'an Government Hospital":  None, 'facility_idx': 18, 'name': "Ma'an Government Hospital", 'region': 'southern', 'size': 'small', 'facility_type': 'hospital'},
    {'facility_idx': 19, 'name': 'Southern Blood Bank',              'region': 'southern', 'size': 'small',  'facility_type': 'blood_bank'},
]

# Remove duplicate key from facility 18 definition above — clean list:
FACILITIES = [
    {'facility_idx': 0,  'name': 'King Hussein Medical Center',      'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 1,  'name': 'Jordan University Hospital',        'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 2,  'name': 'Al-Bashir Hospital',                'region': 'amman',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 3,  'name': 'Amman Blood Bank',                  'region': 'amman',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 4,  'name': 'Islamic Hospital Amman',            'region': 'amman',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 5,  'name': 'Specialty Hospital Amman',          'region': 'amman',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 6,  'name': 'Amman East Clinic',                 'region': 'amman',    'size': 'small',  'facility_type': 'clinic'},
    {'facility_idx': 7,  'name': 'Amman West Clinic',                 'region': 'amman',    'size': 'small',  'facility_type': 'clinic'},
    {'facility_idx': 8,  'name': 'King Abdullah University Hospital',  'region': 'irbid',   'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 9,  'name': 'Irbid Blood Bank',                  'region': 'irbid',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 10, 'name': 'Princess Basma Hospital',           'region': 'irbid',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 11, 'name': 'Irbid North Clinic',                'region': 'irbid',    'size': 'small',  'facility_type': 'clinic'},
    {'facility_idx': 12, 'name': 'Prince Hashem Military Hospital',   'region': 'zarqa',    'size': 'large',  'facility_type': 'hospital'},
    {'facility_idx': 13, 'name': 'Zarqa Blood Bank',                  'region': 'zarqa',    'size': 'medium', 'facility_type': 'blood_bank'},
    {'facility_idx': 14, 'name': 'Zarqa Government Hospital',         'region': 'zarqa',    'size': 'medium', 'facility_type': 'hospital'},
    {'facility_idx': 15, 'name': 'Zarqa East Clinic',                 'region': 'zarqa',    'size': 'small',  'facility_type': 'clinic'},
    {'facility_idx': 16, 'name': 'Aqaba Government Hospital',         'region': 'southern', 'size': 'small',  'facility_type': 'hospital'},
    {'facility_idx': 17, 'name': 'Karak Government Hospital',         'region': 'southern', 'size': 'small',  'facility_type': 'hospital'},
    {'facility_idx': 18, 'name': "Ma'an Government Hospital",         'region': 'southern', 'size': 'small',  'facility_type': 'hospital'},
    {'facility_idx': 19, 'name': 'Southern Blood Bank',               'region': 'southern', 'size': 'small',  'facility_type': 'blood_bank'},
]

# ── Blood types ───────────────────────────────────────────────────────────────
BLOOD_TYPE_DIST = {
    'O+': 0.380, 'A+': 0.300, 'B+': 0.140, 'AB+': 0.060,
    'O-': 0.060, 'A-': 0.040, 'B-': 0.015, 'AB-': 0.005,
}
BLOOD_TYPES = list(BLOOD_TYPE_DIST.keys())

# ── Scale ─────────────────────────────────────────────────────────────────────
START_DATE = datetime(2022, 4, 1)
NUM_WEEKS = 156  # 3 years

SIZE_MULTIPLIER    = {'large': 2.0, 'medium': 1.0, 'small': 0.5}
TYPE_MULTIPLIER    = {'hospital': 1.2, 'blood_bank': 1.0, 'clinic': 0.6}

# ── Ramadan periods (Gregorian approximate) ───────────────────────────────────
RAMADAN_PERIODS = [
    (datetime(2022, 4,  2), datetime(2022, 5,  1)),
    (datetime(2023, 3, 23), datetime(2023, 4, 21)),
    (datetime(2024, 3, 11), datetime(2024, 4,  9)),
    (datetime(2025, 3,  1), datetime(2025, 3, 29)),
]

# ── Jordanian public holidays ─────────────────────────────────────────────────
_HOLIDAY_DATES = [
    # 2022
    '2022-05-02', '2022-05-03',  # Eid Al-Fitr
    '2022-07-09', '2022-07-10',  # Eid Al-Adha
    '2022-05-25', '2022-06-10',  # Independence + Army Day
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
    """Return True if dt's week contains a Jordanian public holiday."""
    week_end = dt + timedelta(days=6)
    current = dt
    while current <= week_end:
        if current in HOLIDAY_DATES:
            return True
        current += timedelta(days=1)
    return False


def generate_weekly_data() -> pd.DataFrame:
    rows = []

    # Pre-compute weekly emergency spike flags per region
    # (if one facility in a region spikes, others get 20% elevation)
    region_spike_weeks: dict[str, set] = {r: set() for r in ['amman', 'irbid', 'zarqa', 'southern']}
    for week_num in range(NUM_WEEKS):
        for region in region_spike_weeks:
            if np.random.random() < 0.03:
                region_spike_weeks[region].add(week_num)

    for facility in FACILITIES:
        idx   = facility['facility_idx']
        size  = facility['size']
        ftype = facility['facility_type']
        region = facility['region']

        size_mult  = SIZE_MULTIPLIER[size]
        type_mult  = TYPE_MULTIPLIER[ftype]
        inventory  = {}

        for blood_type in BLOOD_TYPES:
            bt_weight  = BLOOD_TYPE_DIST[blood_type]
            base_demand = bt_weight * 20 * size_mult * type_mult
            inventory[blood_type] = int(base_demand * 3)

        for week_num in range(NUM_WEEKS):
            week_start = START_DATE + timedelta(weeks=week_num)
            month = week_start.month
            ramadan = is_ramadan_week(week_start)
            holiday = is_holiday_week(week_start)
            region_spike = week_num in region_spike_weeks[region]

            # Seasonal demand factor
            seasonal = 1.0
            if month in [6, 7, 8]:   seasonal = 1.25   # summer emergencies
            elif month in [12, 1]:   seasonal = 1.15   # winter flu season
            elif ramadan:            seasonal = 0.95   # deferred elective surgery

            # Donation factor
            donation_factor = 1.0
            if ramadan:  donation_factor = 0.70   # fasting reduces donations
            if holiday:  donation_factor = 0.60   # holiday donation drop

            for blood_type in BLOOD_TYPES:
                bt_weight   = BLOOD_TYPE_DIST[blood_type]
                base_demand = bt_weight * 20 * size_mult * type_mult

                # Donated units
                donated = max(1, int(base_demand * donation_factor * (1 + np.random.normal(0, 0.12))))

                # Consumed units
                demand_noise = np.random.normal(0, 0.18)
                consumed = max(1, int(base_demand * seasonal * (1 + demand_noise) * 1.05))

                # Emergency spike: facility-level (3%) + regional elevation (20% if region spike)
                if np.random.random() < 0.03:
                    consumed = int(consumed * np.random.uniform(1.5, 2.5))
                elif region_spike:
                    consumed = int(consumed * 1.20)

                inventory[blood_type] = max(0, inventory[blood_type] + donated - consumed)

                rows.append({
                    'facility_idx':   idx,
                    'facility_id':    f"facility_{idx}",
                    'name':           facility['name'],
                    'region':         region,
                    'size':           size,
                    'facility_type':  ftype,
                    'blood_type':     blood_type,
                    'week_start':     week_start.strftime('%Y-%m-%d'),
                    'week_num':       week_num,
                    'month':          month,
                    'is_ramadan':     int(ramadan),
                    'is_holiday':     int(holiday),
                    'units_donated':  donated,
                    'units_consumed': consumed,
                    'ending_inventory': inventory[blood_type],
                })

    return pd.DataFrame(rows)


def generate_donor_data(num_donors: int = 500) -> pd.DataFrame:
    """Generate synthetic donor profiles. Schema unchanged from v1."""
    rows = []
    cities = ['Amman', 'Irbid', 'Zarqa', 'Salt', 'Aqaba', 'Karak', "Ma'an"]
    city_weights = [0.45, 0.15, 0.15, 0.08, 0.07, 0.05, 0.05]
    city_coords = {
        'Amman':  (31.95, 35.91, 0.05),
        'Irbid':  (32.55, 35.85, 0.03),
        'Zarqa':  (32.07, 36.09, 0.03),
        'Salt':   (32.04, 35.73, 0.02),
        'Aqaba':  (29.53, 35.01, 0.02),
        'Karak':  (31.19, 35.70, 0.02),
        "Ma'an":  (30.20, 35.73, 0.02),
    }
    from datetime import datetime as dt_cls
    for i in range(num_donors):
        city = np.random.choice(cities, p=city_weights)
        lat_c, lng_c, spread = city_coords[city]
        blood_type = np.random.choice(BLOOD_TYPES, p=list(BLOOD_TYPE_DIST.values()))
        total_donations = np.random.choice([0,1,2,3,5,8,12], p=[0.30,0.20,0.15,0.12,0.10,0.08,0.05])
        if total_donations > 0:
            days_since = np.random.randint(10, 365)
            from datetime import timedelta as td
            last_donation = (dt_cls.now() - td(days=days_since)).strftime('%Y-%m-%d')
            is_eligible = days_since >= 56
        else:
            last_donation = None
            is_eligible = True
        rows.append({
            'donor_id':        f"donor_{i}",
            'blood_type':      blood_type,
            'gender':          np.random.choice(['male','female'], p=[0.65,0.35]),
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
    weekly_df = generate_weekly_data()
    weekly_path = os.path.join(out_dir, 'synthetic_donations.csv')
    weekly_df.to_csv(weekly_path, index=False)
    print(f"  Saved {len(weekly_df)} rows → {weekly_path}")
    print(f"  Facilities: 20 | Blood types: {len(BLOOD_TYPES)} | Weeks: {NUM_WEEKS}")

    print("\nSaving facility metadata...")
    facilities_df = pd.DataFrame(FACILITIES)
    fac_path = os.path.join(out_dir, 'synthetic_facilities.csv')
    facilities_df.to_csv(fac_path, index=False)
    print(f"  Saved {len(facilities_df)} facilities → {fac_path}")

    print("\nGenerating synthetic donor data...")
    donor_df = generate_donor_data(500)
    donor_path = os.path.join(out_dir, 'synthetic_donors.csv')
    donor_df.to_csv(donor_path, index=False)
    print(f"  Saved {len(donor_df)} donors → {donor_path}")

    print("\nDone!")
```

- [ ] **Step 2: Run data generation tests**

```bash
cd ai-service
source venv/bin/activate
python -m pytest tests/test_data_generation.py -v
```

Expected: All tests PASS.

- [ ] **Step 3: Generate the data files**

```bash
cd ai-service
source venv/bin/activate
python data/generate_synthetic.py
```

Expected output:
```
Generating synthetic weekly donation data...
  Saved 24960 rows → .../synthetic_donations.csv
  Saved 20 facilities → .../synthetic_facilities.csv
Generating synthetic donor data...
  Saved 500 donors → .../synthetic_donors.csv
Done!
```

- [ ] **Step 4: Verify row count**

```bash
python -c "import pandas as pd; df = pd.read_csv('data/synthetic_donations.csv'); print(len(df), 'rows')"
```

Expected: `24960 rows`

- [ ] **Step 5: Commit**

```bash
git add ai-service/data/generate_synthetic.py ai-service/data/synthetic_donations.csv ai-service/data/synthetic_facilities.csv ai-service/data/synthetic_donors.csv
git commit -m "feat(ai): rewrite data generator — 20 facilities, 3yr, Ramadan/holiday effects"
```

---

## Task 4: Write Tests for Forecaster

**Files:**
- Create: `ai-service/tests/test_forecaster.py`

- [ ] **Step 1: Write tests**

Create `ai-service/tests/test_forecaster.py`:

```python
"""Tests for the XGBoost blood demand forecaster."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
import tempfile
import shutil
from models.forecaster import BloodDemandForecaster, FEATURE_COLS


def test_feature_cols_complete():
    """Ensure FEATURE_COLS contains all required features."""
    required = {
        'facility_size_enc', 'facility_region_enc', 'facility_type_enc',
        'blood_type_encoded', 'week_of_year', 'week_sin', 'week_cos',
        'month', 'is_ramadan', 'is_holiday',
        'rolling_avg_4w', 'rolling_avg_8w', 'rolling_avg_12w', 'last_week_consumed'
    }
    assert required == set(FEATURE_COLS), f"Feature mismatch: {required ^ set(FEATURE_COLS)}"


def test_train_returns_metrics():
    f = BloodDemandForecaster()
    metrics = f.train()
    assert 'xgboost' in metrics
    assert 'mae' in metrics['xgboost']
    assert 'r2' in metrics['xgboost']
    assert metrics['xgboost']['mae'] >= 0
    assert -1.0 <= metrics['xgboost']['r2'] <= 1.0


def test_train_sets_is_trained():
    f = BloodDemandForecaster()
    assert not f.is_trained
    f.train()
    assert f.is_trained


def test_predict_returns_correct_structure():
    f = BloodDemandForecaster()
    f.train()
    results = f.predict(facility_idx=0, blood_types=['O+', 'A+'], weeks_ahead=4)
    assert len(results) == 8  # 2 blood types × 4 weeks
    for r in results:
        assert 'blood_type' in r
        assert 'week_offset' in r
        assert 'predicted_units' in r
        assert 'confidence' in r
        assert 'confidence_low' in r
        assert 'confidence_high' in r


def test_predict_units_non_negative():
    f = BloodDemandForecaster()
    f.train()
    results = f.predict(facility_idx=0, blood_types=['O+'], weeks_ahead=4)
    for r in results:
        assert r['predicted_units'] >= 0
        assert r['confidence_low'] >= 0
        assert r['confidence_high'] >= 0


def test_confidence_interval_ordering():
    """q10 <= q50 <= q90 for every prediction."""
    f = BloodDemandForecaster()
    f.train()
    results = f.predict(facility_idx=0, blood_types=['O+', 'B-'], weeks_ahead=4)
    for r in results:
        assert r['confidence_low'] <= r['predicted_units'], (
            f"q10 ({r['confidence_low']}) > q50 ({r['predicted_units']})"
        )
        assert r['predicted_units'] <= r['confidence_high'], (
            f"q50 ({r['predicted_units']}) > q90 ({r['confidence_high']})"
        )


def test_confidence_score_between_0_and_1():
    f = BloodDemandForecaster()
    f.train()
    results = f.predict(facility_idx=0, blood_types=['O+'], weeks_ahead=4)
    for r in results:
        assert 0.0 <= r['confidence'] <= 1.0, f"confidence {r['confidence']} out of range"


def test_save_and_load():
    """Train, save, reload in a new instance, predict successfully."""
    f1 = BloodDemandForecaster()
    f1.train()
    results_before = f1.predict(facility_idx=1, blood_types=['A+'], weeks_ahead=2)

    f2 = BloodDemandForecaster()
    assert f2.load(), "load() should return True when model files exist"
    results_after = f2.predict(facility_idx=1, blood_types=['A+'], weeks_ahead=2)

    assert len(results_before) == len(results_after)
    # Predictions should be identical after save/load
    for r1, r2 in zip(results_before, results_after):
        assert r1['predicted_units'] == r2['predicted_units']


def test_unknown_facility_falls_back():
    """facility_idx 999 should not crash — falls back to medium/amman/hospital."""
    f = BloodDemandForecaster()
    f.train()
    results = f.predict(facility_idx=999, blood_types=['O+'], weeks_ahead=2)
    assert len(results) == 2


def test_linear_regression_baseline_in_metrics():
    f = BloodDemandForecaster()
    metrics = f.train()
    assert 'linear_regression' in metrics
    assert 'mae' in metrics['linear_regression']
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd ai-service
source venv/bin/activate
python -m pytest tests/test_forecaster.py -v 2>&1 | head -20
```

Expected: ImportError — `FEATURE_COLS` not yet exported from forecaster.

- [ ] **Step 3: Commit failing tests**

```bash
git add ai-service/tests/test_forecaster.py
git commit -m "test(ai): add forecaster tests (failing)"
```

---

## Task 5: Rewrite forecaster.py

**Files:**
- Rewrite: `ai-service/models/forecaster.py`

- [ ] **Step 1: Write the new forecaster**

Replace the entire contents of `ai-service/models/forecaster.py`:

```python
"""
Blood demand forecasting model using XGBoost with quantile regression.
Predicts weekly blood consumption per facility per blood type.
Three models: q10 (lower bound), q50 (median), q90 (upper bound).
"""

import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
import os
import math

MODEL_PATH     = os.path.join(os.path.dirname(__file__), '..', 'data', 'forecast_model.pkl')
MODEL_Q10_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'forecast_model_q10.pkl')
MODEL_Q90_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'forecast_model_q90.pkl')
DATA_PATH      = os.path.join(os.path.dirname(__file__), '..', 'data', 'synthetic_donations.csv')
FACILITIES_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'synthetic_facilities.csv')

REGION_ENC = {'amman': 0, 'irbid': 1, 'zarqa': 2, 'southern': 3}
SIZE_ENC   = {'small': 0, 'medium': 1, 'large': 2}
TYPE_ENC   = {'clinic': 0, 'blood_bank': 1, 'hospital': 2}

FEATURE_COLS = [
    'facility_size_enc', 'facility_region_enc', 'facility_type_enc',
    'blood_type_encoded', 'week_of_year', 'week_sin', 'week_cos',
    'month', 'is_ramadan', 'is_holiday',
    'rolling_avg_4w', 'rolling_avg_8w', 'rolling_avg_12w', 'last_week_consumed',
]


def _xgb(quantile_alpha: float) -> XGBRegressor:
    return XGBRegressor(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective='reg:quantileerror',
        quantile_alpha=quantile_alpha,
        random_state=42,
        n_jobs=-1,
    )


class BloodDemandForecaster:
    def __init__(self):
        self.model     = None   # q50 — primary
        self.model_q10 = None   # lower bound
        self.model_q90 = None   # upper bound
        self.blood_type_encoder = LabelEncoder()
        self.is_trained = False
        self.facilities: dict = {}

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _load_facilities(self):
        if os.path.exists(FACILITIES_PATH):
            df = pd.read_csv(FACILITIES_PATH)
            self.facilities = df.set_index('facility_idx').to_dict('index')

    def _facility_features(self, facility_idx: int) -> dict:
        info = self.facilities.get(facility_idx, {})
        return {
            'facility_size_enc':   SIZE_ENC.get(info.get('size',          'medium'),   1),
            'facility_region_enc': REGION_ENC.get(info.get('region',      'amman'),    0),
            'facility_type_enc':   TYPE_ENC.get(info.get('facility_type', 'hospital'), 2),
        }

    def _prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        df['week_start'] = pd.to_datetime(df['week_start'])
        df['week_of_year'] = df['week_start'].dt.isocalendar().week.astype(int)
        df['month']       = df['week_start'].dt.month
        df['week_sin']    = np.sin(2 * np.pi * df['week_of_year'] / 52)
        df['week_cos']    = np.cos(2 * np.pi * df['week_of_year'] / 52)

        df['blood_type_encoded'] = self.blood_type_encoder.fit_transform(df['blood_type'])

        # Facility feature encoding
        df['facility_size_enc']   = df['size'].map(SIZE_ENC).fillna(1).astype(int)
        df['facility_region_enc'] = df['region'].map(REGION_ENC).fillna(0).astype(int)
        df['facility_type_enc']   = df['facility_type'].map(TYPE_ENC).fillna(2).astype(int)

        # Rolling features per facility + blood type
        df = df.sort_values(['facility_idx', 'blood_type', 'week_num'])
        grouped = df.groupby(['facility_idx', 'blood_type'])

        df['rolling_avg_4w']     = grouped['units_consumed'].transform(lambda x: x.rolling(4,  min_periods=1).mean())
        df['rolling_avg_8w']     = grouped['units_consumed'].transform(lambda x: x.rolling(8,  min_periods=1).mean())
        df['rolling_avg_12w']    = grouped['units_consumed'].transform(lambda x: x.rolling(12, min_periods=1).mean())
        df['last_week_consumed'] = grouped['units_consumed'].transform(lambda x: x.shift(1))
        df['last_week_consumed'] = df['last_week_consumed'].fillna(df['units_consumed'])

        # Ensure Ramadan/holiday flags exist (0 if missing from older data)
        if 'is_ramadan' not in df.columns: df['is_ramadan'] = 0
        if 'is_holiday'  not in df.columns: df['is_holiday']  = 0

        return df

    # ── Public API ────────────────────────────────────────────────────────────

    def train(self, data_path: str = None) -> dict:
        """Train q10/q50/q90 XGBoost models using walk-forward validation."""
        self._load_facilities()
        path = data_path or DATA_PATH
        df = pd.read_csv(path)
        df = self._prepare_features(df)

        target = 'units_consumed'

        # Walk-forward split: last 26 weeks (6 months) as test
        split_week = df['week_num'].max() - 26
        train_mask = df['week_num'] <= split_week

        X_train = df[train_mask][FEATURE_COLS]
        y_train = df[train_mask][target]
        X_test  = df[~train_mask][FEATURE_COLS]
        y_test  = df[~train_mask][target]

        # Train three quantile models
        self.model     = _xgb(0.50)
        self.model_q10 = _xgb(0.10)
        self.model_q90 = _xgb(0.90)

        self.model.fit(X_train,     y_train)
        self.model_q10.fit(X_train, y_train)
        self.model_q90.fit(X_train, y_train)

        self.is_trained = True

        # Evaluate median model
        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2  = r2_score(y_test, y_pred)

        # Linear regression baseline
        lr = LinearRegression()
        lr.fit(X_train, y_train)
        lr_pred = lr.predict(X_test)
        lr_mae = mean_absolute_error(y_test, lr_pred)
        lr_r2  = r2_score(y_test, lr_pred)

        # Save all three models
        for obj, path in [
            ({'model': self.model,     'encoder': self.blood_type_encoder, 'facilities': self.facilities}, MODEL_PATH),
            ({'model': self.model_q10, 'encoder': self.blood_type_encoder, 'facilities': self.facilities}, MODEL_Q10_PATH),
            ({'model': self.model_q90, 'encoder': self.blood_type_encoder, 'facilities': self.facilities}, MODEL_Q90_PATH),
        ]:
            with open(path, 'wb') as f:
                pickle.dump(obj, f)

        return {
            'xgboost':           {'mae': round(mae, 2), 'r2': round(r2, 4)},
            'linear_regression': {'mae': round(lr_mae, 2), 'r2': round(lr_r2, 4)},
            'train_size': len(X_train),
            'test_size':  len(X_test),
        }

    def load(self) -> bool:
        """Load all three pre-trained quantile models."""
        if not (os.path.exists(MODEL_PATH) and os.path.exists(MODEL_Q10_PATH) and os.path.exists(MODEL_Q90_PATH)):
            return False
        for attr, path in [('model', MODEL_PATH), ('model_q10', MODEL_Q10_PATH), ('model_q90', MODEL_Q90_PATH)]:
            with open(path, 'rb') as f:
                data = pickle.load(f)
                setattr(self, attr, data['model'])
                self.blood_type_encoder = data['encoder']
                self.facilities = data.get('facilities', {})
        self.is_trained = True
        return True

    def predict(self, facility_idx: int, blood_types: list, weeks_ahead: int = 4) -> list:
        """
        Predict blood demand with confidence intervals.

        Returns list of:
            {blood_type, week_offset, predicted_units, confidence,
             confidence_low, confidence_high}
        """
        if not self.is_trained:
            if not self.load():
                raise RuntimeError("Model not trained. Call train() first.")

        self._load_facilities()
        fac = self._facility_features(facility_idx)

        df = pd.read_csv(DATA_PATH)
        df = self._prepare_features(df)

        predictions = []
        for blood_type in blood_types:
            mask = (df['facility_idx'] == facility_idx) & (df['blood_type'] == blood_type)
            facility_data = df[mask].sort_values('week_num')

            if facility_data.empty:
                # Fallback: use global mean for this blood type
                facility_data = df[df['blood_type'] == blood_type].sort_values('week_num')
                if facility_data.empty:
                    continue

            last_row = facility_data.iloc[-1]

            try:
                bt_encoded = self.blood_type_encoder.transform([blood_type])[0]
            except ValueError:
                continue

            for week_offset in range(1, weeks_ahead + 1):
                future_week  = int((last_row['week_of_year'] + week_offset) % 52) or 52
                future_month = ((int(last_row['month']) - 1 + (week_offset // 4)) % 12) + 1

                features = pd.DataFrame([{
                    'facility_size_enc':   fac['facility_size_enc'],
                    'facility_region_enc': fac['facility_region_enc'],
                    'facility_type_enc':   fac['facility_type_enc'],
                    'blood_type_encoded':  bt_encoded,
                    'week_of_year':        future_week,
                    'week_sin':            math.sin(2 * math.pi * future_week / 52),
                    'week_cos':            math.cos(2 * math.pi * future_week / 52),
                    'month':               future_month,
                    'is_ramadan':          int(last_row.get('is_ramadan', 0)),
                    'is_holiday':          0,
                    'rolling_avg_4w':      last_row['rolling_avg_4w'],
                    'rolling_avg_8w':      last_row['rolling_avg_8w'],
                    'rolling_avg_12w':     last_row['rolling_avg_12w'],
                    'last_week_consumed':  last_row['units_consumed'],
                }])

                q50 = max(0, int(self.model.predict(features)[0]))
                q10 = max(0, int(self.model_q10.predict(features)[0]))
                q90 = max(0, int(self.model_q90.predict(features)[0]))

                # Ensure ordering: q10 <= q50 <= q90
                q10 = min(q10, q50)
                q90 = max(q90, q50)

                # Confidence: tighter interval → higher confidence
                interval = q90 - q10
                denom = q90 + q10 + 1
                confidence = round(max(0.0, min(1.0, 1.0 - (interval / denom))), 2)

                predictions.append({
                    'blood_type':      blood_type,
                    'week_offset':     week_offset,
                    'predicted_units': q50,
                    'confidence':      confidence,
                    'confidence_low':  q10,
                    'confidence_high': q90,
                })

        return predictions


if __name__ == '__main__':
    forecaster = BloodDemandForecaster()
    print("Training XGBoost forecaster...")
    metrics = forecaster.train()
    print(f"  XGBoost   — MAE: {metrics['xgboost']['mae']}, R²: {metrics['xgboost']['r2']}")
    print(f"  Linear    — MAE: {metrics['linear_regression']['mae']}, R²: {metrics['linear_regression']['r2']}")
    print(f"  Train: {metrics['train_size']} rows | Test: {metrics['test_size']} rows")
```

- [ ] **Step 2: Run forecaster tests**

```bash
cd ai-service
source venv/bin/activate
python -m pytest tests/test_forecaster.py -v
```

Expected: All 10 tests PASS. Training may take 30–60 seconds.

- [ ] **Step 3: Retrain and save model files**

```bash
cd ai-service
source venv/bin/activate
python models/forecaster.py
```

Expected output:
```
Training XGBoost forecaster...
  XGBoost   — MAE: X.XX, R²: 0.XXXX
  Linear    — MAE: X.XX, R²: 0.XXXX
  Train: XXXXX rows | Test: XXXX rows
```

- [ ] **Step 4: Run full test suite**

```bash
python -m pytest tests/ -v
```

Expected: All tests PASS.

- [ ] **Step 5: Verify endpoint works**

```bash
curl -s -X POST http://localhost:8000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{"facility_idx": 0, "blood_types": ["O+", "A+"], "weeks_ahead": 4}' | python -m json.tool
```

Expected: JSON with 8 predictions, each containing `confidence_low` and `confidence_high`.

- [ ] **Step 6: Commit**

```bash
git add ai-service/models/forecaster.py ai-service/data/forecast_model.pkl ai-service/data/forecast_model_q10.pkl ai-service/data/forecast_model_q90.pkl
git commit -m "feat(ai): replace RandomForest with XGBoost quantile forecaster (q10/q50/q90)"
```

---

## Task 6: Write AI_MODEL.md

**Files:**
- Create: `ai-service/AI_MODEL.md`

- [ ] **Step 1: Write documentation**

After training completes and you have real MAE/R² numbers from the output of `python models/forecaster.py`, create `ai-service/AI_MODEL.md`:

```markdown
# Damk 3alena — AI Forecasting Model Documentation

## Overview

The forecasting model predicts weekly blood unit consumption per facility per blood type.
It uses XGBoost quantile regression to produce a median prediction plus 80% confidence intervals.

**Model type:** XGBoost Regressor (objective: `reg:quantileerror`)  
**Three models:** q10 (lower bound), q50 (median/primary), q90 (upper bound)  
**Trained on:** Synthetic data — 20 Jordanian facilities × 8 blood types × 156 weeks = 24,960 rows

---

## Synthetic Training Data

### File: `data/synthetic_donations.csv`

| Column | Type | Description |
|--------|------|-------------|
| `facility_idx` | int | Facility index (0–19) |
| `facility_id` | str | String ID (e.g. "facility_0") |
| `name` | str | Facility name |
| `region` | str | amman / irbid / zarqa / southern |
| `size` | str | large / medium / small |
| `facility_type` | str | hospital / blood_bank / clinic |
| `blood_type` | str | O+, A+, B+, AB+, O-, A-, B-, AB- |
| `week_start` | date | ISO date of week start |
| `week_num` | int | 0-indexed week number (0–155) |
| `month` | int | 1–12 |
| `is_ramadan` | int | 1 if week falls in Ramadan |
| `is_holiday` | int | 1 if week contains a Jordanian public holiday |
| `units_donated` | int | Blood units donated that week |
| `units_consumed` | int | Blood units consumed (target variable) |
| `ending_inventory` | int | Inventory at week end |

**Blood type distribution (Jordan-realistic):**
O+: 38% | A+: 30% | B+: 14% | AB+: 6% | O-: 6% | A-: 4% | B-: 1.5% | AB-: 0.5%

**Seasonal effects modelled:**
- Ramadan: donations −30%, demand −5% (deferred elective surgery)
- Eid holidays: donations −40%
- Summer (Jun–Aug): demand +25%
- Winter (Dec–Jan): demand +15%
- Emergency spikes: 3% weekly chance per facility of 1.5–2.5× demand surge
- Regional correlation: spike in one facility elevates neighboring facilities +20%

### File: `data/synthetic_facilities.csv`

20 facilities across 4 regions. Used for feature lookup at inference time.

### File: `data/synthetic_donors.csv`

500 synthetic donor profiles with realistic Jordanian city coordinates.

---

## Feature Engineering (14 features)

| Feature | Description |
|---------|-------------|
| `facility_size_enc` | small=0, medium=1, large=2 |
| `facility_region_enc` | amman=0, irbid=1, zarqa=2, southern=3 |
| `facility_type_enc` | clinic=0, blood_bank=1, hospital=2 |
| `blood_type_encoded` | LabelEncoded (0–7) |
| `week_of_year` | 1–52 |
| `week_sin` | sin(2π × week/52) — cyclical |
| `week_cos` | cos(2π × week/52) — cyclical |
| `month` | 1–12 |
| `is_ramadan` | 0/1 |
| `is_holiday` | 0/1 |
| `rolling_avg_4w` | 4-week rolling mean of consumption |
| `rolling_avg_8w` | 8-week rolling mean |
| `rolling_avg_12w` | 12-week rolling mean |
| `last_week_consumed` | Previous week's actual consumption |

---

## Model Hyperparameters

```python
XGBRegressor(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    reg_alpha=0.1,
    reg_lambda=1.0,
    objective='reg:quantileerror',
    quantile_alpha=0.50,  # 0.10 for q10, 0.90 for q90
    random_state=42,
    n_jobs=-1,
)
```

---

## Training Results

*(Fill in after running `python models/forecaster.py`)*

| Model | MAE | R² | Notes |
|-------|-----|-----|-------|
| XGBoost q50 | — | — | Primary model |
| Linear Regression | — | — | Sanity baseline |

**Train/test split:** Walk-forward — weeks 0–129 train, weeks 130–155 test (last 26 weeks)

---

## Model Files

| File | Contents |
|------|----------|
| `data/forecast_model.pkl` | XGBoost q50 + LabelEncoder + facility dict |
| `data/forecast_model_q10.pkl` | XGBoost q10 (lower bound) |
| `data/forecast_model_q90.pkl` | XGBoost q90 (upper bound) |

---

## API Response

`POST /api/forecast` returns per prediction:

```json
{
  "blood_type": "O+",
  "week_offset": 1,
  "predicted_units": 42,
  "confidence": 0.73,
  "confidence_low": 35,
  "confidence_high": 51
}
```

`confidence` = `1 - (q90 - q10) / (q90 + q10 + 1)` — ranges 0→1, higher is tighter interval.

---

## How to Retrain

```bash
cd ai-service
source venv/bin/activate

# Regenerate data (if needed)
python data/generate_synthetic.py

# Retrain models
python models/forecaster.py
```

## How to Add Real Data

When real Supabase data becomes available:
1. Export `donations` table to CSV matching the schema above
2. Concatenate with `synthetic_donations.csv` or replace it
3. Retrain using `python models/forecaster.py`

The model requires: `facility_idx`, `blood_type`, `week_start`, `week_num`, `month`, `is_ramadan`, `is_holiday`, `units_consumed`, `size`, `region`, `facility_type`
```

- [ ] **Step 2: Fill in the actual MAE/R² numbers**

Open `AI_MODEL.md` and replace the `—` placeholders in the Training Results table with the real numbers printed by `python models/forecaster.py`.

- [ ] **Step 3: Commit**

```bash
git add ai-service/AI_MODEL.md
git commit -m "docs(ai): add AI_MODEL.md with full model and data documentation"
```

---

## Task 7: Restart AI Service

- [ ] **Step 1: Stop old instance and restart with new model**

```bash
# Kill old service
pkill -f "python main.py" || true

# Start fresh
cd ai-service
source venv/bin/activate
nohup python main.py > /tmp/damk-ai.log 2>&1 &
echo "Started PID: $!"
```

- [ ] **Step 2: Confirm health**

```bash
sleep 3 && curl -s http://localhost:8000/health
```

Expected: `{"status":"healthy","model_loaded":true}`

- [ ] **Step 3: Run full end-to-end test**

```bash
# Forecast
curl -s -X POST http://localhost:8000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{"facility_idx": 0, "blood_types": ["O+", "O-", "A+", "B+"], "weeks_ahead": 4}' \
  | python -m json.tool

# Shortage detection
curl -s -X POST http://localhost:8000/api/shortage-detect \
  -H "Content-Type: application/json" \
  -d '{"forecasts": [{"blood_type":"O+","week_offset":1,"predicted_units":50}], "current_inventory": {"O+": 20}, "threshold_warning": 15, "threshold_critical": 5}' \
  | python -m json.tool
```

Expected: Valid JSON responses with no errors.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(ai): complete XGBoost upgrade — realistic synthetic data, quantile CI, Jordan seasonality"
```
