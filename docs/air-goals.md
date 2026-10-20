# Room air intentions

## Controller policies and HACS updates

The release includes the production policies as `ha-m3-*.jinja` files beside the
frontend bundle. The build executes those exact policy sources; the installer
verifies their release-manifest hashes. Household adapters and device bindings
remain private HA configuration.

On the Linux HA host, run the source release's one-time installer:

```sh
python3 scripts/link-controller.py --config /config
```

It creates individual file links under `custom_templates/ha-material3`, pointing
at the verified HACS files. Directory symlinks are deliberately avoided because
HA's recursive template loader does not traverse them. Existing modified
templates are preserved and cause a clear installation error.

After HACS finishes an update, call `homeassistant.reload_custom_templates`;
this can be automated using the update entity's `installed_version` change.
The same existing links then load the new policy bytes. A release introducing a
new policy filename needs the installer run again. Neither updates nor the
installer rewrite dashboard bindings, room wishes or device permissions.

`ha-m3-climate-card` optionally accepts `air_goals`. In the `calm` layout the temperature and the two room air intentions are shown next to one another on wide cards, and stack on narrow cards. Existing configurations remain unchanged when `air_goals` is absent.

An intention is a semantic 0-100 scale, **not motor percentage**. The backend translates the request into actuator settings according to its own configured policy, sensors, manual permissions and hard limits. HA Auto chooses the base intention; moving a slider chooses a manual room intention while leaving device selection to HA. This is independent from each device parameter's automatic permission and Device Auto mode.

```yaml
type: custom:ha-m3-climate-card
layout: calm
target_slider: true
entities:
  room_temperature: sensor.example_room_temperature
  target_temperature: input_number.example_temperature_target
  enabled: input_boolean.example_climate_enabled
air_goals:
  - id: fresh-air
    name: Fresh air
    entity: input_number.example_fresh_air_intention
    automatic_entity: input_boolean.example_fresh_air_automatic
    automatic_value_entity: sensor.example_fresh_air_suggestion
    set_action:
      action: perform-action
      perform_action: script.example_air_intention
      data: {channel: fresh_air}
      value_field: value
    automatic_action:
      action: perform-action
      perform_action: script.example_air_intention_auto
      data: {channel: fresh_air}
      value_field: automatic
    status_entity: sensor.example_fresh_air_status
    availability_entity: binary_sensor.example_fresh_air_available
    boost:
      action_name: Refresh
      active_entity: input_boolean.example_fresh_air_boost
      deadline_entity: input_datetime.example_fresh_air_boost_deadline
      availability_entity: binary_sensor.example_fresh_air_boost_start_allowed
      start_action:
        action: perform-action
        perform_action: script.example_air_boost
        data: {channel: fresh_air}
        value_field: duration
      cancel_action:
        action: perform-action
        perform_action: script.example_air_boost_cancel
        data: {channel: fresh_air}
      durations: [10, 15]
      default_duration: 15
health_alerts:
  - id: example-breather
    name: Breather
    status_entity: sensor.example_breather_health
    message_entity: sensor.example_breather_health_message
    acknowledgement_entity: binary_sensor.example_breather_recovery_allowed
    acknowledge_action:
      action: perform-action
      perform_action: script.example_device_recover
      data: {device: breather}
```

Add a second air goal with a distinct ID and its own helpers/actions for air cleaning. All IDs and actions are supplied by dashboard configuration. No room names, endpoint URLs, device IDs, PM thresholds, speed tables, noise limits or policy rules are built into the card.

## Source and action contract

