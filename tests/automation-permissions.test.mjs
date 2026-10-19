import test from 'node:test';import assert from 'node:assert/strict';
import {automationPermission,automationAction,automationSummary,valueAction} from '../src/quick-controls.js';
import {validateConfig,selectedPreset} from '../src/ha.js';
const state=v=>({state:v,attributes:{}}),item={name:'Temperature',lock_entity:'input_boolean.hold',lock_action:{action:'perform-action',perform_action:'script.gateway',data:{operation:'lock'},value_field:'value'}};
test('checked automatic permission opens only its configured hold; unchecked captures manual intent',()=>{
  assert.equal(automationAction(item,true).data.value,false);assert.equal(automationAction(item,false).data.value,true);assert.equal(automationAction(item,true).data.operation,'lock');
  assert.equal(automationAction({lock_entity:item.lock_entity},true).perform_action,'input_boolean.turn_off');assert.throws(()=>automationAction(item,'on'));
});
test('permission and room availability summaries fail closed for unknown helpers and offline devices',()=>{
  for(const v of ['on','off','unavailable','unknown']){const hass={states:{[item.lock_entity]:state(v),'climate.device':state('heat')}};const p=automationPermission(hass,item);assert.equal(p.automatic,v==='off');assert.equal(p.available,['on','off'].includes(v));const summary=automationSummary(hass,{entity:'climate.device',controls:[item]});assert.deepEqual(summary.automatic,v==='off'?['Temperature']:[]);}
  const summary=automationSummary({states:{'climate.device':state('unavailable'),[item.lock_entity]:state('off')}},{entity:'climate.device',controls:[item]});assert.equal(summary.available,false);assert.deepEqual(summary.automatic,[]);
});
test('requested room mode stays selected while actual devices are partially manual',()=>{
  const cfg={entities:{room_temperature:'sensor.room',target_temperature:'input_number.goal',enabled:'input_boolean.master'},presets:['auto','off','quiet','standard','maximum'].map(id=>({id,action:{action:'perform-action',perform_action:'script.mode'},active_when:[{entity:'input_select.mode',value:id}]})),target_action:{action:'perform-action',perform_action:'script.goal',value_field:'value'},automation_groups:[{name:'Device',entity:'climate.device',controls:[item]}],automation_reset:{name:'Trust all',action:{action:'perform-action',perform_action:'script.trust'}}};
  const result=validateConfig(cfg,'climate');assert.equal(selectedPreset({states:{'input_select.mode':state('standard'),'climate.device':state('off')}},result),'standard');assert.deepEqual(valueAction(result.target_action,27.5).data,{value:27.5});assert.equal(result.automation_reset.action.perform_action,'script.trust');assert.throws(()=>validateConfig({...cfg,automation_groups:[{name:'Bad',entity:'climate.device',controls:[{...item,lock_entity:'climate.device'}]}]},'climate'));
});
