"""Persistent user comfort preferences; executes the distributable Jinja macros.

No duplicate controller implementation, household bindings or HA calls.
"""

import copy
import itertools
import json
import math
from pathlib import Path
import unittest

from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "controller" / "comfort-preferences.jinja"
ENV = Environment(loader=FileSystemLoader(str(SOURCE.parent)), undefined=StrictUndefined, autoescape=False)
MODULE = ENV.get_template(SOURCE.name).module
POLICY = MODULE.comfort_preferences
TRANSITION = MODULE.comfort_transition
BASE = {
    "fresh": 50, "clean": 50, "quiet": 0,
    "fresh_base": 3, "clean_base": 4, "ac_fan_base": 2,
    "fresh_need": 2, "clean_need": 1,
    "fresh_max": 7, "clean_max": 11, "ac_fan_max": 3,
    "fresh_noise_cap": 7, "clean_noise_cap": 11, "ac_fan_noise_cap": 3,
    "fresh_adjustment_steps": 2, "clean_adjustment_steps": 3,
    "fresh_quiet_reduction_steps": 4, "clean_quiet_reduction_steps": 8,
    "ac_fan_quiet_reduction_steps": 2,
}
STATE = {"fresh": 50, "clean": 50, "quiet": 0,
         "temperature": 24, "automatic": True,
         "permissions": {"fresh_speed": False, "clean_power": True},
         "boosts": {"fresh": 1900, "clean": 0}}
VALUES = list(range(0, 101, 5))
OMITTED = object()


def evaluate(inputs=OMITTED, **changes):
    data = BASE | changes if inputs is OMITTED else inputs
    return json.loads(str(POLICY(copy.deepcopy(data))))


def transition(event, state=OMITTED):
    return json.loads(str(TRANSITION(copy.deepcopy(STATE if state is OMITTED else state), copy.deepcopy(event))))


