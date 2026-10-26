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

The trust shortcut is a 48px circular icon. Its primary color means the master is on and every configured manual permission is released. A warm icon indicates manual settings or disabled automation; neutral means insufficient state data. The accessible label and tooltip include the current status. Color changes follow HA state, never an optimistic click. Configure `automation_reset.lock_entities` with the complete set of boolean helpers that must be off, and optional `automation_reset.enabled_entities` with eligibility helpers that must be on, in addition to `entities.enabled`. Without explicit lock helpers, `automation_groups[].controls[].lock_entity` is used. An empty/missing permission set cannot report fully trusted. These fields observe helpers only; the original reset action remains unchanged.

Automation-owner, trust and preset buttons keep their quick tap action. Holding for 600 ms opens contextual help without sending a command; F1 or a context click opens the same help on desktop. Releasing a held button does not run its tap action. Moving more than 10px, scrolling, cancelling the pointer or leaving the control cancels the gesture. Closing help restores focus. Presets can supply a `description`; otherwise help explains the selection without inventing controller behavior. The guarded door hold remains a separate interaction.

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
