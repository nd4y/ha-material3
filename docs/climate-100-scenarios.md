# 100 named climate acceptance scenarios

Executed in every build and CI by `test_scenario_contract.py`, against the shipped Jinja macros. Existing exhaustive source, thermal, context, permission, fault, journal and air-goal matrices run in addition. This finite contract is not a claim about every physical or firmware failure.

| ID | Input change | Required outcome |
| --- | --- | --- |
| thermal_deadband | `{}` | `{"plan.action": "idle", "plan.mode": ""}` |
| thermal_unknown_mode | `{"ac_mode": "unknown"}` | `{"plan.action": "unavailable", "plan.mode": ""}` |
| thermal_offline_mode | `{"ac_mode": "unavailable"}` | `{"plan.action": "unavailable", "plan.mode": ""}` |
| thermal_disabled | `{"auto_enabled": false}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_disabled_owned | `{"auto_enabled": false, "owned": true, "ac_mode": "cool"}` | `{"plan.action": "stop", "plan.mode": ""}` |
| thermal_room_missing | `{"room_ok": false}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_room_missing_owned | `{"room_ok": false, "owned": true, "ac_mode": "heat"}` | `{"plan.action": "stop", "plan.mode": ""}` |
| thermal_fault | `{"device_fault": true}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_fault_owned | `{"device_fault": true, "owned": true, "ac_mode": "cool"}` | `{"plan.action": "stop", "plan.mode": ""}` |
| thermal_supply_conflict | `{"supply_conflict": true, "measured": 25}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_supply_conflict_owned | `{"supply_conflict": true, "measured": 25, "owned": true, "ac_mode": "cool"}` | `{"plan.action": "stop", "plan.mode": ""}` |
| thermal_dry_manual | `{"ac_mode": "dry"}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_fan_manual | `{"ac_mode": "fan_only"}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_maximum_fan | `{"ac_mode": "fan_only", "maximum_fan_only": true}` | `{"plan.action": "idle", "plan.mode": ""}` |
| thermal_ownership_reconcile | `{"owned": true}` | `{"plan.action": "reconcile", "plan.mode": ""}` |
| thermal_adopt_cool | `{"ac_mode": "cool", "measured": 23.5}` | `{"plan.action": "adopt", "plan.mode": "cool"}` |
| thermal_stop_cool | `{"ac_mode": "cool", "measured": 23.5, "owned": true}` | `{"plan.action": "stop", "plan.mode": "cool"}` |
| thermal_adopt_heat | `{"ac_mode": "heat", "measured": 24.5}` | `{"plan.action": "adopt", "plan.mode": "heat"}` |
| thermal_stop_heat | `{"ac_mode": "heat", "measured": 24.5, "owned": true}` | `{"plan.action": "stop", "plan.mode": "heat"}` |
| thermal_cool_target_reached | `{"ac_mode": "cool", "measured": 24.1, "owned": true}` | `{"plan.action": "stop", "plan.mode": "cool"}` |
| thermal_heat_target_reached | `{"ac_mode": "heat", "measured": 23.9, "owned": true}` | `{"plan.action": "stop", "plan.mode": "heat"}` |
| thermal_minimum_cool_runtime | `{"ac_mode": "cool", "owned": true, "since_change": 299}` | `{"plan.action": "maintain", "plan.mode": "cool"}` |
| thermal_minimum_heat_runtime | `{"ac_mode": "heat", "owned": true, "since_change": 299}` | `{"plan.action": "maintain", "plan.mode": "heat"}` |
| thermal_adopt_hot | `{"ac_mode": "cool", "measured": 25}` | `{"plan.action": "adopt", "plan.mode": "cool"}` |
| thermal_adopt_cold | `{"ac_mode": "heat", "measured": 23}` | `{"plan.action": "adopt", "plan.mode": "heat"}` |
| thermal_maintain_cool | `{"ac_mode": "cool", "measured": 25, "owned": true}` | `{"plan.action": "maintain", "plan.mode": "cool"}` |
| thermal_maintain_heat | `{"ac_mode": "heat", "measured": 23, "owned": true}` | `{"plan.action": "maintain", "plan.mode": "heat"}` |
| thermal_start_cool | `{"measured": 24.7}` | `{"plan.action": "start", "plan.mode": "cool"}` |
| thermal_wait_cool | `{"measured": 24.7, "since_change": 299}` | `{"plan.action": "wait", "plan.mode": "cool"}` |
| thermal_start_heat | `{"measured": 23.3}` | `{"plan.action": "start", "plan.mode": "heat"}` |
| thermal_wait_heat | `{"measured": 23.3, "since_change": 299}` | `{"plan.action": "wait", "plan.mode": "heat"}` |
| thermal_breather_assist_dwell | `{"measured": 23.3, "heating_ready": false}` | `{"plan.action": "wait", "plan.mode": "heat"}` |
| thermal_breather_has_capacity | `{"measured": 23.3, "breather_at_limit": false}` | `{"plan.action": "idle", "plan.mode": ""}` |
| thermal_fan_delegated_heat | `{"ac_mode": "fan_only", "thermal_authorized": true, "measured": 23}` | `{"plan.action": "start", "plan.mode": "heat"}` |
| thermal_fan_delegated_cool | `{"ac_mode": "fan_only", "thermal_authorized": true, "measured": 25}` | `{"plan.action": "start", "plan.mode": "cool"}` |
| thermal_fan_delegated_pause | `{"ac_mode": "fan_only", "thermal_authorized": true, "measured": 25, "since_change": 299}` | `{"plan.action": "wait", "plan.mode": "cool"}` |
| thermal_fan_delegated_fault | `{"ac_mode": "fan_only", "thermal_authorized": true, "device_fault": true}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_fan_delegated_missing | `{"ac_mode": "fan_only", "thermal_authorized": true, "room_ok": false}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_fan_delegated_disabled | `{"ac_mode": "fan_only", "thermal_authorized": true, "auto_enabled": false}` | `{"plan.action": "release", "plan.mode": ""}` |
| thermal_dry_not_adopted | `{"ac_mode": "dry", "thermal_authorized": true, "measured": 23}` | `{"plan.action": "release", "plan.mode": ""}` |
| air_baseline | `{}` | `{"target": 3, "can_command": true}` |
| air_master_off | `{"enabled": false}` | `{"can_command": false, "reason": "disabled"}` |
| air_profile_off | `{"global_off": true}` | `{"target": 0, "mode": "off"}` |
| air_maximum | `{"global_maximum": true}` | `{"target": 14, "mode": "maximum"}` |
| air_off_wins | `{"global_off": true, "global_maximum": true}` | `{"target": 0, "mode": "off"}` |
| air_manual_zero | `{"automatic": false, "desired": 0, "sensor_request": 14}` | `{"target": 0}` |
| air_manual_fraction | `{"automatic": false, "desired": 1}` | `{"target": 1}` |
| air_manual_half | `{"automatic": false, "desired": 50}` | `{"target": 7}` |
| air_manual_full | `{"automatic": false, "desired": 100}` | `{"target": 14}` |
| air_sensor_raises | `{"automatic": false, "desired": 1, "sensor_request": 8}` | `{"target": 8}` |
| air_noise_cap | `{"sensor_request": 12, "noise_cap": 4}` | `{"target": 4, "reason": "noise_cap"}` |
| air_hard_cap | `{"sensor_request": 12, "hard_cap": 2}` | `{"target": 2, "reason": "hard_cap"}` |
| air_zero_cap | `{"hard_cap": 0}` | `{"target": 0}` |
| air_boost | `{"boost_deadline": 1001}` | `{"target": 5, "boost_active": true}` |
| air_boost_expiry | `{"boost_deadline": 1000}` | `{"target": 3, "boost_active": false}` |
| air_boost_expired | `{"boost_deadline": 999}` | `{"target": 3, "boost_active": false}` |
| air_boost_ceiling | `{"default_request": 11, "boost_deadline": 1001}` | `{"target": 12}` |
| air_boost_no_reduction | `{"default_request": 14, "boost_deadline": 1001}` | `{"target": 14}` |
| air_boost_noise | `{"boost_deadline": 1001, "noise_cap": 4}` | `{"target": 4}` |
| air_maximum_noise | `{"global_maximum": true, "noise_cap": 4}` | `{"target": 4}` |
| air_speed_locked | `{"speed_allowed": false}` | `{"can_command": false, "reason": "speed_locked"}` |
| air_locked_on_power | `{"power_allowed": false}` | `{"can_set_speed": true, "can_set_power": false}` |
| air_locked_off_power | `{"power_allowed": false, "current_power": "off"}` | `{"can_command": false, "reason": "power_locked"}` |
| air_locked_unknown_power | `{"power_allowed": false, "current_power": "unknown"}` | `{"can_command": false}` |
| air_unavailable | `{"available": false}` | `{"can_command": false, "requires_shutdown": false}` |
| air_fault_on | `{"fault": true}` | `{"can_command": false, "notify": true, "requires_shutdown": true}` |
| air_fault_off | `{"fault": true, "current_power": "off"}` | `{"notify": true, "requires_shutdown": false}` |
| air_fault_unreachable | `{"fault": true, "available": false}` | `{"notify": true, "requires_shutdown": false}` |
| air_invalid_wish | `{"desired": "unknown"}` | `{"can_command": false, "reason": "invalid_input"}` |
| air_single_step_boost | `{"hardware_max": 1, "boost_deadline": 1001, "default_request": 0}` | `{"target": 0}` |
| source_primary | `{}` | `{"room": 23, "source": "primary"}` |
| source_no_averaging | `{"secondary": {"value": 30}}` | `{"room": 23, "disagreement": true}` |
| source_primary_offline | `{"primary": {"available": false}}` | `{"room_ok": false}` |
| source_primary_unconfirmed | `{"primary": {"confirmed": false}}` | `{"room_ok": false}` |
| source_primary_expired | `{"primary": {"age": 901}}` | `{"room_ok": false}` |
| source_exact_ttl | `{"primary": {"age": 900}}` | `{"room_ok": true}` |
| source_negative_age | `{"primary": {"age": -1}}` | `{"room_ok": false}` |
| source_fallback_opt_in | `{"primary": {"available": false}, "fallback_enabled": true}` | `{"room": 24, "source": "secondary"}` |
| source_fallback_stale | `{"primary": {"available": false}, "secondary": {"age": 901}, "fallback_enabled": true}` | `{"room_ok": false}` |
| source_fallback_not_average | `{"fallback_enabled": true}` | `{"room": 23, "source": "primary"}` |
| source_invalid_room_low | `{"primary": {"value": 4.9}}` | `{"room_ok": false}` |
| source_invalid_room_high | `{"primary": {"value": 40.1}}` | `{"room_ok": false}` |
| source_target_min | `{"desired": 16}` | `{"valid": true, "intent": "cool"}` |
| source_target_max | `{"desired": 30}` | `{"valid": true, "intent": "heat"}` |
| source_target_invalid | `{"desired": 30.1}` | `{"valid": false}` |
| source_outdoor_missing | `{"outdoor": {"available": false}}` | `{"outdoor_ok": false, "passive_cooling": false}` |
| source_outdoor_upstream_no_flow | `{"airflow_confirmed": false}` | `{"outdoor_ok": true, "outdoor_qualified": false}` |
| source_free_cooling | `{"desired": 22}` | `{"passive_cooling": true}` |
| source_warm_outdoor | `{"outdoor": {"value": 29}}` | `{"heater_unhelpful": true}` |
| source_stable_55_minutes | `{"primary": {"age": 3300, "ttl": 5400}}` | `{"room_ok": true, "room": 23}` |
| passive_start | `{"eligible": true, "severe": false, "reset": false, "pending": "off", "elapsed": 0, "timeout": 300}` | `{"start_pending": true, "wait": true}` |
| passive_pending | `{"eligible": true, "severe": false, "reset": false, "pending": "on", "elapsed": 299, "timeout": 300}` | `{"start_pending": false, "wait": true}` |
| passive_expiry | `{"eligible": true, "severe": false, "reset": false, "pending": "on", "elapsed": 300, "timeout": 300}` | `{"wait": false}` |
| passive_expired | `{"eligible": true, "severe": false, "reset": false, "pending": "on", "elapsed": 301, "timeout": 300}` | `{"wait": false}` |
| passive_severe | `{"eligible": true, "severe": true, "reset": false, "pending": "on", "elapsed": 0, "timeout": 300}` | `{"wait": false, "cancel_pending": true}` |
| passive_not_eligible | `{"eligible": false, "severe": false, "reset": false, "pending": "on", "elapsed": 0, "timeout": 300}` | `{"wait": false, "cancel_pending": true}` |
| passive_reset | `{"eligible": true, "severe": false, "reset": true, "pending": "on", "elapsed": 300, "timeout": 300}` | `{"start_pending": true, "wait": true}` |
| passive_unknown | `{"eligible": true, "severe": false, "reset": false, "pending": "unknown", "elapsed": 0, "timeout": 300}` | `{"start_pending": true, "wait": true}` |
| passive_bad_timeout | `{"eligible": true, "severe": false, "reset": false, "pending": "off", "elapsed": 0, "timeout": 0}` | `{"valid": false, "wait": false}` |
| passive_bad_elapsed | `{"eligible": true, "severe": false, "reset": false, "pending": "off", "elapsed": -1, "timeout": 300}` | `{"valid": false, "wait": false}` |
