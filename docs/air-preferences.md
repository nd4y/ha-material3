# User comfort preferences

Use the opt-in `semantics: preference` contract when a slider expresses what the user wants rather than the controller's computed demand. It is independent of existing device permissions, fan speed and the automatic ventilation profile. The original air-goal contract remains supported for existing dashboards.

```yaml
air_goals:
  - id: fresh-preference
    semantics: preference
    name: Freshness
    entity: input_number.room_freshness_preference
    preference_note: Your preference
    neutral_value: 50
    value_labels:
      - { value: 0, label: Less }
      - { value: 25, label: A little less }
      - { value: 50, label: As usual }
      - { value: 75, label: Fresher }
      - { value: 100, label: Much fresher }
    set_action:
      action: perform-action
      perform_action: script.room_preference
      value_field: value
      data:
        axis: fresh
```

The helper must expose `min: 0`, `max: 100` and a positive step. Its value is always the stored user preference. Sensor updates and computed plans never move the slider. The frontend sends one typed numeric value through `set_action` only after a user commit. The backend must persist that preference separately from its computed device settings and must not change automatic ownership when handling it.

`value_labels` requires at least two increasing numeric marks covering 0 and 100, each with a nonempty label. The visible output and accessible `aria-valuetext` use the nearest qualitative label. `neutral_value`, if supplied, resolves equal-distance label ties toward the neutral point; it does not reset or initialize the user's helper. `low_label` and `high_label` can override endpoint captions. Names and all qualitative wording are configured.

There is no Auto HA switch for a user preference. `automatic_entity`, `automatic_action` and `automatic_value_entity` are rejected in this contract. A pending edit is confirmed against the preference helper's value only; it does not wait for an ownership flag. Failed or unconfirmed edits discard their temporary display draft without rewriting the stored helper.

Preferences remain editable when a device is offline or room automation is stopped. Only an unavailable or malformed preference helper and an in-flight UI action block editing. Optional `status_entity` is separate read-only controller feedback and does not supply a slider value.

The existing optional per-channel `boost` contract can be added to freshness or cleaning preferences. Both the item-level `availability_entity` and `boost.availability_entity` apply to boost starts, allowing the backend to gate them on the master switch, device health and other permissions. They do not block editing the preference itself. Active boost cancellation stays available independently of start permission. A quietness preference can omit `boost` entirely.

These internal 0-100 values are preference coordinates. Their endpoints do not inherently mean device off/full speed, measured flow, particle concentration or a sound measurement. Mapping preferences to feasible device settings, active profiles, noise constraints and safety remains the responsibility of the shared backend policy.
