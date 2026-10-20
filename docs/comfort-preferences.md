# Persistent room comfort preferences

Comfort preferences describe what the user wants, not what a motor is doing.
They remain unchanged while HA recomputes temperatures, fan speeds and modes.
The card must always show the stored user preference, never calculated speed or
an automatic suggestion in the same control. Device telemetry and decision
reasons belong in separate status information and the decision journal.

The production file `controller/comfort-preferences.jinja` provides two pure
macros. Tests execute this exact file; there is no parallel controller written
in JavaScript or Python. All device bindings and policy tuning are supplied by
the household adapter.

## Policy input

`comfort_preferences(p)` accepts a mapping with these required fields:

| Fields | Meaning |
| --- | --- |
| `fresh`, `clean` | User preferences from 0 to 100. Neutral is 50; below neutral asks for less additional demand, above neutral asks for more. These values are not fan percentages. |
| `quiet` | User preference from 0 to 100. Zero preserves the already-resolved contextual noise caps; increasing it asks for additional quietness. |
| `fresh_base`, `clean_base`, `ac_fan_base` | Current automatic physical-step baselines, before applying these preferences. |
| `fresh_need`, `clean_need` | Current sensor-driven minimum step requests. A preference for less never reduces these requests. |
| `fresh_max`, `clean_max`, `ac_fan_max` | Positive integer physical maxima. AC fan steps are a caller-defined ordered numeric scale. |
| `fresh_noise_cap`, `clean_noise_cap`, `ac_fan_noise_cap` | Already-resolved contextual soft noise caps, before additional user quietness. |
| `fresh_adjustment_steps`, `clean_adjustment_steps` | Positive integer maximum additions or reductions relative to each automatic baseline. These configured ranges are independent of the hardware maximum. |
| `fresh_quiet_reduction_steps`, `clean_quiet_reduction_steps`, `ac_fan_quiet_reduction_steps` | Nonnegative integer maximum additional reductions of the respective contextual noise caps. Zero leaves that device's cap unchanged. |

Preference inputs may be finite decimals within 0-100. Physical-step fields
must be finite integers from 0 to 1,000,000; maxima and demand-adjustment ranges
must be positive. Baselines and sensor needs cannot exceed their hardware
maxima. Booleans, strings, missing fields, NaN and infinity are invalid. Values
are validated before arithmetic; an unknown sensor must be handled explicitly
by the upstream sensor/fallback policy, never silently converted to zero here.

For freshness and cleaning, signed adjustment is the rounded value of
`(preference - 50) / 50 * configured_adjustment_steps`. The result is the larger
of the adjusted baseline and the sensor minimum, bounded to the physical range.
A positive automatic baseline or positive sensor need retains at least step 1,
even when a negative adjustment would otherwise erase it. An already-zero
baseline with zero sensor need can remain zero at neutral or lower preference;
a positive preference can add demand when the outer global mode permits it.
This adjusts an automatic plan, rather than mapping preference to a fraction of
the motor range. A zero preference is not an explicit power-off command, and a
100 preference is not an explicit device-maximum command. HA remains responsible
for selecting feasible settings as the sensor situation changes.

Quietness subtracts the rounded value of
`quiet / 100 * configured_quiet_reduction_steps` from each contextual cap,
after limiting that cap to its hardware range. A previously positive cap is
kept at least 1, so quietness alone cannot introduce a power-off constraint. An
existing zero cap remains zero. Additional quietness never increases a cap.
Rounding uses the template engine's common nearest-even rule at exact halves.

## Policy output and arbitration

The result contains `valid`, `error`, `fresh_request`, `clean_request`,
`ac_fan_request`, `fresh_noise_cap`, `clean_noise_cap`, `ac_fan_cap` and `reasons`.
`ac_fan_request` preserves its automatic baseline; quietness affects its cap.
Reason codes distinguish neutral preferences, more/less preference, a sensor
minimum dominating the preference, and additional quietness. Invalid input
returns `valid: false`, `error: invalid_input`, null requests/caps and explicit
invalid-input reasons. The adapter must not submit a command from this result.

This macro does not grant authority to actuate. The outer controller still must
apply explicit global Off/Maximum behavior, bounded boost overlays, hardware and
hard safety limits, device health, persistent manual permissions, rate limits
and protective pauses. Recheck authority and health immediately before service
calls. These caps are additional soft restrictions; an outer layer must not
re-expand them when composing a boost or Maximum. Any critical-air-quality
exception to ordinary contextual noise policy must be resolved upstream before
applying the user's additional quietness preference. A request can exceed its
soft cap; the outer decision journal should explain the resulting limitation.

Temperature remains the independent desired room-temperature target. Changing
freshness, cleaning or quietness must not rewrite that temperature target.
Thermal compensation can adjust allowed equipment to maintain it.

## User-only persistence

`comfort_transition(state, event)` validates and updates persisted preferences.
State contains numeric `fresh`, `clean`, `quiet` values from 0 to 100 in steps of
5. Extra state fields are preserved unchanged. Only these explicit user events
are supported:

```json
{"type": "set", "axis": "fresh", "value": 75}
{"type": "set", "axis": "clean", "value": 60}
{"type": "set", "axis": "quiet", "value": 40}
{"type": "reset"}
```

Reset explicitly restores `fresh: 50`, `clean: 50`, `quiet: 0`. Invalid input is
rejected with unchanged state and `changed: false`. Editing one preference does
not disable automatic control or modify another preference, temperature,
permissions or boosts. The adapter can independently cancel a matching temporary
overlay under its declared room-intent policy; this reducer has no such side
effect and never rewrites deadlines or equipment settings.

Sensor updates, profile selection, Off/Maximum, timer expiry, restart
reconciliation, master changes and granting automatic permissions must not call
this reducer or write the preference helpers. They re-evaluate the current plan
from the existing preferences. Persist helpers without startup resets; restore
them before re-evaluating automation. Serialise preference updates through the
household adapter so stale requests cannot overwrite a newer explicit edit.

Published demand-style configuration remains a separate compatibility contract.
Do not reinterpret old fan-derived or calculated values as deliberate comfort
preferences. Introduce the new semantics explicitly, initialise new preference
helpers neutrally once, and preserve the existing temperature goal and manual
permissions. HACS updates must not overwrite private helper values or bindings.

## Verification boundary

`tests/controller/test_comfort_preferences.py` covers every 0-100/step-5
preference combination, monotonicity, axis independence, neutral identity,
sensor floors, hardware and quiet-cap boundaries, named rounding witnesses,
invalid types/nonfinite inputs, all explicit edit values, reset, unsupported
automation events and persistence across re-planning/serialization. It executes
the distributable macros directly. The normal build gate discovers this suite.
These finite software properties do not prove physical acoustic comfort,
device effectiveness or every vendor/network failure.
