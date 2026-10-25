## 0.16.0 - 2026-10-25

- Connect device controls in one compact responsive panel, keeping each device action, parameter and automation owner independent.
- Replace the three owner buttons with one labeled circular control that cycles through supported HA, Manual and Device modes. Keep the current owner visible and announce the next action.
- Apply shared compact surfaces and operation colors across light and dark themes, with explicit unknown and off states. Breather heating requires a configured evidence source.
- Keep phone touch areas, keyboard access, histories, dialogs and protected hold actions; verify mobile, tablet and desktop layouts with reduced motion and mocked services.

## 0.15.3 - 2026-10-24

- Distinguish HA automation, held manual values and device automation with labeled icons; use a lock for the manual setting.
- Give each owner a consistent touch target, an explicit selected outline and a description of who controls the parameter.
- Preserve direct one-tap selection, parameter independence and native HACS updates.

## 0.15.2 - 2026-10-24

- Move hold progress and release guidance into a theme-aware status bubble outside the finger's touch area, including compact mobile docks.
- Keep feedback in the browser top layer and within viewport edges; preserve release-to-confirm, cancellation and native HACS updates.
- Add touch, clipping, viewport, progress and reduced-motion browser regressions with mocked services.

## 0.14.0

- Direct per-parameter HA Auto, Manual and Device Auto buttons replace ownership popups.
- Configurable quick-access card with mobile dock and explicit action confirmation.
- Compact mobile intentions and expandable histories preserve all controls.
- Bounded last-temperature display stays distinct from qualified control input.
- Exactly 100 named climate acceptance scenarios and new mobile browser checks run in CI.
# Changelog

## 0.13.1 - 2026-10-22
- Expose strong heating demand when a qualified cold intake and a large room deficit require AC assistance before the supply target has finished ramping. Preserve compressor and manual protections.
- Explain breather-first heating waits instead of reporting an out-of-deadband room as within tolerance; add demand-boundary and restart-delay tests.

## 0.13.0 - 2026-10-22
- Add qualified primary/secondary/outdoor thermal inputs, explicit fallback, discrepancy diagnostics and bounded passive-cooling decisions. Keep source bindings and measurement clocks in the HA adapter.
- Test all 4,116 declared source partitions, 96 passive-window transitions and composed thermal safety guards in every build; preserve existing control and HACS behavior.

## 0.12.2 - 2026-10-22
- Allow a delegated thermal controller to leave fan-only mode after a power-only manual action. Temperature/mode permission remains separate from power permission; existing adapters retain their previous behavior unless they explicitly opt in.
- Add a 384-case fan-only handoff regression matrix covering master/data/fault guards, heating assistance and restart delay, plus manual-mode and malformed-permission checks.

## 0.12.1 - 2026-10-22
- Wrap long climate context sensor labels instead of overflowing narrow screens. Add 320/390/480px browser regressions with long configured labels.

## 0.12.0 - 2026-10-22
- Add configurable, theme-aware sensor mini-tiles grouped by room with native more-info and per-metric report details.
- Distinguish leak, dry, unavailable, unknown, partial data and low battery; avoid inferring connectivity from an old sensor report.
- Preserve native HA views and HACS updates; keep weather providers and household entity bindings in dashboard configuration.
- Add sensor-state regression and desktop/mobile browser checks.

## 0.10.1 - 2026-10-20
- Make automation actions readable without expanding records: show before/after values, decision basis and explicit HA result.
- Fold command stages only by an explicit server correlation ID; preserve uncertainty, legacy compatibility and open detail state during updates.
- Separate latest calculation from action history; retain full technical details and configurable native history navigation.
## 0.10.0 - 2026-10-20
- Add opt-in user preference semantics: persistent qualitative freshness, cleaning and quietness inputs stay independent of device telemetry, profiles and automation mode.
- Adjust automatic demand relative to its baseline and sensor need, with a separate configurable quietness budget. Neutral wishes preserve the existing plan; no preference maps to a motor percentage or implies power-off.
- Add configurable compact circular preset icons with accessible labels, selected-mode text and the existing Maximum return menu.
- Preserve legacy air-goal configurations, manual permissions, fault isolation and independent boost deadlines; test the shared production preference policy in every build.

## 0.9.1 - 2026-10-20
- Display a configured computed wish in Auto HA while preserving the independent stored manual wish. Show missing computed data explicitly and keep manual editing available.
- Gate starting a temporary boost with a separate binary availability source. Active boosts remain cancellable when starting becomes unavailable.
- Add regression matrices for computed wish values, missing data and independent boost start/cancel permissions.

