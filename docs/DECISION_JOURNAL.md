# Decision journal and calm layout

The HACS frontend has no device IDs, health account access or autonomous control loop. Bind cards to your private HA scripts and entities. Upgrading HACS preserves those bindings. Never edit the downloaded bundle or theme YAML.

Select `Material 3 Expressive - Ice` as the HA theme. Ice is a generated, reusable preset in `tokens/theme-presets.json`. Its Material primary role labels **HA Auto** (blue); tertiary labels **Device Auto** (mint). Text and icons distinguish ownership as well as color. A device's internal Auto remains a manual choice from HA's perspective.

If Dark Reader changes the intended colors, opt in to `appearance: {protect_colors: true}` on a card. This adds the documented page-level `darkreader-lock` meta tag for the current HA document; it does not change extension settings. Remove the option and reload to stop requesting color protection.

Use `layout: calm` on the climate card for a compact two-column target/profile layout. On narrow screens it stacks without hiding controls. Eight independent automation permissions live in the Automation popover; slider ownership opens its own permission switch. Moving a slider still uses the configured manual gateway. `automation_groups[].controls[].lock_action` can use that same gateway; otherwise only the configured input_boolean is toggled. Unknown permissions disable controls.

Maximum can open a small popover before activation:

```yaml
maximum:
  preset_id: maximum
  timer: timer.your_maximum
  active_entity: input_boolean.your_maximum_active
  return_entity: input_text.your_return_level
  duration_name: 15 minutes
  start_action:
    action: perform-action
    perform_action: script.your_maximum_gateway
    value_field: return_mode
  cancel_action:
    action: perform-action
    perform_action: script.your_finish_gateway
  return_options:
    - {name: Automatic, value: auto}
    - {name: Quiet, value: quiet}
```

Give each profile its `return_value`. The gateway must validate the return value server-side, start the timer only when inactive, and **never reset an existing deadline when editing the return**. Expiry and Finish use the same server return path. Cancel/Escape only dismiss the popover. Timers, manual precedence, retries and restarts belong to HA, not a browser countdown.

## Real server feed

```yaml
type: custom:ha-m3-journal-card
entity: sensor.climate_decisions
title: Automation journal
limit: 8
```

Optional `entries_attribute` changes the attribute key. Records are rendered in server order, with no fictional initial events. See `examples/decision-journal-template.yaml` for a bounded trigger-based sensor, whose state and attributes HA restores across restarts. Keep individual entries small. The example bounds JSON character count to stay below recorder attribute size limits, even for multibyte text. Use HA Logbook for longer retention, following your recorder retention policy.

Your controller emits a `ha_m3_decision` event with `stream: climate` and `record`:

```json
{"id":"unique-server-id","timestamp":"2026-10-20T10:00:00Z","title":"Airflow limited","status":"decision","source":"your_controller","reason":"The quiet ceiling is lower than the particle demand.","inputs":[{"name":"PM2.5","value":38}],"flow":[{"name":"Demand","value":7},{"name":"Ceiling","value":3},{"name":"Calculated","value":3}]}
```

Statuses: `decision`, `requested`, `confirmed`, `not_confirmed`, `blocked`, `observed`, `no_change`. Emit `requested` when submitting a command. Emit `confirmed` only after HA reports the expected state, and label it as HA confirmation. A service return or optimistic UI is not physical verification. Timeouts and integration failures must remain unconfirmed; the journal must not retry device commands. Deduplicate unchanged periodic plans but retain meaningful policy, permission, sensor-availability and command-result transitions. Do not copy tokens, raw health history, coordinates or application usage into records.

## Two automation policies

Keep the basic **Automatic** profile separate from **Fully automatic**. Basic Automatic uses air-quality demand and configured constant ceilings. Fully automatic may adapt ceilings from trusted, fresh presence, current sleep evidence, positive phone activity and quiet hours. It must not infer room absence from a phone being home, a camera in a shared hallway or lack of motion. Inactivity is not proof of sleep. Historical Fitbit/Health Connect sleep segments are not current sleep state.

Recommended precedence: explicit Off and per-parameter manual holds; unavailable devices and invalid readings; hardware bounds and compressor protection; confirmed, sustained air-quality demand; context-dependent soft noise ceilings; minimum changes and hysteresis. A sleeping occupant or conflicting sleep evidence uses quiet bounds. Confirmed absence can remove the soft noise limit without forcing maximum speed. Unknown context uses conservative day/night bounds. Escalation during sleep must have explicit configurable air-quality thresholds, persistence, a bounded speed and release hysteresis. It never releases a manual hold or exceeds a hard ceiling.

This is a finite fault model, not a guarantee of all physical scenarios. Test stale/missing/conflicting sensors, unavailable actuators, time changes, restart, command timeout, manual edits during execution and infeasible goals. Report unmet goals and degraded inputs instead of claiming success. Multiple occupants require an aggregate presence/sleep source; any sleeping or unknown relevant occupant should retain the stricter limit. Acoustic caps cannot guarantee measured dB before calibrated hardware is installed.

## Readable action records (v0.10.1)

The default view shows commands, blocked actions and observations. The latest calculation is separate, with its full inputs under details. `All records` also shows earlier plans. Reasons and outcomes are visible without expanding a row. Calculated demand is never presented as an executed action.

Supply structured metadata on request and result records:

```json
{"command_id":"server-generated-unique-command-id","trigger":"Air regulation","cause":"Particle demand increased; the quiet ceiling still applies.","action":{"device":"Air purifier","service":"fan.set_percentage","changes":[{"parameter":"Power","from":30,"to":40,"unit":"%"}]}}
```

Reuse a `command_id` only for stages of that exact command, including any blocked result. IDs must be unique across concurrent calls and restarts. The frontend folds these stages using the server's newest-first order; it never pairs records by title, source or time proximity. Legacy entries remain readable but stay separate. A newer pending status is not upgraded using an older confirmation. Structured values and diagnostics are bounded and rendered as escaped text. Source snapshots belong in `inputs`, the decision basis in `cause`, and the reported result in `reported`.

Capture `from` before submitting the command, and log the actual final payload after all clamps. A request is not proof of dispatch or success. Emit `confirmed` only when HA reports the expected state; an unconfirmed result remains explicit. An observation records external state and must not imply HA sent a command. Correlation and this card never cause retries or device commands.
