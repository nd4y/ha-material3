"""Regression matrices for the exported, installed context/air/thermal formulas."""

import itertools
import json
import math
from pathlib import Path
import unittest

from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT = Path(__file__).resolve().parents[2]
ENV = Environment(loader=FileSystemLoader(str(ROOT / "controller")), undefined=StrictUndefined)


def is_number(value):
    try:
        return not isinstance(value, bool) and math.isfinite(float(value))
    except (TypeError, ValueError):
        return False


ENV.globals["is_number"] = is_number
MODULE = ENV.get_template("legacy-policy.jinja").module


def run(name, p):
    return json.loads(str(getattr(MODULE, name)(p)))


VALUES = {
    "context_sleep_ttl": 1800, "context_presence_ttl": 300, "context_active_ttl": 300,
    "sleep_confidence_threshold": 85, "absence_dwell": 900,
    "quiet_hour_start": 23, "quiet_hour_end": 8,
    "sleep_purifier_cap": 1, "sleep_breather_cap": 1,
    "awake_purifier_cap": 4, "awake_breather_cap": 4,
    "purifier_quiet_limit": 3, "unknown_breather_cap": 3,
    "purifier_max": 11, "breather_max": 7,
    "air_quality_ttl": 600, "air_level": "Автоматически",
    "room_temperature": 24, "room_target_temperature": 24,
    "critical_purifier_cap": 7, "critical_breather_cap": 5,
    "purifier_standard_limit": 4, "purifier_auto_limit": 6,
    "purifier_speed_limit": 11, "purifier_noise_cap": 11,
    "invalid_pm_fallback": 3, "breather_speed_limit": 7,
}


def source(value="unknown", age=0, changed=0, available=None):
    return {
        "available": value not in ["unknown", "unavailable"] if available is None else available,
        "value": value, "age": age, "changed": changed,
    }


def context(**changes):
    p = {"values": VALUES, "hour": 14, "worn_configured": False,
         "sources": {k: source() for k in ["presence", "sleep", "confidence", "interactive", "worn"]}}
    return run("legacy_context", p | changes)


def air(**changes):
    return run("legacy_air", {
        "values": VALUES,
        "context": {"profile": "unknown", "purifier_cap": 3, "breather_cap": 3, "ac_fan_cap": "low"},
        "noise": {"configured": False, "valid": False},
        "pm": source(0), "co2": source(800), "trust_availability": False,
        "pm_critical": False, "co2_critical": False,
    } | changes)


THERMAL = {
    "auto_enabled": True, "room_ok": True, "measured": 24, "desired": 24,
    "ac_mode": "off", "owned": False, "device_fault": False,
    "maximum_fan_only": False, "native_room_ok": True, "native_room": 24,
    "since_change": 300, "since_target": 600, "current_target": 24,
    "cycle_target": 24, "target_changed": False, "breather_at_limit": True,
    "supply_conflict": False, "heating_ready": True,
}


def thermal(**changes):
    return run("legacy_thermal", THERMAL | changes)


