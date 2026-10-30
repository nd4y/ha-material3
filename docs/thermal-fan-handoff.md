# Delegated thermal control after power-on

> Область документа: переносимые формулы / прежняя схема адаптера. Актуальный Python-контроллер и отличия описаны в [блок-схемах](automation-flow.md) и [архитектуре](controller-architecture.md). Не применяйте прежнее ограничение притока при охлаждении к reconcile-контроллеру.

The `legacy_thermal` policy accepts an optional boolean `thermal_authorized`.
It defaults to false for compatibility. Pass true only after the adapter has
confirmed that temperature/mode control is delegated and the existing power,
health, source validity and master guards permit the operation.

When true, `fan_only` may transition to heating or cooling if the ordinary
temperature thresholds, heating-assistance dwell and restart delay allow it.
It does not force a start in the deadband, adopt dry/auto mode, bypass a manual
temperature restriction, or authorize switching on a manually disabled unit.

Power ownership and temperature/mode ownership are separate. A manual power-on
may select fan-only as a safe starting mode; it must not implicitly revoke a
temperature/mode permission. Keep the final command dispatcher guards enabled.

Bind household entities in the private HA adapter, never in this module. Both
calls that obtain `plan` and `adjustment` must use the same permission snapshot.
After upgrading through HACS, reload custom templates and verify a shadow
calculation before invoking the normal controller. A confirmed HA `heat` state
does not by itself prove that the physical unit has started producing heat.
