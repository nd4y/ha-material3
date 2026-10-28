# Climate UI control acceptance

`scripts/test-control-audit-browser.mjs` runs the shipped bundle against a synthetic copy of the installed climate control topology. Device account identifiers are aliased. Service calls are recorded, never forwarded to Home Assistant; state confirmation is injected separately from service acknowledgement.

| Controls | Browser checks |
| --- | --- |
| 11 auxiliary switches | Both directions, exact entity/service, pending until readback, unavailable state |
| Melody and brightness selectors | Every configured option and confirmed readback |
| 2 filter reset buttons | Confirmation, cancel without a command, exactly one confirmed request |
| 10 parameter permissions | Both directions, inverse lock semantics, exact script payload, pending/readback |
| Master and 3 device participation switches | Both directions and exact helper confirmation |
| Trust all automation | Partial state, distinct icon, exact action, confirmation of the whole configured scope |
| 4 device ownership buttons | Auto/manual requests, request identity, saved settings and completed receipt |
| 6 device scales | Every selectable value, Off/Auto endpoints, release-only preview and cancelled drag |
| Room temperature and 3 preferences | Range endpoints, exact payload including inverted noise preference, readback and failure |
| 2 boosts | Every duration and explicit cancellation |
| 5 presets and maximum mode | Exact preset action and every return-mode option |
| 4 stop/recovery pairs | Runtime guards, explicit stop, matching observation and recovery receipt |
| History and metrics | Drawer/filter/close, four metric detail actions, no service calls |
| Reconnection/failure | Menu and room-request deadlines survive detach/reconnect; no automatic retry |
| Layout | Mobile/desktop overflow, inline metrics, compact target, ownership surface colors |

The existing motion, mobile, unified, history and journal browser suites cover animations, focus, long press, reduced motion, alternate themes and receipt edge cases. The new audit is part of CI. `M3_AUDIT_CASES` optionally selects a regular expression for a focused local rerun; CI runs the full inventory.

This proves UI command mapping and simulated readback behavior. It does not prove radio delivery, physical heating/cooling, filter replacement or the sensation of phone haptics. Installed UI acceptance must additionally verify the release manifest, loaded assets, actual desktop/phone rendering and preservation of device request IDs during read-only navigation.
