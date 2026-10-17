# Verification of 0.1.0

Checked 2026-10-17. This report describes observed results, not Google certification or a numerical pixel-equivalence guarantee.

## Build and portability

- Node.js 24.18.0; dependencies pinned by `package-lock.json`.
- `npm run check`: 11 passing adapter/motion tests, followed by production build and release audit.
- The source release was extracted into a separate directory. `npm ci --offline --ignore-scripts --no-audit --no-fund` and `npm run check` succeeded there. The rebuilt JavaScript SHA-256 matched the original: `7056e1bd1c20dd9ba01e777236533beb4849c8440d6ed26482a66c8d03d7df3d`.
- Release audit: 9 payload files, all hashes verified; 60 typography checks and 10 shape checks passed. The source manifest prevents packaging a stale build after source changes.
- Public payload/source contain generic examples, local font/icon files and licenses. Household configuration, camera frames, credentials, deployment helpers and diagnostic screenshots are outside the distributable project.
- No runtime CDN, direct cloud API, credentials or independent WebSocket connection is required. The frontend receives the existing authenticated `hass` object.
- Re-importing the module under a second cache URL did not repeat custom-element/card registrations. Selected upstream field components use the `ha-m3-md-*` namespace.

## Behavioral tests

Adapter tests cover helper availability, numeric bounds/step, confirmed preset predicates and maximum precedence, a backend countdown, configured ventilation actions without target writes, command suppression for unavailable entities, and invalid configuration/version/action paths.

Motion tests cover spatial overshoot, non-overshooting effects, settling, retarget continuity of position and velocity, elapsed-time independence, and reduced-motion snapping without scheduled animation frames. These tests validate the solver and adapter; they do not simulate physical HVAC response.

## Browser checks

Edge desktop and compact layouts at 390 and 320 CSS pixels were checked using the fixture lab. No horizontal clipping was found for the tested controls, including long labels. The compact navigation bar remains reachable while content scrolls.

The lab exercised normal, maximum, pending, failed-command and unavailable states; dark/light appearance; reduced motion; keyboard slider/menu operation; native modal Escape/focus behavior; preset selection semantics and retry. Pending prevents duplicate commands, failed commands retain confirmed values, and focus returns after a pending control re-enables.

axe-core 4.14.0 reported **0 violations and 24 passing rules** for the tested main-page normal/error/unavailable/light fixtures. `color-contrast` retained incomplete cases, so this is not a complete WCAG conformance claim. The token-pair color audit checked 60 pairs across violet/teal/blue light and dark schemes, with a lowest tested text contrast of 4.939:1. Native HA dialogs, external cards, extensions and every possible household configuration are outside that audit.

System reduced-motion and the explicit reduced setting were checked in the owned components. Dropdowns use the quick path in explicit reduced mode; inherited CSS suppresses their transitions. See [the component/state contract](component-states.md) for numeric motion values and the distinction between physical springs and official Web curve fallbacks.

## Installed Home Assistant

The module was installed as a separate storage dashboard using `custom:ha-m3-dashboard` on **Home Assistant 2026.9.4**, without restarting HA. This exercises the Lovelace adapter for the standalone interface. The `panel_custom` registration is implemented and documented but was not live-tested with a restart.

Live checks confirmed:

- Dashboard API readback and saved storage matched the intended configuration.
- All 9 asset URLs returned HTTP 200 with matching SHA-256; WOFF2 resources were served as `font/woff2`.
- Existing dashboards, resources and system/user dashboard preferences were preserved.
- The configured temperature target, climate-control enable state, maximum-mode flag and backend timer remained unchanged by installation and UI checks.
- Real camera rendering, device dialogs, navigation by room, the correct automatic-purifier summary and transition from the module dialog to HA's full native more-info dialog worked.

Physical control commands were exercised against the fixture adapter, not resent to the real equipment during this UI deployment. Backend climate logic and automation were not modified. A new 15-minute physical ventilation cycle, thermal performance, and device/network recovery were not retested as part of this frontend release.

## Remaining scope

- Companion app WebViews and browsers other than Edge have not been tested.
- GitHub publication, the configured GitHub Actions workflow, HACS download/update installation and default-catalog acceptance have not run. The source and manual-install archives are ready for publication.
- A protected checkpoint and a guarded site-specific rollback script were prepared. Destructive rollback/removal was not executed against the installed dashboard; generic instructions are in [rollback.md](rollback.md).
- The visual editor covers basic titles/entities. Advanced compositions, predicates, rooms and actions currently use YAML.
- HA's administrative screens and native more-info dialogs retain HA's own layout. The optional companion theme changes supported color/font variables only.

Private screenshots and installation evidence are deliberately not shipped in the public release.
