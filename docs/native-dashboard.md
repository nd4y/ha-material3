# Native Home Assistant navigation with M3 cards

The recommended setup is an ordinary HA dashboard with Sections views and independent M3 cards. HA owns the top-level tabs, room subviews, back navigation, responsive layout and dashboard editor. The module supplies controls and a shared theme. There is no second navigation bar or application-sized card.

Install the module through HACS as described in the README. In a normal HA dashboard, add the Climate, Device or Camera card from the card picker, or copy [the native example](../examples/dashboard.yaml). Replace example entities and paths with your own. Do not add `custom:ha-m3-dashboard` when you want native navigation.

Each card keeps its own configuration. Give wider cards a full section width:

```yaml
type: custom:ha-m3-device-card
entity: fan.example
grid_options:
  columns: full
  rows: auto
```

Use the shared theme without an explicit per-card seed or forced scheme. Theme changes apply through inherited variables. HACS updates replace the module/theme files, while your dashboard, entities, helpers and automations stay in HA configuration. After updates, reload themes if needed and refresh clients. No separate installation path or second resource is required.

## Offline migration from the composite dashboard

The optional converter reads a JSON dashboard configuration, such as the result of the HA `lovelace/config` WebSocket command. It does not connect to HA, read credentials, execute scripts or operate devices. It writes a new JSON file for review; it never overwrites the input or an existing output file.

```sh
node scripts/native-dashboard.mjs --input old.json --output native.json --dashboard-path /your-dashboard
```

The converter replaces exactly one composite view with Home, Rooms, Cameras and one native subview per configured room. Existing card properties, advanced actions, preset conditions, timers and appearance overrides are preserved. Parent language/appearance become explicit card configuration. Unrelated views and inherited view visibility/theme settings are retained. Mixed layouts, duplicate paths, unsupported options and visibility attached to the old parent card are rejected for manual review rather than silently dropped.

Optional `--options options.json` accepts:

```json
{
  "labels": {"home": "Home", "rooms": "Rooms", "cameras": "Cameras"},
  "paths": {"home": "home", "rooms": "rooms", "cameras": "cameras"},
  "layout": {"main_columns": 4, "primary_span": 2, "secondary_span": 2,
    "rooms_columns": 3, "room_columns": 2, "camera_columns": 4, "camera_span": 2}
}
```

The dashboard path is an installation argument, not a hostname or household identifier in JavaScript. Layout values are editable in the generated HA configuration, including through the native editor. Room device cards retain their previous compact/expanded setting. Native buttons open the room subviews; native Back returns to Rooms. Material Symbols used by M3 cards are mapped to native MDI icons for those navigation buttons.

Back up the old configuration before applying the reviewed output using your usual HA configuration workflow. Restore that configuration to roll back; the HACS resource and climate automations do not need changing. Existing composite and standalone panel configurations remain supported, with [their example](../examples/composite-dashboard.yaml) retained.

References: [Sections](https://www.home-assistant.io/dashboards/sections/), [views and subviews](https://www.home-assistant.io/dashboards/views/#subview), [custom cards](https://contributors.home-assistant.io/frontend/custom-ui/custom-card/).
