# Device health policy

> Область документа: переносимые формулы / прежняя схема адаптера. Актуальный Python-контроллер и отличия описаны в [блок-схемах](automation-flow.md) и [архитектуре](controller-architecture.md). Не применяйте прежнее ограничение притока при охлаждении к reconcile-контроллеру.

`controller/device-health.jinja` contains two portable, pure macros. They contain
no entity IDs, vendor commands, clocks, network calls or Home Assistant services.
The controller adapter owns persistence and actual effects. A journal is an
observer, never a source of retry commands.

```jinja
{% from 'device-health.jinja' import device_health, health_transition %}
{% set current = device_health(parameters) | from_json %}
{% set result = health_transition(saved_state, observation) | from_json %}
```

Copy the template to HA's `custom_templates` directory and reload custom
templates. Keep the same tested file when packaging a controller. Jinja's standard
environment used during build supplies JSON filters matching HA's `to_json` and
`from_json` filters. These macros do not execute a shutdown during rendering.

## Input contract

`device_health(p)` takes a mapping with these fields:

| Field | Values | Meaning |
| --- | --- | --- |
| `availability` | `available`, `unavailable`, `unknown` | Current communication availability, not a claim that power is off. |
| `error_known` | boolean or unknown | Whether the adapter can currently interpret its configured error signal. |
| `error_active` | boolean or unknown | Explicit device error. A nonzero vendor code must be interpreted by the vendor adapter. |
| `latched` | boolean; default false for a new state | Persistent exclusion after a device error. |
| `stop_attempted` | boolean; default false for a new state | Persistent record that this error episode already consumed its one stop attempt. |
| `observed_power` | `on`, `off`, `unknown` | Independently reported current HA power state, never a service-call reply. |

Boolean inputs accept actual booleans, 0/1 and the trimmed, case-insensitive
strings `true`/`false`, `on`/`off`, `1`/`0`. Other values are unknown, including
missing required fields. Lists, mappings and arbitrary strings are not truthy
booleans. Invalid persistent flags, or `stop_attempted=true` without a latch,
block ordinary control. A storage adapter must not silently replace corrupt or
unreadable persisted state with a fresh state.

The adapter normalizes climate `heat`, `cool` and other powered modes to `on`.
Availability alone must never be normalized to power `off`. When a device has no
configured error source, its adapter supplies `error_known=true` and
`error_active=false`, and explicitly labels that device **availability-only
monitoring** on the dashboard. This expresses an unconfigured capability, not an
invented error sensor or a guarantee that all internal faults can be detected.
A configured error source that stops reporting supplies `error_known=false` and
blocks control. The macro must not guess vendor error-code semantics.

## Health result

`eligible` is true only when the device is available, the error signal is known
clear, persistent flags are valid and there is no latch. An unknown error signal
blocks control, but is not invented as an explicit error and does not authorize
an emergency shutdown.

`condition` is one of `healthy`, `unavailable`, `health_unknown`, `error` or
`recovery_required`. Explicit error takes precedence; `availability` remains
separate so a device may simultaneously have a latched error and be unreachable.
`notification.kind=device_error` remains active for a latch even after the
current signal clears. Both unavailable and unknown devices are excluded without
being described as stopped.

`shutdown_required` is an advisory request when a device is currently available,
explicitly errored, has valid persisted flags, has not consumed its stop attempt,
and has not already reported power off. `override_manual_power` is true only for
that exact safety request. It never grants access to another device or to its
temperature/speed settings. The controller must use `health_transition`, rather
than repeatedly treating this advisory field as a service command.

`shutdown_confirmation` is one of:

- `confirmed`: the faulted device is available and currently reports power off.
- `not_confirmed`: a stop attempt was consumed but current power off is not
  confirmed, including loss of communication after the command.
- `not_requested`: a fault exists but no stop was necessary or possible yet.
- `not_required`: no current or latched explicit device error.

This is HA-state confirmation, not independent physical proof. Successful command
submission does not change reported power or prove shutdown.

## Transition contract

`health_transition(state, event)` returns `{state, health, effects}`. Preserve the
returned state atomically **before** issuing a returned shutdown effect. Serialize
transitions per device. Keep separate persisted states per device.

| `event.type` | Behavior |
| --- | --- |
| `observe` | Full snapshot of availability, error-known, error-active and reported power. Missing snapshot fields become unknown. |
| `acknowledge` | Request recovery. Optional current observation fields replace the saved values. The adapter must provide a fresh snapshot before accepting a UI acknowledgement. |
| `shutdown_result` | Optional current observation fields update the state. `accepted=true` or `false` is informational only and never confirms power or retries a stop. |
| `restart` | Preserve state exactly; no shutdown, notification retry, acknowledgement or automatic restart. Refresh real observations separately. |