class ComfortPreferencesContract(unittest.TestCase):
    def test_neutral_exactly_preserves_automatic_baseline_and_sensor_floor(self):
        count = 0
        for maximum, baseline, need, cap in itertools.product([1, 3, 7, 11], [0, 1, 3], [0, 1, 3], [0, 1, 3, 20]):
            if baseline > maximum or need > maximum:
                continue
            out = evaluate(fresh_max=maximum, clean_max=maximum, fresh_base=baseline,
                           clean_base=baseline, fresh_need=need, clean_need=need,
                           fresh_noise_cap=cap, clean_noise_cap=cap)
            self.assertTrue(out["valid"])
            self.assertEqual(out["fresh_request"], max(baseline, need))
            self.assertEqual(out["clean_request"], max(baseline, need))
            self.assertEqual(out["fresh_noise_cap"], min(maximum, cap))
            self.assertEqual(out["clean_noise_cap"], min(maximum, cap))
            self.assertEqual(out["ac_fan_request"], BASE["ac_fan_base"])
            self.assertEqual(out["ac_fan_cap"], BASE["ac_fan_noise_cap"])
            count += 1
        self.assertEqual(count, 124)

    def test_all_preferences_are_independent_and_monotone(self):
        count = 0
        for fresh, clean, quiet in itertools.product(VALUES, repeat=3):
            out = evaluate(fresh=fresh, clean=clean, quiet=quiet)
            self.assertTrue(out["valid"])
            fresh_reference = evaluate(fresh=fresh)
            clean_reference = evaluate(clean=clean)
            quiet_reference = evaluate(quiet=quiet)
            self.assertEqual(out["fresh_request"], fresh_reference["fresh_request"])
            self.assertEqual(out["clean_request"], clean_reference["clean_request"])
            self.assertEqual(out["ac_fan_request"], BASE["ac_fan_base"])
            for key in ["fresh_noise_cap", "clean_noise_cap", "ac_fan_cap"]:
                self.assertEqual(out[key], quiet_reference[key])
            count += 1
        self.assertEqual(count, 9261)
        for axis in ["fresh", "clean"]:
            outputs = [evaluate(**{axis: value})[axis + "_request"] for value in VALUES]
            self.assertEqual(outputs, sorted(outputs))
        for key in ["fresh_noise_cap", "clean_noise_cap", "ac_fan_cap"]:
            caps = [evaluate(quiet=value)[key] for value in VALUES]
            self.assertEqual(caps, sorted(caps, reverse=True))

    def test_sensor_need_and_hardware_bounds_for_every_preference_partition(self):
        count = 0
        for maximum, baseline, need, wish, adjustment in itertools.product(
                [1, 3, 7, 11], [0, 1, 3, 7, 11], [0, 1, 3, 7, 11], VALUES, [1, 2, 20]):
            if baseline > maximum or need > maximum:
                continue
            out = evaluate(fresh=wish, clean=wish, fresh_max=maximum, clean_max=maximum,
                           fresh_base=baseline, clean_base=baseline, fresh_need=need,
                           clean_need=need, fresh_adjustment_steps=adjustment,
                           clean_adjustment_steps=adjustment)
            self.assertTrue(out["valid"])
            for axis in ["fresh", "clean"]:
                self.assertGreaterEqual(out[axis + "_request"], need)
                if baseline > 0 or need > 0:
                    self.assertGreaterEqual(out[axis + "_request"], 1)
                self.assertLessEqual(out[axis + "_request"], maximum)
                if wish < 50:
                    self.assertLessEqual(out[axis + "_request"], max(baseline, need))
                elif wish > 50:
                    self.assertGreaterEqual(out[axis + "_request"], max(baseline, need))
                else:
                    self.assertEqual(out[axis + "_request"], max(baseline, need))
            count += 1
        self.assertEqual(count, 3402)

    def test_quiet_caps_never_add_noise_or_implicitly_turn_power_off(self):
        count = 0
        for maximum, cap, reduction, quiet in itertools.product(
                [1, 3, 7, 11], [0, 1, 3, 7, 20], [0, 1, 4, 20], VALUES):
            out = evaluate(fresh_max=maximum, clean_max=maximum, ac_fan_max=maximum,
                           fresh_base=0, clean_base=0, ac_fan_base=0,
                           fresh_need=0, clean_need=0, quiet=quiet,
                           fresh_noise_cap=cap, clean_noise_cap=cap, ac_fan_noise_cap=cap,
                           fresh_quiet_reduction_steps=reduction,
                           clean_quiet_reduction_steps=reduction,
                           ac_fan_quiet_reduction_steps=reduction)
            self.assertTrue(out["valid"])
            for key in ["fresh_noise_cap", "clean_noise_cap", "ac_fan_cap"]:
                self.assertGreaterEqual(out[key], 1 if cap else 0)
                self.assertLessEqual(out[key], min(maximum, cap))
                if cap == 0:
                    self.assertEqual(out[key], 0)
                if quiet == 0 or reduction == 0:
                    self.assertEqual(out[key], min(maximum, cap))
            count += 1
        self.assertEqual(count, 1680)

    def test_signed_adjustments_and_rounding_have_named_witnesses(self):
        witnesses = [(0, 2), (25, 3), (50, 4), (75, 5), (100, 6)]
        for wish, expected in witnesses:
            out = evaluate(fresh=wish, fresh_base=4, fresh_need=0, fresh_adjustment_steps=2)
            self.assertEqual(out["fresh_request"], expected)
        self.assertEqual(evaluate(clean=25, clean_base=4, clean_need=0)["clean_request"], 2)
        self.assertEqual(evaluate(clean=75, clean_base=4, clean_need=0)["clean_request"], 6)
        self.assertEqual(evaluate(quiet=25, clean_quiet_reduction_steps=6)["clean_noise_cap"], 9)

    def test_preference_is_not_a_percentage_of_hardware_speed(self):
        for wish in VALUES:
            small = evaluate(fresh=wish, fresh_max=7, fresh_base=3, fresh_need=1)
            large = evaluate(fresh=wish, fresh_max=100, fresh_base=3, fresh_need=1)
            self.assertEqual(small["fresh_request"], large["fresh_request"])
        self.assertNotEqual(evaluate(fresh=100)["fresh_request"], BASE["fresh_max"])
        self.assertGreater(evaluate(fresh=0)["fresh_request"], 0)
        self.assertEqual(evaluate(fresh=0, fresh_need=6)["fresh_request"], 6)

    def test_preference_for_less_never_turns_off_a_positive_automatic_plan(self):
        for axis, baseline, need, wish, adjustment in itertools.product(
                ["fresh", "clean"], [0, 1, 3], [0, 1, 3], [0, 5, 25, 50], [1, 2, 20]):
            out = evaluate(**{axis: wish, axis + "_base": baseline,
                              axis + "_need": need, axis + "_adjustment_steps": adjustment})
            self.assertTrue(out["valid"])
            if baseline > 0 or need > 0:
                self.assertGreaterEqual(out[axis + "_request"], max(1, need))
            else:
                self.assertEqual(out[axis + "_request"], 0)
        self.assertEqual(evaluate(fresh=0, fresh_base=1, fresh_need=0)["fresh_request"], 1)
        self.assertGreater(evaluate(fresh=100, fresh_base=0, fresh_need=0)["fresh_request"], 0)

    def test_reasons_distinguish_preference_from_sensor_floor(self):
        for axis in ["fresh", "clean"]:
            self.assertEqual(evaluate()["reasons"][axis], "neutral")
            self.assertEqual(evaluate(**{axis: 100})["reasons"][axis], "prefer_more")
            self.assertEqual(evaluate(**{axis: 0, axis + "_need": 0})["reasons"][axis], "prefer_less")
            self.assertEqual(evaluate(**{axis: 0, axis + "_need": BASE[axis + "_max"]})["reasons"][axis], "sensor_need")
        self.assertEqual(evaluate(quiet=100)["reasons"]["quiet"], "prefer_quiet")

    def test_policy_rejects_missing_wrong_typed_nonfinite_and_out_of_range_inputs(self):
        invalid = [None, True, False, "0", "50", "unknown", [], {}, math.nan, math.inf, -math.inf]
        count = 0
        for key in BASE:
            for value in invalid:
                out = evaluate(BASE | {key: value})
                self.assertFalse(out["valid"], (key, value, out))
                self.assertEqual(out["error"], "invalid_input")
                for result in ["fresh_request", "clean_request", "ac_fan_request", "fresh_noise_cap", "clean_noise_cap", "ac_fan_cap"]:
                    self.assertIsNone(out[result])
                count += 1
            missing = dict(BASE)
            missing.pop(key)
            self.assertFalse(evaluate(missing)["valid"], key)
        for key in ["fresh", "clean", "quiet"]:
            for value in [-1, 101, 1000001]:
                self.assertFalse(evaluate(BASE | {key: value})["valid"])
            self.assertTrue(evaluate(BASE | {key: 52.5})["valid"])
        for key in set(BASE) - {"fresh", "clean", "quiet"}:
            for value in [-1, 1.5, 1000001]:
                self.assertFalse(evaluate(BASE | {key: value})["valid"], (key, value))
        for axis in ["fresh", "clean", "ac_fan"]:
            self.assertFalse(evaluate(BASE | {axis + "_max": 0})["valid"])
            self.assertFalse(evaluate(BASE | {axis + "_base": BASE[axis + "_max"] + 1})["valid"])
        for axis in ["fresh", "clean"]:
            self.assertFalse(evaluate(BASE | {axis + "_adjustment_steps": 0})["valid"])
            self.assertFalse(evaluate(BASE | {axis + "_need": BASE[axis + "_max"] + 1})["valid"])
        for value in [None, [], "x", 42, True]:
            self.assertFalse(evaluate(value)["valid"])
        self.assertEqual(count, len(BASE) * len(invalid))

    def test_transition_every_axis_value_preserves_automation_other_preferences_and_metadata(self):
        for axis, value, automatic in itertools.product(["fresh", "clean", "quiet"], VALUES, [False, True]):
            before = copy.deepcopy(STATE)
            before["automatic"] = automatic
            out = transition({"type": "set", "axis": axis, "value": value}, before)
            self.assertTrue(out["valid"])
            self.assertEqual(out["state"], before | {axis: value})
            self.assertEqual(out["changed"], value != before[axis])
            self.assertEqual(out["state"]["automatic"], automatic)
            self.assertEqual(before[axis], STATE[axis])

    def test_transition_reset_only_explicitly_restores_neutral_preferences(self):
        for fresh, clean, quiet in itertools.product([0, 50, 100], repeat=3):
            before = STATE | {"fresh": fresh, "clean": clean, "quiet": quiet}
            out = transition({"type": "reset"}, before)
            self.assertTrue(out["valid"])
            self.assertEqual(out["state"], before | {"fresh": 50, "clean": 50, "quiet": 0})
            self.assertEqual(out["changed"], before != out["state"])

    def test_transition_sensor_profile_tick_timer_and_permission_events_cannot_write_wishes(self):
        for kind in ["tick", "sensor", "profile", "maximum", "off", "boost_start", "boost_cancel",
                     "boost_expired", "master", "permissions", "trust_all", "goal_auto"]:
            out = transition({"type": kind, "axis": "fresh", "value": 100})
            self.assertFalse(out["valid"])
            self.assertEqual(out["error"], "unsupported_event")
            self.assertFalse(out["changed"])
            self.assertEqual(out["state"], STATE)

    def test_transition_invalid_inputs_are_rejected_without_partial_mutation(self):
        events = [None, [], 42, "set", {}, {"type": "set"},
                  {"type": "set", "axis": "temperature", "value": 50}]
        for value in [None, True, False, "50", [], {}, -5, 101, 1, 2.5, math.nan, math.inf, -math.inf]:
            events.append({"type": "set", "axis": "fresh", "value": value})
        for event in events:
            out = transition(event)
            self.assertFalse(out["valid"], event)
            self.assertFalse(out["changed"])
            self.assertEqual(out["state"], STATE)
        for axis in ["fresh", "clean", "quiet"]:
            for value in [None, True, "50", -5, 101, 2.5, math.nan, math.inf]:
                before = STATE | {axis: value}
                out = transition({"type": "reset"}, before)
                self.assertFalse(out["valid"])
                self.assertFalse(out["changed"])
                self.assertEqual(json.dumps(out["state"], sort_keys=True), json.dumps(before, sort_keys=True))
            before = dict(STATE)
            before.pop(axis)
            self.assertFalse(transition({"type": "reset"}, before)["valid"])
        for state in [None, [], "x", 42, True]:
            out = transition({"type": "reset"}, state)
            self.assertFalse(out["valid"])
            self.assertFalse(out["changed"])
            self.assertEqual(out["state"], state)

    def test_transition_sequences_keep_user_only_state_during_replanning_and_restart(self):
        current = copy.deepcopy(STATE)
        for event in [{"type": "set", "axis": "fresh", "value": 75},
                      {"type": "set", "axis": "quiet", "value": 40},
                      {"type": "set", "axis": "clean", "value": 100}]:
            current = transition(event, current)["state"]
        serialized = json.loads(json.dumps(current))
        for need in [0, 1, 6, 1, 0]:
            out = evaluate(fresh=current["fresh"], clean=current["clean"], quiet=current["quiet"], fresh_need=need)
            self.assertTrue(out["valid"])
            self.assertEqual(current, serialized)
        self.assertEqual(transition({"type": "set", "axis": "fresh", "value": 75}, current)["changed"], False)
        self.assertEqual(current["temperature"], STATE["temperature"])
        self.assertEqual(current["permissions"], STATE["permissions"])
        self.assertEqual(current["boosts"], STATE["boosts"])


if __name__ == "__main__":
    unittest.main()
