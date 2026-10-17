# Shared design without household hardcoding

`tokens/design-system.json` is the editable application design configuration. Google reference typography and shape values remain in `tokens/foundation.json`. `src/design-system.js` is the shared contract used by the runtime and the YAML generator.

The theme exports the same colors as `ha-m3-color-*` and `md-sys-color-*`, maps them to native HA variables, and exports typography/layout variables. Runtime cards reference these inherited variables, with generated defaults when the theme is absent. Changing an installed theme updates the owned components through CSS; no global DOM patching, shadow-root injection, hostnames, entity IDs or room selectors are used.

Example `my-design.json`:

```json
{
  "name": "My Material Home",
  "seed_color": "#006A6A",
  "neutral_palette": {"hue": 0, "chroma": 0, "variant_chroma": 2},
  "font_family": "Roboto, Arial, sans-serif",
  "shape": {"card": 28, "temperature": 20},
  "spacing": {"card": 24, "section": 24, "row": 16},
  "layout": {"max_width": 1440, "primary_ratio": 1.25},
  "temperature_surface": "surface-container-high"
}
```

Generate with `node scripts/theme.mjs --config my-design.json --output my-theme.yaml` after `npm ci`. There is no need to rebuild the frontend to use the generated theme. Settings are validated; the generator accepts JSON data, not JavaScript templates. The color seed feeds the same Material Color Utilities color algorithm in both dark and light modes.

`neutral_palette` controls surfaces independently of the accent seed. Use `null` (the default) for standard seed-derived Material neutrals, or an object with `hue` in `[0, 360)`, `chroma` in `[0, 200]`, and optional `variant_chroma` in `[0, 200]` (defaults to `chroma + 2`). Zero chroma makes the main neutral surfaces grayscale; the neutral variant still supplies outlines and secondary text. Light and dark roles are generated together. No RGB colors are embedded into component styles.

`tokens/theme-presets.json` defines additional bundled themes. The release combines them with the original **Material 3 Expressive** theme in the same `ha-material3-theme.yaml` asset, so existing includes continue working. **Material 3 Expressive - Graphite Blue** uses seed `#415F91` and neutral hue/chroma/variant chroma `0/0/2`. Choose that name in HA or set it as both light and dark system defaults. The original preset is retained for existing installations. Theme names must be unique.

Supported neutral temperature surfaces: `surface`, `surface-container-low`, `surface-container`, `surface-container-high`, `surface-container-highest`. Buttons and the main reading use semantic accent roles. Per-card explicit `appearance.seed_color` or a forced light/dark `appearance.scheme` opts out of inherited colors; omit them for a unified shell. Motion preference is independent.

The HACS release ships `ha-material3-theme.yaml`. Include it in HA configuration using the relative path in the README, reload themes, and select it. For a manually installed module use its actual installation path. The file path is installation configuration, not a household identifier baked into JavaScript.

Theme updates need `frontend.reload_themes` after HACS replaces the YAML. The generated YAML and shared JSON are source-controlled; do not edit the downloaded HACS YAML as your only copy, because updates replace it. Put custom settings in your own JSON and keep generated custom YAML in your own themes directory.

HA officially supports primary/accent/state color variables; other theme variables can change between HA releases. This release checks its mappings against the tested HA version. A companion theme unifies supported colors, fonts and surfaces, but cannot replace every native administrative layout or restyle every third-party card.
