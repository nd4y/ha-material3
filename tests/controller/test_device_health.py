"""Finite-domain device health specification, run without a Home Assistant server."""

import itertools
import json
from pathlib import Path
import unittest

import jinja2


ROOT = Path(__file__).resolve().parents[2]
ENV = jinja2.Environment(loader=jinja2.FileSystemLoader(ROOT / "controller"), undefined=jinja2.StrictUndefined)
ENV.filters.update(to_json=lambda value: json.dumps(value, allow_nan=False), from_json=json.loads)
POLICY = ENV.get_template("device-health.jinja").module


def health(**values):
    return json.loads(POLICY.device_health(values))


def step(state, kind="observe", **values):
    return json.loads(POLICY.health_transition(state, dict(type=kind, **values)))


def initial(**overrides):
    return dict(availability="available", error_known=True, error_active=False,
                latched=False, stop_attempted=False, observed_power="on") | overrides


def snapshot(state, **overrides):
    return dict({key: state[key] for key in ("availability", "error_known", "error_active", "observed_power")}, **overrides)


class DeviceHealthTests(unittest.TestCase):
    def test_all_324_health_input_states(self):
        checked = 0
        for availability, known, active, latched, attempted, power in itertools.product(
            ["available", "unavailable", "unknown"], [True, False, None],
            [True, False, None], [False, True], [False, True], ["on", "off", "unknown"]
        ):
            # 3 * 3 * 3 * 2 * 2 * 3 = 324, including inconsistent persisted state.
            with self.subTest(availability=availability, known=known, active=active,
                              latched=latched, attempted=attempted, power=power):
                value = health(availability=availability, error_known=known, error_active=active,
                               latched=latched, stop_attempted=attempted, observed_power=power)
                available = availability == "available"
                explicit = known is True and active is True
                clear = known is True and active is False
                valid = not (attempted and not latched)
                condition = ("error" if explicit else "unavailable" if availability == "unavailable"
                             else "health_unknown" if not available or not clear or not valid
                             else "recovery_required" if latched else "healthy")
                fault = explicit or latched
                confirmation = ("not_required" if not fault else "confirmed" if available and power == "off"
                                else "not_confirmed" if attempted else "not_requested")
                notice = ("device_error" if fault else "device_unavailable" if condition == "unavailable"
                          else "health_unknown" if condition == "health_unknown" else "")
                self.assertEqual(value["eligible"], available and clear and valid and not latched)
                self.assertEqual(value["condition"], condition)
                self.assertEqual(value["state_valid"], valid)
                self.assertEqual(value["explicit_error"], explicit)
                self.assertEqual(value["shutdown_required"], explicit and available and valid and not attempted and power != "off")
                self.assertEqual(value["override_manual_power"], value["shutdown_required"])
                self.assertEqual(value["acknowledgement_allowed"], available and clear and valid and latched)
                self.assertEqual(value["notification"]["required"], not value["eligible"])
                self.assertEqual(value["notification"]["kind"], notice)
                self.assertEqual(value["notification"]["severity"], "error" if fault else "warning" if not value["eligible"] else "none")
                self.assertEqual(value["shutdown_confirmation"], confirmation)
                if not available:
                    self.assertFalse(value["eligible"])
                    self.assertFalse(value["shutdown_required"])
                    self.assertNotEqual(value["shutdown_confirmation"], "confirmed")
                if not explicit:
                    self.assertFalse(value["override_manual_power"])
                if value["shutdown_confirmation"] == "confirmed":
                    self.assertTrue(available)
                    self.assertEqual(power, "off")
                checked += 1
        self.assertEqual(checked, 324)

    def test_strict_normalization_and_malformed_values_fail_closed(self):
        true_values = [True, 1, "true", "TRUE", " on ", "1"]
        false_values = [False, 0, "false", "FALSE", " off ", "0"]
        invalid = [None, "unknown", "unavailable", "", "null", 2, -1, [], {}, [True]]
        for value in true_values:
            with self.subTest(value=value):
                self.assertTrue(health(**dict(initial(), availability=value))["eligible"])
                self.assertTrue(health(**dict(initial(), error_active=value))["explicit_error"])
        for value in false_values:
            with self.subTest(value=value):
                self.assertFalse(health(**dict(initial(), availability=value))["eligible"])
                self.assertTrue(health(**dict(initial(), error_active=value))["eligible"])
        for field in ["availability", "error_known", "error_active", "latched", "stop_attempted"]:
            for value in invalid:
                with self.subTest(field=field, value=value):
                    self.assertFalse(health(**dict(initial(), **{field: value}))["eligible"])
        for value in [None, [], "unexpected"]:
            self.assertFalse(json.loads(POLICY.device_health(value))["eligible"])
        self.assertFalse(json.loads(POLICY.device_health({}))["eligible"])

    def test_all_observations_of_all_persistent_latch_states(self):
        checked = 0
        for latched, attempted in [(False, False), (True, False), (True, True)]:
            for availability, known, active, power in itertools.product(
                ["available", "unavailable", "unknown"], [True, False, None],
                [True, False, None], ["on", "off", "unknown"]
            ):
                before = dict(initial(), latched=latched, stop_attempted=attempted)
                values = dict(availability=availability, error_known=known, error_active=active, observed_power=power)
                result = step(before, **values)
                explicit = known is True and active is True
                expect_shutdown = availability == "available" and explicit and not attempted and power != "off"
                with self.subTest(before=before, observation=values):
                    self.assertEqual(result["state"]["latched"], latched or explicit)
                    self.assertEqual(result["effects"]["shutdown"], expect_shutdown)
                    self.assertEqual(result["state"]["stop_attempted"], attempted or expect_shutdown)
                    self.assertFalse(result["effects"]["clear_notification"] and result["health"]["notification"]["required"])
                    self.assertFalse(result["health"]["eligible"] and (latched or explicit))
                    # Same observation is idempotent: not a service retry loop.
                    repeated = step(result["state"], **values)
                    self.assertFalse(repeated["effects"]["shutdown"])
                    self.assertFalse(repeated["effects"]["notify"])
                    self.assertEqual(repeated["state"], result["state"])
                checked += 1
        self.assertEqual(checked, 243)

    def test_acknowledgement_matrix_requires_current_available_known_clear_error(self):
        for availability, known, active, power in itertools.product(
            ["available", "unavailable", "unknown"], [True, False, None],
            [True, False, None], ["on", "off", "unknown"]
        ):
            state = dict(initial(), latched=True, stop_attempted=True)
            result = step(state, "acknowledge", availability=availability,
                          error_known=known, error_active=active, observed_power=power)
            accept = availability == "available" and known is True and active is False
            with self.subTest(availability=availability, known=known, active=active, power=power):
                self.assertEqual(result["effects"]["acknowledgement"], "accepted" if accept else "rejected")
                self.assertEqual(result["state"]["latched"], not accept)
                self.assertEqual(result["state"]["stop_attempted"], not accept)
                self.assertEqual(result["health"]["eligible"], accept)
                self.assertFalse(result["effects"]["shutdown"])

    def test_unavailability_does_not_latch_or_claim_shutdown(self):
        state = initial()
        lost = step(state, **snapshot(state, availability="unavailable", observed_power="off"))
        self.assertEqual(lost["health"]["condition"], "unavailable")
        self.assertFalse(lost["effects"]["shutdown"])
        self.assertFalse(lost["state"]["latched"])
        recovered = step(lost["state"], **snapshot(state))
        self.assertTrue(recovered["health"]["eligible"])
        self.assertTrue(recovered["effects"]["clear_notification"])

    def test_explicit_error_latches_one_shutdown_until_clear_and_ack(self):
        fault = step(initial(), **snapshot(initial(), error_active=True))
        self.assertTrue(fault["effects"]["shutdown"])
        self.assertTrue(fault["effects"]["override_manual_power"])
        self.assertEqual(fault["health"]["shutdown_confirmation"], "not_confirmed")
        self.assertTrue(fault["health"]["notification"]["persistent"])
        # Error active: acknowledgement fails and does not re-arm shutdown.
        rejected = step(fault["state"], "acknowledge")
        self.assertEqual(rejected["effects"]["acknowledgement"], "rejected")
        self.assertFalse(rejected["effects"]["shutdown"])
        # Neither a successful service reply nor restart proves power is off.
        replied = step(rejected["state"], "shutdown_result", accepted=True)
        self.assertEqual(replied["health"]["shutdown_confirmation"], "not_confirmed")
        restarted = step(replied["state"], "restart")
        self.assertEqual(restarted["state"], replied["state"])
        self.assertFalse(any(restarted["effects"][name] for name in ["shutdown", "notify", "clear_notification"]))
        confirmed = step(restarted["state"], **snapshot(restarted["state"], observed_power="off"))
        self.assertEqual(confirmed["health"]["shutdown_confirmation"], "confirmed")
        cleared = step(confirmed["state"], **snapshot(confirmed["state"], error_active=False))
        self.assertEqual(cleared["health"]["condition"], "recovery_required")
        self.assertFalse(cleared["health"]["eligible"])
        acknowledged = step(cleared["state"], "acknowledge")
        self.assertEqual(acknowledged["effects"]["acknowledgement"], "accepted")
        self.assertTrue(acknowledged["health"]["eligible"])
        self.assertTrue(acknowledged["effects"]["clear_notification"])
        # Recovery never sends turn_on; a future error creates a new episode.
        self.assertFalse(acknowledged["effects"]["shutdown"])
        later = step(acknowledged["state"], **snapshot(acknowledged["state"], error_active=True, observed_power="on"))
        self.assertTrue(later["effects"]["shutdown"])

    def test_error_unavailable_defers_first_shutdown_but_never_retries_it(self):
        state = initial()
        fault = step(state, **snapshot(state, error_active=True, availability="unavailable"))
        self.assertTrue(fault["state"]["latched"])
        self.assertFalse(fault["effects"]["shutdown"])
        returned = step(fault["state"], **snapshot(fault["state"], availability="available"))
        self.assertTrue(returned["effects"]["shutdown"])
        failed = step(returned["state"], "shutdown_result", accepted=False)
        self.assertFalse(failed["effects"]["shutdown"])
        self.assertEqual(failed["health"]["shutdown_confirmation"], "not_confirmed")
        for _ in range(3):
            failed = step(failed["state"], **snapshot(failed["state"]))
            self.assertFalse(failed["effects"]["shutdown"])

    def test_off_state_avoids_redundant_command_but_later_power_on_gets_one_stop(self):
        state = initial()
        fault = step(state, **snapshot(state, error_active=True, observed_power="off"))
        self.assertTrue(fault["state"]["latched"])
        self.assertFalse(fault["effects"]["shutdown"])
        self.assertEqual(fault["health"]["shutdown_confirmation"], "confirmed")
        powered = step(fault["state"], **snapshot(fault["state"], observed_power="on"))
        self.assertTrue(powered["effects"]["shutdown"])

    def test_other_device_state_is_never_changed_by_an_error(self):
        first, other = initial(), initial()
        original = dict(other)
        result = step(first, **snapshot(first, error_active=True))
        self.assertTrue(result["effects"]["shutdown"])
        self.assertEqual(other, original)
        self.assertTrue(health(**other)["eligible"])
        self.assertNotIn("entity_id", result["effects"])

    def test_incomplete_observation_fails_closed_unsupported_event_has_no_effects(self):
        result = step(initial())
        self.assertFalse(result["health"]["eligible"])
        self.assertEqual(result["health"]["condition"], "health_unknown")
        state = initial()
        unsupported = step(state, "journal_retry", error_known=True, error_active=True)
        self.assertEqual(unsupported["state"], state)
        self.assertTrue(unsupported["effects"]["unsupported_event"])
        self.assertFalse(unsupported["effects"]["shutdown"])

    def test_restart_and_submission_replies_never_rearm_or_confirm_a_stop(self):
        for availability, known, active, latched, attempted, power in itertools.product(
            ["available", "unavailable", "unknown"], [True, False, None],
            [True, False, None], [False, True], [False, True], ["on", "off", "unknown"]
        ):
            state = dict(availability=availability, error_known=known, error_active=active,
                         latched=latched, stop_attempted=attempted, observed_power=power)
            restarted = step(state, "restart")
            self.assertEqual(restarted["state"], state)
            self.assertFalse(restarted["effects"]["shutdown"])
            self.assertFalse(restarted["effects"]["notify"])
            for accepted in [False, True]:
                result = step(state, "shutdown_result", accepted=accepted)
                self.assertFalse(result["effects"]["shutdown"])
                self.assertEqual(result["health"]["observed_power"], power)
                self.assertEqual(result["state"]["stop_attempted"], attempted)
                if availability != "available" or power != "off":
                    self.assertNotEqual(result["health"]["shutdown_confirmation"], "confirmed")


if __name__ == "__main__":
    unittest.main()
