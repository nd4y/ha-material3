# Changelog

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
