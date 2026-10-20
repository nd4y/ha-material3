"""Finite event/state contract for the reducer used by the queued HA dispatcher.

The reducer is the production Jinja source, not a Python reimplementation.
Every canonical mode, channel, flag and deadline equivalence class is exercised.
"""

import copy
import itertools
import json
import math
from pathlib import Path
import unittest

from jinja2 import Environment, FileSystemLoader, StrictUndefined


ROOT = Path(__file__).resolve().parents[2]
MODES = ["auto", "full", "off", "quiet", "standard", "maximum"]
AXES = ["fresh", "clean"]
POLICY = {
    "maximum_return": "quiet",
    "profiles": {
        "auto": {"fresh": {"automatic": True, "value": 40}, "clean": {"automatic": True, "value": 30}},
        "full": {"fresh": {"automatic": True, "value": 40}, "clean": {"automatic": True, "value": 30}},
        "off": {"fresh": {"automatic": False, "value": 0}, "clean": {"automatic": False, "value": 0}},
        "quiet": {"fresh": {"automatic": False, "value": 35}, "clean": {"automatic": False, "value": 20}},
        "standard": {"fresh": {"automatic": False, "value": 50}, "clean": {"automatic": False, "value": 25}},
    },
}
BASE = {
    "mode": "full", "master": True,
    "fresh": {"automatic": True, "value": 40, "active": False, "deadline": 0},
    "clean": {"automatic": False, "value": 30, "active": False, "deadline": 0},
    "temperature": {"target": 24},
    "permissions": {"fresh_speed": False, "clean_power": True},
}


def compile_reducer(source=None):
    env = Environment(loader=FileSystemLoader(str(ROOT / "controller")), undefined=StrictUndefined, autoescape=False)
    env.filters["to_json"] = json.dumps
    template = env.from_string(source) if source is not None else env.get_template("intent-transition.jinja")
    return template.module.intent_transition


REDUCER = compile_reducer()
OMITTED = object()


def evaluate(event, state=OMITTED, policy=OMITTED, reducer=REDUCER):
    return json.loads(str(reducer(copy.deepcopy(BASE if state is OMITTED else state), event, copy.deepcopy(POLICY if policy is OMITTED else policy))))


