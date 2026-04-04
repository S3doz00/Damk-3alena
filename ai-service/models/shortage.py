"""
Shortage detection module.
Rule-based comparison of forecasted demand vs current inventory vs thresholds.
"""


def detect_shortages(
    forecasts: list[dict],
    current_inventory: dict[str, int],
    threshold_warning: int = 15,
    threshold_critical: int = 5
) -> list[dict]:
    """
    Detect blood shortages based on forecasts and current inventory.

    Args:
        forecasts: List of {blood_type, week_offset, predicted_units}
        current_inventory: Dict of {blood_type: current_units}
        threshold_warning: Units below which to trigger warning
        threshold_critical: Units below which to trigger critical alert

    Returns:
        List of shortage alerts with severity levels.
    """
    alerts = []

    # Group forecasts by blood type
    bt_forecasts: dict[str, list] = {}
    for f in forecasts:
        bt = f['blood_type']
        if bt not in bt_forecasts:
            bt_forecasts[bt] = []
        bt_forecasts[bt].append(f)

    for blood_type, type_forecasts in bt_forecasts.items():
        current = current_inventory.get(blood_type, 0)

        # Calculate cumulative demand over forecast period
        total_predicted = sum(f['predicted_units'] for f in type_forecasts)

        # Project inventory after forecast period
        projected = current - total_predicted

        # Check first week specifically (most urgent)
        first_week_demand = type_forecasts[0]['predicted_units'] if type_forecasts else 0
        after_first_week = current - first_week_demand

        # Determine severity
        severity = None
        message = None

        if after_first_week <= threshold_critical:
            severity = 'critical'
            message = (
                f"CRITICAL: {blood_type} projected to drop to {after_first_week} units "
                f"after this week (threshold: {threshold_critical}). "
                f"Current inventory: {current} units, expected demand: {first_week_demand} units."
            )
        elif after_first_week <= threshold_warning:
            severity = 'warning'
            message = (
                f"WARNING: {blood_type} projected at {after_first_week} units "
                f"after this week (threshold: {threshold_warning}). "
                f"Current inventory: {current} units, expected demand: {first_week_demand} units."
            )
        elif projected <= threshold_critical:
            severity = 'warning'
            weeks = len(type_forecasts)
            message = (
                f"WARNING: {blood_type} projected to reach critical levels within "
                f"{weeks} weeks. Current: {current} units, projected: {projected} units."
            )

        if severity:
            alerts.append({
                'blood_type': blood_type,
                'severity': severity,
                'current_units': current,
                'predicted_demand': total_predicted,
                'projected_inventory': max(0, projected),
                'threshold': threshold_critical if severity == 'critical' else threshold_warning,
                'message': message
            })

    # Sort: critical first, then warning
    alerts.sort(key=lambda x: 0 if x['severity'] == 'critical' else 1)
    return alerts
