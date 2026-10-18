# Independent temperature-control devices

A climate card can show independent permission switches below the main thermostat switch. The card writes only the configured `input_boolean` flag; your HA controller must read that flag before commanding a device. The frontend does not select a physical device, invent an automation, or start ventilation by itself.

Add to a `custom:ha-m3-climate-card`:

```yaml
actuators_name: Temperature control devices
actuators:
  - id: supply
    name: Supply unit
    entity: input_boolean.use_supply_temperature
    icon: air
  - id: cooling
    name: Air conditioner
    entity: input_boolean.use_air_conditioner
    icon: ac_unit
  - id: future
    name: Future heater
    disabled: true
    description: Not connected
    icon: thermostat
```

Each entry needs a unique `id` and visible `name`. Enabled entries require an `input_boolean` entity; direct `climate`, `fan` or `switch` bindings are rejected. `icon` and `description` are optional. A disabled future entry may omit its entity. Missing/unavailable flags render an unavailable switch and cannot send a command. Permission selection remains editable while the master thermostat is off, allowing users to prepare the next automatic cycle.

The same configuration works inside the optional composite dashboard. Native Sections dashboards and their room subviews use the standalone card unchanged.

## Ventilation Off

Use a normal configured preset. For example:

```yaml
presets:
  - id: off
    name: Off
    icon: power_settings_new
    action:
      action: perform-action
      perform_action: script.turn_on
      target:
        entity_id: script.ventilation_off
    active_when:
      - entity: climate.supply
        value: 'off'
      - entity: fan.purifier
        value: 'off'
```

The HA script should cancel its maximum-ventilation timer/intent and stop the configured ventilation devices. It need not disable the thermostat or change the room target. The backend must prevent a delayed timer or reconnect from restarting ventilation after an explicit Off request. Keep permission checks, device ownership, sensor failure handling, restart delays and command throttling in HA. Those policies are installation configuration, not embedded into this reusable frontend module.
