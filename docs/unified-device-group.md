# Unified device controls

`custom:ha-m3-device-group-card` combines existing quick device cards into one surface. Child power, target, speed, histories, permission guards and configured actions remain independent. The group itself never submits a service call.

```yaml
type: custom:ha-m3-device-group-card
config_version: 1
language: en
cards:
  - type: custom:ha-m3-quick-device-card
    entity: climate.example
    name: Air conditioner
    quick_controls: []
```

Place complete existing quick configurations under `cards`; this minimal example intentionally has no writable controls. The group supports 1-12 quick device cards, inherits language and appearance, and preserves explicit child overrides. It applies `grouped: true` to each child to avoid repeated outer card surfaces. A title is optional.

The group uses one column on phones and up to three columns when its actual container is at least 850 px wide. Groups of one or two devices use the full available width. HA Sections should give the group `grid_options: {columns: full, rows: auto}` and an appropriate section span. It does not impose a fixed content height.

Unknown operation status must remain distinct from unavailable controls. A missing heater indicator gives a neutral operation label, while an otherwise available and permitted target control remains usable. See [the implementation specification](unified-panel-spec.md) for the ownership and semantic color contracts.

## Operation evidence

Each child can opt into `operation: {kind: climate}`, `breather` or `purifier`.
Climate cards color the selected `heat`, `cool` or `fan_only` mode and show
`hvac_action` separately when provided. A selected mode does not prove physical
compressor or heater activity. Purifiers use `on` as cleaning. An explicit
`entity`, optional `attribute` and finite `states` map can bind other reported
values to `heat`, `cool`, `fan`, `fresh`, `clean`, `boost`, `off` or `idle`.
An unrecognized configured value stays unknown.

A breather requires a source that actually reports heater activity, for example:

```yaml
operation:
  kind: breather
  indicator:
    entity: binary_sensor.example_heater_active
    active_value: 'on'
    inactive_value: 'off'
```

Use this binding only when the source is verified to represent active heating.
A heater-installed flag, `fan_only`, a desired temperature or a coincident
measured temperature is insufficient. Omit the indicator when that evidence
is unavailable. A speed parameter can use `operation: airflow` to show confirmed
airflow separately from the unknown heater. Off and unavailable remain neutral
with explicit text. Colors can be overridden by `appearance.operation_colors`
using `dark` and `light` role maps; every foreground role has a matching
`<role>-container` background.