class LegacyContextTests(unittest.TestCase):
    def test_existing_324_context_regression_cases(self):
        count = 0
        for presence, sleep, confidence, active, hour, dwell in itertools.product(
            ["on", "off", "unknown"], ["on", "off", "unknown"],
            [0, 90, "unknown"], ["on", "off", "unknown"], [2, 14], [0, 1800]
        ):
            sources = {"presence": source(presence, changed=dwell), "sleep": source(sleep),
                       "confidence": source(confidence), "interactive": source(active), "worn": source()}
            asleep = sleep == "on" or confidence == 90
            awake = active == "on" or sleep == "off"
            absent = presence == "off" and dwell >= 900
            expected = "absent" if absent else "sleep" if asleep else "awake" if awake else "night_unknown" if hour == 2 else "unknown"
            result = context(sources=sources, hour=hour)
            self.assertEqual(result["profile"], expected, (sources, hour, result))
            self.assertEqual(result["sleep"], "conflict" if asleep and awake else "asleep" if asleep else "awake" if awake else "unknown")
            count += 1
        self.assertEqual(count, 324)

    def test_watch_freshness_worn_and_phone_disagreement_matrix(self):
        count = 0
        for activity, worn, age, confidence, active in itertools.product(
            ["asleep", "passive", "exercise", "unknown"], ["on", "off", "unknown"],
            [-1, 0, 1800, 1801], [0, 85, "unknown"], ["on", "off", "unknown"]
        ):
            sources = {"sleep": source(activity, age=age), "worn": source(worn),
                       "confidence": source(confidence), "interactive": source(active), "presence": source()}
            result = context(sources=sources, worn_configured=True)
            usable = activity != "unknown" and worn == "on" and 0 <= age <= 1800
            asleep = usable and activity == "asleep" or confidence == 85
            awake = usable and activity in ["passive", "exercise"] or active == "on"
            self.assertEqual(result["watch_available"], usable)
            self.assertEqual(result["sleep"], "conflict" if asleep and awake else "asleep" if asleep else "awake" if awake else "unknown")
            if asleep:
                self.assertEqual(result["profile"], "sleep")
                self.assertEqual(result["purifier_cap"], 1)
            count += 1
        self.assertEqual(count, 432)

    def test_missing_context_is_not_presence_or_awake(self):
        for hour in [0, 8, 14, 23]:
            result = context(hour=hour)
            self.assertEqual(result["presence"], "unknown")
            self.assertEqual(result["sleep"], "unknown")
            self.assertNotEqual(result["profile"], "absent")

    def test_verified_room_absence_removes_soft_noise_limit_even_during_sleep(self):
        for active, watch in itertools.product(["on", "off"], ["asleep", "passive"]):
            sources = {"presence": source("off", changed=900), "sleep": source(watch),
                       "confidence": source(100), "interactive": source(active), "worn": source("on")}
            out = context(sources=sources, worn_configured=True)
            self.assertEqual(out["presence"], "absent")
            self.assertEqual(out["profile"], "absent")
            self.assertEqual((out["purifier_cap"], out["breather_cap"], out["ac_fan_cap"]), (11, 7, "high"))
            for unknown in [source("unknown"), source("off", changed=899), source("off", age=301, changed=900)]:
                sources["presence"] = unknown
                out = context(sources=sources, worn_configured=True)
                self.assertNotEqual(out["profile"], "absent")
                self.assertEqual(out["profile"], "sleep")
                sources["presence"] = source("off", changed=900)

    def test_stale_phone_never_proves_awake_or_asleep(self):
        sources = {"sleep": source(), "worn": source(), "presence": source(),
                   "confidence": source(100, age=1801), "interactive": source("on", age=301)}
        self.assertEqual(context(sources=sources)["sleep"], "unknown")

    def test_quiet_hours_cross_midnight_or_same_day(self):
        for start, end in [(23, 8), (8, 18), (0, 0)]:
            for hour in range(24):
                result = context(values=VALUES | {"quiet_hour_start": start, "quiet_hour_end": end}, hour=hour)
                expected = hour >= start or hour < end if start >= end else start <= hour < end
                self.assertEqual(result["night"], expected)


