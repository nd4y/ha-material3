# Полный каталог условий контроллера

Сгенерировано из 7 публичных Jinja-файлов v0.10.0: **250 условных операторов** и **623 логических / сравнительных выражений** в **240 исходных тегах**.

Каталог включает if/elif, value if test else other, and/or/not, сравнения, Jinja-тесты и is_number, в том числе внутри присваиваний и возвращаемых флагов. Вложенные узлы посчитаны отдельно; это не число независимых сценариев. Теги приводятся целиком; соседние теги на одной строке объединены, поскольку Jinja AST хранит номер строки без позиции столбца. Это инвентаризация кода, не заявление о полном покрытии физических событий.

[Обзор и блок-схемы](automation-flow.md). Обновление: python3 docs/tools/generate-condition-index.py.

## air-goals.jinja

### air_goal - L5

[Исходник](../controller/air-goals.jinja#L5) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set n = namespace(valid=p is mapping) -%}
```

### air_goal - L10

[Исходник](../controller/air-goals.jinja#L10) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- if n.valid -%}
```

### air_goal - L12

[Исходник](../controller/air-goals.jinja#L12) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if p.get(key) is not boolean -%} {%- set n.valid = false -%} {%- endif -%}
```

### air_goal - L16

[Исходник](../controller/air-goals.jinja#L16) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### air_goal - L18

[Исходник](../controller/air-goals.jinja#L18) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- elif not (-1000000 <= value <= 1000000) or value != value|int -%}
```

### air_goal - L24

[Исходник](../controller/air-goals.jinja#L24) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### air_goal - L26

[Исходник](../controller/air-goals.jinja#L26) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (-1000000000000 <= value <= 1000000000000) -%}
```

### air_goal - L30

[Исходник](../controller/air-goals.jinja#L30) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- if p.get('hardware_max', 0) is number and p.get('hardware_max', 0) <= 0 -%}
```

### air_goal - L33

[Исходник](../controller/air-goals.jinja#L33) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if p.get('current_power') not in ['on', 'off', 'unknown'] -%}
```

### air_goal - L37

[Исходник](../controller/air-goals.jinja#L37) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if not n.valid -%}
```

### air_goal - L53

[Исходник](../controller/air-goals.jinja#L53) | if/elif: 0, inline-if: 0, предикаты: 6

```jinja
{%- set boost = p.boost_deadline > p.now and p.boost_deadline > 0
                    and not p.global_maximum and p.enabled -%}
```

### air_goal - L55

[Исходник](../controller/air-goals.jinja#L55) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{%- set requested = default if p.automatic else
          ((desired * maximum / 100)|round(0, 'ceil')|int) -%}
```

### air_goal - L57

[Исходник](../controller/air-goals.jinja#L57) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{%- set mode = 'automatic' if p.automatic else 'manual' -%}
```

### air_goal - L58

[Исходник](../controller/air-goals.jinja#L58) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if p.global_off or (not p.automatic and desired == 0) -%}
```

### air_goal - L64

[Исходник](../controller/air-goals.jinja#L64) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if p.global_maximum and not p.global_off -%}
```

### air_goal - L67

[Исходник](../controller/air-goals.jinja#L67) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- elif boost -%}
```

### air_goal - L72

[Исходник](../controller/air-goals.jinja#L72) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set limited = target < requested -%}
```

### air_goal - L73

[Исходник](../controller/air-goals.jinja#L73) | if/elif: 0, inline-if: 2, предикаты: 4

```jinja
{%- set reason = 'noise_cap' if noise < requested and noise <= hard
                     else 'hard_cap' if hard < requested else mode -%}
```

### air_goal - L75

[Исходник](../controller/air-goals.jinja#L75) | if/elif: 0, inline-if: 0, предикаты: 5

```jinja
{%- set speed = target > 0 and p.speed_allowed
                    and (p.current_power == 'on' or p.power_allowed) -%}
```

### air_goal - L77

[Исходник](../controller/air-goals.jinja#L77) | if/elif: 0, inline-if: 0, предикаты: 5

```jinja
{%- set power = p.power_allowed and
                    ((target == 0) or (target > 0 and p.speed_allowed)) -%}
```

### air_goal - L79

[Исходник](../controller/air-goals.jinja#L79) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set can_command = speed or power -%}
```

### air_goal - L80

[Исходник](../controller/air-goals.jinja#L80) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- if target > 0 and not p.speed_allowed -%}
```

### air_goal - L82

[Исходник](../controller/air-goals.jinja#L82) | if/elif: 1, inline-if: 0, предикаты: 5

```jinja
{%- elif not p.power_allowed and (target == 0 or p.current_power != 'on') -%}
```

### air_goal - L85

[Исходник](../controller/air-goals.jinja#L85) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if not p.enabled -%}
```

### air_goal - L88

[Исходник](../controller/air-goals.jinja#L88) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- elif p.fault -%}
```

### air_goal - L91

[Исходник](../controller/air-goals.jinja#L91) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif not p.available -%}
```

### air_goal - L95

[Исходник](../controller/air-goals.jinja#L95) | if/elif: 0, inline-if: 0, предикаты: 3

```jinja
{{- {'requested': requested, 'target': target, 'boost_active': boost,
         'can_command': can_command, 'can_set_speed': speed, 'can_set_power': power,
         'reason': reason, 'limited': limited, 'mode': mode,
         'requires_shutdown': p.fault and p.available and p.current_power != 'off',
         'notify': p.fault}|tojson -}}
```

## comfort-preferences.jinja

### comfort_preferences - L5

[Исходник](../controller/comfort-preferences.jinja#L5) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set n = namespace(valid=p is mapping, requests={}, caps={}, reasons={}) -%}
```

### comfort_preferences - L6

[Исходник](../controller/comfort-preferences.jinja#L6) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- if n.valid -%}
```

### comfort_preferences - L9

[Исходник](../controller/comfort-preferences.jinja#L9) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### comfort_preferences - L11

[Исходник](../controller/comfort-preferences.jinja#L11) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (0 <= value <= 100) -%}
```

### comfort_preferences - L18

[Исходник](../controller/comfort-preferences.jinja#L18) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### comfort_preferences - L20

[Исходник](../controller/comfort-preferences.jinja#L20) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- elif not (0 <= value <= 1000000) or value != value|int -%}
```

### comfort_preferences - L22

[Исходник](../controller/comfort-preferences.jinja#L22) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- elif suffix == 'max' and value == 0 -%}
```

### comfort_preferences - L30

[Исходник](../controller/comfort-preferences.jinja#L30) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### comfort_preferences - L32

[Исходник](../controller/comfort-preferences.jinja#L32) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- elif not (0 <= value <= 1000000) or value != value|int -%}
```

### comfort_preferences - L34

[Исходник](../controller/comfort-preferences.jinja#L34) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- elif suffix == 'adjustment_steps' and value == 0 -%}
```

### comfort_preferences - L39

[Исходник](../controller/comfort-preferences.jinja#L39) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- if n.valid -%}
```

### comfort_preferences - L41

[Исходник](../controller/comfort-preferences.jinja#L41) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if p[axis ~ '_base'] > p[axis ~ '_max'] -%}
```

### comfort_preferences - L46

[Исходник](../controller/comfort-preferences.jinja#L46) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if p[axis ~ '_need'] > p[axis ~ '_max'] -%}
```

### comfort_preferences - L52

[Исходник](../controller/comfort-preferences.jinja#L52) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if not n.valid -%}
```

### comfort_preferences - L64

[Исходник](../controller/comfort-preferences.jinja#L64) | if/elif: 0, inline-if: 1, предикаты: 3

```jinja
{%- set floor = 1 if p[axis ~ '_base'] > 0 or p[axis ~ '_need'] > 0 else 0 -%}
```

### comfort_preferences - L67

[Исходник](../controller/comfort-preferences.jinja#L67) | if/elif: 0, inline-if: 3, предикаты: 3

```jinja
{%- set reason = 'sensor_need' if p[axis ~ '_need'] > preferred else
                       'prefer_more' if adjustment > 0 else
                       'prefer_less' if adjustment < 0 else 'neutral' -%}
```

### comfort_preferences - L76

[Исходник](../controller/comfort-preferences.jinja#L76) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{%- set cap = [1, original - reduction] | max if original > 0 else 0 -%}
```

### comfort_preferences - L79

[Исходник](../controller/comfort-preferences.jinja#L79) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{{- {'valid': true, 'error': '', 'fresh_request': n.requests.fresh,
         'clean_request': n.requests.clean, 'ac_fan_request': p.ac_fan_base | int,
         'fresh_noise_cap': n.caps.fresh, 'clean_noise_cap': n.caps.clean,
         'ac_fan_cap': n.caps.ac_fan,
         'reasons': dict(n.reasons, quiet='prefer_quiet' if p.quiet > 0 else 'neutral')} | tojson -}}
```

### comfort_transition - L91

[Исходник](../controller/comfort-preferences.jinja#L91) | if/elif: 1, inline-if: 0, предикаты: 5

```jinja
{%- if state is not mapping or event is not mapping -%}
```

### comfort_transition - L96

[Исходник](../controller/comfort-preferences.jinja#L96) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### comfort_transition - L98

[Исходник](../controller/comfort-preferences.jinja#L98) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- elif not (0 <= value <= 100) or value % 5 != 0 -%}
```

### comfort_transition - L102

[Исходник](../controller/comfort-preferences.jinja#L102) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if event.get('type') not in ['set', 'reset'] -%}
```

### comfort_transition - L104

[Исходник](../controller/comfort-preferences.jinja#L104) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif event.type == 'set' -%}
```

### comfort_transition - L105

[Исходник](../controller/comfort-preferences.jinja#L105) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if event.get('axis') not in ['fresh', 'clean', 'quiet'] -%}
```

### comfort_transition - L109

[Исходник](../controller/comfort-preferences.jinja#L109) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### comfort_transition - L111

[Исходник](../controller/comfort-preferences.jinja#L111) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- elif not (0 <= value <= 100) or value % 5 != 0 -%}
```

### comfort_transition - L115

[Исходник](../controller/comfort-preferences.jinja#L115) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if n.error == '' -%}
```

### comfort_transition - L116

[Исходник](../controller/comfort-preferences.jinja#L116) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{%- set n.result = dict(state, fresh=50, clean=50, quiet=0) if event.type == 'reset'
                         else dict(state, **{event.axis: event.value}) -%}
```

### comfort_transition - L120

[Исходник](../controller/comfort-preferences.jinja#L120) | if/elif: 0, inline-if: 0, предикаты: 4

```jinja
{{- {'valid': n.error == '', 'error': n.error, 'state': n.result,
       'changed': n.error == '' and n.result != state} | tojson -}}
```

## command-guards.jinja

### command_guard - L3

[Исходник](../controller/command-guards.jinja#L3) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set n = namespace(valid=p is mapping, allowed=false, reason='invalid_input', safety=false) -%}
```

### command_guard - L4

[Исходник](../controller/command-guards.jinja#L4) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- if n.valid -%}
```

### command_guard - L6

[Исходник](../controller/command-guards.jinja#L6) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if p.get(key) is not boolean -%} {%- set n.valid = false -%} {%- endif -%}
```

### command_guard - L9

[Исходник](../controller/command-guards.jinja#L9) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if p.get(key) not in ['on', 'off', 'unknown'] -%} {%- set n.valid = false -%} {%- endif -%}
```

### command_guard - L11

[Исходник](../controller/command-guards.jinja#L11) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if p.get('parameter_lock') not in ['', 'on', 'off', 'unknown'] -%} {%- set n.valid = false -%} {%- endif -%}
```

### command_guard - L13

[Исходник](../controller/command-guards.jinja#L13) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- if n.valid -%}
```

### command_guard - L14

[Исходник](../controller/command-guards.jinja#L14) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if p.fault_shutdown and not p.stopping -%}
```

### command_guard - L16

[Исходник](../controller/command-guards.jinja#L16) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif not p.available -%}
```

### command_guard - L18

[Исходник](../controller/command-guards.jinja#L18) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- elif p.fault_shutdown -%}
```

### command_guard - L19

[Исходник](../controller/command-guards.jinja#L19) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if p.explicit_error and p.latched -%}
```

### command_guard - L25

[Исходник](../controller/command-guards.jinja#L25) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not p.automatic and p.stopping -%}
```

### command_guard - L27

[Исходник](../controller/command-guards.jinja#L27) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif not p.eligible -%}
```

### command_guard - L29

[Исходник](../controller/command-guards.jinja#L29) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif not p.automatic -%}
```

### command_guard - L31

[Исходник](../controller/command-guards.jinja#L31) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif not p.master_enabled -%}
```

### command_guard - L33

[Исходник](../controller/command-guards.jinja#L33) | if/elif: 1, inline-if: 0, предикаты: 10

```jinja
{%- elif p.power_lock != 'off' and not (p.power_lock == 'on' and p.saved_power == 'on' and p.current_power == 'on' and not p.stopping) -%}
```

### command_guard - L35

[Исходник](../controller/command-guards.jinja#L35) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif p.parameter_lock not in ['', 'off'] -%}
```

## control-dynamics.jinja

### critical_hysteresis - L4

[Исходник](../controller/control-dynamics.jinja#L4) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set n=namespace(valid=p is mapping) -%}
```

### critical_hysteresis - L5

[Исходник](../controller/control-dynamics.jinja#L5) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- if n.valid -%}
```

### critical_hysteresis - L7

[Исходник](../controller/control-dynamics.jinja#L7) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if p.get(key) is not boolean -%} {%- set n.valid=false -%} {%- endif -%}
```

### critical_hysteresis - L10

[Исходник](../controller/control-dynamics.jinja#L10) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if p.get(key) not in ['on','off','unknown'] -%} {%- set n.valid=false -%} {%- endif -%}
```

### critical_hysteresis - L14

[Исходник](../controller/control-dynamics.jinja#L14) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### critical_hysteresis - L16

[Исходник](../controller/control-dynamics.jinja#L16) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (-1000000000000 <= value <= 1000000000000) -%}
```

### critical_hysteresis - L20

[Исходник](../controller/control-dynamics.jinja#L20) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if n.valid and (p.dwell <= 0 or p.release_dwell <= 0) -%}
```

### critical_hysteresis - L24

[Исходник](../controller/control-dynamics.jinja#L24) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if not n.valid -%}
```

### critical_hysteresis - L28

[Исходник](../controller/control-dynamics.jinja#L28) | if/elif: 0, inline-if: 0, предикаты: 25

```jinja
{{- {'valid':true,
         'start_pending':p.above and p.pending!='on',
         'cancel_pending':not p.above and p.pending!='off',
         'activate':p.above and p.pending=='on' and p.elapsed>=p.dwell and p.active!='on',
         'start_clear':p.valid and p['clear'] and p.clear_pending!='on',
         'cancel_clear':not p['clear'] and p.clear_pending!='off',
         'release':(not p.valid or (p['clear'] and p.clear_pending=='on' and p.clear_elapsed>=p.release_dwell)) and p.active!='off'}|tojson -}}
```

### supply_pi - L39

[Исходник](../controller/control-dynamics.jinja#L39) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set n=namespace(valid=p is mapping) -%}
```

### supply_pi - L40

[Исходник](../controller/control-dynamics.jinja#L40) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- if n.valid -%}
```

### supply_pi - L42

[Исходник](../controller/control-dynamics.jinja#L42) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if p.get(key) is not boolean -%} {%- set n.valid=false -%} {%- endif -%}
```

### supply_pi - L46

[Исходник](../controller/control-dynamics.jinja#L46) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### supply_pi - L48

[Исходник](../controller/control-dynamics.jinja#L48) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (-1000000 <= value <= 1000000) -%}
```

### supply_pi - L53

[Исходник](../controller/control-dynamics.jinja#L53) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{%- set tuning=p.get('tuning',{}) if p is mapping else {} -%}
```

### supply_pi - L58

[Исходник](../controller/control-dynamics.jinja#L58) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if tuning is not mapping -%}
```

### supply_pi - L63

[Исходник](../controller/control-dynamics.jinja#L63) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### supply_pi - L65

[Исходник](../controller/control-dynamics.jinja#L65) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (-1000000 <= value <= 1000000) -%}
```

### supply_pi - L70

[Исходник](../controller/control-dynamics.jinja#L70) | if/elif: 1, inline-if: 0, предикаты: 25

```jinja
{%- if n.valid and (cfg.values.supply_min>=cfg.values.supply_max
          or cfg.values.integral_min>cfg.values.integral_max
          or cfg.values.kp<0 or cfg.values.ki<0 or cfg.values.deadband<0
          or cfg.values.max_dt_minutes<0 or cfg.values.max_step<0
          or cfg.values.supply_min!=cfg.values.supply_min|int
          or cfg.values.supply_max!=cfg.values.supply_max|int
          or cfg.values.max_step!=cfg.values.max_step|int
          or p.current!=p.current|int
          or not cfg.values.supply_min<=p.current<=cfg.values.supply_max) -%}
```

### supply_pi - L82

[Исходник](../controller/control-dynamics.jinja#L82) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if not n.valid -%}
```

### supply_pi - L86

[Исходник](../controller/control-dynamics.jinja#L86) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{%- set old_i=0 if p.reset else p.old_i -%}
```

### supply_pi - L88

[Исходник](../controller/control-dynamics.jinja#L88) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{%- set dt=0 if p.force else [cfg.values.max_dt_minutes,elapsed/60]|min -%}
```

### supply_pi - L90

[Исходник](../controller/control-dynamics.jinja#L90) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{%- set candidate_i=[[old_i+(cfg.values.ki*error*dt if error|abs>cfg.values.deadband else 0),cfg.values.integral_min]|max,cfg.values.integral_max]|min -%}
```

### supply_pi - L92

[Исходник](../controller/control-dynamics.jinja#L92) | if/elif: 0, inline-if: 1, предикаты: 7

```jinja
{%- set new_i=old_i if (candidate_raw>cfg.values.supply_max and error>0) or (candidate_raw<cfg.values.supply_min and error<0) else candidate_i -%}
```

### supply_pi - L96

[Исходник](../controller/control-dynamics.jinja#L96) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{%- set command=requested if p.force else [[requested,current-cfg.values.max_step]|max,current+cfg.values.max_step]|min|round(0)|int -%}
```

## device-health.jinja

### _boolean - L3

[Исходник](../controller/device-health.jinja#L3) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- if value is sameas true or value is sameas false -%}
```

### _boolean - L5

[Исходник](../controller/device-health.jinja#L5) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- elif value is string and value | lower | trim in ['true', 'on', '1', 'false', 'off', '0'] -%}
```

### _boolean - L6

[Исходник](../controller/device-health.jinja#L6) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{{- (value | lower | trim in ['true', 'on', '1']) | to_json -}}
```

### _boolean - L7

[Исходник](../controller/device-health.jinja#L7) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- elif value is number and value in [0, 1] -%}
```

### _boolean - L8

[Исходник](../controller/device-health.jinja#L8) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{{- (value == 1) | to_json -}}
```

### _availability - L13

[Исходник](../controller/device-health.jinja#L13) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- if value is string and value | lower | trim in ['available', 'unavailable'] -%}
```

### _availability - L17

[Исходник](../controller/device-health.jinja#L17) | if/elif: 0, inline-if: 2, предикаты: 2

```jinja
{{- ('available' if boolean is sameas true else 'unavailable' if boolean is sameas false else 'unknown') | to_json -}}
```

### _power - L23

[Исходник](../controller/device-health.jinja#L23) | if/elif: 0, inline-if: 2, предикаты: 2

```jinja
{{- ('on' if boolean is sameas true else 'off' if boolean is sameas false else 'unknown') | to_json -}}
```

### device_health - L27

[Исходник](../controller/device-health.jinja#L27) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{%- set p = p if p is mapping else {} -%}
```

### device_health - L34

[Исходник](../controller/device-health.jinja#L34) | if/elif: 0, inline-if: 0, предикаты: 9

```jinja
{%- set state_valid = latched is not none and attempted is not none and not (attempted and not latched) -%}
```

### device_health - L35

[Исходник](../controller/device-health.jinja#L35) | if/elif: 0, inline-if: 0, предикаты: 3

```jinja
{%- set explicit_error = known is sameas true and active is sameas true -%}
```

### device_health - L36

[Исходник](../controller/device-health.jinja#L36) | if/elif: 0, inline-if: 0, предикаты: 3

```jinja
{%- set known_clear = known is sameas true and active is sameas false -%}
```

### device_health - L37

[Исходник](../controller/device-health.jinja#L37) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set available = availability == 'available' -%}
```

### device_health - L38

[Исходник](../controller/device-health.jinja#L38) | if/elif: 0, inline-if: 0, предикаты: 4

```jinja
{%- set healthy = available and known_clear and state_valid and latched is sameas false -%}
```

### device_health - L39

[Исходник](../controller/device-health.jinja#L39) | if/elif: 0, inline-if: 0, предикаты: 6

```jinja
{%- set shutdown = explicit_error and available and state_valid and attempted is sameas false and power != 'off' -%}
```

### device_health - L40

[Исходник](../controller/device-health.jinja#L40) | if/elif: 0, inline-if: 0, предикаты: 2

```jinja
{%- set fault = explicit_error or latched is sameas true -%}
```

### device_health - L41

[Исходник](../controller/device-health.jinja#L41) | if/elif: 0, inline-if: 4, предикаты: 6

```jinja
{%- set condition = 'error' if explicit_error else 'unavailable' if availability == 'unavailable' else 'health_unknown' if not available or not known_clear or not state_valid else 'recovery_required' if latched else 'healthy' -%}
```

### device_health - L42

[Исходник](../controller/device-health.jinja#L42) | if/elif: 0, inline-if: 3, предикаты: 4

```jinja
{%- set confirmation = 'not_required' if not fault else 'confirmed' if available and power == 'off' else 'not_confirmed' if attempted is sameas true else 'not_requested' -%}
```

### device_health - L43

[Исходник](../controller/device-health.jinja#L43) | if/elif: 0, inline-if: 3, предикаты: 2

```jinja
{%- set notice = 'device_error' if fault else 'device_unavailable' if condition == 'unavailable' else 'health_unknown' if condition == 'health_unknown' else '' -%}
```

### device_health - L44

[Исходник](../controller/device-health.jinja#L44) | if/elif: 0, inline-if: 2, предикаты: 11

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

### health_transition - L70

[Исходник](../controller/device-health.jinja#L70) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{%- set s = s if s is mapping else {} -%}
```

### health_transition - L71

[Исходник](../controller/device-health.jinja#L71) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{%- set event = event if event is mapping else {} -%}
```

### health_transition - L74

[Исходник](../controller/device-health.jinja#L74) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set supported = kind in ['observe', 'acknowledge', 'restart', 'shutdown_result'] -%}
```

### health_transition - L76

[Исходник](../controller/device-health.jinja#L76) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if supported and kind != 'restart' -%}
```

### health_transition - L78

[Исходник](../controller/device-health.jinja#L78) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if kind == 'observe' -%}
```

### health_transition - L80

[Исходник](../controller/device-health.jinja#L80) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif kind in ['acknowledge', 'shutdown_result'] -%}
```

### health_transition - L82

[Исходник](../controller/device-health.jinja#L82) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if key in event -%} {%- set ns.state = dict(ns.state, **{key: event[key]}) -%} {%- endif -%}
```

### health_transition - L86

[Исходник](../controller/device-health.jinja#L86) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if current.explicit_error and current.state_valid -%}
```

### health_transition - L90

[Исходник](../controller/device-health.jinja#L90) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if kind == 'acknowledge' -%}
```

### health_transition - L91

[Исходник](../controller/device-health.jinja#L91) | if/elif: 1, inline-if: 0, предикаты: 0

```jinja
{%- if current.acknowledgement_allowed -%}
```

### health_transition - L99

[Исходник](../controller/device-health.jinja#L99) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if current.shutdown_required and kind != 'shutdown_result' -%}
```

### health_transition - L106

[Исходник](../controller/device-health.jinja#L106) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set changed = before.notification != after.notification -%}
```

### health_transition - L107

[Исходник](../controller/device-health.jinja#L107) | if/elif: 0, inline-if: 0, предикаты: 10

```jinja
{{- {
    'state': ns.state,
    'health': after,
    'effects': {
      'shutdown': ns.shutdown,
      'override_manual_power': ns.shutdown,
      'notify': supported and kind != 'restart' and changed and after.notification.required,
      'clear_notification': supported and kind != 'restart' and before.notification.required and not after.notification.required,
      'acknowledgement': ns.acknowledge,
      'unsupported_event': not supported
    }
  } | to_json -}}
```

## intent-transition.jinja

### intent_transition - L8

[Исходник](../controller/intent-transition.jinja#L8) | if/elif: 1, inline-if: 0, предикаты: 8

```jinja
{%- if state is not mapping or event is not mapping or policy is not mapping -%}
```

### intent_transition - L11

[Исходник](../controller/intent-transition.jinja#L11) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if state.get('mode') not in modes or state.get('master') is not boolean -%}
```

### intent_transition - L16

[Исходник](../controller/intent-transition.jinja#L16) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if channel is not mapping -%}
```

### intent_transition - L19

[Исходник](../controller/intent-transition.jinja#L19) | if/elif: 1, inline-if: 0, предикаты: 5

```jinja
{%- if channel.get('automatic') is not boolean or channel.get('active') is not boolean -%}
```

### intent_transition - L23

[Исходник](../controller/intent-transition.jinja#L23) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### intent_transition - L25

[Исходник](../controller/intent-transition.jinja#L25) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (0 <= value <= 100) -%}
```

### intent_transition - L29

[Исходник](../controller/intent-transition.jinja#L29) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if deadline is not number or deadline is boolean -%}
```

### intent_transition - L31

[Исходник](../controller/intent-transition.jinja#L31) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (0 <= deadline <= 1000000000000) -%}
```

### intent_transition - L36

[Исходник](../controller/intent-transition.jinja#L36) | if/elif: 1, inline-if: 0, предикаты: 6

```jinja
{%- if policy.get('maximum_return') not in modes or policy.get('maximum_return') == 'maximum' or policy.get('profiles') is not mapping -%}
```

### intent_transition - L40

[Исходник](../controller/intent-transition.jinja#L40) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if kind not in ['goal_set', 'goal_auto', 'boost_start', 'boost_cancel', 'tick', 'master', 'profile'] -%}
```

### intent_transition - L43

[Исходник](../controller/intent-transition.jinja#L43) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- if kind in ['goal_set', 'goal_auto', 'boost_start', 'boost_cancel'] and event.get('axis') not in axes -%}
```

### intent_transition - L46

[Исходник](../controller/intent-transition.jinja#L46) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if kind == 'goal_set' -%}
```

### intent_transition - L48

[Исходник](../controller/intent-transition.jinja#L48) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if value is not number or value is boolean -%}
```

### intent_transition - L50

[Исходник](../controller/intent-transition.jinja#L50) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- elif not (0 <= value <= 100) or value % 5 != 0 -%}
```

### intent_transition - L53

[Исходник](../controller/intent-transition.jinja#L53) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- elif kind == 'goal_auto' and event.get('automatic') is not boolean -%}
```

### intent_transition - L55

[Исходник](../controller/intent-transition.jinja#L55) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- elif kind == 'master' and event.get('enabled') is not boolean -%}
```

### intent_transition - L58

[Исходник](../controller/intent-transition.jinja#L58) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if kind in ['boost_start', 'tick', 'profile'] -%}
```

### intent_transition - L60

[Исходник](../controller/intent-transition.jinja#L60) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{%- if now is not number or now is boolean -%}
```

### intent_transition - L62

[Исходник](../controller/intent-transition.jinja#L62) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (0 <= now <= 999999999100) -%}
```

### intent_transition - L66

[Исходник](../controller/intent-transition.jinja#L66) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if kind == 'boost_start' -%}
```

### intent_transition - L67

[Исходник](../controller/intent-transition.jinja#L67) | if/elif: 1, inline-if: 0, предикаты: 6

```jinja
{%- if event.get('duration') is not number or event.get('duration') is boolean or event.get('duration') not in [10, 15] -%}
```

### intent_transition - L69

[Исходник](../controller/intent-transition.jinja#L69) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif event.get('eligible') is not boolean -%}
```

### intent_transition - L72

[Исходник](../controller/intent-transition.jinja#L72) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif kind == 'profile' -%}
```

### intent_transition - L73

[Исходник](../controller/intent-transition.jinja#L73) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if event.get('mode') not in modes -%}
```

### intent_transition - L75

[Исходник](../controller/intent-transition.jinja#L75) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- elif event.get('mode') != 'maximum' and policy.get('profiles') is mapping -%}
```

### intent_transition - L77

[Исходник](../controller/intent-transition.jinja#L77) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if profile is not mapping -%}
```

### intent_transition - L82

[Исходник](../controller/intent-transition.jinja#L82) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- if baseline is not mapping -%}
```

### intent_transition - L86

[Исходник](../controller/intent-transition.jinja#L86) | if/elif: 1, inline-if: 0, предикаты: 7

```jinja
{%- if baseline.get('automatic') is not boolean or value is not number or value is boolean -%}
```

### intent_transition - L88

[Исходник](../controller/intent-transition.jinja#L88) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif not (0 <= value <= 100) -%}
```

### intent_transition - L97

[Исходник](../controller/intent-transition.jinja#L97) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{%- if n.error == '' and kind == 'boost_start' -%}
```

### intent_transition - L98

[Исходник](../controller/intent-transition.jinja#L98) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if not state.master -%}
```

### intent_transition - L100

[Исходник](../controller/intent-transition.jinja#L100) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif state.mode == 'maximum' -%}
```

### intent_transition - L102

[Исходник](../controller/intent-transition.jinja#L102) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif not event.eligible -%}
```

### intent_transition - L104

[Исходник](../controller/intent-transition.jinja#L104) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{%- elif state[event.axis].active and state[event.axis].deadline > event.now -%}
```

### intent_transition - L108

[Исходник](../controller/intent-transition.jinja#L108) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if n.error == '' -%}
```

### intent_transition - L110

[Исходник](../controller/intent-transition.jinja#L110) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if kind == 'goal_set' -%}
```

### intent_transition - L113

[Исходник](../controller/intent-transition.jinja#L113) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if state.mode == 'maximum' -%} {%- set n.result = dict(n.result, mode=policy.maximum_return) -%} {%- endif -%}
```

### intent_transition - L114

[Исходник](../controller/intent-transition.jinja#L114) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif kind == 'goal_auto' -%}
```

### intent_transition - L116

[Исходник](../controller/intent-transition.jinja#L116) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if state.mode == 'maximum' -%} {%- set n.result = dict(n.result, mode=policy.maximum_return) -%} {%- endif -%}
```

### intent_transition - L117

[Исходник](../controller/intent-transition.jinja#L117) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif kind == 'boost_start' -%}
```

### intent_transition - L119

[Исходник](../controller/intent-transition.jinja#L119) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif kind == 'boost_cancel' -%}
```

### intent_transition - L121

[Исходник](../controller/intent-transition.jinja#L121) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif kind == 'tick' -%}
```

### intent_transition - L123

[Исходник](../controller/intent-transition.jinja#L123) | if/elif: 1, inline-if: 0, предикаты: 5

```jinja
{%- if not state[axis].active or state[axis].deadline <= event.now or not state.master -%}
```

### intent_transition - L127

[Исходник](../controller/intent-transition.jinja#L127) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif kind == 'master' -%}
```

### intent_transition - L129

[Исходник](../controller/intent-transition.jinja#L129) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- if not event.enabled -%}
```

### intent_transition - L134

[Исходник](../controller/intent-transition.jinja#L134) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{%- elif kind == 'profile' -%}
```

### intent_transition - L137

[Исходник](../controller/intent-transition.jinja#L137) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{%- set baseline = {} if event.mode == 'maximum' else {'automatic': policy.profiles[event.mode][axis].automatic, 'value': policy.profiles[event.mode][axis].value} -%}
```

### intent_transition - L142

[Исходник](../controller/intent-transition.jinja#L142) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{%- set n.changed = n.result != state -%}
```

### intent_transition - L145

[Исходник](../controller/intent-transition.jinja#L145) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{{- {'valid': n.error == '', 'error': n.error, 'state': n.result, 'changed': n.changed} | to_json -}}
```

## legacy-policy.jinja

### legacy_context - L7

[Исходник](../controller/legacy-policy.jinja#L7) | if/elif: 0, inline-if: 2, предикаты: 2

```jinja
{% set ttl=p['values']['context_' ~ ('sleep' if key in ['sleep','confidence'] else 'presence' if key=='presence' else 'active') ~ '_ttl'] | int(300) %}
```

### legacy_context - L8

[Исходник](../controller/legacy-policy.jinja#L8) | if/elif: 0, inline-if: 0, предикаты: 6

```jinja
{% set valid=item.available and 0 <= item.age and (key=='worn' or item.age <= ttl) %}
```

### legacy_context - L9

[Исходник](../controller/legacy-policy.jinja#L9) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set src_ns.items=dict(src_ns.items,**{key:{'valid':valid,'value':item.value | string | lower if valid else 'unknown','age':item.age | int,'changed':item.changed}}) %}
```

### legacy_context - L15

[Исходник](../controller/legacy-policy.jinja#L15) | if/elif: 0, inline-if: 0, предикаты: 5

```jinja
{% set watch_usable=watch.valid and (not p.worn_configured or (worn.valid and worn.value=='on')) %}
```

### legacy_context - L16

[Исходник](../controller/legacy-policy.jinja#L16) | if/elif: 0, inline-if: 0, предикаты: 2

```jinja
{% set active=phone.valid and phone.value=='on' %}
```

### legacy_context - L17

[Исходник](../controller/legacy-policy.jinja#L17) | if/elif: 0, inline-if: 0, предикаты: 9

```jinja
{% set asleep=(watch_usable and watch.value in ['on','asleep','sleeping']) or (confidence.valid and is_number(confidence.value) and 0 <= confidence.value | float <= 100 and confidence.value | float >= p['values']['sleep_confidence_threshold'] | float(85)) %}
```

### legacy_context - L18

[Исходник](../controller/legacy-policy.jinja#L18) | if/elif: 0, inline-if: 0, предикаты: 3

```jinja
{% set awake=active or (watch_usable and watch.value in ['off','awake','passive','exercise']) %}
```

### legacy_context - L19

[Исходник](../controller/legacy-policy.jinja#L19) | if/elif: 0, inline-if: 3, предикаты: 1

```jinja
{% set sleep='conflict' if asleep and awake else 'asleep' if asleep else 'awake' if awake else 'unknown' %}
```

### legacy_context - L20

[Исходник](../controller/legacy-policy.jinja#L20) | if/elif: 0, inline-if: 0, предикаты: 2

```jinja
{% set present=presence.valid and presence.value in ['on','present','occupied'] %}
```

### legacy_context - L21

[Исходник](../controller/legacy-policy.jinja#L21) | if/elif: 0, inline-if: 0, предикаты: 4

```jinja
{% set absent=presence.valid and presence.value in ['off','absent','clear'] and presence.changed >= p['values']['absence_dwell'] | int(900) %}
```

### legacy_context - L23

[Исходник](../controller/legacy-policy.jinja#L23) | if/elif: 0, inline-if: 1, предикаты: 5

```jinja
{% set night=(p.hour>=start or p.hour<end) if start>=end else (start<=p.hour<end) %}
```

### legacy_context - L24

[Исходник](../controller/legacy-policy.jinja#L24) | if/elif: 0, inline-if: 4, предикаты: 2

```jinja
{% set profile='absent' if absent else 'sleep' if sleep in ['asleep','conflict'] else 'awake' if sleep=='awake' else 'night_unknown' if night else 'unknown' %}
```

### legacy_context - L25

[Исходник](../controller/legacy-policy.jinja#L25) | if/elif: 0, inline-if: 3, предикаты: 3

```jinja
{% set pc=p['values']['purifier_max'] if profile=='absent' else p['values']['sleep_purifier_cap'] | int(1) if profile in ['sleep','night_unknown'] else p['values']['awake_purifier_cap'] | int(4) if profile=='awake' else p['values']['purifier_quiet_limit'] | int(3) %}
```

### legacy_context - L26

[Исходник](../controller/legacy-policy.jinja#L26) | if/elif: 0, inline-if: 3, предикаты: 3

```jinja
{% set bc=p['values']['breather_max'] if profile=='absent' else p['values']['sleep_breather_cap'] | int(1) if profile in ['sleep','night_unknown'] else p['values']['awake_breather_cap'] | int(4) if profile=='awake' else p['values']['unknown_breather_cap'] | int(3) %}
```

### legacy_context - L27

[Исходник](../controller/legacy-policy.jinja#L27) | if/elif: 0, inline-if: 5, предикаты: 2

```jinja
{% set result={'profile':profile,'sleep':sleep,'presence':'present' if present else 'absent' if absent else 'unknown','night':night,'purifier_cap':pc,'breather_cap':bc,'ac_fan_cap':'high' if profile=='absent' else 'medium' if profile=='awake' else 'low','confidence_available':confidence.valid,'phone_active_available':phone.valid,'watch_available':watch_usable,'watch_worn_available':worn.valid,'watch_worn':worn.value if worn.valid else 'unknown'} %}
```

### legacy_air - L34

[Исходник](../controller/legacy-policy.jinja#L34) | if/elif: 0, inline-if: 0, предикаты: 2

```jinja
{% set full=selected=='Полностью автоматически' %} {% set automatic=selected in ['Автоматически','Полностью автоматически'] %}
```

### legacy_air - L37

[Исходник](../controller/legacy-policy.jinja#L37) | if/elif: 0, inline-if: 0, предикаты: 6

```jinja
{% set co2valid=co2item.available and is_number(co2item.value) and 250 <= co2item.value | float <= 10000 and 0 <= co2item.age <= ttl %}
```

### legacy_air - L38

[Исходник](../controller/legacy-policy.jinja#L38) | if/elif: 0, inline-if: 0, предикаты: 7

```jinja
{% set pmvalid=pmitem.available and is_number(pmitem.value) and 0 <= pmitem.value | float <= 2000 and (p.trust_availability or (0 <= pmitem.age <= ttl)) %}
```

### legacy_air - L40

[Исходник](../controller/legacy-policy.jinja#L40) | if/elif: 0, inline-if: 4, предикаты: 4

```jinja
{% set b=2 if co2<800 else 3 if co2<1000 else 4 if co2<1400 else 5 if co2<1800 else 7 %}
```

### legacy_air - L41

[Исходник](../controller/legacy-policy.jinja#L41) | if/elif: 0, inline-if: 4, предикаты: 4

```jinja
{% set particle_request=1 if pm<=8 else 3 if pm<=15 else 4 if pm<=35 else 7 if pm<=75 else 11 %}
```

### legacy_air - L43

[Исходник](../controller/legacy-policy.jinja#L43) | if/elif: 0, inline-if: 0, предикаты: 2

```jinja
{% set critical_pm=full and pmvalid and p.pm_critical %}
```

### legacy_air - L44

[Исходник](../controller/legacy-policy.jinja#L44) | if/elif: 0, inline-if: 0, предикаты: 2

```jinja
{% set critical_co2=full and co2valid and p.co2_critical %}
```

### legacy_air - L45

[Исходник](../controller/legacy-policy.jinja#L45) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set psoft=[context.purifier_cap,p['values']['critical_purifier_cap'] | int(7)] | max if critical_pm else context.purifier_cap %}
```

### legacy_air - L46

[Исходник](../controller/legacy-policy.jinja#L46) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set bsoft=[context.breather_cap,p['values']['critical_breather_cap'] | int(5)] | max if critical_co2 else context.breather_cap %}
```

### legacy_air - L47

[Исходник](../controller/legacy-policy.jinja#L47) | if/elif: 0, inline-if: 4, предикаты: 3

```jinja
{% set profile=psoft if full else p['values']['purifier_quiet_limit'] | int(3) if selected=='Тихий' else p['values']['purifier_standard_limit'] | int(4) if selected=='Стандартный' else p['values']['purifier_auto_limit'] | int(6) if selected=='Автоматически' else 11 %}
```

### legacy_air - L49

[Исходник](../controller/legacy-policy.jinja#L49) | if/elif: 0, inline-if: 1, предикаты: 5

```jinja
{% set learned=p['values']['purifier_noise_cap'] | int(3) if noise.valid and not(full and (context.profile=='absent' or critical_pm)) else 11 %}
```

### legacy_air - L51

[Исходник](../controller/legacy-policy.jinja#L51) | if/elif: 0, inline-if: 2, предикаты: 2

```jinja
{% set floor=11 if selected=='Максимум' else 2 if selected=='Стандартный' else 1 %}
```

### legacy_air - L52

[Исходник](../controller/legacy-policy.jinja#L52) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set demand=[floor,particle_request if pmvalid else p['values']['invalid_pm_fallback'] | int(3)] | max %}
```

### legacy_air - L53

[Исходник](../controller/legacy-policy.jinja#L53) | if/elif: 0, inline-if: 5, предикаты: 3

```jinja
{% set bdemand=(b if co2valid else 3) if automatic else 3 if selected=='Тихий' else 4 if selected=='Стандартный' else 7 if selected=='Максимум' else 0 %}
```

### legacy_air - L54

[Исходник](../controller/legacy-policy.jinja#L54) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set bcap=[1,[7,bsoft,p['values']['breather_speed_limit'] | int(7)] | min] | max if full else p['values']['breather_speed_limit'] | int(7) %}
```

### legacy_air - L55

[Исходник](../controller/legacy-policy.jinja#L55) | if/elif: 0, inline-if: 5, предикаты: 4

```jinja
{% set fan=('high' if error>=1.5 else 'medium' if error>=0.7 else 'low') if automatic else 'high' if selected=='Максимум' else 'medium' if selected=='Стандартный' else 'low' %}
```

### legacy_air - L56

[Исходник](../controller/legacy-policy.jinja#L56) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set ranks={'low':1,'medium':2,'high':3} %} {% set fcap=context.ac_fan_cap if full else 'high' %}
```

### legacy_air - L57

[Исходник](../controller/legacy-policy.jinja#L57) | if/elif: 0, inline-if: 6, предикаты: 3

```jinja
{% set result={'mode':selected,'breather':[bdemand,bcap] | min,'breather_requested':bdemand,'breather_sensor_requested':b if co2valid else 3,'breather_cap':bcap,'purifier':([demand,cap] | min) if selected!='Отключено' else 'off','purifier_requested':demand,'purifier_cap':cap,'purifier_limited':demand>cap,'ac_fan':fan if ranks[fan]<=ranks[fcap] else fcap,'co2_valid':co2valid,'pm_valid':pmvalid,'co2':co2 if co2valid else 'unknown','pm':pm if pmvalid else 'unknown','critical_pm':critical_pm,'critical_co2':critical_co2,'context':context.profile if full else 'fixed','noise_valid':noise.valid,'noise_configured':noise.configured} %}
```

### legacy_thermal - L81

[Исходник](../controller/legacy-policy.jinja#L81) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{% if ac_mode in ['unknown','unavailable'] %}
```

### legacy_thermal - L83

[Исходник](../controller/legacy-policy.jinja#L83) | if/elif: 1, inline-if: 0, предикаты: 4

```jinja
{% elif not auto_enabled or not room_ok or device_fault %}
```

### legacy_thermal - L84

[Исходник](../controller/legacy-policy.jinja#L84) | if/elif: 0, inline-if: 1, предикаты: 2

```jinja
{% set ns.action='stop' if owned and ac_mode in ['cool','heat'] else 'release' %}
```

### legacy_thermal - L85

[Исходник](../controller/legacy-policy.jinja#L85) | if/elif: 0, inline-if: 2, предикаты: 2

```jinja
{% set ns.reason='Климат-контроль выключен' if not auto_enabled else ('Нет достоверной температуры комнаты' if not room_ok else 'Ошибка кондиционера') %}
```

### legacy_thermal - L86

[Исходник](../controller/legacy-policy.jinja#L86) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{% elif supply_conflict and measured > desired + 0.1 %}
```

### legacy_thermal - L87

[Исходник](../controller/legacy-policy.jinja#L87) | if/elif: 0, inline-if: 1, предикаты: 2

```jinja
{% set ns.action='stop' if owned and ac_mode == 'cool' else 'release' %} {% set ns.reason='Охлаждение приостановлено: закреплён нагрев притока' %}
```

### legacy_thermal - L88

[Исходник](../controller/legacy-policy.jinja#L88) | if/elif: 1, inline-if: 0, предикаты: 5

```jinja
{% elif ac_mode not in ['off','cool','heat'] and not (ac_mode == 'fan_only' and maximum_fan_only) %}
```

### legacy_thermal - L90

[Исходник](../controller/legacy-policy.jinja#L90) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{% elif owned and ac_mode not in ['cool','heat'] %}
```

### legacy_thermal - L92

[Исходник](../controller/legacy-policy.jinja#L92) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{% elif ac_mode in ['cool','heat'] %}
```

### legacy_thermal - L94

[Исходник](../controller/legacy-policy.jinja#L94) | if/elif: 1, inline-if: 0, предикаты: 7

```jinja
{% if (ac_mode == 'cool' and measured <= desired - 0.5) or (ac_mode == 'heat' and measured >= desired + 0.5) %}
```

### legacy_thermal - L95

[Исходник](../controller/legacy-policy.jinja#L95) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set ns.action='stop' if owned else 'adopt' %} {% set ns.reason='Температура вышла за защитный порог' %}
```

### legacy_thermal - L96

[Исходник](../controller/legacy-policy.jinja#L96) | if/elif: 1, inline-if: 0, предикаты: 10

```jinja
{% elif owned and since_change >= 300 and ((ac_mode == 'cool' and measured <= desired + 0.1) or (ac_mode == 'heat' and measured >= desired - 0.1)) %}
```

### legacy_thermal - L99

[Исходник](../controller/legacy-policy.jinja#L99) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set ns.action='maintain' if owned else 'adopt' %}
```

### legacy_thermal - L100

[Исходник](../controller/legacy-policy.jinja#L100) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{% set ns.reason='Охлаждение' if ac_mode == 'cool' else 'Обогрев' %}
```

### legacy_thermal - L102

[Исходник](../controller/legacy-policy.jinja#L102) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{% elif measured >= desired + 0.7 %}
```

### legacy_thermal - L103

[Исходник](../controller/legacy-policy.jinja#L103) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{% set ns.mode='cool' %} {% set ns.action='start' if since_change >= 300 else 'wait' %}
```

### legacy_thermal - L104

[Исходник](../controller/legacy-policy.jinja#L104) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{% set ns.reason='Охлаждение' if since_change >= 300 else 'Пауза перед пуском' %}
```

### legacy_thermal - L105

[Исходник](../controller/legacy-policy.jinja#L105) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{% elif measured <= desired - 0.7 and breather_at_limit %}
```

### legacy_thermal - L107

[Исходник](../controller/legacy-policy.jinja#L107) | if/elif: 0, inline-if: 1, предикаты: 2

```jinja
{% set ns.action='start' if since_change >= 300 and heating_ready else 'wait' %}
```

### legacy_thermal - L108

[Исходник](../controller/legacy-policy.jinja#L108) | if/elif: 0, inline-if: 1, предикаты: 1

```jinja
{% set ns.reason='Помощь бризеру: обогрев' if ns.action == 'start' else 'Ожидание: бризер / защитная пауза' %}
```

### legacy_thermal - L110

[Исходник](../controller/legacy-policy.jinja#L110) | if/elif: 0, inline-if: 1, предикаты: 0

```jinja
{% set offset = [[native_room - measured,-3] | max,3] | min if native_room_ok else 0 %}
```

### legacy_thermal - L114

[Исходник](../controller/legacy-policy.jinja#L114) | if/elif: 1, inline-if: 0, предикаты: 1

```jinja
{% if plan.action in ['start','adopt'] %}
```

### legacy_thermal - L115

[Исходник](../controller/legacy-policy.jinja#L115) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{% set ns.value=plan.target %} {% set ns.send=current_target != plan.target %} {% set ns.reason='Начало цикла' %}
```

### legacy_thermal - L116

[Исходник](../controller/legacy-policy.jinja#L116) | if/elif: 1, inline-if: 0, предикаты: 2

```jinja
{% elif plan.action == 'maintain' and target_changed %}
```

### legacy_thermal - L117

[Исходник](../controller/legacy-policy.jinja#L117) | if/elif: 0, inline-if: 0, предикаты: 1

```jinja
{% set ns.value=plan.target %} {% set ns.send=current_target != plan.target %} {% set ns.reason='Новая цель комнаты' %}
```

### legacy_thermal - L118

[Исходник](../controller/legacy-policy.jinja#L118) | if/elif: 1, inline-if: 0, предикаты: 3

```jinja
{% elif plan.action == 'maintain' and since_target >= 600 %}
```

### legacy_thermal - L119

[Исходник](../controller/legacy-policy.jinja#L119) | if/elif: 1, inline-if: 0, предикаты: 5

```jinja
{% if plan.mode == 'cool' and measured >= desired + 0.5 and plan.target < cycle_target %}
```

### legacy_thermal - L121

[Исходник](../controller/legacy-policy.jinja#L121) | if/elif: 1, inline-if: 0, предикаты: 5

```jinja
{% elif plan.mode == 'heat' and measured <= desired - 0.5 and plan.target > cycle_target %}
```
