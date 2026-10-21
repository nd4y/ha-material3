# History and noise preferences

Version 0.11 adds opt-in Recorder-backed mini graphs to climate and quick-device cards.
Set `history: true` or `history: {hours: 24}` on a card. Supported periods are 6 hours,
24 hours and 7 days, with at most 168 hours configured. HA Recorder must retain the
selected entities and their attributes. The frontend only reads history; it does not
create measurements or send device commands from graphs.

Graphs use bounded monotone curves without overshoot. Unknown/unavailable records
break the curve. Hover shows interpolated values with an approximation sign; settings
also show the recorded value. These visual curves do not imply intermediate commands.
Touch pins the same details, a second tap or Escape clears them. History requests are
batched per connection/window and cached for two minutes; hovering makes no requests.

Context sensors can configure secondary series, loaded only when expanded:

```yaml
history: {hours: 24}
context_sensors:
  - name: PM2.5
    entity: sensor.room_pm25
    details_title: Air quality
    details:
      - name: PM1
        entity: sensor.room_pm1
        unit: μg/m³
```

PM2.5 stays on the main screen. PM1 shares its time/concentration scale in details.
Configure comparable units; the module does not perform implicit unit conversion.
Absent history, Recorder errors and unavailable readings show no-data states.

For an existing quietness preference, use `invert: true` to expose allowed noise
instead. The displayed value is `100 - backend_value`; writes use the same inverse.
Existing automations, helper IDs, saved preferences and manual locks are preserved.
This is a subjective noise allowance, not a measured dBA value or device speed.

```yaml
air_goals:
  - id: noise
    name: Noise
    semantics: preference
    entity: input_number.room_quiet_preference
    invert: true
    neutral_value: 50
    low_label: Less noise
    high_label: Noise allowed
    value_labels:
      - {value: 0, label: Very quiet}
      - {value: 50, label: Moderate}
      - {value: 100, label: Noise allowed}
    set_action:
      action: perform-action
      perform_action: script.room_preference
      value_field: value
      data: {axis: quiet}
```

Quick controls graph the actual entity/attribute, independently of a saved manual
draft. `history_sources` can override the source with one or two named entities,
attributes, units and optional numeric `value_map` entries. Native Auto enum values
without a numeric mapping become gaps instead of invented fan speeds.

Update through the regular HACS release. Dashboard configuration is separate from
downloaded files and survives updates; never edit the downloaded bundle locally.
