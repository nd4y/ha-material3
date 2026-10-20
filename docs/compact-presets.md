# Compact ventilation presets

The calm climate layout can show circular icon buttons instead of wide preset labels:

```yaml
type: custom:ha-m3-climate-card
layout: calm
preset_style: icons
# Keep the remaining climate entities and actions from your configuration.
presets:
  - id: calm
    name: Quiet
    icon: eco
    action:
      action: perform-action
      perform_action: script.room_quiet
    active_when:
      - entity: input_select.room_profile
        value: Quiet
  - id: fresh
    name: Fresh air
    icon: air
    action:
      action: perform-action
      perform_action: script.room_fresh
    active_when:
      - entity: input_select.room_profile
        value: Fresh
```

Names, icons, IDs, state conditions and actions all come from the card configuration. Icons use the bundled Material Symbols listed in `src/icons.js`; no profile name or ID selects an icon. Omitting `preset_style` retains labeled buttons. Use `preset_style: text` explicitly for the same presentation.

Each circular visual is 40px inside a 48px button target. Buttons keep native keyboard activation, visible focus, an accessible name, a native title tooltip and the selected `aria-pressed` state. The selected profile name also remains visible beside the group. The six configured profiles fit in a short row on wide cards and wrap on narrow cards. Unavailable action targets and pending actions disable the controls.

The configured Maximum profile still uses the existing return-profile popover before starting. Icon rendering does not change backend actions, timers, return settings, room wishes or device permissions.
