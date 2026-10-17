# Home Assistant Material 3 Expressive

Configurable Material 3 Expressive panel and reusable cards for Home Assistant. Dark theme is the default; light and system appearance are supported. Version **0.1.1**, Apache-2.0. Independent project, not an official Google or Home Assistant product.

[Releases](https://github.com/nd4y/ha-material3/releases) · [Changelog](CHANGELOG.md) · [Issues](https://github.com/nd4y/ha-material3/issues)

## Included

- `ha-m3-panel`: standalone custom panel with home, rooms and cameras.
- `custom:ha-m3-dashboard`: integrated Lovelace panel view, without a second app bar or navigation rail. Desktop uses compact section navigation; mobile uses a bottom navigation bar. No HA restart.
- `custom:ha-m3-climate-card`: room temperature, helper target, control switch, configured ventilation presets and backend timer.
- `custom:ha-m3-device-card`: device state and supported controls; HA more-info and configured navigation actions preserve access to advanced features.
- `custom:ha-m3-camera-card`: native live camera when HA card helpers are available, otherwise a protected HA preview and more-info action.
- Optional YAML theme for the surrounding HA interface, generated from the same color roles.
- Russian/English labels and localized numbers. Device, room and action names are configurable.

Entities, actions, rooms, camera, labels and preset conditions live in configuration. No credentials, cloud service, firmware patch or hardcoded household identifiers are required. Climate automation stays in HA. Ventilation actions do not write a room target.

## Manual installation

1. Extract the frontend release archive into `<config>/www/ha-material3/`. Keep `assets/` beside `ha-material3.js`.
2. Add `/local/ha-material3/ha-material3.js` as a Dashboard resource of type **JavaScript module**, then refresh the browser.
3. Create a dashboard with a panel view and add `type: custom:ha-m3-dashboard`. Start with [examples/dashboard.yaml](examples/dashboard.yaml) and replace generic entity IDs.

The module, fonts and icons run from the HA host without a runtime CDN. For genuine `panel_custom` registration use [examples/panel-custom.yaml](examples/panel-custom.yaml). That registration needs an HA restart; both modes share the frontend implementation. Administrative HA screens remain native.

## Install and update with HACS

1. In HACS open the three-dot menu, **Custom repositories**.
2. Add `https://github.com/nd4y/ha-material3`, category **Dashboard**.
3. Open **Material 3 Expressive** and select **Download**. Keep the latest stable release selected.
4. In Dashboard resources ensure there is exactly one module resource: `/hacsfiles/ha-material3/ha-material3.js`. HACS may add it automatically with its own cache version query.
5. Refresh the browser and use [examples/dashboard.yaml](examples/dashboard.yaml).

HACS checks published GitHub releases for updates. Install the offered update in HACS or HA's Updates page, then refresh every open client. Existing dashboard YAML, entities, helpers and automation stay in your configuration. Automatic unattended updates are not enabled by this project.

When migrating from manual installation, remove the old `/local/ha-material3/ha-material3.js?...` resource after HACS has downloaded the module. Preserve the old files until the HACS path works. Do not load both resource paths. The default branch is hidden from HACS's version selector so unversioned development changes are not offered as releases.

The repository uses the complete `dist/` tree, including local fonts/licenses. Do not upload only a bare JS release asset without the matching assets. `zip_release` is deliberately absent: HACS supports it for integrations, not Dashboard plugins. Inclusion in the default HACS catalog is a separate review process; custom-repository installation is supported here.

The optional companion theme is `themes/ha-material3.yaml`. Install it separately through `frontend.themes` and select **Material 3 Expressive**. It is not required for the cards and does not replace administrative layouts. See [HACS plugin requirements](https://www.hacs.xyz/docs/publish/plugin/) and [theme requirements](https://www.hacs.xyz/docs/publish/theme/).

## Configuration

See [configuration reference](docs/configuration.md). Minimal climate card:

```yaml
type: custom:ha-m3-climate-card
config_version: 1
title: Office
appearance:
  scheme: dark
  seed_color: "#6750A4"
  motion: expressive
entities:
  room_temperature: sensor.office_temperature
  target_temperature: input_number.office_target
  enabled: input_boolean.office_climate
presets: []
```

The target uses the helper's actual min/max/step. Unavailable/malformed helpers disable writes. Presets reflect HA conditions/maximum state, not the last click. Actions support `perform-action`, `toggle`, `more-info` and internal HA navigation. JavaScript templates are not accepted.

Basic title/entity selection has a visual editor. Rooms, compositions and advanced actions currently use YAML.

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
