import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerModel,ownerAction} from '../src/ownership.js';
import {roomReading} from '../src/room-reading.js';
const s=(state,attributes={})=>({state,attributes,last_changed:new Date(100000).toISOString()});
const item={entity:'fan.demo',lock_entity:'input_boolean.lock',attribute:'preset_mode',options_attribute:'preset_modes',set_action:{action:'perform-action',perform_action:'script.manual',value_field:'value'},auto:{value:'Auto',active_when:[{entity:'fan.demo',attribute:'preset_mode',value:'Auto'}],action:{action:'perform-action',perform_action:'script.device_auto'}}};
test('direct ownership keeps HA, native Auto and manual distinct',()=>{
  const hass={states:{'fan.demo':s('on',{preset_mode:'Auto',preset_modes:['Auto','low','high']}),'input_boolean.lock':s('off')}};
  assert.equal(ownerModel(hass,item).owner,'ha');
  assert.equal(ownerAction(hass,item,'ha'),null);
  assert.equal(ownerAction(hass,item,'device').perform_action,'script.device_auto');
  assert.throws(()=>ownerAction(hass,item,'manual'),/Current device setting unavailable/);
  hass.states['input_boolean.lock']=s('on');hass.states['fan.demo'].attributes.preset_modes=['Auto','low','high'];assert.equal(ownerModel(hass,item).owner,'device');
  assert.throws(()=>ownerAction(hass,item,'manual'),/Current device setting unavailable/);
  hass.states['fan.demo']=s('on',{preset_mode:'low'});assert.equal(ownerModel(hass,item).owner,'manual');
  assert.equal(ownerAction(hass,item,'ha').perform_action,'input_boolean.turn_off');
  hass.states['input_boolean.lock']=s('unavailable');assert.throws(()=>ownerAction(hass,item,'ha'));
  assert.deepEqual(ownerModel(hass,{...item,auto:undefined}).choices,['ha','manual']);
});
test('native Auto freezes the actual supported speed, never the first option or saved manual value',()=>{
  const control={...item,attribute:'fan_mode',options_attribute:'fan_modes',value_entity:'input_text.manual',auto:{...item.auto,effective_readback:true,active_when:[{entity:'fan.demo',attribute:'preset_mode',value:'Auto'}]}};
  const hass={states:{'fan.demo':s('on',{preset_mode:'Auto',fan_mode:'high',fan_modes:['low','high']}),'input_boolean.lock':s('on'),'input_text.manual':s('Auto')}};
  assert.equal(ownerAction(hass,control,'manual').data.value,'high');
  for(const value of [null,undefined,'','auto','invalid']){hass.states['fan.demo'].attributes.fan_mode=value;assert.throws(()=>ownerAction(hass,control,'manual'));}
  assert.equal(hass.states['input_boolean.lock'].state,'on');
});
test('purifier favorite level is not an effective native Auto speed',()=>{
  const control={...item,entity:'select.favorite',attribute:undefined,options_attribute:'options',value_entity:'input_text.manual',auto:{...item.auto,active_when:[{entity:'fan.purifier',attribute:'preset_mode',value:'Auto'}]}};
  const hass={states:{'fan.purifier':s('on',{preset_mode:'Auto'}),'select.favorite':s('5',{options:['5','9']}),'input_boolean.lock':s('on'),'input_text.manual':s('Auto')}};
  assert.throws(()=>ownerAction(hass,control,'manual'),/Current device setting unavailable/);
  assert.equal(hass.states['select.favorite'].state,'5');assert.equal(hass.states['input_boolean.lock'].state,'on');
});
test('last temperature is explicitly display-only and expires',()=>{
  const config={entities:{room_temperature:'sensor.qualified'},temperature_display:{entity:'sensor.raw',max_age:3600}};
  const hass={states:{'sensor.qualified':s('23'),'sensor.raw':s('24')}};
  assert.equal(roomReading(hass,config,100000).qualified,true);
  hass.states['sensor.qualified']=s('unavailable');
  assert.deepEqual(roomReading(hass,config,100000),{value:24,unit:'°C',qualified:false,age:0});
  assert.equal(roomReading(hass,config,3700000).value,24);
  assert.equal(roomReading(hass,config,3700001).value,null);
  for(const bad of ['unknown','unavailable','', 'NaN']){hass.states['sensor.raw']=s(bad);assert.equal(roomReading(hass,config,100000).value,null);}
  hass.states['sensor.raw']=s('24');assert.equal(roomReading(hass,config,0).value,null);
});
