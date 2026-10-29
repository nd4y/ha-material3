# Quick controls and automation locks

Automation-group controls may set `manual_readback: {entity: sensor.qualified_device, attribute: fan_mode}` (omit `attribute` for power). Manual capture is disabled when that qualified current value is absent, the source is unavailable or reports a fault; release to automation remains available. Use the controller's qualified source rather than an optimistic provider entity. Unknown stopped speed is adjustable through the primary scale; it is never inferred from an old saved speed.

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

## Optional mode scales and settings menus

`mode_scale` replaces a quick control with a discrete scale whose endpoints are
Off and HA Auto. Intermediate positions come from the configured bounds or device
options. In HA Auto the handle displays the observed setting, not the Auto endpoint.
The browser sends a choice to an explicitly configured script gateway on release;
the installation's gateway must validate and execute the choice. Accepted script
calls are not proof that a device has applied a setting.

Each scale needs `revision_entity` and `completed_entity` (distinct `input_text`
helpers) and a script `gateway` with `value_field: choice`. The gateway receives a
new UUID `request_id`; it must expose that UUID in the revision helper when the
request is admitted and in the completion helper only after its own verified work
is complete. The UI also checks the lock, saved value and device state. It displays
an error or pending state when those observations are unavailable or disagree.
The helpers and scripts are installation-specific and are not included by this
card. These IDs are correlation markers, not atomic locks; all competing writers
and hardware safety rules must be handled by the backend.

For an AC speed stored while the device is off, configure `saved_entity` as a
separate `input_text` marker. The server writes the request UUID there only after
the intended value has been stored; the UI can then show it as a setting for the
next start without claiming that the device applied it. When an actual setting is
unknown, the card offers available choices without drawing a fabricated position.

Supported kinds are `breather-temperature`, `breather-speed`, `ac-temperature`,
`ac-speed`, `purifier-speed` and `heater-temperature`. Breather temperature requires
a confirmed minimum of 5 °C; its Off choice requests 5 °C as a heating-off
setting, without requesting power off. Other Off choices request device power off.
AC temperature additionally requires a qualified room source, source/TTL/epoch
helpers and explicit saved-intent/pending readback. Speed and heater modes require
the manual-mode checks specified by `confirmation`. Turbo is opt-in and requires
the dedicated temperature lock/value readbacks; the gateway must verify its full
sequence. A native Auto program's saved favourite speed is not an observed speed.

For controllers exposing `planning.source_quality` and a `room_measurement`
with source, value, received_at and origin, set
`room_freshness.qualifier_entity` to that controller sensor. The slider then
uses the measurement timestamp rather than the entity's last value change;
it rejects an unqualified, stale or mismatched reading. Without this optional
field the existing source/TTL/epoch validation remains unchanged.

`device_ownership` optionally binds the card's Auto/lock button to a separate
script gateway with `value_field: owner` and the same pair of request and completion
helpers as its controls. Manual capture is available only when all needed current
settings are observable. HA Auto requests transfer control back to the backend.
Neither action invents a missing current value.

`settings_menu.groups` adds a device menu and long-press access from a scale.
Explicit switch and select actions are constrained to the configured entity;
`reading` entries are read-only, and a `filter-reset` button uses a separate
confirmation and an exact configured `button.press` target. The menu reports the
command submission, not an unverified physical reset. Feature availability and
interactions with automation remain the responsibility of the installation.

Installations can opt in to `runtime_ready_entity` and `runtime_safety` to keep
ordinary controls disabled when their backend or configured safety automation is
not ready. A `stop_only` script gateway may offer an independent immediate stop;
the observed HA state is not proof that an earlier command cannot take effect
later. An optional `recovery` gateway exposes an explicit backend readiness check
without changing device settings from the UI. These gateways and their recovery
and safety policies must exist on the server before enabling the options.

The room automation shortcut may define an explicit `automation_reset.scope` with
a short `label`, `included` and `excluded` names. Its visible label and contextual
help then describe that configured group, rather than claiming that unrelated
devices are managed by HA. The shortcut can use the same optional readiness and
safety checks as the quick cards.

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
