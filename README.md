# Home Assistant Material 3 Expressive

Configurable Material 3 Expressive cards and theme for Home Assistant. Use native HA navigation and Sections layout with independent cards. Dark appearance is the fallback; the active companion theme is inherited by default. Version **0.5.0**, Apache-2.0. Independent project, not an official Google or Home Assistant product.

[Releases](https://github.com/nd4y/ha-material3/releases) · [Changelog](CHANGELOG.md) · [Issues](https://github.com/nd4y/ha-material3/issues)

## Included

- Native HA views, room subviews and Sections layout: [recommended setup](docs/native-dashboard.md), no nested application or second navigation bar.
- `custom:ha-m3-climate-card`: room temperature, helper target, control switch, configured ventilation presets and backend timer.
- `custom:ha-m3-device-card`: device state and supported controls; HA more-info and configured navigation actions preserve access to advanced features.
- `custom:ha-m3-camera-card`: native live camera when HA card helpers are available, otherwise a protected HA preview and more-info action.
- Optional YAML theme for the surrounding HA interface, generated from the same color roles.
- Optional `ha-m3-panel` / `custom:ha-m3-dashboard` composition with its own navigation, retained for existing installations. See [composite example](examples/composite-dashboard.yaml).
- Russian/English labels and localized numbers. Device, room and action names are configurable.

Entities, actions, rooms, camera, labels and preset conditions live in configuration. No credentials, cloud service, firmware patch or hardcoded household identifiers are required. Climate automation stays in HA. Ventilation actions do not write a room target.

## Manual installation

1. Extract the frontend release archive into `<config>/www/ha-material3/`. Keep the font/license files beside `ha-material3.js`.
2. Add `/local/ha-material3/ha-material3.js` as a Dashboard resource of type **JavaScript module**, then refresh the browser.
3. Add individual M3 cards to normal HA Sections views. Start with [examples/dashboard.yaml](examples/dashboard.yaml) and replace generic entity IDs and navigation paths.

The module, fonts and icons run from the HA host without a runtime CDN. For genuine `panel_custom` registration use [examples/panel-custom.yaml](examples/panel-custom.yaml). That registration needs an HA restart; both modes share the frontend implementation. Administrative HA screens remain native.

## Install and update with HACS

1. In HACS open the three-dot menu, **Custom repositories**.
2. Add `https://github.com/nd4y/ha-material3`, category **Dashboard**.
3. Open **Material 3 Expressive** and select **Download**. Keep the latest stable release selected.
4. In Dashboard resources ensure there is exactly one module resource: `/hacsfiles/ha-material3/ha-material3.js`. HACS may add it automatically with its own cache version query.
5. Refresh the browser, then add Climate, Device and Camera cards to an ordinary Sections dashboard. Use [examples/dashboard.yaml](examples/dashboard.yaml) or the native card picker.

HACS checks published GitHub releases for updates. Install the offered update in HACS or HA's Updates page, then refresh every open client. Existing dashboard YAML, entities, helpers and automation stay in your configuration. Automatic unattended updates are not enabled by this project.

When migrating from manual installation, remove the old `/local/ha-material3/ha-material3.js?...` resource after HACS has downloaded the module. Preserve the old files until the HACS path works. Do not load both resource paths. The default branch is hidden from HACS's version selector so unversioned development changes are not offered as releases.

GitHub releases include the raw JS, fonts/licenses and manifest as flat assets, as well as manual/source ZIPs. HACS 2.0.5 downloads release assets directly; ZIP files alone are not an installable Dashboard release. Do not upload only a bare JS without its fonts. `zip_release` is deliberately absent: HACS supports it for integrations, not Dashboard plugins. Inclusion in the default HACS catalog is a separate review process; custom-repository installation is supported here.

## One design for the HA shell and the module

The companion theme is part of the same HACS release: `ha-material3-theme.yaml` lives beside the JS and is updated by HACS. For a configuration without an existing `frontend` block, add:

```yaml
frontend:
  themes: !include www/community/ha-material3/ha-material3-theme.yaml
```

If you already merge a `themes/` directory, add `themes/ha-material3.yaml` containing `!include ../www/community/ha-material3/ha-material3-theme.yaml`. Preserve existing frontend settings. Run `frontend.reload_themes`, then choose **Material 3 Expressive** in your profile or set it with `frontend.set_theme`. After future HACS updates reload themes and refresh the browser.

The same HACS file also includes **Material 3 Expressive - Graphite Blue**, with neutral graphite surfaces and blue accents in dark mode, plus a matching light mode. Select this name for the neutral preset. Set both system defaults with the `frontend.set_theme` action and `mode: light` / `mode: dark` to use it throughout HA for users following the system theme. An explicit profile or dashboard-view theme takes precedence. The named preset remains available after HACS updates; do not modify the downloaded YAML.

Remove explicit `appearance.seed_color` and `appearance.scheme` from cards that should follow the shared theme. An explicit seed/scheme remains an intentional per-card override. Shared colors, fonts, typography, card shapes and spacing come from `tokens/design-system.json` and `tokens/foundation.json`, rather than household-specific CSS.

For a different brand without changing source code:

```sh
node scripts/theme.mjs --config my-design.json --output my-theme.yaml
```

The JSON can override `name`, `seed_color`, `neutral_palette`, `font_family`, `shape`, `spacing`, `layout` and `temperature_surface`; omitted fields retain defaults. Install the generated YAML as a normal HA theme. Native HA and the module inherit the same exported roles. See [shared theme configuration](docs/shared-theme.md).

The theme uses HA's theme mechanism. Native administrative layouts remain native; arbitrary third-party cards may require their own theme support. See [HA frontend themes](https://www.home-assistant.io/integrations/frontend/).

## Configuration

See [configuration reference](docs/configuration.md). Minimal climate card:

```yaml
type: custom:ha-m3-climate-card
config_version: 1
title: Office
appearance:
  motion: expressive
entities:
  room_temperature: sensor.office_temperature
  target_temperature: input_number.office_target
  enabled: input_boolean.office_climate
presets: []
```

The target uses the helper's actual min/max/step. Unavailable/malformed helpers disable writes. Presets reflect HA conditions/maximum state, not the last click. Actions support `perform-action`, `toggle`, `more-info` and internal HA navigation. JavaScript templates are not accepted.

Basic title/entity selection has a visual editor. Rooms, compositions and advanced actions currently use YAML.

For independent permission switches and a ventilation Off preset, see [temperature-control devices](docs/climate-permissions.md). Device permissions, future-device placeholders and preset actions are configured in YAML; the HA backend owns temperature policy and recovery.

For migration from an existing composite dashboard, see the [offline converter](docs/native-dashboard.md#offline-migration-from-the-composite-dashboard). It reads your configuration and preserves entities/actions rather than embedding household identifiers in source. The generated configuration uses native tabs and room Back navigation.

## Material 3 and motion

Reference: [m3.material.io](https://m3.material.io/), Google M3 token snapshot **34.0.21**, Expressive Web motion, color spec **2025**. See [component/state matrix](docs/component-states.md).

Owned buttons, groups, switches, slider and dialog use prefixed components. Spatial motion uses analytic springs with position/velocity continuity on retargeting. Colors/opacity use official non-overshooting Web effects curves. Selected Material Web field components have all registrations/templates/selectors namespaced to `ha-m3-md-*`; menu motion is adapted at build time to official Expressive Web curves. HA's components and registry are not patched.

System reduced-motion is honored. `appearance.motion: reduced` also suppresses owned spatial motion and menu animation. Recoloring browser extensions can alter appearance independently; the local audit lab opts out without changing browser preferences. This is not official Material certification or a numeric 99.9% guarantee for every HA screen.

## Build

Node.js 24 and Python 3:

```sh
npm ci
npm run check
python scripts/package.py
```

`npm run dev` serves fixture data at `127.0.0.1:8769`, never real devices. The lab includes normal/loading/error/unavailable/maximum/long-label states, dark/light, reduced motion and an axe audit button. Its code is excluded from the production bundle.

The icon subset/licenses are included in `assets/`. Only when changing icons, run `node scripts/fetch-assets.mjs` to regenerate the official subset. Normal builds do not download fonts.

## Compatibility and updates

Tested with HA **2026.9.4** and Edge. [Verification](docs/verification.md) states exact scope. Other browsers and Companion WebViews are not yet claimed as tested. Direct `panel_custom` API is implemented; live testing used the Lovelace adapter to avoid restarting HA.

Refresh clients after bundle updates: custom element definitions cannot be replaced in an already-running document. Preserve your dashboard/panel configuration. [Rollback/removal](docs/rollback.md) removes only the module's UI/resource, leaving helpers, scripts, automation and other dashboards intact.

## Publishing a version

Changes go through a branch and pull request. Run `npm version patch --no-git-tag-version`, update the changelog, then `npm run check` and commit the matching `dist/` and theme. After the PR is merged, tag that merged commit with the exact package version, for example `v0.1.2`, and push the tag. The release workflow checks that the tag is on the default branch, tests/rebuilds the module, rejects stale committed distribution files, packages archives and publishes a GitHub release with SHA-256 checksums. HACS then detects the new release. See [publishing details](docs/publishing.md).

[Third-party notices](THIRD_PARTY_NOTICES.md) and font/icon licenses are included. Public examples contain generic devices only.

## Quick sliders and persistent locks

See [quick control configuration](docs/QUICK_CONTROLS.md) for device metadata, native Auto modes and server-enforced manual locks. Available since v0.6.0.
