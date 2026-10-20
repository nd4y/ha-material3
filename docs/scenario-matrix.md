# Controller scenario contract

The build tests execute the distributable Jinja macros, not a parallel JavaScript
implementation. A household adapter supplies entities, measured demand, device
steps, permissions, timestamps and limits. No household identifier belongs in a
macro or test fixture.

## Coverage boundary

"All scenarios" means all states and transitions in the explicit finite model
below. The air-goal suite enumerates every Boolean guard combination, all three
power states, expired/exactly-expiring/active deadlines and off/minimum/maximum
manual wishes: **6,912 combinations**. A second complete boundary matrix covers
four hardware ranges, seven wish partitions, five sensor partitions, five hard
caps, five noise caps and boost on/off: **7,000 combinations**. Additional tests
cover typed invalid inputs, state sequences and six deliberate fault mutations.

This is not proof of every possible physical failure, arbitrary vendor firmware,
acoustic comfort or eventual thermal performance. HA state confirmation does not
constitute an independent physical measurement. A passing build must not claim
those unmeasured properties or substitute a percentage of Python lines for
controller scenario coverage.

## Air-goal inputs and result

`controller/air-goals.jinja` exports `air_goal(p)`, producing JSON. The caller
imports that exact file as a Home Assistant custom template. The build imports
the same file through Jinja with strict undefined handling.

| Input | Contract |
| --- | --- |
| `enabled` | Master permits automatic decisions. False submits no normal command. |
| `global_off`, `global_maximum` | Global profile flags. If inconsistent, explicit Off wins. |
| `automatic` | Automatic baseline instead of the user's numeric wish. |
| `desired` | Numeric 0-100 wish; bounded to range. Manual zero means explicit Off. |
| `default_request`, `sensor_request` | Physical step requests calculated upstream. Automatic uses their maximum. A nonzero manual wish is a minimum, so measured need can increase it. |
| `hardware_max`, `hard_cap`, `noise_cap` | Physical nonzero maximum and resolved nonnegative caps. Critical pollution/sleep/presence handling belongs upstream; the macro never bypasses a supplied cap. |
| `boost_deadline`, `now` | Absolute seconds. Boost is active strictly before its positive deadline. |
| `boost_increment`, `boost_ceiling` | Additional physical steps and a ceiling strictly below hardware maximum. A boost never lowers an already higher baseline or sensor request. |
| `available`, `fault` | Separate communication availability and explicit device-error states. |
| `speed_allowed`, `power_allowed` | Independent automatic permissions. |
| `current_power` | Exactly `on`, `off` or `unknown`; unknown is not treated as off. |

All flags are actual Booleans, not strings. Step fields are finite integers.
Numeric wishes/timestamps must be finite. Missing, malformed and nonfinite
inputs fail closed with null request/target and no command. Clamping applies
only after type validation; unavailable/unknown values cannot silently become 0.

Results include the uncapped `requested` step, guarded `target`, `mode`,
`boost_active`, `limited`, `reason`, `can_set_speed`, `can_set_power` and their
combined `can_command`. The caller must check permissions and health again
immediately before each service call. A reason is explanation, never permission.

`requires_shutdown` and `notify` are safety-handler signals, not normal actuator
commands. An explicit fault always requests notification. Shutdown is requested
only when the device is available and not already confirmed off. A master toggle
or manual permission cannot turn a failed device back on. If the device cannot
be reached, shutdown cannot be claimed successful; the dashboard must retain
the unconfirmed outcome. Fault latching, notification deduplication and retry
rules belong to the health handler and its separate tests.

## Required scenarios