class LegacyAirTests(unittest.TestCase):
    def test_existing_7200_air_policy_cases(self):
        profiles = {"sleep": (1, 1, "low"), "absent": (11, 7, "high"),
                    "awake": (4, 4, "medium"), "night_unknown": (1, 1, "low"), "unknown": (3, 3, "low")}
        count = 0
        for mode, profile, pm, co2, available, age, critical_age, hard in itertools.product(
            ["Автоматически", "Полностью автоматически", "Отключено", "Тихий", "Стандартный", "Максимум"],
            profiles, [0, 16, 76, 150, 2001], [799, 1400, 1900],
            [False, True], [0, 601], [0, 120], [3, 11]
        ):
            pc, bc, fc = profiles[profile]
            valid = available and age <= 600
            pv = valid and 0 <= pm <= 2000
            cv = valid and 250 <= co2 <= 10000
            criticalp = mode == "Полностью автоматически" and pv and pm >= 150 and critical_age >= 120
            criticalb = mode == "Полностью автоматически" and cv and co2 >= 1800 and critical_age >= 120
            floor = 11 if mode == "Максимум" else 2 if mode == "Стандартный" else 1
            particle_demand = 1 if pm <= 8 else 3 if pm <= 15 else 4 if pm <= 35 else 7 if pm <= 75 else 11
            demand = max(floor, particle_demand if pv else 3)
            profilecap = max(pc, 7) if criticalp else pc
            cap = min(hard, profilecap if mode == "Полностью автоматически" else 3 if mode == "Тихий" else 4 if mode == "Стандартный" else 6 if mode == "Автоматически" else 11)
            values = VALUES | {"air_level": mode, "purifier_speed_limit": hard}
            result = air(values=values, context={"profile": profile, "purifier_cap": pc, "breather_cap": bc, "ac_fan_cap": fc},
                         pm=source(pm, age=age, available=available), co2=source(co2, age=age, available=available),
                         pm_critical=critical_age >= 120 and pm >= 150,
                         co2_critical=critical_age >= 120 and co2 >= 1800)
            self.assertEqual(result["purifier"], "off" if mode == "Отключено" else min(demand, cap))
            self.assertEqual(result["purifier_cap"], cap)
            self.assertEqual(result["critical_pm"], criticalp)
            self.assertEqual(result["critical_co2"], criticalb)
            self.assertEqual(result["pm_valid"], pv)
            self.assertEqual(result["co2_valid"], cv)
            self.assertEqual(result["breather_sensor_requested"], (2 if co2 < 800 else 3 if co2 < 1000 else 4 if co2 < 1400 else 5 if co2 < 1800 else 7) if cv else 3)
            count += 1
        self.assertEqual(count, 7200)

    def test_source_freshness_availability_and_numeric_ranges(self):
        for available, trust, age, value in itertools.product(
            [False, True], [False, True], [-1, 0, 600, 601], [0, 24, 2000, 2001, "unknown"]
        ):
            out = air(trust_availability=trust, pm=source(value, age=age, available=available))
            self.assertEqual(out["pm_valid"], available and is_number(value) and 0 <= float(value) <= 2000 and (trust or 0 <= age <= 600))
        for value in [249, 250, 10000, 10001, "unknown"]:
            self.assertEqual(air(co2=source(value, available=True))["co2_valid"], is_number(value) and 250 <= float(value) <= 10000)

    def test_noise_learned_cap_critical_and_absence_policy(self):
        for full, profile, critical, noise_valid in itertools.product([False, True], ["awake", "absent"], [False, True], [False, True]):
            out = air(values=VALUES | {"air_level": "Полностью автоматически" if full else "Автоматически", "purifier_noise_cap": 2},
                      context={"profile": profile, "purifier_cap": 11, "breather_cap": 7, "ac_fan_cap": "high"},
                      pm=source(150), pm_critical=critical, noise={"valid": noise_valid, "configured": True})
            if noise_valid and not(full and (profile == "absent" or critical)):
                self.assertLessEqual(out["purifier"], 2)
            self.assertLessEqual(out["purifier"], 11)

    def test_channel_boost_and_deadline_do_not_remove_resolved_noise_caps(self):
        from test_air_goals import evaluate
        for profile, context_cap, measured_noise, deadline in itertools.product(
            ["sleep", "awake", "unknown"], [1, 3, 4], [False, True], [0, 1000, 1001]
        ):
            plan = air(values=VALUES | {"air_level": "Полностью автоматически", "purifier_noise_cap": 2},
                       context={"profile": profile, "purifier_cap": context_cap, "breather_cap": context_cap, "ac_fan_cap": "low"},
                       pm=source(150), co2=source(1900), noise={"valid": measured_noise, "configured": measured_noise})
            for key in ["purifier", "breather"]:
                out = evaluate(default_request=plan[key + "_requested"], sensor_request=0,
                               hardware_max=11 if key == "purifier" else 7,
                               noise_cap=plan[key + "_cap"], boost_ceiling=7 if key == "purifier" else 5,
                               boost_deadline=deadline, boost_increment=2)
                self.assertLessEqual(out["target"], context_cap)
                if key == "purifier" and measured_noise:
                    self.assertLessEqual(out["target"], 2)