## 0.9.0 - 2026-10-20
- Add optional room fresh-air and cleaning wishes alongside temperature, independent Auto HA baseline switches and configurable 10/15-minute per-channel boosts. Preserve native navigation and shared themes.
- Read server deadlines, keep independent optimistic drafts, allow cancellation when a device is offline, and show explicit error/recovery notices without claiming an unconfirmed shutdown.
- Distribute reusable Jinja policies for intent transitions, goal arbitration, device health, last-moment command guards, context, thermal control and hysteresis. Household bindings remain private configuration.
- Run exhaustive finite scenario matrices and existing regression cases before every build and release; publish the tested policy files with the HACS-managed assets. Document the boundary between software verification and physical behavior.

## 0.5.0 - 2026-10-18
- Add configurable actuator-permission switches to climate cards, independent of the main thermostat switch. Controls write only the configured input_boolean flags; the HA backend decides how permitted devices maintain temperature.
- Support explicitly disabled future devices without a connected entity, unavailable-state handling and pending feedback. Keep labels, icons, descriptions and permission entities in dashboard configuration.
- Document a state-derived ventilation Off preset using the existing configurable preset actions. Add regression checks for permission routing, invalid/direct device bindings, unavailable controls and Off detection.

## 0.4.0 - 2026-10-18
- Bundle a Graphite Blue companion theme with neutral surfaces and blue accents in both dark and light modes. Preserve the original theme and the existing HACS include path.
- Add validated, optional neutral-palette configuration independent of the source accent. Generate native HA and component roles through the same color implementation, with no household-specific CSS.
- Verify the selected graphite surface values, readable contrast in both modes, custom neutral settings and invalid input handling. Document system defaults, profile/view overrides and update-safe customization.

## 0.3.0 - 2026-10-17
- Recommend independent cards in native HA Sections views, with native tabs and room subviews. Retain the optional composite dashboard and standalone panel for compatibility.
- Add an offline, configurable migration tool that preserves cards, actions, helper references, timer conditions and unrelated views. Reject ambiguous migrations rather than silently losing settings.
- Ship a native dashboard example and installation/migration documentation with the same HACS resource and shared theme.
- Make base component text inherit the shared font setting, including nested buttons, switches and dialogs. Live browser verification found the older font declaration still overriding the shared setting in 0.2.0.

## 0.2.0 - 2026-10-17

- Keep card height and target width stable while commands are pending and values switch between whole/fractional numbers. Restore focus without scrolling.
- Share semantic color, font, typography, shape and spacing tokens between the HA companion theme and module. Follow the shared theme by default; retain explicit per-card appearance overrides.
- Ship the generated companion theme as a HACS asset and provide a JSON-based theme generator. Use neutral temperature surfaces with accent readings/controls instead of a large fixed accent block.

## 0.1.3 - 2026-10-17

- Publish the raw JS, font/license files and manifest as flat GitHub Release assets. HACS 2.0.5 downloads these directly; manual ZIP archives alone are not an installable Dashboard release.
- Resolve local font files beside the module so HACS preserves the complete runtime layout. Keep manual/source ZIPs and checksums for all release files.

## 0.1.2 - 2026-10-17

- Make manifest asset ordering deterministic across Windows and Linux. The v0.1.1 release check correctly rejected a different filesystem ordering before any release was published; its tag is retained rather than moved.

## 0.1.1 - 2026-10-17

- Integrate the Lovelace dashboard into HA's existing shell: remove the duplicate app bar and second navigation rail. Keep compact section navigation and responsive mobile navigation.
- Add public-repository HACS installation/migration instructions and stable version selection.
- Add a tag-based release workflow that verifies the merged source, committed distribution and package version before publishing archives and checksums.

## 0.1.0 - 2026-10-17

- Initial configurable Material 3 Expressive panel, climate/device/camera cards and basic visual editor.
- Local font/icon assets, namespaced components, spring motion, reduced motion, keyboard controls and pending/error/unavailable states.
- HA-owned automation/timer state, generic examples, manual installation and rollback documentation.
# 0.8.0

- Add the generated Ice theme for the HA shell and individual cards; HA Auto and Device Auto use distinct semantic colors and text.
- Add a compact calm climate layout, independent automation switches in popovers, physical power switches and visible ownership per slider.
- Add a configurable Maximum return menu whose gateway preserves an active timer deadline.
- Add a server-backed decision journal card and a bounded, restorable HA template example. Commands and HA-reported confirmations remain distinct.
- Keep device IDs, policy thresholds, sleep/presence sources and control logic in private HA configuration. Existing layouts and HACS upgrades remain compatible.

# 0.11.0

- Add optional Recorder-backed smooth mini histories for room metrics, preferences and device settings, with cached batched reads, gaps and cross-series hover details.
- Add configurable inverted preferences for a noise allowance slider without changing existing quietness backend semantics.
- Support secondary PM1 in expanded air-quality history while keeping PM2.5 primary on the dashboard.