| Area | Required states / transitions | Expected invariant | Automated evidence |
| --- | --- | --- | --- |
| Baseline goals | Automatic, manual 0, fractional wish, 100, out-of-range numeric | Manual 0 is Off; valid positive wishes map upward to physical steps; measured need can raise a positive request | `test_air_goals.py` boundary matrix and automatic-floor tests |
| Three independent intentions | Temperature, fresh air, air cleaning | A boost/edit affects only its own channel; temperature edits preserve both boosts | Air-goal sequence tests plus frontend action tests |
| Per-channel boost | Start 10/15 min, replace deadline, cancel, run simultaneously | One absolute deadline per channel; own boost may temporarily operate from global Off; no physical-maximum requirement | Deadline and sequence tests; caller transition tests |
| Deadline | Before, equal to, after, invalid, restored after restart | Strict expiry boundary; expired overlay is ignored even if a timer event was missed | Air-goal deadline/restart test |
| Boost ceiling | Base below/at/above ceiling, 1-step device | Increase only within its own ceiling; never reduce an already higher request | Numeric matrix and explicit ceiling witnesses |
| Global profiles | Off, ordinary, Maximum, inconsistent flags | Off wins inconsistent state; Maximum supersedes overlay; global profile change cancels old overlays at caller | Profile matrix and caller transition tests |
| Master | Enabled, disabled, disabled with fault | Disabled sends no normal commands; safety notification remains required | Full Boolean matrix |
| Permissions | Both open, speed locked, power locked on/off/unknown, both locked | Never modify locked speed/power; locked-on device may change an allowed speed; speed lock does not prohibit an authorized explicit power-off | Full Boolean matrix and focused guard tests |
| Hard/noise limits | Zero, negative, tight, equal, above device range | No target exceeds resolved caps or hardware range, including Maximum and boost | Boundary matrix and cap mutation witnesses |
| Unavailable device | Online -> unavailable -> online | No normal command while unreachable; do not report successful shutdown; preserve intent for later reevaluation | Air-goal guard matrix and device-health tests |
| Explicit device error | On/off/unknown power; available/unavailable; repeated same/new error | Quarantine device, request shutdown when reachable, show actionable dashboard notification; no normal start while quarantined | Air-goal fault tests and device-health state-machine tests |
| Invalid input | Missing, wrong type, unknown, NaN/infinity, fractional physical step | No normal command; unknown is not coerced to zero or a valid health state | Invalid-input tests |
| Context | Awake, asleep, disagreement, absent, unknown; day/night; stale/off-body | Quiet conservative fallback for uncertainty/conflict; never assume absence or awake from missing data | Context regression tests imported into build |
| Pollution escalation | Normal, rising, critical-pending, critical-active, release-pending, recovered, missing | Respect persistence/release hysteresis; only configured critical policy adjusts soft noise caps; hard guards remain mandatory | Critical/demand regression tests imported into build |
| Temperature | Heat/cool/deadband, sensor missing, device fault, manual ownership, compressor pause, ordinary correction delay | Never simultaneous contradictory thermal decisions; manual ownership and compressor protections remain mandatory | Thermal/manual regression tests imported into build |
| Journal | Plan, submitted, confirmed, timed out, fault, inaccessible | Do not claim command or physical success from a plan; surface the limiting guard and unconfirmed failures | Journal model tests and actual HA adapter checks |
| Installation | Public release, HACS update, custom-template loading, restart/reload | The installed macro bytes equal the tested release; private configuration survives update | Release hash audit and installed-instance verification |

## Mutation witnesses

The suite deliberately changes the expiry comparison, removes each cap,
suppresses each of the two fault guards and relaxes the boost ceiling. Every
mutant must produce a different result on an independent named witness. These
checks show that safety assertions can detect the targeted regression; they are
not an exhaustive mutation score.

## Existing control dynamics

`legacy-policy.jinja` exports the existing context, air-demand and AC-cycle
formulas. Its regression tests cover 7,200 demand decisions, 324 original context
combinations, 432 worn/stale/conflicting Watch combinations, 576 thermal guard
combinations and 43 explicit thermal plan/adjustment branch witnesses, plus
freshness, noise, quiet-hour and native-offset boundaries.

Verified room absence takes priority over sleep and conflicting personal sleep
signals for the room's soft noise cap. A source must be available, fresh and
continuously absent for the configured dwell; unknown, stale or insufficient
presence evidence never proves absence. Boosts retain both the context limit
and the measured-noise cap before, at and after their deadline.

`control-dynamics.jinja` exports `critical_hysteresis(p)` and `supply_pi(p)`.
The first receives the three exact helper states (`on`, `off`, `unknown`), valid
source predicates and elapsed/configured dwell times. Tests enumerate all 3,456
Boolean/state/deadline combinations, including unknown helper behavior, and the
full activation/recovery transition sequence. The adapter retains ordered side
effects and reevaluates after resetting a pending timestamp; it must not apply a
single stale calculation across those effects.

The PI receives force/reset, measured/desired temperature, previous integral,
elapsed seconds and current supply target. Its 2,700-case regression compares
the original equations, anti-windup and rate limit against independent Python
equations. Optional tuning replaces generic defaults for gains, deadband,
integral bounds, supply range and rate limits. Invalid inputs/current targets
produce null commands. Existing source, manual ownership, turbo, power,
eligibility, opposing-cooling and inter-step guards remain mandatory before PI.
The PI result is arithmetic intent and does not itself authorize a service call.

## Integration gate

Public macros have no knowledge of sensors, clock sources or HA services.
Therefore their tests must run alongside the established demand/context,
critical hysteresis, power/manual, thermal and frontend tests during `check` and
release builds. The HA adapter must also be verified for absolute-deadline
storage, start/cancel/edit ordering, safety quarantine, template loading and
idempotent service dispatch. Real device faults should be tested with fixtures
or read-only template rendering; do not inject a physical failure or reset a
compressor merely to exercise a branch.
