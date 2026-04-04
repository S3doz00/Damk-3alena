"""
Blood demand forecasting model using XGBoost quantile regression.
Predicts weekly blood consumption per facility per blood type.
Three models: q10 (lower bound), q50 (median/primary), q90 (upper bound).
"""

import math
import os
import pickle

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

MODEL_PATH      = os.path.join(os.path.dirname(__file__), '..', 'data', 'forecast_model.pkl')
MODEL_Q10_PATH  = os.path.join(os.path.dirname(__file__), '..', 'data', 'forecast_model_q10.pkl')
MODEL_Q90_PATH  = os.path.join(os.path.dirname(__file__), '..', 'data', 'forecast_model_q90.pkl')
DATA_PATH       = os.path.join(os.path.dirname(__file__), '..', 'data', 'synthetic_donations.csv')
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


def _make_xgb(quantile_alpha: float) -> XGBRegressor:
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
        self.model      = None   # q50 — primary median model
        self.model_q10  = None   # lower confidence bound
        self.model_q90  = None   # upper confidence bound
        self.blood_type_encoder = LabelEncoder()
        self.is_trained = False
        self.facilities: dict = {}

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _load_facilities(self):
        if not self.facilities and os.path.exists(FACILITIES_PATH):
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
        df['week_start']  = pd.to_datetime(df['week_start'])
        df['week_of_year'] = df['week_start'].dt.isocalendar().week.astype(int)
        df['month']        = df['week_start'].dt.month
        df['week_sin']     = np.sin(2 * np.pi * df['week_of_year'] / 52)
        df['week_cos']     = np.cos(2 * np.pi * df['week_of_year'] / 52)

        df['blood_type_encoded']  = self.blood_type_encoder.fit_transform(df['blood_type'])
        df['facility_size_enc']   = df['size'].map(SIZE_ENC).fillna(1).astype(int)
        df['facility_region_enc'] = df['region'].map(REGION_ENC).fillna(0).astype(int)
        df['facility_type_enc']   = df['facility_type'].map(TYPE_ENC).fillna(2).astype(int)

        if 'is_ramadan' not in df.columns: df['is_ramadan'] = 0
        if 'is_holiday'  not in df.columns: df['is_holiday']  = 0

        df = df.sort_values(['facility_idx', 'blood_type', 'week_num'])
        grouped = df.groupby(['facility_idx', 'blood_type'])

        df['rolling_avg_4w']     = grouped['units_consumed'].transform(lambda x: x.rolling(4,  min_periods=1).mean())
        df['rolling_avg_8w']     = grouped['units_consumed'].transform(lambda x: x.rolling(8,  min_periods=1).mean())
        df['rolling_avg_12w']    = grouped['units_consumed'].transform(lambda x: x.rolling(12, min_periods=1).mean())
        df['last_week_consumed'] = grouped['units_consumed'].transform(lambda x: x.shift(1))
        df['last_week_consumed'] = df['last_week_consumed'].fillna(df['units_consumed'])

        return df

    # ── Public API ────────────────────────────────────────────────────────────

    def train(self, data_path: str = None) -> dict:
        """Train q10/q50/q90 XGBoost models with walk-forward validation."""
        self._load_facilities()
        df = pd.read_csv(data_path or DATA_PATH)
        df = self._prepare_features(df)

        # Walk-forward split: last 26 weeks (~6 months) held out as test
        split_week = df['week_num'].max() - 26
        train_mask = df['week_num'] <= split_week

        X_train = df[train_mask][FEATURE_COLS]
        y_train = df[train_mask]['units_consumed']
        X_test  = df[~train_mask][FEATURE_COLS]
        y_test  = df[~train_mask]['units_consumed']

        self.model     = _make_xgb(0.50)
        self.model_q10 = _make_xgb(0.10)
        self.model_q90 = _make_xgb(0.90)

        self.model.fit(X_train,     y_train)
        self.model_q10.fit(X_train, y_train)
        self.model_q90.fit(X_train, y_train)

        self.is_trained = True

        y_pred = self.model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2  = r2_score(y_test, y_pred)

        lr = LinearRegression().fit(X_train, y_train)
        lr_pred = lr.predict(X_test)

        # Save all three models + shared encoder/facilities
        payload_base = {'encoder': self.blood_type_encoder, 'facilities': self.facilities}
        for model_obj, path in [
            (self.model,     MODEL_PATH),
            (self.model_q10, MODEL_Q10_PATH),
            (self.model_q90, MODEL_Q90_PATH),
        ]:
            with open(path, 'wb') as f:
                pickle.dump({'model': model_obj, **payload_base}, f)

        return {
            'xgboost':           {'mae': round(mae, 2), 'r2': round(r2, 4)},
            'linear_regression': {
                'mae': round(mean_absolute_error(y_test, lr_pred), 2),
                'r2':  round(r2_score(y_test, lr_pred), 4),
            },
            'train_size': int(train_mask.sum()),
            'test_size':  int((~train_mask).sum()),
        }

    def load(self) -> bool:
        """Load all three pre-trained quantile models."""
        if not all(os.path.exists(p) for p in [MODEL_PATH, MODEL_Q10_PATH, MODEL_Q90_PATH]):
            return False
        for attr, path in [
            ('model',     MODEL_PATH),
            ('model_q10', MODEL_Q10_PATH),
            ('model_q90', MODEL_Q90_PATH),
        ]:
            with open(path, 'rb') as f:
                data = pickle.load(f)
            setattr(self, attr, data['model'])
            self.blood_type_encoder = data['encoder']
            self.facilities = data.get('facilities', {})
        self.is_trained = True
        return True

    def predict(self, facility_idx: int, blood_types: list, weeks_ahead: int = 4) -> list:
        """
        Predict blood demand with 80% confidence intervals.

        Returns list of dicts:
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
                # Fallback: use any facility's data for this blood type
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

                # Guarantee ordering: q10 ≤ q50 ≤ q90
                q10 = min(q10, q50)
                q90 = max(q90, q50)

                # Confidence: tighter interval → higher score
                interval   = q90 - q10
                confidence = round(max(0.0, min(1.0, 1.0 - (interval / (q90 + q10 + 1)))), 2)

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
    print("Training XGBoost forecaster (q10 / q50 / q90)...")
    metrics = forecaster.train()
    print(f"  XGBoost  — MAE: {metrics['xgboost']['mae']:>7.2f}  |  R²: {metrics['xgboost']['r2']:.4f}")
    print(f"  Linear   — MAE: {metrics['linear_regression']['mae']:>7.2f}  |  R²: {metrics['linear_regression']['r2']:.4f}")
    print(f"  Train: {metrics['train_size']:,} rows  |  Test: {metrics['test_size']:,} rows")
    print("\nModels saved to data/forecast_model*.pkl")
