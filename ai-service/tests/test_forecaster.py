"""Tests for the XGBoost blood demand forecaster."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from models.forecaster import BloodDemandForecaster, FEATURE_COLS


def test_feature_cols_complete():
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
    f1 = BloodDemandForecaster()
    f1.train()
    results_before = f1.predict(facility_idx=1, blood_types=['A+'], weeks_ahead=2)

    f2 = BloodDemandForecaster()
    assert f2.load(), "load() should return True when model files exist"
    results_after = f2.predict(facility_idx=1, blood_types=['A+'], weeks_ahead=2)

    assert len(results_before) == len(results_after)
    for r1, r2 in zip(results_before, results_after):
        assert r1['predicted_units'] == r2['predicted_units']


def test_unknown_facility_falls_back():
    f = BloodDemandForecaster()
    f.train()
    results = f.predict(facility_idx=999, blood_types=['O+'], weeks_ahead=2)
    assert len(results) == 2


def test_linear_regression_baseline_in_metrics():
    f = BloodDemandForecaster()
    metrics = f.train()
    assert 'linear_regression' in metrics
    assert 'mae' in metrics['linear_regression']
