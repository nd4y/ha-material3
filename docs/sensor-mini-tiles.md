# Sensor mini-tiles

`custom:ha-m3-sensor-card` groups small, read-only sensor tiles by room. It uses the shared M3 theme and local assets. Rooms, entity IDs, names and metrics belong in dashboard configuration; the module contains no household bindings.

```yaml
type: custom:ha-m3-sensor-card
config_version: 1
title: Sensors
groups:
  - name: Living room
    tiles:
      - name: Air
        entity: sensor.living_room_temperature
        icon: thermostat
        battery: sensor.living_room_battery
        low_battery: 20
        metrics:
          - entity: sensor.living_room_temperature
            decimals: 1
          - entity: sensor.living_room_humidity
            decimals: 0
  - name: Bathroom
    tiles:
      - name: Under sink
        entity: binary_sensor.bathroom_leak
        kind: moisture
        battery: sensor.bathroom_leak_battery
```

`metrics` defaults to the primary entity. Each metric optionally accepts `name` and `decimals` (0-4); its unit is read from HA. `icon` uses a bundled symbol, defaulting to thermostat or water drop. `kind: moisture` is optional when HA reports the moisture device class. Only an explicit `off` means dry; `on` is a leak. Unknown, missing, partial and unavailable measurements have distinct text states. Battery warnings default to 20%, configurable per tile.

Tapping a tile opens native HA more-info for its primary entity. Battery and expanded metric links open their own more-info/history. Details show per-metric HA report times, explicitly without interpreting a report as current physical connectivity. No polling, inferred radio health or physical controls are introduced.

Use native HA sections/views for navigation, for example Overview and Office. Existing appliance/camera/detail views can remain subviews. Add a native weather-forecast card bound to your weather integration; forecast and physical outdoor measurements should remain labelled separately. HACS updates the module without overwriting dashboard bindings.
