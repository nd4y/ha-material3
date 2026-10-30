# Qualified room and outdoor measurements

> Область документа: переносимые формулы / прежняя схема адаптера. Актуальный Python-контроллер и отличия описаны в [блок-схемах](automation-flow.md) и [архитектуре](controller-architecture.md). Не применяйте прежнее ограничение притока при охлаждении к reconcile-контроллеру.

`thermal_environment(p)` selects the dedicated primary room measurement. A
secondary sensor is used to flag a configurable discrepancy and is never
silently averaged into the primary measurement. It becomes a fallback only
when explicitly enabled. Outdoor air is never a room fallback.

All bindings stay in the private adapter: primary, secondary and outdoor source,
measurement clocks, calibration, TTLs, fallback permission, confirmed airflow,
room target and tuning. The module contains no household entity identifiers.

Each source supplies numeric `value`, `age`, `ttl` and Boolean `available` and
`confirmed`. The adapter must reject cached startup values until an actual
post-start measurement is established. `last_reported` on its own proves neither
a new physical sample nor radio connectivity. Push-only integrations may use
entity-report age after establishing that post-start qualification; polling
integrations require a trustworthy measurement timestamp or a conservative
changed-measurement age. Unknown/malformed/future/stale sources do not become 0.
Conservative qualification can pause on a long unchanged reading; expose TTL
and source status rather than silently extending trust.

The output includes the active source, room value, per-source validity,
secondary difference/disagreement, outdoor quality and thermal opportunities.
The outdoor sensor must be on the outdoor side of the heater. Qualify it for
thermal decisions only when airflow confirms that a warm stopped duct is not
being mistaken for outdoor air. This is not a post-heater supply measurement.

When outdoor air is already at/above the desired room temperature, extra supply
heating is unhelpful; the adapter can lower the heater request to its configured
minimum, preserving explicit manual temperature and power permissions. Cold
outdoor air is a ventilation load, not a reason to increase ventilation for heat.
The room PI continues to temper the requested flow; the AC provides heat
assistance if the breather is insufficient. A disabled/unavailable breather
must not require a fictitious warm-up dwell.
With a configurable large room deficit and a qualified colder intake,
`strong_heating_demand` permits requesting assistance before the slowly ramped
heater reaches its maximum. It never bypasses the AC restart delay or manual
permissions. Smaller deficits retain the ordinary breather-first policy.

Useful outdoor cooling requires cooler-than-room and below-target margins.
`passive_window(p)` bounds a trial on existing permitted airflow: no new airflow
is started just to measure, no manual speed is overwritten, no physical maximum
is requested. Large error bypasses the trial. Cancel on invalid inputs, target
change or lost eligibility; re-evaluate after the finite deadline, then permit
normal AC cooling with its existing restart protection. Existing thermal cycles
are not stopped merely to try passive cooling. Never enable an AC operating mode
outside a verified manufacturer operating envelope; this policy supplies no
invented outdoor safety limits or promise of thermal effectiveness.

The helper `passive_cooling_wait` is an optional Boolean input to
`legacy_thermal`. It can defer a new cooling start; it cannot authorize heating,
override fault/data/master/manual guards, or bypass compressor protection.

The build executes 4,116 complete source partitions, 96 passive-window
transitions, boundary/malformed/restart/fallback/disagreement tests and the
composed thermal guard matrix. Existing thermal, PI, permissions, power,
device-health and frontend suites remain required. This is 100% of the declared
finite partitions, not a claim that all real-world firmware/thermal conditions
or arbitrary adapter modifications are covered.
