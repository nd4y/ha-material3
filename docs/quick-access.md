# Direct controls and responsive quick access

The quick device card exposes one circular owner button beside every configured
parameter. It cycles **HA Auto -> Manual -> Device Auto -> HA Auto** when an
`auto` action is configured, or **HA Auto -> Manual -> HA Auto** otherwise.
The current owner remains visible as text; the button announces the next owner.
An unavailable permission is labelled explicitly. After an action, its parameter
waits for observed HA state rather than treating a service acknowledgment as
confirmation. A bounded timeout offers an explicit retry.
Permission actions remain independent per parameter. Device Auto uses the existing configured
server action, which must save manual intent and acquire that parameter's lock
atomically. HA Auto releases the permission and lets the next controller cycle
decide; it does not force native Auto.

Selecting Manual while Device Auto is active applies the manual step displayed
by the slider. If the device does not expose an actual manual speed in Auto,
this is the first supported manual step. Dragging the slider always submits
the chosen value through the configured manual action. Power and temperature
permissions are unaffected by a speed edit.

## Quick access card

```yaml
type: custom:ha-m3-action-bar
language: en
mobile_floating: true
actions:
  - name: Home
    icon: home
    action:
      action: navigate
      navigation_path: /your-dashboard/home
  - name: Climate
    icon: thermostat
    action:
      action: navigate
      navigation_path: /your-dashboard/room
  - name: Cameras
    icon: videocam
    action:
      action: navigate
      navigation_path: /your-dashboard/cameras
  - name: Door
    icon: meeting_room
    confirmation: Open the entrance door?
    action:
      action: perform-action
      perform_action: script.your_guarded_door_action
```

Use one to four actions. Names, paths, service, targets and confirmation are
configuration, not module constants. Place the card in the native view footer
to reserve space at the end of the view, or as a normal card. On small screens
it stays at the bottom with safe-area spacing; set `mobile_floating: false`
to keep it inline. A guarded server script must enforce call identity and door
policy. The card never claims that an accepted service call proves an unlock.
Failed actions deliberately have no automatic retry button.

On mobile, mini-plots collapse to their history expansion buttons. The full
history and original records remain accessible; sliders, boost buttons and
owner controls stay visible. No device functionality is removed.

## Temperature continuity

`temperature_display: {entity: sensor.your_raw_room_source, max_age: 86400}`
optionally shows a bounded last reading, explicitly labelled, when the
qualified controller temperature is unavailable. It is display-only and never
feeds the controller. No numeric value is invented for missing/non-numeric,
future-dated or expired samples. The backend source qualification TTL must be
configured for the sensor's actual reporting behavior. Availability alone or
a generic HA heartbeat is not proof of a fresh measurement.

The named acceptance contract is documented in
[100 climate scenarios](climate-100-scenarios.md). CI also runs the existing
exhaustive partition matrices and synthetic browser tests at mobile widths.
