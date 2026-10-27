import test from 'node:test';
import assert from 'node:assert/strict';
import {automationTrustState,automationTrustReady,automationTrustScope} from '../src/quick-controls.js';
import {runtimeSafetyReady,validateRuntimeSafety} from '../src/ha.js';
const config={entities:{enabled:'input_boolean.master'},automation_reset:{lock_entities:['input_boolean.a','input_boolean.b']}};
const hass=(master='on',a='off',b='off')=>({states:{'input_boolean.master':{state:master},'input_boolean.a':{state:a},'input_boolean.b':{state:b}}});
test('all trusted requires enabled master and every known unlocked permission',()=>{
  assert.equal(automationTrustState(hass(),config),'all');
  assert.equal(automationTrustState(hass('off'),config),'partial');
  assert.equal(automationTrustState(hass('on','on'),config),'partial');
  for(const value of ['unknown','unavailable','invalid'])assert.equal(automationTrustState(hass('on','off',value),config),'unknown');
  assert.equal(automationTrustState(hass('unavailable'),config),'unknown');
  assert.equal(automationTrustState({states:{}},config),'unknown');
});
test('missing permissions never appear fully trusted; groups can supply permission entities',()=>{
  assert.equal(automationTrustState(hass(),{entities:config.entities}),'unknown');
  assert.equal(automationTrustState(hass(),{...config,automation_reset:{lock_entities:[]}}),'unknown');
  const grouped={entities:config.entities,automation_groups:[{controls:[{lock_entity:'input_boolean.a'},{lock_entity:'input_boolean.b'}]}]};
  assert.equal(automationTrustState(hass(),grouped),'all');
  assert.equal(automationTrustState(hass('on','off','on'),grouped),'partial');
});
test('device eligibility switches also have to be explicitly enabled',()=>{
  const c={...config,automation_reset:{...config.automation_reset,enabled_entities:['input_boolean.use_device']}};
  for(const [state,result] of [['on','all'],['off','partial'],['unavailable','unknown']])assert.equal(automationTrustState({states:{...hass().states,'input_boolean.use_device':{state}}},c),result);
});
test('opt-in readiness prevents falsely reporting that automation is active',()=>{const c={...config,automation_reset:{...config.automation_reset,runtime_ready_entity:'input_boolean.ready'}};for(const status of ['off','unknown','unavailable']){const h=hass();h.states['input_boolean.ready']={state:status};assert.equal(automationTrustReady(h,c),false);assert.equal(automationTrustState(h,c),'unknown');}const h=hass();assert.equal(automationTrustState(h,c),'unknown');h.states['input_boolean.ready']={state:'on'};assert.equal(automationTrustState(h,c),'all');assert.equal(automationTrustReady(h,config),true);});
test('scoped labels identify included and excluded devices without implying all devices',()=>{const reset={scope:{label:'4 прибора',included:['Бризер','Кондиционер','Очиститель 1','Обогреватель'],excluded:['Очиститель 2']}};const s=automationTrustScope(reset,'all','ru');assert.match(s.name,/Передать управление/);assert.match(s.status,/4 прибора/);for(const name of [...reset.scope.included,...reset.scope.excluded])assert(s.details.includes(name));assert(!`${s.name} ${s.status} ${s.help}`.includes('всё'));const notReady=automationTrustScope(reset,'unknown','ru',false);assert.equal(notReady.status,'Управление временно недоступно');assert.equal(automationTrustScope({},'all','ru'),null);});
test('dynamic protection must name an enabled automation with the exact expected ID',()=>{const safety={automation_entity_source:'input_text.enforcer',automation_id:'guard'},c={...config,automation_reset:{...config.automation_reset,runtime_ready_entity:'input_boolean.ready',runtime_safety:safety}},h=hass();h.states['input_boolean.ready']={state:'on'};assert.doesNotThrow(()=>validateRuntimeSafety(safety));assert.equal(runtimeSafetyReady(h,safety),false);h.states['input_text.enforcer']={state:'automation.guard'};h.states['automation.guard']={state:'on',attributes:{id:'guard'}};assert.equal(automationTrustReady(h,c),true);assert.equal(automationTrustState(h,c),'all');for(const source of ['unknown','unavailable','sensor.guard','automation.missing']){h.states['input_text.enforcer'].state=source;assert.equal(automationTrustReady(h,c),false);assert.equal(automationTrustState(h,c),'unknown');}h.states['input_text.enforcer'].state='automation.guard';for(const status of ['off','unknown','unavailable']){h.states['automation.guard'].state=status;assert.equal(automationTrustReady(h,c),false);}h.states['automation.guard'].state='on';for(const id of ['wrong',null,1]){h.states['automation.guard'].attributes.id=id;assert.equal(automationTrustReady(h,c),false);}assert.equal(automationTrustScope({scope:{label:'4',included:['a'],excluded:['b']}},'unknown','ru',false,false).status,'Защита недоступна');assert.throws(()=>validateRuntimeSafety({automation_entity_source:'sensor.bad',automation_id:'guard'}));});
