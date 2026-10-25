# Unified panel - implementation specification

Status: implementation in progress. Approved visual direction: compact Unified panel, Material 3 Expressive, Graphite Blue. This document defines the implementation and acceptance scope; it is not a statement that deployment or physical acceptance has completed.

## Result

All user-facing dashboard views use one compact visual language. Device name and operation status share a header row. Related controls form connected sections. The current value stays visible, the owner label is adjacent to the parameter name, and a round owner button stays beside its control. Mobile use is the primary layout; tablet and desktop retain useful columns and readable history.

The reference is the Unified panel mockup approved on 25 October 2026, including its compact headers and semantic operating colors. Reference dimensions are a starting point, not a screenshot overlay or fixed-height constraint.

## Scope and ownership

| Direction | Implementation scope | Acceptance evidence |
| --- | --- | --- |
| Common design system | Shared tokens, buttons, switches, sliders, sheets, dialogs, fonts, motion, theme export | Component matrix in light/dark and reduced motion |
| Climate and device controls | Quick controls, independent ownership, configured operation colors, room wishes and presets | Unit state matrix and actual-component browser cases |
| Screens and composition | Home, office, rooms, cameras, intercom, services and existing subviews | Preserved routes/actions and responsive view screenshots |
| Information surfaces | Sensor tiles, histories, journal, empty/error/stale/pending states | Data-state cases and reload/readback |
| Integration and release | Dashboard migration, native theme adoption, CI, release, HACS, rollback | Exact source SHA -> release assets -> installed version -> UI |

Reusable components and examples contain no installation-specific entity IDs. Private bindings remain in the installation dashboard. Existing external camera, call and 3D components retain their supported interfaces and use shared theme/layout where supported. No shadow-DOM selector patching or replacement of their streaming/call protocols is introduced to simulate visual consistency.

System administration pages use the shared HA theme. This work does not replace Home Assistant's administration frontend.

## Geometry and readability

- Card padding: normally 16 px; compact controls 10-12 px. Related rows use a 2 px gap and connected corners; device groups use 10-16 px gaps.
- Owner buttons: round 48 x 48 px targets. Other actions: at least 44 x 44 px effective touch area. Do not shrink touch areas to reduce scroll height.
- Main parameter labels: at least 14 px. Supporting labels and owner names: at least 12 px. Values use tabular figures and do not disappear while editing.
- Put device status opposite its title. Keep both readable at 320 px, allowing controlled wrapping when the actual content cannot fit. Do not truncate essential state text.
- Sliders retain an effective 48 px touch area with a compact visible track and a visible handle. Controls remain native keyboard targets.
- Remove duplicate headings and decorative empty space. Do not remove useful functions, measurements, histories or decision details merely to shorten the page.
- Do not reserve fixed empty card heights. Feedback and state updates must not unexpectedly move the active control or lose focus.
- Existing mobile dock keeps climate, cameras and guarded door opening within reach. Its safe-area spacing must not cover the last controls.

## Ownership interaction

Each configured power/temperature/speed permission remains independent. One button cycles `HA -> manual -> device -> HA` only when the parameter supports native device Auto. Parameters without native Auto cycle `HA -> manual -> HA`. A requested state takes one tap to advance; any state is reachable in at most two taps, without a menu.

Use `lock_open`, `lock`, and `devices` respectively, with a visible current owner label. Announce the current and next owner. A three-state control must not expose a misleading binary `aria-pressed` value.

Keep the existing configured action bindings and manual intent handling. Native Auto -> manual uses a valid displayed/manual value through the established action model. Off-device edits save intent without turning the device on. Pending/error handling prevents duplicate actions and retains retry behavior. An operation-status gap does not disable an otherwise valid control entity; the existing availability, bounds and permission guards remain authoritative.

## Semantic operating colors

Color describes operation, not ownership or a guessed physical temperature. Use a visible mode label and icon alongside color.

