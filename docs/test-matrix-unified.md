# Unified panel acceptance matrix

This is the finite acceptance inventory for `unified-panel-spec.md`. A listed case is complete only when its actual test report passes. This inventory does not claim all possible Home Assistant states or all external integrations are covered.

## Gates and evidence

| Gate | Required evidence | Scope |
| --- | --- | --- |
| Existing frontend suite | `npm run test:frontend` | All existing tests retained, plus unified contracts |
| Existing controller suite | `npm run test:controller`, `controller-test-report.json` | Existing 100 unique named climate scenarios and all controller methods; no controller policy changes |
| Existing browser suites | CI reports for mobile, hold, history, sensor and journal | Existing guards, full hold cancellation matrix, histories and details |
| Unified browser suite | `node scripts/test-unified-browser.mjs <root> <tools>`; `unified-browser-report.json` | Shipped components loaded from built release assets, synthetic entities, intercepted services, local-only networking |
| Ice browser suite | Same command with `M3_UNIFIED_PRESET="Material 3 Expressive - Ice"` and `M3_UNIFIED_REPORT_PREFIX="unified-ice"`; `unified-ice-browser-report.json` | Same mandatory matrix against the existing exported Ice preset; independent artifact directory |
| Reproducible release | `npm run check`, committed distribution comparison, release manifest | Exact source/build consistency |
| Installation acceptance | Private checkpoint/readback and view inventory | Real HA rendering and unchanged actions, entities, routes and backend; independent from mocked tests |
| Physical acceptance | Explicit human verification | Not performed by browser tests; no door, call, microphone or climate device action |

Builds and full browser runs are coordinated by the parent agent on build-01 or remote CI. Editing and syntax checks are not a substitute for a passing browser report.

## Layout cells

All Cartesian combinations are mandatory: widths **320, 390, 768, 1024, 1440 px**, schemes **light/dark**, motion **expressive/reduced**. Total: **20 cells per preset**, **40 cells** across mandatory Graphite Blue and Ice runs.

`M3_UNIFIED_PRESET` selects an exact existing preset from `tokens/theme-presets.json`; omitting it selects Graphite Blue. Unknown names fail rather than silently testing a different palette. Each report records `selected_theme`. `M3_UNIFIED_REPORT_PREFIX` defaults to `unified` and permits only a lowercase ASCII filename prefix (1-48 characters, starting with a letter); it cannot redirect outputs outside the repository root. For Ice, `unified-ice` produces `unified-ice-browser-report.json` and `unified-ice-browser-artifacts/`, keeping success and failure evidence separate from the default run.

Every cell checks viewport overflow, essential text clipping, supporting/parameter typography, effective touch targets (48 px owner controls, at least 44 px other controls), actual component presence, independent owner count, grouped responsive columns and mobile dock bounds. The quick card's resolved primary role must equal the selected exported document theme role, so a fallback palette cannot silently pass the selected light/dark theme matrix. Screenshots are representative additional evidence, not replacements for numeric layout checks.

Actual fixture inventory: device-group, quick-device, climate, sensor, camera, standard-device, journal, history, action-bar, hold-button, slider, button, switch, connected-group, dialog. The fixture mounts production components; it does not reproduce mockup markup.

## Functional cases

| Case ID | Required behavior |
| --- | --- |
| `owner-two-state-independent` | One button cycles HA/manual; current and next accessible state; native keyboard focus; unrelated permissions unchanged |
| `owner-three-state-native-auto-exit` | HA/manual/device/HA cycle; native Auto cannot silently replace requested manual state; valid manual fallback |
| `owner-pending-error-unavailable` | Busy prevents duplicates; failure does not look confirmed; unknown/missing permissions fail closed |
| `owner-service-ack-awaits-observed-state` | Acknowledged service with delayed state retains its per-parameter pending guard, prevents duplicates and leaves other owners usable |
| `owner-timeout-explicit-retry-only` | Ten-second observation timeout never automatically repeats a service; explicit retry keeps the original target and clears on observed confirmation |
| `owner-unmount-clears-pending-no-repeat` | Unmount clears owner timers and guards without a new service; remount has no stale pending state |
| `off-device-edit-intent-keyboard` | Arrow-key edit saves manual intent while device remains off; visible edited value |
| `operating-color-state-matrix` | AC heat/cool/fan/off/unknown, selected mode vs activity, explicit heater on/off/unknown, airflow distinction, purifier on/off |
| `unknown-operation-not-control-availability` | Missing operation evidence stays gray but independently valid control remains usable |
| `sensor-values-and-gaps` | Zero preserved, unknown distinct, leak alarm visible, more-info stays read-only |
| `history-empty-error-popup-keyboard` | Empty and error states distinct, responsive history sheet, Escape/close |
| `journal-empty-unavailable` | Empty/unavailable journal remains explicit |
| `dialog-open-escape-close-focus` | Keyboard opening, Escape, close button, focus restoration |
| `native-switch-and-connected-keyboard` | Switch activation and connected selection work with keyboard |
| `hold-visible-outside-finger-cancel-no-command` | Progress outside 64 px finger radius; cancellation and taps emit no command |
| `dock-navigation-one-tap-mocked` | Camera destination accessible in one activation; only mocked target emitted |
| `network-and-runtime-isolation` | No external request or runtime error; all 20 cells completed |
| `camera-placeholder-unavailable-image-error` | Actual module placeholder, unavailable, failed image and recovery; more-info stays read-only |

Pure unified contract tests additionally exercise operation maps, unknown evidence, setpoint/activity distinction and repeated owner transitions from manual and native-Auto starting values. Existing 100 named climate cases remain a separate mandatory gate.

## External boundaries

The existing camera cache integration/card, native HA streaming/call controls, 3D view and system administration frontend retain their supported interfaces. This repository's module tests cannot prove their complete behavior, external stale mark or measured real camera latency. Private installation evidence must identify each checked view, actual rendered external card and any unverified interaction. No synthetic stale-label stub may be counted as testing the external camera cache.

Data freshness in these UI tests refers to configured displayed source metadata. Neither an unchanged sensor value, an entity timestamp nor `available=true` proves a newly received Zigbee report.
