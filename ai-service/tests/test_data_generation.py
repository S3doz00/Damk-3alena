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
    ramadan_weeks = df[df['is_ramadan'] == 1]['week_num'].nunique()
    assert ramadan_weeks >= 10, f"Expected >=10 Ramadan weeks, got {ramadan_weeks}"


def test_holiday_flag_exists():
    df = generate_weekly_data()
    assert df['is_holiday'].sum() > 0, "No holiday weeks flagged"


def test_blood_type_distribution():
    df = generate_weekly_data()
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
    assert is_ramadan_week(datetime(2024, 3, 15)) is True
    assert is_ramadan_week(datetime(2024, 1, 15)) is False


def test_is_holiday_week_function():
    from datetime import datetime
    assert is_holiday_week(datetime(2024, 5, 25)) is True
    assert is_holiday_week(datetime(2024, 3, 1)) is False


def test_donor_data_shape():
    df = generate_donor_data(100)
    assert len(df) == 100
    required = {'donor_id', 'blood_type', 'latitude', 'longitude', 'is_eligible'}
    assert required.issubset(df.columns)