| Device/process | Evidence | Color and label |
| --- | --- | --- |
| AC cooling | Confirmed selected `cool` mode, or configured explicit operation source | Cool blue, Cooling |
| AC ventilation | Confirmed `fan_only` mode or explicit fan operation | Intermediate teal, Ventilation |
| AC heating | Confirmed selected `heat` mode or explicit heating operation | Warm amber, Heating |
| AC idle | If `hvac_action` is available, show the activity/idle detail separately | Do not describe an idle compressor as currently heating/cooling |
| Breather heater on | Explicit configured heater indicator or equivalent finite evidence | Warm amber, Heater on |
| Breather heater off | Explicit indicator reports its configured inactive state | Cool blue, Without heating |
| Breather airflow | Valid airflow configuration while the device is on | Intermediate teal |
| Purifier on | Confirmed on/cleaning state | Green, Cleaning |
| Purifier intense operation | Explicit configured boost/intense state | Stronger green, Intense cleaning |
| Device off | Confirmed off state | Neutral gray, Off |
| Operation unknown | Missing, unknown, unavailable or unrecognized evidence | Neutral gray and explicit No operation/heating data |

An AC mode label describes the selected mode unless actual activity is independently available. It does not prove compressor operation. Ballu breather `fan_only`, target temperature, built-in current temperature and outdoor temperature do not establish the heater state. Until an explicit source is available, show unknown heating rather than inventing blue/amber evidence. Unknown status and unknown control availability are separate states.

Implement configurable `operation` bindings: kind, entity, optional attribute, finite state map, and explicit heater indicator. Per-parameter airflow may override only the process color. Do not infer a process from an entity's localized name or from the numeric slider position.

Shared tokens: `--ha-m3-operation-{warm,cool,fan,clean,off,unknown}` and matching `-container` roles. Export both light and dark pairs. Owner buttons use stable primary/secondary identity independent of these operating colors.

## Existing behavior to preserve

- Room temperature continues to use the configured sensor 2 source. No reporting, calibration, ZHA or controller policy changes are part of this design work.
- Room wishes, temporary boosts, timers, presets, return mode and manual locks retain their current semantics and persistence.
- Door opening still requires the existing intentional hold. Progress remains outside the finger. Cancel, pointer leave, loss of visibility/focus, disconnect and error must not submit an opening action.
- Recorded opening/rejection sequences, microphone handling, camera memory cache/stale mark and auto-opening settings are preserved. No physical opening, voice call or microphone test is performed by UI tests.
- Preserve all view paths, action targets, entity bindings, visibility restrictions, saved values and access to details. Camera streams and 3D rendering are not recreated by the visual components.

## Test and acceptance contract

The finite test inventory is explicit. Every listed acceptance case must pass; this is not a claim of exhaustive coverage of every possible HA state or external integration.

1. Keep all existing frontend and controller gates. The existing 100 uniquely named climate scenarios and the controller suite remain in CI; do not weaken their assertions to accommodate a visual change.
2. Run an actual-component browser layout matrix: 320, 390, 768, 1024 and 1440 px; light/dark; normal/reduced motion - 20 cells. Cover every component family used by the dashboard, not only the quick card.
3. Test two/three-state ownership cycles, native Auto -> manual, independent power/temperature/speed, keyboard focus, pending/error and unavailable permissions.
4. Test the finite operation color map, unrecognized/missing sources, explicit heater evidence, off-state intent editing and independence from setpoint/owner.
5. Test data present/missing/stale/unavailable, camera placeholder/error/stale display, journal/history gaps and long localized labels. Do not equate old unchanged values with missing radio packets.
6. Test sheets/dialogs opening/closing, Escape and focus restoration; navigation and mobile dock reachability; intentional hold completion and all cancellation paths using intercepted/mocked actions.
7. Check effective target sizes, text readability/overflow, scroll reachability, active-control stability, contrast and reduced motion. Inspect representative screenshots after data/history hydration.
8. Installation acceptance uses a checkpoint, exact source SHA and built manifest, CI, released tag, HACS installed-version readback, asset hashes and actual HA rendering. Keep simulated, installed and physically verified states separate.

## Delivery and rollback

Use a feature branch and PR. Build and long tests run on build-01 or an established remote CI runner. If build-01 is freshly confirmed unavailable, document the reason before a bounded local exception and keep parallelism minimal. Do not disturb other jobs.

The user has a standing project-specific instruction to merge, release and install ordinary ha-material3 updates after successful checks. Preserve the before-state dashboard, resources, previous frontend assets and backend hashes. If release or UI acceptance fails, restore only the changed frontend/dashboard scope and re-read it. No HA restart or backend deployment is expected for this frontend change.

The release report must distinguish implemented code, passing tests, installed version, actual rendered behavior, and any remaining physical or external-component limitations.
