# AI Phase 1+2 Design — Damk 3alena
**Date:** 2026-04-03  
**Scope:** Realistic synthetic data generation + XGBoost forecasting model upgrade  
**Author:** AI Research session

---

## 1. Goal

Replace the current RandomForest forecaster (trained on 6,240 rows of basic synthetic data) with an XGBoost model trained on 24,960 rows of Jordan-realistic synthetic data. No changes to FastAPI endpoints — existing dashboard integration remains intact.

---

## 2. Synthetic Data Generation

### Scale
- 3 years (156 weeks) × 20 facilities × 8 blood types = **24,960 rows**

### Facilities
20 facilities across 4 Jordanian regions:

| Region | Count | Sizes |
|--------|-------|-------|
| Amman | 8 | 3 large, 3 medium, 2 small |
| Irbid | 4 | 1 large, 2 medium, 1 small |
| Zarqa | 4 | 1 large, 2 medium, 1 small |
| Southern (Aqaba/Karak) | 4 | 4 small |

Each facility has: `facility_idx`, `region`, `size` (large/medium/small), `type` (hospital/blood_bank/clinic).

### Blood Type Distribution (Jordan-realistic)
```
O+: 38%  A+: 30%  B+: 14%  AB+: 6%
O-: 6%   A-: 4%   B-: 1.5% AB-: 0.5%
```

### Seasonal Patterns
- **Ramadan** (exact Hijri dates for 2023–2025): donations drop 30%, demand unchanged → realistic shortage pressure
- **Eid Al-Fitr, Eid Al-Adha**: donations drop 40% for 1 week
- **Jordanian Independence Day (May 25), Army Day (Jun 10)**: minor donation dip (~10%)
- **Summer (Jun–Aug)**: demand +25% (accidents, dehydration emergencies)
- **Winter (Dec–Jan)**: demand +15% (flu season complications)
- **Ramadan month**: demand −5% (elective surgeries deferred)

### Emergency Spikes
- 3% weekly chance per facility of a 1.5–2.5× demand surge (accidents, mass casualty)
- Spikes are **regionally correlated**: if one Amman facility spikes, others in Amman get a 20% elevation
- Small facilities have higher spike variance (less buffer)

### Output Files
```
ai-service/data/
  synthetic_donations.csv      # 24,960 rows (replaces current 6,240)
  synthetic_facilities.csv     # 20 rows — facility metadata for inference
  synthetic_donors.csv         # 500 donor profiles (unchanged schema)
```

---

## 3. Feature Engineering

### Training Features (13 total)

| Feature | Type | Description |
|---------|------|-------------|
| `facility_size_enc` | int 0–2 | small=0, medium=1, large=2 |
| `facility_region_enc` | int 0–3 | Amman=0, Irbid=1, Zarqa=2, Southern=3 |
| `facility_type_enc` | int 0–2 | clinic=0, blood_bank=1, hospital=2 |
| `blood_type_encoded` | int 0–7 | LabelEncoded blood type |
| `week_of_year` | int 1–52 | Raw week number |
| `week_sin` | float | sin(2π × week/52) — cyclical encoding |
| `week_cos` | float | cos(2π × week/52) — cyclical encoding |
| `month` | int 1–12 | Calendar month |
| `is_ramadan` | int 0/1 | 1 during Ramadan weeks |
| `is_holiday` | int 0/1 | 1 during Eid/public holiday weeks |
| `rolling_avg_4w` | float | 4-week rolling mean of consumption |
| `rolling_avg_8w` | float | 8-week rolling mean of consumption |
| `rolling_avg_12w` | float | 12-week rolling mean (new) |
| `last_week_consumed` | float | Previous week's actual consumption |

**Removed:** `facility_idx` (replaced by size+region+type encoding)

### Facility Lookup at Inference
`predict()` accepts `facility_id` (UUID string from Supabase) and looks up `synthetic_facilities.csv` to resolve size/region/type features. Falls back to medium/Amman/hospital if unknown.

---

## 4. Model Architecture

### Primary Model — XGBoost Regressor
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
    random_state=42,
    n_jobs=-1,
)
```

### Confidence Intervals — Quantile Regression
Three separate models trained on same features:
- `q50` — median prediction (main forecast, replaces old model)
- `q10` — lower bound (optimistic/best case)
- `q90` — upper bound (pessimistic/worst case)

Returns 80% prediction interval. Replaces current hard-coded `1.0 - week * 0.1` decay.

### Training Strategy — Walk-Forward Validation
```
Weeks 1–130  → training set  (~2.5 years)
Weeks 131–156 → test set     (~6 months, always in the future relative to training)
```
Prevents data leakage from future weeks into training (current random split has this bug).

### Baseline Comparison
Linear Regression kept as sanity-check baseline. Both MAE and R² reported for RF (legacy), XGBoost, and LinearRegression on held-out test set.

### Model Files
```
ai-service/data/
  forecast_model.pkl        # XGBoost q50 + encoders (same filename, same load interface)
  forecast_model_q10.pkl    # Lower bound model
  forecast_model_q90.pkl    # Upper bound model
```

---

## 5. API Changes (Minimal)

`POST /api/forecast` response gains two optional fields per prediction:

```json
{
  "blood_type": "O+",
  "week_offset": 1,
  "predicted_units": 42,
  "confidence": 0.87,
  "confidence_low": 35,
  "confidence_high": 51
}
```

`confidence` scalar is now derived from interval width: `1 - (q90 - q10) / (q90 + q10 + 1)` — tighter interval = higher confidence. Backwards compatible with existing dashboard code.

---

## 6. Documentation File

All model metadata written to `ai-service/AI_MODEL.md`:
- Data schema and generation parameters
- Feature list with descriptions
- Model hyperparameters
- Training metrics (MAE, R² per blood type)
- How to retrain
- How to add real data when available

---

## 7. Files Changed

| File | Change |
|------|--------|
| `ai-service/data/generate_synthetic.py` | Full rewrite — 20 facilities, 3 years, Ramadan, holidays, regional spikes |
| `ai-service/models/forecaster.py` | Replace RF with XGBoost, new features, quantile models, facility lookup |
| `ai-service/requirements.txt` | Add `xgboost>=2.0` |
| `ai-service/AI_MODEL.md` | New — full model documentation |
| `ai-service/data/synthetic_donations.csv` | Regenerated (24,960 rows) |
| `ai-service/data/synthetic_facilities.csv` | New |
| `ai-service/data/forecast_model.pkl` | Regenerated with XGBoost |
| `ai-service/data/forecast_model_q10.pkl` | New |
| `ai-service/data/forecast_model_q90.pkl` | New |

**Not changed:** `shortage.py`, `recommender.py`, `main.py`, all dashboard code.
