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

Hold with a finger, mouse, Space or Enter. A non-interactive status bubble
shows the action name, progress and release instruction outside the finger's
touch area. It uses the browser's top layer to escape clipped or transformed
cards, stays inside the viewport, and moves below controls near the top edge.
Reduced-motion mode shows progress in discrete steps. Scrolling or resizing
the viewport cancels the gesture and dismisses its feedback.
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

## Release delivery

From v0.15.1 stable releases have no attached assets. HACS reads the compiled
`dist` directory at the immutable release tag, including local fonts, theme
and controller templates. This avoids GitHub release-asset redirects whose
CSP header exceeds the HTTP parser limit in HACS 2.0.5. HACS installation,
version tracking and future updates remain native; no HACS patch or proxy is
required. Reproducible packages and checksum manifests remain available as
the release workflow's `verified-release` artifact. Source archives are
available from the Git tag as usual.