Unsupported event types preserve the state and emit no effects. Non-mapping input
is treated as an empty, unknown state. No event can emit a turn-on command.

Effects are:

- `shutdown`: issue one configured stop command for this device. Before calling
  it, revalidate that the signal is still an explicit error and the device is
  still the same eligible fault target. Marking the attempt precedes submission,
  so even a failed call cannot become a retry loop. If persistence fails, do not
  submit and raise a controller error. A crash between persistence and submission
  can leave shutdown unconfirmed, which must remain visible.
- `override_manual_power`: this shutdown alone may bypass the errored device's
  manual power permission. It cannot bypass permissions for other writes.
- `notify` / `clear_notification`: update or clear the per-device persistent
  alert only when its current health content changes. Repeating an identical
  observation emits no duplicate notification. These effects do not control the
  dashboard's current-state display.
- `acknowledgement`: `accepted`, `rejected` or `not_requested`.

An explicit error creates the latch. If initially unreachable, its first stop
attempt is deferred until communication returns **and the explicit error still
exists**. Already confirmed power off avoids a redundant command; a later power
on during that same error episode gets the single available stop attempt.
Neither an error-clear observation nor a restart removes the latch. Acknowledgement
is accepted only when currently available with a known clear error and valid
persistent flags. It removes the latch and resets the attempt record. It does
not turn the device on; the normal controller may use it again in a later plan.

If a failed stop leaves the device running, retain the persistent alert and show
**shutdown unconfirmed**. Do not silently retry, fake an off state, or treat the
journal's command record as current health. An operator can stop the device
outside this policy; a confirmed power-off observation updates the alert.

## Dashboard and decision journal

Render current faults above the bounded journal feed, from current `health`, so
an old fault cannot disappear when its journal entry scrolls away. Use the
configured device name and expose availability, explicit/latched error and
shutdown confirmation separately. Keep a clear recovery action disabled while
acknowledgement is not allowed. Error alerts use the theme's error color; unknown
and unavailable states use a warning treatment. Never rely on color alone.

The existing journal format can record `decision` (excluded), `requested`
(stop submitted), `observed` (error cleared), `not_confirmed` (shutdown not
confirmed) and `confirmed` (HA reports off). A `confirmed` entry must describe
power off explicitly; error acknowledgement is a separate event. The sticky
alert is a separate current-state model, not a scan for old journal entries.

## Last-moment command guard

`controller/command-guards.jinja` exports `command_guard(p)`, returning only
`{allowed, reason, safety_override}`. The central gateway calls this same tested
macro immediately before every automatic **and** manual physical write. It
performs no commands, persistence, retries or journal writes itself.

All eight flags (`automatic`, `available`, `eligible`, `fault_shutdown`,
`explicit_error`, `latched`, `stopping`, `master_enabled`) must be actual booleans.
`power_lock`, `saved_power` and `current_power` must be canonical `on`, `off` or
`unknown`. `parameter_lock` additionally accepts the empty string when no
parameter permission applies. Other types and missing fields reject the write.

The allowed sets are:

- Safety stop: available, explicit error, active latch, `fault_shutdown=true`
  and `stopping=true`. This alone may bypass manual holds and master enable.
  The caller must bind all these observations to the exact command target and
  preserve the one-attempt latch transition before submitting it.
- Ordinary manual stop: available and explicitly stopping, even with uncertain
  health or manual holds. Other manual writes require eligibility.
- Automatic write: available, eligible, master enabled; parameter permission
  absent or off; power permission off, or held on **and** saved on **and**
  currently on **and** nonstopping. An unknown hold blocks automatic writes.

`fault_shutdown=true` can never authorize a nonstopping write. Unavailability
blocks every command, including safety and manual stops. A gate decision is
authorization for the current observations, not proof that a device acted on a
command. Confirmation remains separate.

`test_command_guards.py` exhaustively checks all 27,648 combinations of the
declared Boolean and state domain against an independent Boolean authorization
formula, plus missing/wrong types, target separation, held-on behavior and
purity. The complete set of reachable decision reasons is asserted as well.

## Tested finite model and limitations

`tests/controller/test_device_health.py` enumerates all 324 health combinations
in the declared domain; all 243 complete observations over the three valid
persistent latch/attempt states, including repeated observations; all 81
acknowledgement snapshots; all 324 restart states; and all 648 successful/failed
command-submission replies. Additional sequences cover disconnect/reconnect,
explicit error, command failure/success, confirmation, restart, clear without
acknowledgement, new error episodes, unavailable-but-reported-off contradictions,
malformed inputs, incomplete observations and separation of devices.

The expected invariants are calculated independently in Python. These tests
cover this finite contract, not every possible vendor firmware fault, physical
failure, network timing, corrupted disk or service integration. Build-time checks
must be supplemented by native HA template validation and adapter tests. Never
create a real device error or energize equipment merely to exercise a fixture.
