# Hold actions and reachable sheets

`custom:ha-m3-action-bar` accepts one to four configurable actions. Use one
action for a full-width control, or four for quick access. No household IDs
are built into the module.

```yaml
type: custom:ha-m3-action-bar
language: en
mobile_floating: false
actions:
  - name: Open entrance
    icon: meeting_room
    activation: hold
    hold_duration: 1200
    confirmation: Open the entrance?
    action:
      action: perform-action
      perform_action: script.example_guarded_open
```

Hold with a finger, mouse, Space or Enter. Progress fills during the hold.
Release after the indicator is ready to submit once. A short tap, double
tap, release outside, scroll/pointer cancellation, Escape, blur, hidden tab,
disconnect or unavailable action cancels. Duration is 800-5000 ms, default
1200. Reaching the duration alone does not submit. Failed commands are
displayed without automatic retries. "Command sent" does not assert a
physical door position; the configured backend script owns that evidence.

Assistive activation without a physical hold opens an explicit confirmation
sheet. Existing `confirmation` actions remain supported. On phones the
sheet is at the bottom, with adjacent Cancel/Confirm buttons and safe-area
padding. M3 settings popovers use bottom sheets on narrow viewports and
anchored menus on desktop. Long content scrolls inside the sheet; action
buttons remain reachable. Native HA and other vendors' dialogs are not
globally restyled or intercepted.

The gesture is accidental-activation protection, not authorization. Keep
authentication and server-side action validation. A restart, lost connection
or error never queues an unlock for later.