class IntentTransitionContract(unittest.TestCase):
    def assert_preserved(self, before, result, axis=None):
        after = result["state"]
        self.assertEqual(after["temperature"], before["temperature"])
        self.assertEqual(after["permissions"], before["permissions"])
        if axis:
            self.assertEqual(after["clean" if axis == "fresh" else "fresh"], before["clean" if axis == "fresh" else "fresh"])
        self.assertEqual(result["changed"], before != after)

    def assert_rejected(self, event, state=OMITTED, policy=OMITTED, error=None):
        original = copy.deepcopy(BASE if state is OMITTED else state)
        out = evaluate(event, original, policy)
        self.assertFalse(out["valid"], (event, original, out))
        self.assertFalse(out["changed"])
        self.assertEqual(json.dumps(out["state"], sort_keys=True), json.dumps(original, sort_keys=True))
        if error:
            self.assertEqual(out["error"], error)
        return out

    def test_every_goal_value_mode_channel_and_baseline_flag(self):
        count = 0
        for mode, axis, automatic, active, value in itertools.product(MODES, AXES, [False, True], [False, True], range(0, 101, 5)):
            before = copy.deepcopy(BASE)
            before["mode"] = mode
            before[axis].update(automatic=automatic, active=active, deadline=1900 if active else 0)
            out = evaluate({"type": "goal_set", "axis": axis, "value": value}, before)
            self.assertTrue(out["valid"])
            self.assertEqual(out["state"][axis] | {}, before[axis] | {"automatic": False, "value": value, "active": False, "deadline": 0})
            self.assertEqual(out["state"]["mode"], "quiet" if mode == "maximum" else mode)
            self.assert_preserved(before, out, axis)
            count += 1
        self.assertEqual(count, 1008)

    def test_automatic_toggle_preserves_running_overlay_and_other_axis(self):
        count = 0
        for mode, axis, initial, desired, active in itertools.product(MODES, AXES, [False, True], [False, True], [False, True]):
            before = copy.deepcopy(BASE)
            before["mode"] = mode
            before[axis].update(automatic=initial, active=active, deadline=1900 if active else 0)
            out = evaluate({"type": "goal_auto", "axis": axis, "automatic": desired}, before)
            self.assertTrue(out["valid"])
            self.assertEqual(out["state"][axis], before[axis] | {"automatic": desired})
            self.assertEqual(out["state"]["mode"], "quiet" if mode == "maximum" else mode)
            self.assert_preserved(before, out, axis)
            count += 1
        self.assertEqual(count, 96)

    def test_all_boost_start_guards_modes_deadlines_and_durations(self):
        count = 0
        for mode, axis, master, eligible, active, deadline, duration in itertools.product(MODES, AXES, [False, True], [False, True], [False, True], [0, 999, 1000, 1001], [10, 15]):
            before = copy.deepcopy(BASE)
            before.update(mode=mode, master=master)
            before[axis].update(active=active, deadline=deadline)
            out = evaluate({"type": "boost_start", "axis": axis, "duration": duration, "now": 1000, "eligible": eligible}, before)
            allowed = master and mode != "maximum" and eligible and not (active and deadline > 1000)
            self.assertEqual(out["valid"], allowed)
            if allowed:
                self.assertEqual(out["state"][axis], before[axis] | {"active": True, "deadline": 1000 + duration * 60})
                self.assertEqual(out["state"]["mode"], mode)
                self.assert_preserved(before, out, axis)
            else:
                self.assertEqual(out["state"], before)
                self.assertFalse(out["changed"])
            count += 1
        self.assertEqual(count, 768)

    def test_boost_cancel_all_states_and_axes(self):
        for mode, axis, active, deadline in itertools.product(MODES, AXES, [False, True], [0, 1000, 1900]):
            before = copy.deepcopy(BASE)
            before["mode"] = mode
            before[axis].update(active=active, deadline=deadline)
            out = evaluate({"type": "boost_cancel", "axis": axis}, before)
            self.assertTrue(out["valid"])
            self.assertEqual(out["state"][axis], before[axis] | {"active": False, "deadline": 0})
            self.assert_preserved(before, out, axis)

    def test_tick_full_cross_product_and_restart_deadline_reconciliation(self):
        count = 0
        for master, fa, ca, fd, cd in itertools.product([False, True], [False, True], [False, True], [0, 999, 1000, 1001], [0, 999, 1000, 1001]):
            before = copy.deepcopy(BASE)
            before["master"] = master
            before["fresh"].update(active=fa, deadline=fd)
            before["clean"].update(active=ca, deadline=cd)
            out = evaluate({"type": "tick", "now": 1000}, before)
            self.assertTrue(out["valid"])
            for axis in AXES:
                expires = not before[axis]["active"] or before[axis]["deadline"] <= 1000 or not master
                expected = before[axis] | ({"active": False, "deadline": 0} if expires else {})
                self.assertEqual(out["state"][axis], expected)
            self.assert_preserved(before, out)
            self.assertEqual(evaluate({"type": "tick", "now": 1000}, out["state"])["state"], out["state"])
            count += 1
        self.assertEqual(count, 128)

    def test_master_off_cancels_both_but_on_never_restarts_overlays(self):
        for master, enabled, fresh, clean in itertools.product([False, True], repeat=4):
            before = copy.deepcopy(BASE)
            before["master"] = master
            before["fresh"].update(active=fresh, deadline=1900)
            before["clean"].update(active=clean, deadline=1800)
            out = evaluate({"type": "master", "enabled": enabled}, before)
            self.assertTrue(out["valid"])
            self.assertEqual(out["state"]["master"], enabled)
            for axis in AXES:
                self.assertEqual(out["state"][axis], before[axis] | ({} if enabled else {"active": False, "deadline": 0}))
            self.assert_preserved(before, out)

    def test_all_profile_transitions_cancel_overlays_maximum_preserves_baselines(self):
        for mode, target, fresh, clean in itertools.product(MODES, MODES, [False, True], [False, True]):
            before = copy.deepcopy(BASE)
            before["mode"] = mode
            before["fresh"].update(active=fresh, deadline=1900)
            before["clean"].update(active=clean, deadline=1800)
            out = evaluate({"type": "profile", "mode": target, "now": 1000}, before)
            self.assertTrue(out["valid"])
            self.assertEqual(out["state"]["mode"], target)
            for axis in AXES:
                baseline = {} if target == "maximum" else POLICY["profiles"][target][axis]
                self.assertEqual(out["state"][axis], before[axis] | baseline | {"active": False, "deadline": 0})
            self.assert_preserved(before, out)

    def test_named_off_boost_expiry_and_independent_parallel_boosts(self):
        state = evaluate({"type": "profile", "mode": "off", "now": 1000})["state"]
        state = evaluate({"type": "boost_start", "axis": "fresh", "duration": 10, "now": 1000, "eligible": True}, state)["state"]
        state = evaluate({"type": "boost_start", "axis": "clean", "duration": 15, "now": 1100, "eligible": True}, state)["state"]
        self.assertEqual(state["mode"], "off")
        self.assertEqual(state["fresh"]["value"], 0)
        self.assertEqual(state["clean"]["value"], 0)
        state = evaluate({"type": "tick", "now": 1600}, state)["state"]
        self.assertFalse(state["fresh"]["active"])
        self.assertTrue(state["clean"]["active"])
        state = evaluate({"type": "tick", "now": 2000}, state)["state"]
        self.assertFalse(state["clean"]["active"])
        self.assertEqual(state["mode"], "off")

    def test_named_manual_wish_cancels_only_own_overlay_temperature_unchanged(self):
        state = copy.deepcopy(BASE)
        for axis in AXES:
            state[axis].update(active=True, deadline=1900)
        out = evaluate({"type": "goal_set", "axis": "fresh", "value": 65}, state)
        self.assertFalse(out["state"]["fresh"]["active"])
        self.assertTrue(out["state"]["clean"]["active"])
        self.assert_preserved(state, out, "fresh")

    def test_named_repeated_boost_never_extends_and_expired_boost_requires_explicit_start(self):
        state = evaluate({"type": "boost_start", "axis": "fresh", "duration": 10, "now": 1000, "eligible": True})["state"]
        self.assert_rejected({"type": "boost_start", "axis": "fresh", "duration": 15, "now": 1100, "eligible": True}, state, error="boost_already_active")
        expired = evaluate({"type": "tick", "now": 1600}, state)["state"]
        self.assertFalse(expired["fresh"]["active"])
        restarted = evaluate({"type": "boost_start", "axis": "fresh", "duration": 15, "now": 1700, "eligible": True}, state)
        self.assertTrue(restarted["valid"])
        self.assertEqual(restarted["state"]["fresh"]["deadline"], 2600)

    def test_invalid_event_fields_never_mutate_maximum_or_other_state(self):
        state = copy.deepcopy(BASE)
        state["mode"] = "maximum"
        for event in [None, [], "tick", False, 0, {}]:
            self.assert_rejected(event, state)
        bad_numbers = [None, False, True, "50", "unknown", math.nan, math.inf, -math.inf, -5, 105, 2.5]
        for axis, value in itertools.product(AXES, bad_numbers):
            self.assert_rejected({"type": "goal_set", "axis": axis, "value": value}, state)
        for axis in [None, "", "other", False, 0]:
            for kind in ["goal_set", "goal_auto", "boost_start", "boost_cancel"]:
                self.assert_rejected({"type": kind, "axis": axis, "value": 50, "automatic": True, "duration": 10, "now": 1000, "eligible": True}, state)
        for value in [None, "true", 0, 1, [], {}]:
            self.assert_rejected({"type": "goal_auto", "axis": "fresh", "automatic": value}, state)
            self.assert_rejected({"type": "master", "enabled": value}, state)
        for kind in ["tick", "profile", "boost_start"]:
            for now in [None, True, "1000", -1, math.nan, math.inf, 1000000000000]:
                self.assert_rejected({"type": kind, "axis": "fresh", "mode": "quiet", "duration": 10, "eligible": True, "now": now}, state)
        for duration in [None, False, True, "10", 0, 9, 11, 20, math.nan]:
            self.assert_rejected({"type": "boost_start", "axis": "fresh", "duration": duration, "eligible": True, "now": 1000}, state)
        for eligible in [None, 0, 1, "true", [], {}]:
            self.assert_rejected({"type": "boost_start", "axis": "fresh", "duration": 10, "eligible": eligible, "now": 1000}, state)
        self.assert_rejected({"type": "unsupported"}, state)
        self.assert_rejected({"type": "profile", "mode": "unsupported", "now": 1000}, state)

    def test_invalid_state_and_policy_shapes_fail_closed(self):
        for state in [None, [], 1, "state", {}]:
            self.assert_rejected({"type": "tick", "now": 1000}, state)
        for field, value in [("mode", "unsupported"), ("mode", None), ("master", 1), ("master", "on")]:
            self.assert_rejected({"type": "tick", "now": 1000}, copy.deepcopy(BASE) | {field: value})
        for axis in AXES:
            for channel in [None, [], "channel", {}, {"automatic": True}]:
                self.assert_rejected({"type": "tick", "now": 1000}, copy.deepcopy(BASE) | {axis: channel})
            for field, bad in [("automatic", 1), ("active", "on"), ("value", False), ("value", math.nan), ("value", 101), ("deadline", "0"), ("deadline", -1), ("deadline", math.inf)]:
                state = copy.deepcopy(BASE)
                state[axis][field] = bad
                self.assert_rejected({"type": "tick", "now": 1000}, state)
        for policy in [None, [], {}, {"profiles": {}, "maximum_return": "maximum"}, {"profiles": [], "maximum_return": "quiet"}, {"profiles": {}, "maximum_return": None}]:
            self.assert_rejected({"type": "tick", "now": 1000}, policy=policy)
        for profile in [None, [], "profile", {}]:
            policy = copy.deepcopy(POLICY)
            policy["profiles"]["quiet"] = profile
            self.assert_rejected({"type": "profile", "mode": "quiet", "now": 1000}, policy=policy)
        for axis in AXES:
            for baseline in [None, {}, {"automatic": 1, "value": 50}, {"automatic": True, "value": math.nan}, {"automatic": True, "value": 101}, {"automatic": True, "value": False}]:
                policy = copy.deepcopy(POLICY)
                policy["profiles"]["quiet"][axis] = baseline
                self.assert_rejected({"type": "profile", "mode": "quiet", "now": 1000}, policy=policy)

    def test_extra_fields_cannot_overwrite_temperature_permissions_or_channel_metadata(self):
        policy = copy.deepcopy(POLICY)
        policy["profiles"]["quiet"]["fresh"].update(temperature=99, active=True, deadline=9000)
        state = copy.deepcopy(BASE)
        state["fresh"]["metadata"] = {"preserve": True}
        out = evaluate({"type": "profile", "mode": "quiet", "now": 1000, "temperature": 99}, state, policy)
        self.assertTrue(out["valid"])
        self.assertEqual(out["state"]["fresh"]["metadata"], {"preserve": True})
        self.assertNotIn("temperature", out["state"]["fresh"])
        self.assertFalse(out["state"]["fresh"]["active"])
        self.assertEqual(out["state"]["fresh"]["deadline"], 0)
        self.assert_preserved(state, out)

    def test_mutation_sentinels_detect_cross_channel_writes_and_deadline_extension(self):
        source = (ROOT / "controller" / "intent-transition.jinja").read_text(encoding="utf-8")
        mutant = compile_reducer(source.replace("state[event.axis].deadline > event.now", "state[event.axis].deadline < event.now"))
        state = copy.deepcopy(BASE)
        state["fresh"].update(active=True, deadline=1900)
        out = evaluate({"type": "boost_start", "axis": "fresh", "duration": 15, "now": 1100, "eligible": True}, state, reducer=mutant)
        self.assertTrue(out["valid"], "Sentinel mutation must demonstrate the repeated-start test detects a changed guard")
        self.assertNotEqual(out["state"]["fresh"]["deadline"], state["fresh"]["deadline"])
        mutant = compile_reducer(source.replace("{event.axis: channel}", "{'clean' if event.axis == 'fresh' else 'fresh': channel}"))
        out = evaluate({"type": "goal_set", "axis": "fresh", "value": 65}, BASE, reducer=mutant)
        self.assertNotEqual(out["state"]["clean"], BASE["clean"], "Sentinel mutation must demonstrate the other-axis invariant detects a cross-channel write")

    def test_ordered_off_boost_events_follow_last_complete_intent(self):
        off = {"type": "profile", "mode": "off", "now": 1000}
        boost = {"type": "boost_start", "axis": "fresh", "duration": 10, "now": 1001, "eligible": True}
        first_off = evaluate(boost, evaluate(off)["state"])["state"]
        first_boost = evaluate(off, evaluate(boost)["state"])["state"]
        self.assertTrue(first_off["fresh"]["active"])
        self.assertFalse(first_boost["fresh"]["active"])
        self.assertEqual(first_off["clean"], first_boost["clean"])
        self.assertEqual(first_off["temperature"], first_boost["temperature"])
        self.assertEqual(first_off["permissions"], first_boost["permissions"])


if __name__ == "__main__":
    unittest.main()
