# Damk 3alena — AI Forecasting Model Documentation

## Overview

The forecasting model predicts weekly blood unit consumption per facility per blood type.
It uses XGBoost quantile regression to produce a median prediction plus an 80% confidence interval.

| Property | Value |
|----------|-------|
| Model type | XGBoost Regressor (`reg:quantileerror`) |
| Models | q10 (lower bound), q50 (median/primary), q90 (upper bound) |
| Training data | 24,960 rows — 20 facilities × 8 blood types × 156 weeks (3 years) |
| Test MAE | **0.46 units/week** |
| Test R² | **0.9320** |

---

## Synthetic Training Data

### File: `data/synthetic_donations.csv`

24,960 rows covering April 2022 – March 2025.

| Column | Type | Description |
|--------|------|-------------|
| `facility_idx` | int | Facility index (0–19) |
| `facility_id` | str | e.g. "facility_0" |
| `name` | str | Real-world inspired facility name |
| `region` | str | amman / irbid / zarqa / southern |
| `size` | str | large / medium / small |
| `facility_type` | str | hospital / blood_bank / clinic |
| `blood_type` | str | O+, A+, B+, AB+, O-, A-, B-, AB- |
| `week_start` | date | ISO date of week start |
| `week_num` | int | 0-indexed (0–155) |
| `month` | int | 1–12 |
| `is_ramadan` | int | 1 if week falls within Ramadan |
| `is_holiday` | int | 1 if week contains a Jordanian public holiday |
| `units_donated` | int | Blood units donated that week |
| `units_consumed` | int | Blood units consumed — **target variable** |
| `ending_inventory` | int | Rolling inventory at week end |

### Blood Type Distribution (Jordan-realistic)

| Type | Prevalence |
|------|-----------|
| O+ | 38% |
| A+ | 30% |
| B+ | 14% |
| AB+ | 6% |
| O- | 6% |
| A- | 4% |
| B- | 1.5% |
| AB- | 0.5% |

### Seasonal & Cultural Effects Modelled

| Event | Donation effect | Demand effect |
|-------|----------------|---------------|
| Ramadan (4 weeks/year) | −30% | −5% (elective surgery deferred) |
| Eid Al-Fitr / Eid Al-Adha | −40% | neutral |
| Independence Day / Army Day | −10% | neutral |
| Summer (Jun–Aug) | neutral | +25% (accidents) |
| Winter (Dec–Jan) | neutral | +15% (flu complications) |
| Emergency spikes | — | 1.5–2.5× surge, 3% weekly chance |
| Regional correlation | — | Adjacent facility +20% if region spikes |

### Ramadan Calendar Used

| Year | Start | End |
|------|-------|-----|
| 2022 | Apr 2 | May 1 |
| 2023 | Mar 23 | Apr 21 |
| 2024 | Mar 11 | Apr 9 |
| 2025 | Mar 1 | Mar 29 |

---

### File: `data/synthetic_facilities.csv`

20 facilities across 4 Jordanian regions. Used for feature lookup at prediction time.

| Region | Facilities | Sizes |
|--------|-----------|-------|
| Amman | 8 | 3 large, 3 medium, 2 small |
| Irbid | 4 | 1 large, 2 medium, 1 small |
| Zarqa | 4 | 1 large, 2 medium, 1 small |
| Southern | 4 | 4 small |

### File: `data/synthetic_donors.csv`

500 donor profiles with realistic Jordanian city coordinates (Amman 45%, Irbid 15%, Zarqa 15%, others 25%).

---

## Feature Engineering (14 features)

| Feature | Description | Why it matters |
|---------|-------------|----------------|
| `facility_size_enc` | small=0, medium=1, large=2 | Larger hospitals consume more |
| `facility_region_enc` | amman=0, irbid=1, zarqa=2, southern=3 | Regional demand patterns differ |
| `facility_type_enc` | clinic=0, blood_bank=1, hospital=2 | Hospitals have emergency demand |
| `blood_type_encoded` | LabelEncoded (0–7) | Base demand rate per blood type |
| `week_of_year` | 1–52 | Seasonality |
| `week_sin` | sin(2π × week/52) | Cyclical — prevents week 52→1 discontinuity |
| `week_cos` | cos(2π × week/52) | Cyclical |
| `month` | 1–12 | Month-level seasonality |
| `is_ramadan` | 0/1 | Donation drop + deferred surgeries |
| `is_holiday` | 0/1 | Donation closures |
| `rolling_avg_4w` | 4-week rolling mean of consumption | Short-term trend |
| `rolling_avg_8w` | 8-week rolling mean | Medium-term trend |
| `rolling_avg_12w` | 12-week rolling mean | Long-term baseline |
| `last_week_consumed` | Previous week's actual consumption | Immediate momentum |

---

## Model Hyperparameters

All three quantile models share the same architecture, differing only in `quantile_alpha`:

```python
XGBRegressor(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    reg_alpha=0.1,       # L1 regularization
    reg_lambda=1.0,      # L2 regularization
    objective='reg:quantileerror',
    quantile_alpha=0.50, # 0.10 for lower bound, 0.90 for upper bound
    random_state=42,
    n_jobs=-1,
)
```

---

## Training Results

**Split strategy:** Walk-forward validation (not random split — prevents data leakage)
- Train: weeks 0–129 (20,800 rows, ~2.5 years)
- Test: weeks 130–155 (4,160 rows, last 6 months)

| Model | MAE (units/week) | R² |
|-------|------------------|----|
| XGBoost q50 | **0.46** | **0.9320** |
| Linear Regression | 0.50 | 0.9363 |

R² of 0.93 means the model explains 93% of variance in weekly blood consumption. MAE of 0.46 means predictions are within half a unit per blood type per week on average.

---

## Model Files

| File | Contents |
|------|----------|
| `data/forecast_model.pkl` | XGBoost q50 + LabelEncoder + facility lookup dict |
| `data/forecast_model_q10.pkl` | XGBoost q10 (lower confidence bound) |
| `data/forecast_model_q90.pkl` | XGBoost q90 (upper confidence bound) |

---

## API Response Format

`POST /api/forecast` — each prediction in the response:

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

`confidence` = `1 - (q90 - q10) / (q90 + q10 + 1)` — ranges 0→1. Higher = tighter interval = more certain prediction.

---

## How to Retrain

```bash
cd ai-service
source venv/bin/activate

# Step 1: Regenerate data (optional — only if changing generator)
python data/generate_synthetic.py

# Step 2: Retrain all three quantile models
python models/forecaster.py
```

Training takes approximately 2–3 minutes on a modern laptop.

## How to Add Real Data

When real Supabase donation history becomes available:

1. Export the `donations` table joined with `facilities` to a CSV
2. Map columns to match the schema above (especially `region`, `size`, `facility_type`, `is_ramadan`, `is_holiday`)
3. Either replace `synthetic_donations.csv` or concatenate real + synthetic data
4. Retrain: `python models/forecaster.py`

Minimum recommended: 26+ weeks of real data per facility for the walk-forward split to be meaningful.

---

## Running Tests

```bash
cd ai-service
source venv/bin/activate
python -m pytest tests/ -v
```

- `tests/test_data_generation.py` — 12 tests covering data shape, Ramadan flags, distributions
- `tests/test_forecaster.py` — 10 tests covering training, prediction structure, confidence intervals, save/load
