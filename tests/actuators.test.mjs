import test from 'node:test';import assert from 'node:assert/strict';
import {actuatorState,actuatorAction,perform,validateConfig,selectedPreset}from'../src/ha.js';
const config={entities:{room_temperature:'sensor.room',target_temperature:'input_number.target',enabled:'input_boolean.control'}};
const item={id:'unit',name:'Example unit',entity:'input_boolean.unit'};
test('actuator switch only changes the configured permission flag',async()=>{
  const calls=[],hass={states:{'input_boolean.unit':{state:'on'}},callService:async(...a)=>calls.push(a)};
  assert.deepEqual(actuatorState(hass,item),{available:true,selected:true});
  await perform({},hass,actuatorAction(hass,item,false));
  assert.deepEqual(calls,[['input_boolean','turn_off',{}, {entity_id:'input_boolean.unit'}]]);
  assert.equal(calls.some(([domain])=>domain==='climate'||domain==='fan'),false);
});
test('missing, unavailable and future actuator controls cannot call services',()=>{
  for(const value of [undefined,'unavailable','unknown','invalid']){
    const hass={states:value?{'input_boolean.unit':{state:value}}:{}};
    assert.deepEqual(actuatorState(hass,item),{available:false,selected:false});
    assert.throws(()=>actuatorAction(hass,item,true));
  }
  const future={id:'future',name:'Future heater',disabled:true};
  assert.doesNotThrow(()=>validateConfig({...config,actuators:[future]},'climate'));
  assert.throws(()=>actuatorAction({states:{}},future,true));
});
test('actuator configuration rejects duplicates and direct device bindings',()=>{
  for(const actuators of [{},[item,item],[{...item,entity:'climate.unit'}],[{...item,name:''}],[{...item,disabled:'yes'}]])assert.throws(()=>validateConfig({...config,actuators},'climate'));
  assert.equal(validateConfig({...config,actuators:[item]},'climate').actuators[0].entity,item.entity);
});
test('configured ventilation off needs actual off states, never missing devices or stale preset attributes',()=>{
  const c={presets:[{id:'off',active_when:[{entity:'climate.unit',value:'off'},{entity:'fan.unit',value:'off'}]}]};
  for(const value of ['unknown','unavailable','fan_only'])assert.equal(selectedPreset({states:{'climate.unit':{state:value},'fan.unit':{state:'off'}}},c),null);
  assert.equal(selectedPreset({states:{'climate.unit':{state:'off',attributes:{fan_mode:'3'}},'fan.unit':{state:'off',attributes:{preset_mode:'auto'}}}},c),'off');
});
