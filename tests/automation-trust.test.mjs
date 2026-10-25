import test from 'node:test';
import assert from 'node:assert/strict';
import {automationTrustState} from '../src/quick-controls.js';
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
