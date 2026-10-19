# Quick controls and automation locks

`custom:ha-m3-quick-device-card` uses the installed HA entities for numeric bounds,
steps and discrete options. It has no thermostat algorithm, installation IDs,
addresses or embedded device models. The regular device card remains compatible.

Each quantity has its own optional persistent `input_boolean` lock. A closed lock
holds a manual setting; it does not disable the slider. Editing a held value is
still an explicit manual action. A native device Auto mode can also be held: the
device may vary its speed, while HA scenarios must preserve the selected Auto mode.

The visible control is now a **Managed automatically** checkbox. Checked means
the configured lock helper is `off`; unchecked means it is `on`. Existing lock
bindings and gateway actions remain compatible. Power has its own checkbox.
Manual edits should clear only their corresponding checkbox on the server.

The backend, rather than a browser tab, must enforce locks. Every automatic write,
including timers, recovery and preset helpers, needs an `is_state(lock, 'off')`
guard. Unknown or unavailable lock states must fail closed. Do not use `not on` as
the write permission. Store lock helpers without an `initial` value so they restore
after restart. Manual actions should validate, acquire their lock, save intent,
then apply it. Serialize manual actions and preserve explicit power-off requests.

```yaml
type: custom:ha-m3-quick-device-card
entity: climate.my_device
name: My device
quick_controls:
  - id: temperature
    name: Temperature
    entity: climate.my_device
    attribute: temperature
    bounds:
      min: min_temp
      max: max_temp
      step: target_temp_step
    unit: °C
    lock_entity: input_boolean.my_temperature_lock
    value_entity: input_number.my_saved_temperature
    set_action:
      action: perform-action
      perform_action: script.my_manual_control
      data:
        parameter: temperature
      value_field: value
    lock_action:
      action: perform-action
      perform_action: script.my_manual_control
      data:
        parameter: temperature
        operation: lock
      value_field: value
  - id: speed
    name: Speed
    entity: climate.my_device
    attribute: fan_mode
    options_attribute: fan_modes
    option_labels:
      low: Quiet
      medium: Medium
      high: High
    lock_entity: input_boolean.my_speed_lock
    value_entity: input_text.my_saved_speed
    set_action:
      action: perform-action
      perform_action: script.my_manual_control
      data:
        parameter: speed
      value_field: value
    auto:
      value: auto
      active_when:
        - entity: climate.my_device
          attribute: fan_mode
          value: auto
      action:
        action: perform-action
        perform_action: script.my_manual_control
        data:
          parameter: speed
          value: auto
```

The scripts and helpers above are example bindings, not provided entities. Use an
installation-specific, server-enforced manual gateway. `lock_action` is optional;
without it the card directly toggles the specified lock helper. Use a gateway when
closing a lock also needs to capture the current setting. `power` accepts the same
`action`, `lock_action` and `lock_entity` shape, with a boolean dynamic `value`.
An optional `on_when` condition array defines its live power state. `status_entity`
displays the backend explanation (pending, conflict, protection or applied state).

For numeric entities, omit `attribute` and `bounds` to use state/min/max/step.
For select entities, use `options_attribute: options` and omit `attribute`.
`value_entity` supplies saved intent only while the lock is closed. When unlocked,
the live device value is shown. Unknown options never map silently to another speed.

Sliders preview locally during a drag and send one manual action on release.
The backend must decide whether to defer an off-device change, how to choose HVAC
modes, and how to honor equipment restart protection. A UI lock alone cannot protect
against unrelated automations or vendor cloud changes.

Use `compact: true` on `ha-m3-climate-card` for a small room summary and scenario
controls alongside the individual quick cards. `preset_status_entity` can explain
partially applied scenarios when some quantities are locked. The shared room target
can be exposed by a configured quick slider rather than duplicated in the summary.

For room-level intent, add `target_slider: true` to the compact climate card.
An optional `target_action` has the same dynamic `value_field` contract as a quick
control. Bind it to a room-goal gateway that preserves manual device permissions.
Keep the shared room goal separate from held device targets so changing the goal
does not overwrite a manual thermostat setting.

```yaml
target_slider: true
target_action:
  action: perform-action
  perform_action: script.my_room_goal
  value_field: value
automation_groups:
  - name: Air conditioner
    entity: climate.my_device
    controls:
      - name: Temperature
        lock_entity: input_boolean.my_temperature_lock
automation_reset:
  name: Trust all automation
  action:
    action: perform-action
    perform_action: script.my_trust_all
context_sensors:
  - name: CO2
    entity: sensor.my_co2
```

Configure the requested air levels as regular `presets` with `active_when` bound
to a persistent selector. This keeps requested intent selected when manual
parameters prevent full application. Five choices use a full-width first choice
and two rows of two. Labels, actions and sensor bindings remain configurable.
The reset gateway defines which permissions are released; the card itself never
chooses devices, enables unrelated entities, or changes a requested room goal.