class LegacyThermalTests(unittest.TestCase):
    def test_plan_branch_witnesses(self):
        cases = [
            ({}, "idle", ""),
            ({"ac_mode": "unknown"}, "unavailable", ""),
            ({"ac_mode": "unavailable"}, "unavailable", ""),
            ({"auto_enabled": False}, "release", ""),
            ({"auto_enabled": False, "owned": True, "ac_mode": "cool"}, "stop", ""),
            ({"room_ok": False}, "release", ""),
            ({"room_ok": False, "owned": True, "ac_mode": "heat"}, "stop", ""),
            ({"device_fault": True}, "release", ""),
            ({"device_fault": True, "owned": True, "ac_mode": "cool"}, "stop", ""),
            ({"supply_conflict": True, "measured": 25}, "release", ""),
            ({"supply_conflict": True, "measured": 25, "owned": True, "ac_mode": "cool"}, "stop", ""),
            ({"ac_mode": "dry"}, "release", ""),
            ({"ac_mode": "fan_only"}, "release", ""),
            ({"ac_mode": "fan_only", "maximum_fan_only": True}, "idle", ""),
            ({"owned": True}, "reconcile", ""),
            ({"ac_mode": "cool", "measured": 23.5}, "adopt", "cool"),
            ({"ac_mode": "cool", "measured": 23.5, "owned": True}, "stop", "cool"),
            ({"ac_mode": "heat", "measured": 24.5}, "adopt", "heat"),
            ({"ac_mode": "heat", "measured": 24.5, "owned": True}, "stop", "heat"),
            ({"ac_mode": "cool", "measured": 24.1, "owned": True}, "stop", "cool"),
            ({"ac_mode": "heat", "measured": 23.9, "owned": True}, "stop", "heat"),
            ({"ac_mode": "cool", "measured": 24, "owned": True, "since_change": 299}, "maintain", "cool"),
            ({"ac_mode": "heat", "measured": 24, "owned": True, "since_change": 299}, "maintain", "heat"),
            ({"ac_mode": "cool", "measured": 25}, "adopt", "cool"),
            ({"ac_mode": "heat", "measured": 23}, "adopt", "heat"),
            ({"ac_mode": "cool", "measured": 25, "owned": True}, "maintain", "cool"),
            ({"ac_mode": "heat", "measured": 23, "owned": True}, "maintain", "heat"),
            ({"measured": 24.7}, "start", "cool"),
            ({"measured": 24.7, "since_change": 299}, "wait", "cool"),
            ({"measured": 23.3}, "start", "heat"),
            ({"measured": 23.3, "since_change": 299}, "wait", "heat"),
            ({"measured": 23.3, "heating_ready": False}, "wait", "heat"),
            ({"measured": 23.3, "breather_at_limit": False}, "idle", ""),
        ]
        for changes, action, mode in cases:
            out = thermal(**changes)
            self.assertEqual((out["plan"]["action"], out["plan"]["mode"]), (action, mode), changes)
        self.assertEqual(len(cases), 33)

    def test_thermal_guard_cross_product(self):
        count = 0
        for enabled, valid, fault, owned, mode, error, delay in itertools.product(
            [False, True], [False, True], [False, True], [False, True],
            ["off", "cool", "heat", "dry", "unknown", "unavailable"], [-1, 0, 1], [299, 300]
        ):
            out = thermal(auto_enabled=enabled, room_ok=valid, device_fault=fault, owned=owned,
                          ac_mode=mode, measured=24+error, since_change=delay)
            plan = out["plan"]
            if not enabled or not valid or fault or mode in ["unknown", "unavailable", "dry"]:
                self.assertNotIn(plan["action"], ["start", "maintain", "adopt"])
            if plan["action"] == "start":
                self.assertIn(plan["mode"], ["cool", "heat"])
                self.assertGreaterEqual(delay, 300)
            self.assertGreaterEqual(plan["target"], 16)
            self.assertLessEqual(plan["target"], 32)
            count += 1
        self.assertEqual(count, 576)

    def test_adjustment_branch_witnesses_and_slow_corrections(self):
        cases = [
            ({"measured": 25}, True, 23),
            ({"measured": 25, "current_target": 23}, False, 23),
            ({"ac_mode": "cool", "owned": True, "measured": 25, "target_changed": True}, True, 23),
            ({"ac_mode": "cool", "owned": True, "measured": 25, "cycle_target": 24, "since_target": 600}, True, 23),
            ({"ac_mode": "cool", "owned": True, "measured": 25, "cycle_target": 24, "since_target": 599}, False, 24),
            ({"ac_mode": "heat", "owned": True, "measured": 23, "cycle_target": 24, "since_target": 600}, True, 25),
            ({"ac_mode": "heat", "owned": True, "measured": 23, "cycle_target": 24, "since_target": 599}, False, 24),
            ({"ac_mode": "cool", "owned": True, "measured": 24.4, "cycle_target": 24}, False, 24),
            ({"ac_mode": "heat", "owned": True, "measured": 23.6, "cycle_target": 24}, False, 24),
            ({"native_room_ok": False, "measured": 25}, False, 24),
        ]
        for changes, send, value in cases:
            out = thermal(**changes)
            self.assertEqual((out["adjustment"]["send"], out["adjustment"]["value"]), (send, value), changes)
        self.assertEqual(len(cases), 10)

    def test_native_offset_bounded_and_target_range(self):
        for desired, measured, native, valid in itertools.product([16, 24, 30], [5, 24, 40], [5, 24, 40], [False, True]):
            plan = thermal(desired=desired, measured=measured, native_room=native, native_room_ok=valid)["plan"]
            expected_offset = min(3, max(-3, native-measured)) if valid else 0
            self.assertEqual(plan["target"], max(16, min(32, round(desired + expected_offset))))


if __name__ == "__main__":
    unittest.main()
