# Полный каталог условий контроллера

Сгенерировано из 7 публичных Jinja-файлов v0.10.0: **250 условных операторов** в **200 исходных тегах**.

Каталог включает if/elif и выражения вида value if test else other. Составные and/or остаются в точном исходном выражении. Это инвентаризация кода, не заявление о полном покрытии физических событий.

[Обзор и блок-схемы](automation-flow.md). Обновление: python3 docs/tools/generate-condition-index.py.

## air-goals.jinja

### air_goal - L8

[Исходник](../controller/air-goals.jinja#L8) | if/elif: 1, inline-if: 0

```jinja
{%- set steps = ['default_request', 'sensor_request', 'hardware_max',
                  'hard_cap', 'noise_cap', 'boost_increment', 'boost_ceiling'] -%}
```

### air_goal - L11

[Исходник](../controller/air-goals.jinja#L11) | if/elif: 1, inline-if: 0

```jinja
{%- for key in flags -%}
```

### air_goal - L15

[Исходник](../controller/air-goals.jinja#L15) | if/elif: 1, inline-if: 0

```jinja
{%- set value = p.get(key) -%}
```

### air_goal - L17

[Исходник](../controller/air-goals.jinja#L17) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid = false -%}
```

### air_goal - L23

[Исходник](../controller/air-goals.jinja#L23) | if/elif: 1, inline-if: 0

```jinja
{%- set value = p.get(key) -%}
```

### air_goal - L25

[Исходник](../controller/air-goals.jinja#L25) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid = false -%}
```

### air_goal - L29

[Исходник](../controller/air-goals.jinja#L29) | if/elif: 1, inline-if: 0

```jinja
{%- endfor -%}
```

### air_goal - L32

[Исходник](../controller/air-goals.jinja#L32) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### air_goal - L36

[Исходник](../controller/air-goals.jinja#L36) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### air_goal - L53

[Исходник](../controller/air-goals.jinja#L53) | if/elif: 0, inline-if: 1

```jinja
{%- set boost = p.boost_deadline > p.now and p.boost_deadline > 0
                    and not p.global_maximum and p.enabled -%}
```

### air_goal - L55

[Исходник](../controller/air-goals.jinja#L55) | if/elif: 0, inline-if: 1

```jinja
{%- set requested = default if p.automatic else
          ((desired * maximum / 100)|round(0, 'ceil')|int) -%}
```

### air_goal - L57

[Исходник](../controller/air-goals.jinja#L57) | if/elif: 1, inline-if: 0

```jinja
{%- set mode = 'automatic' if p.automatic else 'manual' -%}
```

### air_goal - L63

[Исходник](../controller/air-goals.jinja#L63) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### air_goal - L66

[Исходник](../controller/air-goals.jinja#L66) | if/elif: 1, inline-if: 0

```jinja
{%- set mode = 'maximum' -%}
```

### air_goal - L72

[Исходник](../controller/air-goals.jinja#L72) | if/elif: 0, inline-if: 1

```jinja
{%- set limited = target < requested -%}
```

### air_goal - L73

[Исходник](../controller/air-goals.jinja#L73) | if/elif: 0, inline-if: 1

```jinja
{%- set reason = 'noise_cap' if noise < requested and noise <= hard
                     else 'hard_cap' if hard < requested else mode -%}
```

### air_goal - L79

[Исходник](../controller/air-goals.jinja#L79) | if/elif: 1, inline-if: 0

```jinja
{%- set can_command = speed or power -%}
```

### air_goal - L81

[Исходник](../controller/air-goals.jinja#L81) | if/elif: 1, inline-if: 0

```jinja
{%- set reason = 'speed_locked' -%}
```

### air_goal - L84

[Исходник](../controller/air-goals.jinja#L84) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### air_goal - L87

[Исходник](../controller/air-goals.jinja#L87) | if/elif: 1, inline-if: 0

```jinja
{%- set boost = false -%}
```

### air_goal - L90

[Исходник](../controller/air-goals.jinja#L90) | if/elif: 1, inline-if: 0

```jinja
{%- set reason = 'fault' -%}
```

## comfort-preferences.jinja

### comfort_preferences - L5

[Исходник](../controller/comfort-preferences.jinja#L5) | if/elif: 1, inline-if: 0

```jinja
{%- set n = namespace(valid=p is mapping, requests={}, caps={}, reasons={}) -%}
```

### comfort_preferences - L8

[Исходник](../controller/comfort-preferences.jinja#L8) | if/elif: 1, inline-if: 0

```jinja
{%- set value = p.get(key) -%}
```

### comfort_preferences - L10

[Исходник](../controller/comfort-preferences.jinja#L10) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid = false -%}
```

### comfort_preferences - L17

[Исходник](../controller/comfort-preferences.jinja#L17) | if/elif: 1, inline-if: 0

```jinja
{%- set value = p.get(axis ~ '_' ~ suffix) -%}
```

### comfort_preferences - L19

[Исходник](../controller/comfort-preferences.jinja#L19) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid = false -%}
```

### comfort_preferences - L21

[Исходник](../controller/comfort-preferences.jinja#L21) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid = false -%}
```

### comfort_preferences - L29

[Исходник](../controller/comfort-preferences.jinja#L29) | if/elif: 1, inline-if: 0

```jinja
{%- set value = p.get(axis ~ '_' ~ suffix) -%}
```

### comfort_preferences - L31

[Исходник](../controller/comfort-preferences.jinja#L31) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid = false -%}
```

### comfort_preferences - L33

[Исходник](../controller/comfort-preferences.jinja#L33) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid = false -%}
```

### comfort_preferences - L38

[Исходник](../controller/comfort-preferences.jinja#L38) | if/elif: 1, inline-if: 0

```jinja
{%- endfor -%}
```

### comfort_preferences - L40

[Исходник](../controller/comfort-preferences.jinja#L40) | if/elif: 1, inline-if: 0

```jinja
{%- for axis in ['fresh', 'clean', 'ac_fan'] -%}
```

### comfort_preferences - L45

[Исходник](../controller/comfort-preferences.jinja#L45) | if/elif: 1, inline-if: 0

```jinja
{%- for axis in ['fresh', 'clean'] -%}
```

### comfort_preferences - L51

[Исходник](../controller/comfort-preferences.jinja#L51) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### comfort_preferences - L64

[Исходник](../controller/comfort-preferences.jinja#L64) | if/elif: 0, inline-if: 1

```jinja
{%- set floor = 1 if p[axis ~ '_base'] > 0 or p[axis ~ '_need'] > 0 else 0 -%}
```

### comfort_preferences - L66

[Исходник](../controller/comfort-preferences.jinja#L66) | if/elif: 0, inline-if: 1

```jinja
{%- set requested = [p[axis ~ '_max'], [preferred, p[axis ~ '_need']] | max] | min | int -%}
```

### comfort_preferences - L67

[Исходник](../controller/comfort-preferences.jinja#L67) | if/elif: 0, inline-if: 2

```jinja
{%- set reason = 'sensor_need' if p[axis ~ '_need'] > preferred else
                       'prefer_more' if adjustment > 0 else
                       'prefer_less' if adjustment < 0 else 'neutral' -%}
```

### comfort_preferences - L75

[Исходник](../controller/comfort-preferences.jinja#L75) | if/elif: 0, inline-if: 1

```jinja
{%- set reduction = (p.quiet / 100 * p[axis ~ '_quiet_reduction_steps']) | round(0) | int -%}
```

### comfort_preferences - L79

[Исходник](../controller/comfort-preferences.jinja#L79) | if/elif: 0, inline-if: 1

```jinja
{{- {'valid': true, 'error': '', 'fresh_request': n.requests.fresh,
         'clean_request': n.requests.clean, 'ac_fan_request': p.ac_fan_base | int,
         'fresh_noise_cap': n.caps.fresh, 'clean_noise_cap': n.caps.clean,
         'ac_fan_cap': n.caps.ac_fan,
         'reasons': dict(n.reasons, quiet='prefer_quiet' if p.quiet > 0 else 'neutral')} | tojson -}}
```

### comfort_transition - L90

[Исходник](../controller/comfort-preferences.jinja#L90) | if/elif: 1, inline-if: 0

```jinja
{%- set n = namespace(error='', result=state) -%}
```

### comfort_transition - L95

[Исходник](../controller/comfort-preferences.jinja#L95) | if/elif: 1, inline-if: 0

```jinja
{%- set value = state.get(axis) -%}
```

### comfort_transition - L97

[Исходник](../controller/comfort-preferences.jinja#L97) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_state' -%}
```

### comfort_transition - L101

[Исходник](../controller/comfort-preferences.jinja#L101) | if/elif: 1, inline-if: 0

```jinja
{%- endfor -%}
```

### comfort_transition - L103

[Исходник](../controller/comfort-preferences.jinja#L103) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'unsupported_event' -%}
```

### comfort_transition - L104

[Исходник](../controller/comfort-preferences.jinja#L104) | if/elif: 1, inline-if: 0

```jinja
{%- elif event.type == 'set' -%}
```

### comfort_transition - L108

[Исходник](../controller/comfort-preferences.jinja#L108) | if/elif: 1, inline-if: 0

```jinja
{%- set value = event.get('value') -%}
```

### comfort_transition - L110

[Исходник](../controller/comfort-preferences.jinja#L110) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_value' -%}
```

### comfort_transition - L114

[Исходник](../controller/comfort-preferences.jinja#L114) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### comfort_transition - L115

[Исходник](../controller/comfort-preferences.jinja#L115) | if/elif: 0, inline-if: 1

```jinja
{%- if n.error == '' -%}
```

## command-guards.jinja

### command_guard - L3

[Исходник](../controller/command-guards.jinja#L3) | if/elif: 1, inline-if: 0

```jinja
{%- set n = namespace(valid=p is mapping, allowed=false, reason='invalid_input', safety=false) -%}
```

### command_guard - L5

[Исходник](../controller/command-guards.jinja#L5) | if/elif: 1, inline-if: 0

```jinja
{%- for key in ['automatic', 'available', 'eligible', 'fault_shutdown', 'explicit_error', 'latched', 'stopping', 'master_enabled'] -%}
```

### command_guard - L8

[Исходник](../controller/command-guards.jinja#L8) | if/elif: 1, inline-if: 0

```jinja
{%- for key in ['power_lock', 'saved_power', 'current_power'] -%}
```

### command_guard - L10

[Исходник](../controller/command-guards.jinja#L10) | if/elif: 1, inline-if: 0

```jinja
{%- endfor -%}
```

### command_guard - L12

[Исходник](../controller/command-guards.jinja#L12) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### command_guard - L13

[Исходник](../controller/command-guards.jinja#L13) | if/elif: 1, inline-if: 0

```jinja
{%- if n.valid -%}
```

### command_guard - L15

[Исходник](../controller/command-guards.jinja#L15) | if/elif: 1, inline-if: 0

```jinja
{%- set n.reason = 'invalid_fault_shutdown' -%}
```

### command_guard - L17

[Исходник](../controller/command-guards.jinja#L17) | if/elif: 1, inline-if: 0

```jinja
{%- set n.reason = 'unavailable' -%}
```

### command_guard - L18

[Исходник](../controller/command-guards.jinja#L18) | if/elif: 1, inline-if: 0

```jinja
{%- elif p.fault_shutdown -%}
```

### command_guard - L24

[Исходник](../controller/command-guards.jinja#L24) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### command_guard - L26

[Исходник](../controller/command-guards.jinja#L26) | if/elif: 1, inline-if: 0

```jinja
{%- set n.reason = 'manual_stop' -%}
```

### command_guard - L28

[Исходник](../controller/command-guards.jinja#L28) | if/elif: 1, inline-if: 0

```jinja
{%- set n.reason = 'ineligible' -%}
```

### command_guard - L30

[Исходник](../controller/command-guards.jinja#L30) | if/elif: 1, inline-if: 0

```jinja
{%- set n.reason = 'manual' -%}
```

### command_guard - L32

[Исходник](../controller/command-guards.jinja#L32) | if/elif: 1, inline-if: 0

```jinja
{%- set n.reason = 'master_disabled' -%}
```

### command_guard - L34

[Исходник](../controller/command-guards.jinja#L34) | if/elif: 1, inline-if: 0

```jinja
{%- set n.reason = 'power_locked' -%}
```

## control-dynamics.jinja

### critical_hysteresis - L4

[Исходник](../controller/control-dynamics.jinja#L4) | if/elif: 1, inline-if: 0

```jinja
{%- set n=namespace(valid=p is mapping) -%}
```

### critical_hysteresis - L6

[Исходник](../controller/control-dynamics.jinja#L6) | if/elif: 1, inline-if: 0

```jinja
{%- for key in ['above','valid','clear'] -%}
```

### critical_hysteresis - L9

[Исходник](../controller/control-dynamics.jinja#L9) | if/elif: 1, inline-if: 0

```jinja
{%- for key in ['pending','active','clear_pending'] -%}
```

### critical_hysteresis - L13

[Исходник](../controller/control-dynamics.jinja#L13) | if/elif: 1, inline-if: 0

```jinja
{%- set value=p.get(key) -%}
```

### critical_hysteresis - L15

[Исходник](../controller/control-dynamics.jinja#L15) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid=false -%}
```

### critical_hysteresis - L19

[Исходник](../controller/control-dynamics.jinja#L19) | if/elif: 1, inline-if: 0

```jinja
{%- endfor -%}
```

### critical_hysteresis - L23

[Исходник](../controller/control-dynamics.jinja#L23) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### supply_pi - L39

[Исходник](../controller/control-dynamics.jinja#L39) | if/elif: 1, inline-if: 0

```jinja
{%- set n=namespace(valid=p is mapping) -%}
```

### supply_pi - L41

[Исходник](../controller/control-dynamics.jinja#L41) | if/elif: 1, inline-if: 0

```jinja
{%- for key in ['force','reset'] -%}
```

### supply_pi - L45

[Исходник](../controller/control-dynamics.jinja#L45) | if/elif: 1, inline-if: 0

```jinja
{%- set value=p.get(key) -%}
```

### supply_pi - L47

[Исходник](../controller/control-dynamics.jinja#L47) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid=false -%}
```

### supply_pi - L52

[Исходник](../controller/control-dynamics.jinja#L52) | if/elif: 0, inline-if: 1

```jinja
{%- endif -%}
```

### supply_pi - L57

[Исходник](../controller/control-dynamics.jinja#L57) | if/elif: 1, inline-if: 0

```jinja
{%- set cfg=namespace(values={}) -%}
```

### supply_pi - L62

[Исходник](../controller/control-dynamics.jinja#L62) | if/elif: 1, inline-if: 0

```jinja
{%- set value=tuning.get(key,fallback) -%}
```

### supply_pi - L64

[Исходник](../controller/control-dynamics.jinja#L64) | if/elif: 1, inline-if: 0

```jinja
{%- set n.valid=false -%}
```

### supply_pi - L69

[Исходник](../controller/control-dynamics.jinja#L69) | if/elif: 1, inline-if: 0

```jinja
{%- endfor -%}
```

### supply_pi - L81

[Исходник](../controller/control-dynamics.jinja#L81) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### supply_pi - L85

[Исходник](../controller/control-dynamics.jinja#L85) | if/elif: 0, inline-if: 1

```jinja
{%- set desired=p.desired -%}
```

### supply_pi - L87

[Исходник](../controller/control-dynamics.jinja#L87) | if/elif: 0, inline-if: 1

```jinja
{%- set elapsed=[0,p.elapsed]|max -%}
```

### supply_pi - L89

[Исходник](../controller/control-dynamics.jinja#L89) | if/elif: 0, inline-if: 1

```jinja
{%- set error=desired-measured -%}
```

### supply_pi - L91

[Исходник](../controller/control-dynamics.jinja#L91) | if/elif: 0, inline-if: 1

```jinja
{%- set candidate_raw=desired+cfg.values.kp*error+candidate_i -%}
```

### supply_pi - L95

[Исходник](../controller/control-dynamics.jinja#L95) | if/elif: 0, inline-if: 1

```jinja
{%- set current=p.current -%}
```

## device-health.jinja

### _boolean - L2

[Исходник](../controller/device-health.jinja#L2) | if/elif: 1, inline-if: 0

```jinja
{% macro _boolean(value) -%}
```

### _boolean - L4

[Исходник](../controller/device-health.jinja#L4) | if/elif: 1, inline-if: 0

```jinja
{{- value | to_json -}}
```

### _boolean - L6

[Исходник](../controller/device-health.jinja#L6) | if/elif: 1, inline-if: 0

```jinja
{{- (value | lower | trim in ['true', 'on', '1']) | to_json -}}
```

### _availability - L12

[Исходник](../controller/device-health.jinja#L12) | if/elif: 1, inline-if: 0

```jinja
{% macro _availability(value) -%}
```

### _availability - L16

[Исходник](../controller/device-health.jinja#L16) | if/elif: 0, inline-if: 2

```jinja
{%- set boolean = _boolean(value) | from_json -%}
```

### _power - L22

[Исходник](../controller/device-health.jinja#L22) | if/elif: 0, inline-if: 2

```jinja
{%- set boolean = _boolean(value) | from_json -%}
```

### device_health - L26

[Исходник](../controller/device-health.jinja#L26) | if/elif: 0, inline-if: 1

```jinja
{% macro device_health(p) -%}
```

### device_health - L40

[Исходник](../controller/device-health.jinja#L40) | if/elif: 0, inline-if: 4

```jinja
{%- set fault = explicit_error or latched is sameas true -%}
```

### device_health - L41

[Исходник](../controller/device-health.jinja#L41) | if/elif: 0, inline-if: 3

```jinja
{%- set condition = 'error' if explicit_error else 'unavailable' if availability == 'unavailable' else 'health_unknown' if not available or not known_clear or not state_valid else 'recovery_required' if latched else 'healthy' -%}
```

### device_health - L42

[Исходник](../controller/device-health.jinja#L42) | if/elif: 0, inline-if: 3

```jinja
{%- set confirmation = 'not_required' if not fault else 'confirmed' if available and power == 'off' else 'not_confirmed' if attempted is sameas true else 'not_requested' -%}
```

### device_health - L44

[Исходник](../controller/device-health.jinja#L44) | if/elif: 0, inline-if: 2

```jinja
{{- {
    'availability': availability,
    'condition': condition,
    'eligible': healthy,
    'error_known': known is sameas true and active is not none,
    'explicit_error': explicit_error,
    'latched': latched,
    'state_valid': state_valid,
    'stop_attempted': attempted,
    'observed_power': power,
    'shutdown_required': shutdown,
    'shutdown_confirmation': confirmation,
    'override_manual_power': shutdown,
    'acknowledgement_allowed': available and known_clear and state_valid and latched is sameas true,
    'notification': {
      'required': not healthy,
      'persistent': not healthy,
      'kind': notice,
      'severity': 'error' if fault else 'warning' if not healthy else 'none',
      'reason': condition,
      'shutdown_confirmation': confirmation
    }
  } | to_json -}}
```

### health_transition - L69

[Исходник](../controller/device-health.jinja#L69) | if/elif: 0, inline-if: 1

```jinja
{% macro health_transition(s, event) -%}
```

### health_transition - L70

[Исходник](../controller/device-health.jinja#L70) | if/elif: 0, inline-if: 1

```jinja
{%- set s = s if s is mapping else {} -%}
```

### health_transition - L75

[Исходник](../controller/device-health.jinja#L75) | if/elif: 1, inline-if: 0

```jinja
{%- set ns = namespace(state=dict(s), acknowledge='not_requested', shutdown=false) -%}
```

### health_transition - L78

[Исходник](../controller/device-health.jinja#L78) | if/elif: 1, inline-if: 0

```jinja
{%- if kind == 'observe' -%}
```

### health_transition - L79

[Исходник](../controller/device-health.jinja#L79) | if/elif: 1, inline-if: 0

```jinja
{%- set ns.state = dict(ns.state, availability=event.get('availability'), error_known=event.get('error_known'), error_active=event.get('error_active'), observed_power=event.get('observed_power')) -%}
```

### health_transition - L81

[Исходник](../controller/device-health.jinja#L81) | if/elif: 1, inline-if: 0

```jinja
{%- for key in ['availability', 'error_known', 'error_active', 'observed_power'] -%}
```

### health_transition - L85

[Исходник](../controller/device-health.jinja#L85) | if/elif: 1, inline-if: 0

```jinja
{%- set current = device_health(ns.state) | from_json -%}
```

### health_transition - L89

[Исходник](../controller/device-health.jinja#L89) | if/elif: 1, inline-if: 0

```jinja
{%- set current = device_health(ns.state) | from_json -%}
```

### health_transition - L90

[Исходник](../controller/device-health.jinja#L90) | if/elif: 1, inline-if: 0

```jinja
{%- if kind == 'acknowledge' -%}
```

### health_transition - L98

[Исходник](../controller/device-health.jinja#L98) | if/elif: 1, inline-if: 0

```jinja
{%- set current = device_health(ns.state) | from_json -%}
```

## intent-transition.jinja

### intent_transition - L7

[Исходник](../controller/intent-transition.jinja#L7) | if/elif: 1, inline-if: 0

```jinja
{%- set n = namespace(error='', result=state, changed=false) -%}
```

### intent_transition - L10

[Исходник](../controller/intent-transition.jinja#L10) | if/elif: 1, inline-if: 0

```jinja
{%- else -%}
```

### intent_transition - L15

[Исходник](../controller/intent-transition.jinja#L15) | if/elif: 1, inline-if: 0

```jinja
{%- set channel = state.get(axis) -%}
```

### intent_transition - L18

[Исходник](../controller/intent-transition.jinja#L18) | if/elif: 1, inline-if: 0

```jinja
{%- else -%}
```

### intent_transition - L22

[Исходник](../controller/intent-transition.jinja#L22) | if/elif: 1, inline-if: 0

```jinja
{%- set value = channel.get('value') -%}
```

### intent_transition - L24

[Исходник](../controller/intent-transition.jinja#L24) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_state' -%}
```

### intent_transition - L28

[Исходник](../controller/intent-transition.jinja#L28) | if/elif: 1, inline-if: 0

```jinja
{%- set deadline = channel.get('deadline') -%}
```

### intent_transition - L30

[Исходник](../controller/intent-transition.jinja#L30) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_state' -%}
```

### intent_transition - L35

[Исходник](../controller/intent-transition.jinja#L35) | if/elif: 1, inline-if: 0

```jinja
{%- endfor -%}
```

### intent_transition - L39

[Исходник](../controller/intent-transition.jinja#L39) | if/elif: 1, inline-if: 0

```jinja
{%- set kind = event.get('type') -%}
```

### intent_transition - L42

[Исходник](../controller/intent-transition.jinja#L42) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L45

[Исходник](../controller/intent-transition.jinja#L45) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L47

[Исходник](../controller/intent-transition.jinja#L47) | if/elif: 1, inline-if: 0

```jinja
{%- set value = event.get('value') -%}
```

### intent_transition - L49

[Исходник](../controller/intent-transition.jinja#L49) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_value' -%}
```

### intent_transition - L52

[Исходник](../controller/intent-transition.jinja#L52) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L54

[Исходник](../controller/intent-transition.jinja#L54) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_automatic' -%}
```

### intent_transition - L57

[Исходник](../controller/intent-transition.jinja#L57) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L59

[Исходник](../controller/intent-transition.jinja#L59) | if/elif: 1, inline-if: 0

```jinja
{%- set now = event.get('now') -%}
```

### intent_transition - L61

[Исходник](../controller/intent-transition.jinja#L61) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_now' -%}
```

### intent_transition - L65

[Исходник](../controller/intent-transition.jinja#L65) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L66

[Исходник](../controller/intent-transition.jinja#L66) | if/elif: 1, inline-if: 0

```jinja
{%- if kind == 'boost_start' -%}
```

### intent_transition - L68

[Исходник](../controller/intent-transition.jinja#L68) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_duration' -%}
```

### intent_transition - L71

[Исходник](../controller/intent-transition.jinja#L71) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L72

[Исходник](../controller/intent-transition.jinja#L72) | if/elif: 1, inline-if: 0

```jinja
{%- elif kind == 'profile' -%}
```

### intent_transition - L74

[Исходник](../controller/intent-transition.jinja#L74) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_mode' -%}
```

### intent_transition - L76

[Исходник](../controller/intent-transition.jinja#L76) | if/elif: 1, inline-if: 0

```jinja
{%- set profile = policy.profiles.get(event.mode) -%}
```

### intent_transition - L81

[Исходник](../controller/intent-transition.jinja#L81) | if/elif: 1, inline-if: 0

```jinja
{%- set baseline = profile.get(axis) -%}
```

### intent_transition - L85

[Исходник](../controller/intent-transition.jinja#L85) | if/elif: 1, inline-if: 0

```jinja
{%- set value = baseline.get('value') -%}
```

### intent_transition - L87

[Исходник](../controller/intent-transition.jinja#L87) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'invalid_profile' -%}
```

### intent_transition - L97

[Исходник](../controller/intent-transition.jinja#L97) | if/elif: 2, inline-if: 0

```jinja
{%- if n.error == '' and kind == 'boost_start' -%}
```

### intent_transition - L99

[Исходник](../controller/intent-transition.jinja#L99) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'master_disabled' -%}
```

### intent_transition - L101

[Исходник](../controller/intent-transition.jinja#L101) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'maximum_active' -%}
```

### intent_transition - L103

[Исходник](../controller/intent-transition.jinja#L103) | if/elif: 1, inline-if: 0

```jinja
{%- set n.error = 'ineligible' -%}
```

### intent_transition - L107

[Исходник](../controller/intent-transition.jinja#L107) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L109

[Исходник](../controller/intent-transition.jinja#L109) | if/elif: 1, inline-if: 0

```jinja
{%- set n.result = dict(state) -%}
```

### intent_transition - L112

[Исходник](../controller/intent-transition.jinja#L112) | if/elif: 1, inline-if: 0

```jinja
{%- set n.result = dict(n.result, **{event.axis: channel}) -%}
```

### intent_transition - L113

[Исходник](../controller/intent-transition.jinja#L113) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L115

[Исходник](../controller/intent-transition.jinja#L115) | if/elif: 1, inline-if: 0

```jinja
{%- set n.result = dict(n.result, **{event.axis: dict(state[event.axis], automatic=event.automatic)}) -%}
```

### intent_transition - L116

[Исходник](../controller/intent-transition.jinja#L116) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L118

[Исходник](../controller/intent-transition.jinja#L118) | if/elif: 1, inline-if: 0

```jinja
{%- set n.result = dict(n.result, **{event.axis: dict(state[event.axis], active=true, deadline=event.now + event.duration * 60)}) -%}
```

### intent_transition - L120

[Исходник](../controller/intent-transition.jinja#L120) | if/elif: 1, inline-if: 0

```jinja
{%- set n.result = dict(n.result, **{event.axis: dict(state[event.axis], active=false, deadline=0)}) -%}
```

### intent_transition - L122

[Исходник](../controller/intent-transition.jinja#L122) | if/elif: 1, inline-if: 0

```jinja
{%- for axis in axes -%}
```

### intent_transition - L126

[Исходник](../controller/intent-transition.jinja#L126) | if/elif: 1, inline-if: 0

```jinja
{%- endfor -%}
```

### intent_transition - L128

[Исходник](../controller/intent-transition.jinja#L128) | if/elif: 1, inline-if: 0

```jinja
{%- set n.result = dict(n.result, master=event.enabled) -%}
```

### intent_transition - L133

[Исходник](../controller/intent-transition.jinja#L133) | if/elif: 1, inline-if: 0

```jinja
{%- endif -%}
```

### intent_transition - L136

[Исходник](../controller/intent-transition.jinja#L136) | if/elif: 0, inline-if: 1

```jinja
{%- for axis in axes -%}
```

## legacy-policy.jinja

### legacy_context - L7

[Исходник](../controller/legacy-policy.jinja#L7) | if/elif: 0, inline-if: 2

```jinja
{% set ttl=p['values']['context_' ~ ('sleep' if key in ['sleep','confidence'] else 'presence' if key=='presence' else 'active') ~ '_ttl'] | int(300) %}
```

### legacy_context - L9

[Исходник](../controller/legacy-policy.jinja#L9) | if/elif: 0, inline-if: 1

```jinja
{% set src_ns.items=dict(src_ns.items,**{key:{'valid':valid,'value':item.value | string | lower if valid else 'unknown','age':item.age | int,'changed':item.changed}}) %}
```

### legacy_context - L19

[Исходник](../controller/legacy-policy.jinja#L19) | if/elif: 0, inline-if: 3

```jinja
{% set sleep='conflict' if asleep and awake else 'asleep' if asleep else 'awake' if awake else 'unknown' %}
```

### legacy_context - L23

[Исходник](../controller/legacy-policy.jinja#L23) | if/elif: 0, inline-if: 1

```jinja
{% set night=(p.hour>=start or p.hour<end) if start>=end else (start<=p.hour<end) %}
```

### legacy_context - L24

[Исходник](../controller/legacy-policy.jinja#L24) | if/elif: 0, inline-if: 4

```jinja
{% set profile='absent' if absent else 'sleep' if sleep in ['asleep','conflict'] else 'awake' if sleep=='awake' else 'night_unknown' if night else 'unknown' %}
```

### legacy_context - L25

[Исходник](../controller/legacy-policy.jinja#L25) | if/elif: 0, inline-if: 3

```jinja
{% set pc=p['values']['purifier_max'] if profile=='absent' else p['values']['sleep_purifier_cap'] | int(1) if profile in ['sleep','night_unknown'] else p['values']['awake_purifier_cap'] | int(4) if profile=='awake' else p['values']['purifier_quiet_limit'] | int(3) %}
```

### legacy_context - L26

[Исходник](../controller/legacy-policy.jinja#L26) | if/elif: 0, inline-if: 3

```jinja
{% set bc=p['values']['breather_max'] if profile=='absent' else p['values']['sleep_breather_cap'] | int(1) if profile in ['sleep','night_unknown'] else p['values']['awake_breather_cap'] | int(4) if profile=='awake' else p['values']['unknown_breather_cap'] | int(3) %}
```

### legacy_context - L27

[Исходник](../controller/legacy-policy.jinja#L27) | if/elif: 0, inline-if: 5

```jinja
{% set result={'profile':profile,'sleep':sleep,'presence':'present' if present else 'absent' if absent else 'unknown','night':night,'purifier_cap':pc,'breather_cap':bc,'ac_fan_cap':'high' if profile=='absent' else 'medium' if profile=='awake' else 'low','confidence_available':confidence.valid,'phone_active_available':phone.valid,'watch_available':watch_usable,'watch_worn_available':worn.valid,'watch_worn':worn.value if worn.valid else 'unknown'} %}
```

### legacy_air - L40

[Исходник](../controller/legacy-policy.jinja#L40) | if/elif: 0, inline-if: 4

```jinja
{% set b=2 if co2<800 else 3 if co2<1000 else 4 if co2<1400 else 5 if co2<1800 else 7 %}
```

### legacy_air - L41

[Исходник](../controller/legacy-policy.jinja#L41) | if/elif: 0, inline-if: 4

```jinja
{% set particle_request=1 if pm<=8 else 3 if pm<=15 else 4 if pm<=35 else 7 if pm<=75 else 11 %}
```

### legacy_air - L45

[Исходник](../controller/legacy-policy.jinja#L45) | if/elif: 0, inline-if: 1

```jinja
{% set psoft=[context.purifier_cap,p['values']['critical_purifier_cap'] | int(7)] | max if critical_pm else context.purifier_cap %}
```

### legacy_air - L46

[Исходник](../controller/legacy-policy.jinja#L46) | if/elif: 0, inline-if: 1

```jinja
{% set bsoft=[context.breather_cap,p['values']['critical_breather_cap'] | int(5)] | max if critical_co2 else context.breather_cap %}
```

### legacy_air - L47

[Исходник](../controller/legacy-policy.jinja#L47) | if/elif: 0, inline-if: 4

```jinja
{% set profile=psoft if full else p['values']['purifier_quiet_limit'] | int(3) if selected=='Тихий' else p['values']['purifier_standard_limit'] | int(4) if selected=='Стандартный' else p['values']['purifier_auto_limit'] | int(6) if selected=='Автоматически' else 11 %}
```

### legacy_air - L49

[Исходник](../controller/legacy-policy.jinja#L49) | if/elif: 0, inline-if: 1

```jinja
{% set learned=p['values']['purifier_noise_cap'] | int(3) if noise.valid and not(full and (context.profile=='absent' or critical_pm)) else 11 %}
```

### legacy_air - L51

[Исходник](../controller/legacy-policy.jinja#L51) | if/elif: 0, inline-if: 2

```jinja
{% set floor=11 if selected=='Максимум' else 2 if selected=='Стандартный' else 1 %}
```

### legacy_air - L52

[Исходник](../controller/legacy-policy.jinja#L52) | if/elif: 0, inline-if: 1

```jinja
{% set demand=[floor,particle_request if pmvalid else p['values']['invalid_pm_fallback'] | int(3)] | max %}
```

### legacy_air - L53

[Исходник](../controller/legacy-policy.jinja#L53) | if/elif: 0, inline-if: 5

```jinja
{% set bdemand=(b if co2valid else 3) if automatic else 3 if selected=='Тихий' else 4 if selected=='Стандартный' else 7 if selected=='Максимум' else 0 %}
```

### legacy_air - L54

[Исходник](../controller/legacy-policy.jinja#L54) | if/elif: 0, inline-if: 1

```jinja
{% set bcap=[1,[7,bsoft,p['values']['breather_speed_limit'] | int(7)] | min] | max if full else p['values']['breather_speed_limit'] | int(7) %}
```

### legacy_air - L55

[Исходник](../controller/legacy-policy.jinja#L55) | if/elif: 0, inline-if: 5

```jinja
{% set fan=('high' if error>=1.5 else 'medium' if error>=0.7 else 'low') if automatic else 'high' if selected=='Максимум' else 'medium' if selected=='Стандартный' else 'low' %}
```

### legacy_air - L56

[Исходник](../controller/legacy-policy.jinja#L56) | if/elif: 0, inline-if: 1

```jinja
{% set ranks={'low':1,'medium':2,'high':3} %}
```

### legacy_air - L57

[Исходник](../controller/legacy-policy.jinja#L57) | if/elif: 0, inline-if: 6

```jinja
{% set result={'mode':selected,'breather':[bdemand,bcap] | min,'breather_requested':bdemand,'breather_sensor_requested':b if co2valid else 3,'breather_cap':bcap,'purifier':([demand,cap] | min) if selected!='Отключено' else 'off','purifier_requested':demand,'purifier_cap':cap,'purifier_limited':demand>cap,'ac_fan':fan if ranks[fan]<=ranks[fcap] else fcap,'co2_valid':co2valid,'pm_valid':pmvalid,'co2':co2 if co2valid else 'unknown','pm':pm if pmvalid else 'unknown','critical_pm':critical_pm,'critical_co2':critical_co2,'context':context.profile if full else 'fixed','noise_valid':noise.valid,'noise_configured':noise.configured} %}
```

### legacy_thermal - L81

[Исходник](../controller/legacy-policy.jinja#L81) | if/elif: 1, inline-if: 0

```jinja
{% if ac_mode in ['unknown','unavailable'] %}
```

### legacy_thermal - L83

[Исходник](../controller/legacy-policy.jinja#L83) | if/elif: 1, inline-if: 0

```jinja
{% elif not auto_enabled or not room_ok or device_fault %}
```

### legacy_thermal - L84

[Исходник](../controller/legacy-policy.jinja#L84) | if/elif: 0, inline-if: 1

```jinja
{% set ns.action='stop' if owned and ac_mode in ['cool','heat'] else 'release' %}
```

### legacy_thermal - L85

[Исходник](../controller/legacy-policy.jinja#L85) | if/elif: 0, inline-if: 2

```jinja
{% set ns.reason='Климат-контроль выключен' if not auto_enabled else ('Нет достоверной температуры комнаты' if not room_ok else 'Ошибка кондиционера') %}
```

### legacy_thermal - L86

[Исходник](../controller/legacy-policy.jinja#L86) | if/elif: 1, inline-if: 0

```jinja
{% elif supply_conflict and measured > desired + 0.1 %}
```

### legacy_thermal - L87

[Исходник](../controller/legacy-policy.jinja#L87) | if/elif: 0, inline-if: 1

```jinja
{% set ns.action='stop' if owned and ac_mode == 'cool' else 'release' %}
```

### legacy_thermal - L88

[Исходник](../controller/legacy-policy.jinja#L88) | if/elif: 1, inline-if: 0

```jinja
{% elif ac_mode not in ['off','cool','heat'] and not (ac_mode == 'fan_only' and maximum_fan_only) %}
```

### legacy_thermal - L90

[Исходник](../controller/legacy-policy.jinja#L90) | if/elif: 1, inline-if: 0

```jinja
{% elif owned and ac_mode not in ['cool','heat'] %}
```

### legacy_thermal - L92

[Исходник](../controller/legacy-policy.jinja#L92) | if/elif: 1, inline-if: 0

```jinja
{% elif ac_mode in ['cool','heat'] %}
```

### legacy_thermal - L94

[Исходник](../controller/legacy-policy.jinja#L94) | if/elif: 1, inline-if: 0

```jinja
{% if (ac_mode == 'cool' and measured <= desired - 0.5) or (ac_mode == 'heat' and measured >= desired + 0.5) %}
```

### legacy_thermal - L95

[Исходник](../controller/legacy-policy.jinja#L95) | if/elif: 0, inline-if: 1

```jinja
{% set ns.action='stop' if owned else 'adopt' %}
```

### legacy_thermal - L96

[Исходник](../controller/legacy-policy.jinja#L96) | if/elif: 1, inline-if: 0

```jinja
{% elif owned and since_change >= 300 and ((ac_mode == 'cool' and measured <= desired + 0.1) or (ac_mode == 'heat' and measured >= desired - 0.1)) %}
```

### legacy_thermal - L99

[Исходник](../controller/legacy-policy.jinja#L99) | if/elif: 0, inline-if: 1

```jinja
{% set ns.action='maintain' if owned else 'adopt' %}
```

### legacy_thermal - L100

[Исходник](../controller/legacy-policy.jinja#L100) | if/elif: 0, inline-if: 1

```jinja
{% set ns.reason='Охлаждение' if ac_mode == 'cool' else 'Обогрев' %}
```

### legacy_thermal - L102

[Исходник](../controller/legacy-policy.jinja#L102) | if/elif: 1, inline-if: 0

```jinja
{% elif measured >= desired + 0.7 %}
```

### legacy_thermal - L103

[Исходник](../controller/legacy-policy.jinja#L103) | if/elif: 0, inline-if: 1

```jinja
{% set ns.mode='cool' %}
```

### legacy_thermal - L104

[Исходник](../controller/legacy-policy.jinja#L104) | if/elif: 0, inline-if: 1

```jinja
{% set ns.reason='Охлаждение' if since_change >= 300 else 'Пауза перед пуском' %}
```

### legacy_thermal - L105

[Исходник](../controller/legacy-policy.jinja#L105) | if/elif: 1, inline-if: 0

```jinja
{% elif measured <= desired - 0.7 and breather_at_limit %}
```

### legacy_thermal - L107

[Исходник](../controller/legacy-policy.jinja#L107) | if/elif: 0, inline-if: 1

```jinja
{% set ns.action='start' if since_change >= 300 and heating_ready else 'wait' %}
```

### legacy_thermal - L108

[Исходник](../controller/legacy-policy.jinja#L108) | if/elif: 0, inline-if: 1

```jinja
{% set ns.reason='Помощь бризеру: обогрев' if ns.action == 'start' else 'Ожидание: бризер / защитная пауза' %}
```

### legacy_thermal - L110

[Исходник](../controller/legacy-policy.jinja#L110) | if/elif: 0, inline-if: 1

```jinja
{% set offset = [[native_room - measured,-3] | max,3] | min if native_room_ok else 0 %}
```

### legacy_thermal - L114

[Исходник](../controller/legacy-policy.jinja#L114) | if/elif: 1, inline-if: 0

```jinja
{% if plan.action in ['start','adopt'] %}
```

### legacy_thermal - L116

[Исходник](../controller/legacy-policy.jinja#L116) | if/elif: 1, inline-if: 0

```jinja
{% elif plan.action == 'maintain' and target_changed %}
```

### legacy_thermal - L118

[Исходник](../controller/legacy-policy.jinja#L118) | if/elif: 1, inline-if: 0

```jinja
{% elif plan.action == 'maintain' and since_target >= 600 %}
```

### legacy_thermal - L119

[Исходник](../controller/legacy-policy.jinja#L119) | if/elif: 1, inline-if: 0

```jinja
{% if plan.mode == 'cool' and measured >= desired + 0.5 and plan.target < cycle_target %}
```

### legacy_thermal - L121

[Исходник](../controller/legacy-policy.jinja#L121) | if/elif: 1, inline-if: 0

```jinja
{% elif plan.mode == 'heat' and measured <= desired - 0.5 and plan.target > cycle_target %}
```
