# Configuration v1

All cards accept `config_version: 1`, optional `language: ru|en` and:

```yaml
appearance:
  scheme: auto # omit or auto to inherit the shared theme; dark/light force an override
  # seed_color: "#6750A4" # optional explicit per-card color override
  motion: expressive # expressive | reduced
```

The default uses shared companion-theme variables when present, with generated dark/light defaults otherwise. See [shared-theme.md](shared-theme.md) for JSON-configurable colors, typography, font, shape and spacing. Room/entity names are separate configuration data.

## Native dashboard (recommended)

Use independent `custom:ha-m3-climate-card`, `custom:ha-m3-device-card` and `custom:ha-m3-camera-card` cards in HA Sections views. HA owns tabs, room subviews, back navigation and layout. Card configuration below applies unchanged, without a wrapping `kind` key. See [native setup and migration](native-dashboard.md) and [example](../examples/dashboard.yaml).

## Optional composite panel/dashboard

`title` names the panel. `home` contains `title`, optional `subtitle`, and `cards`. `rooms` is an array of `{id, name, icon, description, cards}`. Optional `cameras` contains camera configs. `links` and `header_actions` are arrays of `{name, icon, action}`. The surrounding HA shell remains native. `custom:ha-m3-dashboard` integrates with that shell: no duplicate app bar or second sidebar, only compact section navigation on desktop and bottom navigation on mobile. Direct `ha-m3-panel` retains its standalone app bar and rail.

Within a panel, cards have `kind: climate|device|camera`. Standalone types are `custom:ha-m3-climate-card`, `custom:ha-m3-device-card`, `custom:ha-m3-camera-card`. Parent appearance/language are inherited unless overridden.

## Climate

Required `entities.room_temperature` is a numeric sensor; `entities.target_temperature` an input_number helper; `entities.enabled` an input_boolean helper. The module creates no helpers or automation.

`presets`: array of `{id, name, icon, action, active_when}`. Each `active_when` is a nonempty list of AND conditions, with `entity`, optional `attribute` and either `value` or `not_value`. Missing/unknown/unavailable entities cannot match. Comparison normalizes values to strings.

```yaml
active_when:
  - entity: climate.office_breather
    not_value: off
  - entity: climate.office_breather
    attribute: fan_mode
    value: "3"
  - entity: fan.office_purifier
    attribute: preset_mode
    value: auto
```

Optional `maximum`: `preset_id`, `active_entity`, `timer`, `cancel_action`. Active `on` takes precedence. Countdown reads HA timer finishes_at/remaining. Browser timer expiry never sends a command: returning to everyday mode belongs to an HA automation/script.

`details`: array of `{name, entity, attribute?}`. `details_title`, `description`, `control_name`, `presets_name`, `presets_description` customize text. Values are escaped text, not HTML/templates.

## Device

Required `entity`; optional `name`, `icon`, `expanded`, `actions`. Compact rows open an M3 dialog. Basic controls derive from attributes for climate, fan, humidifier, water_heater, light, switch, input_boolean, number/input_number and select/input_select. Advanced functions remain accessible through HA more-info or configured navigation to a dedicated device page. No brand-specific service is assumed.

`secondary`: array of `{entity?, attribute?, prefix?, suffix?, when?}`; `when` uses the same conditions as presets. Show a saved manual purifier level only in manual mode, for example. Off/unavailable takes precedence over secondary attributes.

Bundled Material Symbols names are listed in `src/components.js`; unknown icons fall back to devices. Extend the allowlist and regenerate the font subset when adding icons.

## Camera

Required `entity`, optional `name`. Native HA picture-entity is retained across state updates when helpers exist. Otherwise the HA-provided entity picture is a preview, refreshed while mounted and the document is visible. Runtime stream/image credentials come from HA and are not put into config. More-info opens the standard full camera view.

## Actions

```yaml
action:
  action: perform-action
  perform_action: script.turn_on
  target:
    entity_id: script.office_everyday
  data: {}
```

Also supported: `{action: toggle, entity: switch.example}`, `{action: more-info, entity: fan.example}`, `{action: navigate, navigation_path: /home-control/example}`. Navigation must start with a single slash. No eval, arbitrary JavaScript or external navigation action.