- `entity`: an `input_number` with attributes `min: 0`, `max: 100` and a positive `step`. The current state must be within that range.
- `automatic_entity`: `input_boolean`, `on` means HA chooses the base intention.
- `automatic_value_entity`: optional numeric source, including `sensor` or `input_number`, for the computed HA intention (0-100). While HA Auto is on, the readout and slider show this value; `entity` remains the stored manual wish. In manual mode the card shows `entity`. If omitted, the previous display behavior is preserved. Finite decimal values, including zero and scientific notation, are accepted; whitespace-only values, booleans, objects and alternate-radix strings are rejected. A missing, unknown, unavailable, malformed or out-of-range computed value shows No data rather than a fabricated zero. The manual editor stays usable, starting from the valid stored manual wish, so a manual change can safely leave Auto. Display-source failure does not change the stored wish or revoke manual editing.
- `set_action`: receives the requested **Number** in `value_field`. The backend must atomically save it, turn off this goal's automatic selection and cancel only this channel's boost. It must not change the other channel, room temperature or device manual permissions.
- `automatic_action`: receives a real **Boolean**, `true` to delegate base intention selection to HA and `false` to select the stored manual wish without changing it. It does not mean Device Auto and must not change unrelated permissions.
- `status_entity`: optional backend explanation of the effective result or its limit, shown directly on this goal.
- `availability_entity`: optional source, only exact `on` enables editing. A missing, unknown or unavailable helper disables the control.
- Each boost has independent active and deadline helpers. `deadline_entity` must expose a positive Unix epoch seconds `timestamp` attribute. Localized date strings are deliberately not parsed by the browser.
- `boost.start_action`: receives minutes as a **Number**. The backend persists the absolute deadline and enforces its allowed durations. The optional `boost.availability_entity` must be a `binary_sensor` and requires exact `on` to start. Bind it to the backend's current start eligibility (for example channel ready and no conflicting global mode). It only gates starting: an already-active boost can still be opened and cancelled if this permission becomes off, missing or unavailable.
- `boost.cancel_action`: reconciles this channel against the latest base intention and sensor values. A boost increases demand within configured bounds; it does not necessarily select maximum actuator output.

The main boost button starts the configured default duration. The arrow opens the configured duration choices. Once active, either button opens the active controls and Finish action. Repeated taps do **not** silently extend the deadline. The card derives the countdown from server state, renders expiry as Finishing and never sends an expiry action from the browser. Unknown boost helpers disable starting instead of assuming the boost is inactive. Cancelling an explicitly active boost remains possible if the intention, deadline or device is unavailable; cancellation does not depend on the ability to send actuator commands.

The backend owns restart reconciliation and expiry. Keep a persisted absolute deadline and reconcile on startup and a periodic tick as well as timer expiry. Finishing a boost must recompute from **current** wishes and sensors rather than restoring stale motor settings. An overall Off mode should cancel both channels according to the configured backend policy.

Numeric and Auto changes are displayed optimistically, then require matching HA state. A numeric draft is confirmed only when both the value and manual intention state match. Service failure rolls it back immediately; missing helper state clears it; missing confirmation rolls it back within eight seconds and shows a notice. Changing another goal does not replace a pending draft for this goal. Values and notices reserve their layout space.

## Fault state contract

`health_alerts` binds generic backend health state and message sources:

| State | Card behavior |
| --- | --- |
| `healthy` | No fault notice |
| `unavailable` | Device unavailable notice |
| `error` | Error notice with error color and alert semantics |
| `recovery_required` | Persistent error notice requiring a check |
| `health_unknown` | Health not confirmed notice |
| Any missing or unexpected state | Visible unavailable notice, never silently hidden |

The backend must distinguish loss of connectivity from an explicit device error. On an explicit error, it requests power-off if reachable, latches the exclusion and notifies the user. Acknowledge is a backend-controlled recovery operation, not a frontend dismissal; only the backend may clear the latch after checking current availability and the fault signal. Bind the optional `acknowledgement_entity` to a backend `binary_sensor` which is `on` only when recovery may be attempted; unknown or unavailable values disable acknowledgement. Keep the health state `error` while a fault is latched even if the device also becomes unavailable, so the error notice remains prominent. If no actual error sensor is available, do not invent a healthy value or promise detection. Dashboard notices report HA/backend state, not independent proof that the physical actuator turned off. The default message explicitly says power-off is unconfirmed.

## Verification scope

`tests/air-goals-ui.test.mjs` tests source and timer matrices, invalid config, bounds/steps, independent actions, active-boost rejection, optimistic confirmation, rollback/timeout and fault state visibility. The project build/test gate runs these alongside the backend finite-model suite. Browser layout, keyboard and accessibility checks complement these tests. These checks cover the declared finite state contract; they cannot prove every physical device, network or future vendor failure.
