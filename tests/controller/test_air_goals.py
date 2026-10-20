"""Executable finite contract for the same Jinja macro installed in HA.

Run: python -m unittest discover -s tests/controller -v
No network, HA service calls, household entities or real devices are required.
"""

import itertools
import json
import math
from pathlib import Path
import unittest

from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "controller" / "air-goals.jinja"
BASE = {
    "enabled": True,
    "global_off": False,
    "global_maximum": False,
    "automatic": True,
    "desired": 50,
    "default_request": 3,
    "sensor_request": 0,
    "hardware_max": 14,
    "hard_cap": 14,
    "noise_cap": 14,
    "boost_deadline": 0,
    "now": 1000,
    "boost_increment": 2,
    "boost_ceiling": 12,
    "available": True,
    "fault": False,
    "speed_allowed": True,
    "power_allowed": True,
    "current_power": "on",
}


def compile_goal(source=None):
    env = Environment(
        loader=FileSystemLoader(str(SOURCE.parent)),
        undefined=StrictUndefined,
        autoescape=False,
    )
    template = env.from_string(source) if source is not None else env.get_template(SOURCE.name)
    return template.module.air_goal


GOAL = compile_goal()


def evaluate(p=None, **changes):
    inputs = BASE | ({} if p is None else p) | changes
    return json.loads(str(GOAL(inputs)))


