"""Independent authorization invariants for the same last-moment HA write guard."""

import itertools
import json
from pathlib import Path
import unittest

import jinja2


ROOT = Path(__file__).resolve().parents[2]
ENV = jinja2.Environment(loader=jinja2.FileSystemLoader(ROOT / "controller"), undefined=jinja2.StrictUndefined)
ENV.filters["to_json"] = lambda value: json.dumps(value, allow_nan=False)
GUARD = ENV.get_template("command-guards.jinja").module.command_guard
FLAGS = ["automatic", "available", "eligible", "fault_shutdown", "explicit_error", "latched", "stopping", "master_enabled"]
BASE = dict(automatic=True, available=True, eligible=True, fault_shutdown=False,
            explicit_error=False, latched=False, stopping=False, master_enabled=True,
            power_lock="off", saved_power="on", current_power="on", parameter_lock="")


def evaluate(values=None, **changes):
    return json.loads(GUARD(BASE | (values or {}) | changes))


class CommandGuardTests(unittest.TestCase):
    def test_all_27648_authorization_states_against_independent_formula(self):
        count = 0
        reasons = set()
        for flags, power_lock, saved_power, current_power, parameter in itertools.product(
            itertools.product([False, True], repeat=8), ["off", "on", "unknown"],
            ["off", "on", "unknown"], ["off", "on", "unknown"], ["", "off", "on", "unknown"]
        ):
            p = dict(zip(FLAGS, flags)) | dict(power_lock=power_lock, saved_power=saved_power,
                                              current_power=current_power, parameter_lock=parameter)
            output = evaluate(p)
            # Logical sets derived from the safety contract, not the macro's branches.
            safety = p["fault_shutdown"] and p["available"] and p["explicit_error"] and p["latched"] and p["stopping"]
            manual = not p["fault_shutdown"] and not p["automatic"] and p["available"] and (p["stopping"] or p["eligible"])
            held_on = power_lock == "on" and saved_power == "on" and current_power == "on" and not p["stopping"]
            automation = (not p["fault_shutdown"] and p["automatic"] and p["available"] and p["eligible"]
                          and p["master_enabled"] and (power_lock == "off" or held_on) and parameter in ["", "off"])
            with self.subTest(inputs=p):
                self.assertEqual(output["allowed"], safety or manual or automation)
                self.assertEqual(output["safety_override"], safety)
                self.assertIsInstance(output["reason"], str)
                if not p["available"]:
                    self.assertFalse(output["allowed"])
                if p["fault_shutdown"] and not p["stopping"]:
                    self.assertFalse(output["allowed"])
                    self.assertEqual(output["reason"], "invalid_fault_shutdown")
                if output["safety_override"]:
                    self.assertTrue(all(p[key] for key in ["available", "explicit_error", "latched", "stopping", "fault_shutdown"]))
                if output["allowed"] and p["automatic"] and not output["safety_override"]:
                    self.assertTrue(p["master_enabled"])
                    self.assertTrue(p["eligible"])
                    self.assertIn(parameter, ["", "off"])
            count += 1
            reasons.add(output["reason"])
        self.assertEqual(count, 27648)
        self.assertEqual(reasons, {"invalid_fault_shutdown", "unavailable", "safety_shutdown",
                                  "fault_not_confirmed", "manual_stop", "ineligible", "manual",
                                  "master_disabled", "power_locked", "parameter_locked", "automatic"})

    def test_every_missing_and_wrong_typed_input_is_rejected(self):
        for key in BASE:
            incomplete = dict(BASE)
            del incomplete[key]
            self.assertEqual(json.loads(GUARD(incomplete)), dict(allowed=False, reason="invalid_input", safety_override=False))
        for key in FLAGS:
            for value in [None, "true", "false", "on", "off", 0, 1, [], {}]:
                with self.subTest(key=key, value=value):
                    self.assertEqual(evaluate(**{key: value})["reason"], "invalid_input")
                    self.assertFalse(evaluate(**{key: value})["allowed"])
        for key in ["power_lock", "saved_power", "current_power", "parameter_lock"]:
            for value in [None, True, False, 0, 1, [], {}, "unavailable", "ON", " off "]:
                with self.subTest(key=key, value=value):
                    self.assertEqual(evaluate(**{key: value})["reason"], "invalid_input")
        for value in [None, [], "bad", True, 1]:
            self.assertEqual(json.loads(GUARD(value)), dict(allowed=False, reason="invalid_input", safety_override=False))

    def test_safety_stop_is_target_scoped_and_cannot_be_repurposed_for_parameter_write(self):
        safety = dict(automatic=True, available=True, eligible=False, fault_shutdown=True,
                      explicit_error=True, latched=True, stopping=True, master_enabled=False,
                      power_lock="unknown", saved_power="unknown", current_power="unknown", parameter_lock="unknown")
        self.assertEqual(evaluate(safety), dict(allowed=True, reason="safety_shutdown", safety_override=True))
        for missing_proof in ["available", "explicit_error", "latched", "stopping"]:
            self.assertFalse(evaluate(safety, **{missing_proof: False})["allowed"])
        other_device = BASE | dict(eligible=False)
        self.assertFalse(evaluate(other_device)["allowed"])
        self.assertEqual(other_device, BASE | dict(eligible=False))

    def test_manual_stop_is_allowed_even_when_health_and_permissions_are_unknown(self):
        off = BASE | dict(automatic=False, stopping=True, eligible=False, master_enabled=False,
                          power_lock="unknown", current_power="unknown", saved_power="unknown", parameter_lock="unknown")
        self.assertEqual(evaluate(off), dict(allowed=True, reason="manual_stop", safety_override=False))
        self.assertFalse(evaluate(off, available=False)["allowed"])
        self.assertFalse(evaluate(off, stopping=False)["allowed"])

    def test_locked_power_on_only_permits_nonstopping_adjustment_of_already_on_device(self):
        held = dict(power_lock="on", saved_power="on", current_power="on", parameter_lock="off")
        self.assertTrue(evaluate(held)["allowed"])
        for field in ["saved_power", "current_power"]:
            for value in ["off", "unknown"]:
                self.assertFalse(evaluate(held, **{field: value})["allowed"])
        self.assertFalse(evaluate(held, stopping=True)["allowed"])
        self.assertFalse(evaluate(held, parameter_lock="on")["allowed"])
        self.assertFalse(evaluate(held, parameter_lock="unknown")["allowed"])

    def test_guard_is_pure_repeatable_and_never_emits_commands_or_retry_effects(self):
        original = dict(BASE)
        result = evaluate(original)
        self.assertEqual(original, BASE)
        for _ in range(3):
            self.assertEqual(evaluate(original), result)
        self.assertEqual(set(result), {"allowed", "reason", "safety_override"})


if __name__ == "__main__":
    unittest.main()
