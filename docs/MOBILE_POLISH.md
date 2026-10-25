# Mobile navigation and room overview

The native Lovelace views remain the navigation source. Add `swipe_navigation` to one M3 card in each participating view:

```yaml
swipe_navigation:
  paths:
    - /my-dashboard/home
    - /my-dashboard/climate
    - /my-dashboard/plan
```

Paths must belong to one dashboard. Swiping moves to an adjacent path without wrapping. It starts on a free area of the current `hui-view`; controls, charts, media, dialogs, vertical scrolling, multiple touches and the 24-pixel screen edges do not navigate. Tapping native tabs and browser Back remain available. No device service is called by navigation.

Set `presentation: drawer` on `custom:ha-m3-journal-card` to replace the persistent feed with a compact history launcher and a modal side drawer. The underlying server journal and its distinction between a request and a confirmed state are unchanged. Measurement charts retain their own expanded history view.

On `custom:ha-m3-climate-card`, `layout: summary` displays the room name, optional `navigation_action`, configured `room_metrics` and the existing `automation_reset` action. Use this on an overview; the full `layout: calm` card remains on the climate view. The shortcut calls the configured script. It does not fabricate a local rollback or change the controller's contracts.

```yaml
room_metrics:
  - id: pm25
    name: PM2.5
    entity: sensor.room_particles
    unit: "µg/m³"
    icon: blur_on
    freshness: {timestamp: last_reported, max_age: 3600}
    color:
      ranges:
        - {min: 0, max: 15, tone: good, label: Low particles}
        - {min: 15, max: 35, tone: notice, label: Elevated particles}
        - {min: 35, tone: high, label: High particles}
```

Ranges are dashboard settings, not an air-quality standard or medical assessment. PM2.5 is particulate concentration, not an aggregate AQI. A maximum bound is exclusive unless `max_inclusive: true`; a minimum is inclusive unless `min_inclusive: false`. Use a temperature target comparison with `color: {target_entity: input_number.room_target, tolerance: 1}`. Missing, stale or future-dated data have a neutral tone; HA timestamps do not establish radio connectivity. A display fallback is never promoted to a control source.

Device ownership and operating mode have separate visual channels. Parameter colors follow the configured operating evidence; the whole device surface shows whether all configured automation permissions are closed. Unknown permissions stay neutral. A selected HVAC mode alone does not imply active heating or cooling, and a breather's `fan_only` state does not establish that its heater is off. Icon motion respects reduced motion and pauses when the card is hidden.