class AirGoalContract(unittest.TestCase):
    def assert_guard_invariants(self, p, out):
        """Guard assertions are independent safety properties, not a second macro."""
        self.assertIsInstance(out["target"], int)
        self.assertGreaterEqual(out["target"], 0)
        self.assertLessEqual(out["target"], p["hardware_max"])
        self.assertLessEqual(out["target"], max(0, p["hard_cap"]))
        self.assertLessEqual(out["target"], max(0, p["noise_cap"]))
        self.assertGreaterEqual(out["requested"], out["target"])
        self.assertEqual(out["limited"], out["target"] < out["requested"])
        unavailable_for_command = not p["enabled"] or p["fault"] or not p["available"]
        if unavailable_for_command:
            self.assertFalse(out["can_command"], p)
            self.assertFalse(out["can_set_speed"], p)
            self.assertFalse(out["can_set_power"], p)
        if not p["speed_allowed"]:
            self.assertFalse(out["can_set_speed"], p)
            if out["target"] > 0:
                self.assertFalse(out["can_command"], p)
        if not p["power_allowed"]:
            self.assertFalse(out["can_set_power"], p)
            if p["current_power"] != "on" or out["target"] == 0:
                self.assertFalse(out["can_command"], p)
        self.assertEqual(out["notify"], p["fault"])
        self.assertEqual(
            out["requires_shutdown"],
            p["fault"] and p["available"] and p["current_power"] != "off",
        )

    def test_all_boolean_guard_and_profile_combinations(self):
        """6,912 complete combinations of every guard/profile Boolean, power and deadline."""
        flags = [
            "enabled", "global_off", "global_maximum", "automatic", "available",
            "fault", "speed_allowed", "power_allowed",
        ]
        count = 0
        for values in itertools.product([False, True], repeat=len(flags)):
            for power, deadline, desired in itertools.product(
                ["on", "off", "unknown"], [0, 1000, 1001], [0, 1, 100]
            ):
                p = BASE | dict(zip(flags, values)) | {
                    "current_power": power, "boost_deadline": deadline, "desired": desired
                }
                out = evaluate(p)
                self.assert_guard_invariants(p, out)
                if p["global_off"] and deadline <= p["now"]:
                    self.assertEqual(out["target"], 0)
                if p["global_maximum"]:
                    self.assertFalse(out["boost_active"])
                if not p["enabled"]:
                    self.assertEqual(out["reason"], "disabled")
                elif p["fault"]:
                    self.assertEqual(out["reason"], "fault")
                elif not p["available"]:
                    self.assertEqual(out["reason"], "unavailable")
                count += 1
        self.assertEqual(count, 6912)

    def test_numeric_boundary_matrix(self):
        """Boundary equivalence classes across 1/2/6/14-step hardware, caps and demand."""
        count = 0
        for maximum in [1, 2, 6, 14]:
            for desired, request, hard, noise, boost in itertools.product(
                [-1, 0, 0.01, 50, 99.99, 100, 101],
                [-1, 0, 1, maximum, maximum + 1],
                [-1, 0, 1, maximum, maximum + 1],
                [-1, 0, 1, maximum, maximum + 1],
                [False, True],
            ):
                p = BASE | {
                    "automatic": False,
                    "hardware_max": maximum,
                    "desired": desired,
                    "sensor_request": request,
                    "hard_cap": hard,
                    "noise_cap": noise,
                    "boost_deadline": 1001 if boost else 0,
                    "boost_ceiling": maximum + 1,
                    "boost_increment": maximum + 1,
                }
                out = evaluate(p)
                self.assert_guard_invariants(p, out)
                if desired <= 0 and not boost:
                    self.assertEqual(out["requested"], 0)
                elif not boost:
                    minimum = math.ceil(min(100, max(0, desired)) * maximum / 100)
                    self.assertGreaterEqual(out["requested"], minimum)
                if boost and desired <= 0:
                    self.assertLess(out["requested"], maximum)
                count += 1
        self.assertEqual(count, 7000)

    def test_automatic_default_and_sensor_are_independent_floors(self):
        for default, sensor in itertools.product([-1, 0, 1, 7, 14, 15], repeat=2):
            out = evaluate(default_request=default, sensor_request=sensor)
            self.assertEqual(out["requested"], min(14, max(0, default, sensor)))

    def test_manual_zero_is_explicit_off_and_unknown_is_not_zero(self):
        self.assertEqual(evaluate(automatic=False, desired=0, sensor_request=14)["target"], 0)
        for invalid in [None, "unknown", "unavailable", "0", False]:
            out = evaluate(automatic=False, desired=invalid)
            self.assertIsNone(out["target"])
            self.assertFalse(out["can_command"])
            self.assertEqual(out["reason"], "invalid_input")

    def test_boost_has_own_ceiling_and_never_lowers_existing_request(self):
        self.assertEqual(evaluate(boost_deadline=1100)["requested"], 5)
        self.assertEqual(evaluate(default_request=14, boost_deadline=1100)["requested"], 14)
        self.assertEqual(evaluate(sensor_request=13, boost_deadline=1100)["requested"], 13)
        self.assertEqual(evaluate(default_request=11, boost_deadline=1100)["requested"], 12)
        self.assertEqual(evaluate(default_request=0, boost_deadline=1100, boost_increment=-1)["target"], 0)
        self.assertEqual(evaluate(default_request=0, boost_deadline=1100, boost_ceiling=-1)["target"], 0)

    def test_boost_from_off_only_enables_own_channel_under_guards(self):
        for off in [dict(global_off=True), dict(automatic=False, desired=0)]:
            self.assertEqual(evaluate(**off, boost_deadline=1100)["target"], 2)
            self.assertEqual(evaluate(**off, boost_deadline=1100, hard_cap=1)["target"], 1)
            self.assertFalse(evaluate(**off, boost_deadline=1100, enabled=False)["can_command"])
            self.assertFalse(evaluate(**off, boost_deadline=1100, fault=True)["can_command"])
            self.assertFalse(evaluate(**off, boost_deadline=1100, speed_allowed=False)["can_command"])
            self.assertFalse(evaluate(**off, boost_deadline=1100, power_allowed=False, current_power="off")["can_command"])

    def test_deadline_expiry_boundary_and_restart_restore(self):
        self.assertTrue(evaluate(boost_deadline=1100, now=1099.999)["boost_active"])
        self.assertFalse(evaluate(boost_deadline=1100, now=1100)["boost_active"])
        self.assertFalse(evaluate(boost_deadline=1100, now=1100.001)["boost_active"])
        # A restart has no separate timer state: restored deadline is sufficient.
        saved = BASE | {"boost_deadline": 1100}
        self.assertEqual(evaluate(saved, now=1050)["target"], 5)
        self.assertEqual(evaluate(saved, now=1200)["target"], 3)
        self.assertFalse(evaluate(boost_deadline=-1)["boost_active"])

    def test_maximum_supersedes_boost_but_never_safety_or_explicit_global_off(self):
        out = evaluate(global_maximum=True, boost_deadline=1100)
        self.assertEqual(out["requested"], 14)
        self.assertEqual(out["mode"], "maximum")
        self.assertFalse(out["boost_active"])
        self.assertEqual(evaluate(global_maximum=True, noise_cap=4)["target"], 4)
        self.assertFalse(evaluate(global_maximum=True, fault=True)["can_command"])
        self.assertEqual(evaluate(global_maximum=True, global_off=True)["target"], 0)

    def test_fault_and_unavailable_are_distinct_safety_states(self):
        missing = evaluate(available=False)
        self.assertEqual(missing["reason"], "unavailable")
        self.assertFalse(missing["notify"])
        self.assertFalse(missing["requires_shutdown"])
        broken = evaluate(fault=True)
        self.assertEqual(broken["reason"], "fault")
        self.assertTrue(broken["requires_shutdown"])
        self.assertTrue(broken["notify"])
        self.assertFalse(broken["can_command"])
        # Fault is retained for notification even if shutdown cannot be sent.
        both = evaluate(fault=True, available=False)
        self.assertFalse(both["requires_shutdown"])
        self.assertTrue(both["notify"])
        self.assertEqual(both["reason"], "fault")
        self.assertFalse(evaluate(fault=True, current_power="off")["requires_shutdown"])
        self.assertTrue(evaluate(fault=True, enabled=False)["notify"])

    def test_power_lock_on_allows_speed_but_locked_off_does_not_enable(self):
        out = evaluate(power_allowed=False, current_power="on")
        self.assertTrue(out["can_set_speed"])
        self.assertFalse(out["can_set_power"])
        self.assertTrue(out["can_command"])
        for power in ["off", "unknown"]:
            out = evaluate(power_allowed=False, current_power=power)
            self.assertFalse(out["can_command"])
            self.assertEqual(out["reason"], "power_locked")
        out = evaluate(global_off=True, power_allowed=False, current_power="on")
        self.assertFalse(out["can_command"])

    def test_speed_lock_still_allows_authorized_off_but_not_start(self):
        self.assertFalse(evaluate(speed_allowed=False)["can_command"])
        out = evaluate(global_off=True, speed_allowed=False)
        self.assertTrue(out["can_set_power"])
        self.assertFalse(out["can_set_speed"])
        self.assertTrue(out["can_command"])

    def test_reason_precedence_and_limiting_cause(self):
        self.assertEqual(evaluate(default_request=9, hard_cap=3, noise_cap=5)["reason"], "hard_cap")
        self.assertEqual(evaluate(default_request=9, hard_cap=5, noise_cap=3)["reason"], "noise_cap")
        self.assertEqual(evaluate(default_request=9, hard_cap=3, noise_cap=3)["reason"], "noise_cap")
        self.assertEqual(evaluate(available=False, fault=True, enabled=False)["reason"], "disabled")
        self.assertEqual(evaluate(available=False, fault=True)["reason"], "fault")
        self.assertEqual(evaluate(available=False, speed_allowed=False)["reason"], "unavailable")

    def test_each_missing_or_wrong_typed_field_fails_closed(self):
        for key in BASE:
            p = BASE.copy()
            del p[key]
            out = json.loads(str(GOAL(p)))
            self.assertEqual(out["reason"], "invalid_input", key)
            self.assertFalse(out["can_command"], key)
        for key in ["enabled", "global_off", "global_maximum", "automatic", "available", "fault", "speed_allowed", "power_allowed"]:
            for value in [0, 1, "on", "off", "false", None, []]:
                self.assertEqual(evaluate(**{key: value})["reason"], "invalid_input", (key, value))
        for key in ["desired", "default_request", "sensor_request", "hardware_max", "hard_cap", "noise_cap", "boost_deadline", "now", "boost_increment", "boost_ceiling"]:
            for value in [None, True, "0", [], {}, float("nan"), float("inf"), -float("inf")]:
                self.assertEqual(evaluate(**{key: value})["reason"], "invalid_input", (key, value))
        for key in ["default_request", "sensor_request", "hardware_max", "hard_cap", "noise_cap", "boost_increment", "boost_ceiling"]:
            for value in [0.5, 1000001, -1000001]:
                self.assertEqual(evaluate(**{key: value})["reason"], "invalid_input", (key, value))
        for value in [0, -1]:
            self.assertEqual(evaluate(hardware_max=value)["reason"], "invalid_input")
        for key in ["now", "boost_deadline", "desired"]:
            self.assertEqual(evaluate(**{key: 1000000000001})["reason"], "invalid_input")
            self.assertEqual(evaluate(**{key: -1000000000001})["reason"], "invalid_input")
        for value in [None, [], "unavailable", 0]:
            self.assertEqual(json.loads(str(GOAL(value)))["reason"], "invalid_input")
        for value in [None, "unavailable", "ON", 0]:
            self.assertEqual(evaluate(current_power=value)["reason"], "invalid_input")

    def test_two_channel_sequences_are_isolated_from_each_other_and_temperature(self):
        fresh = BASE | {"default_request": 3}
        clean = BASE | {"default_request": 4}
        clean_before = evaluate(clean)
        # One-channel boost neither enables nor changes the other channel.
        fresh["boost_deadline"] = 1900
        self.assertEqual(evaluate(fresh)["target"], 5)
        self.assertEqual(evaluate(clean), clean_before)
        clean["boost_deadline"] = 1600
        self.assertEqual(evaluate(clean)["target"], 6)
        self.assertTrue(evaluate(fresh)["boost_active"])
        # Targets/irrelevant fields are excluded from the channel decision.
        for target in [16, 24, 30]:
            self.assertEqual(evaluate(fresh, temperature_target=target), evaluate(fresh))
        # Editing one wish cancels that channel's stored deadline at the caller.
        fresh.update(automatic=False, desired=80, boost_deadline=0)
        self.assertFalse(evaluate(fresh)["boost_active"])
        self.assertTrue(evaluate(clean)["boost_active"])
        # Expiry recalculates current policy, never restores a stale physical speed.
        clean.update(now=1600, sensor_request=8)
        self.assertEqual(evaluate(clean)["target"], 8)
        self.assertFalse(evaluate(clean)["boost_active"])
        # Global profile edit clears both stored deadlines; no delayed reappearance.
        fresh.update(global_off=True, boost_deadline=0)
        clean.update(global_off=True, boost_deadline=0)
        self.assertEqual((evaluate(fresh)["target"], evaluate(clean)["target"]), (0, 0))

    def test_named_mutations_have_independent_witnesses(self):
        """The assertions kill safety/timer/ceiling regressions, not just execute code."""
        source = SOURCE.read_text(encoding="utf-8")
        mutations = [
            ("p.boost_deadline > p.now", "p.boost_deadline >= p.now",
             {"boost_deadline": 1000}, "boost_active", False),
            ("[requested, hard, noise]|min", "[requested, hard]|min",
             {"default_request": 10, "noise_cap": 2}, "target", 2),
            ("[requested, hard, noise]|min", "[requested, noise]|min",
             {"default_request": 10, "hard_cap": 2}, "target", 2),
            ("{%- elif p.fault -%}", "{%- elif false -%}",
             {"fault": True}, "can_command", False),
            ("{%- elif not p.available -%}", "{%- elif false -%}",
             {"available": False}, "can_command", False),
            ("maximum - 1, [0, p.boost_ceiling]", "maximum, [0, p.boost_ceiling]",
             {"default_request": 0, "hardware_max": 2, "boost_ceiling": 2, "boost_deadline": 1100}, "target", 1),
        ]
        for original, replacement, changes, key, correct in mutations:
            self.assertEqual(source.count(original), 1, original)
            self.assertEqual(evaluate(**changes)[key], correct)
            mutant = compile_goal(source.replace(original, replacement))
            observed = json.loads(str(mutant(BASE | changes)))[key]
            self.assertNotEqual(observed, correct, original)


if __name__ == "__main__":
    unittest.main()
