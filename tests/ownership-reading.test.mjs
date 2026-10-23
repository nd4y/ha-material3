import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerModel,ownerAction} from '../src/ownership.js';
import {roomReading} from '../src/room-reading.js';
const s=(state,attributes={})=>({state,attributes,last_changed:new Date(100000).toISOString()});
const item={entity:'fan.demo',lock_entity:'input_boolean.lock',attribute:'preset_mode',options_attribute:'preset_modes',set_action:{action:'perform-action',perform_action:'script.manual',value_field:'value'},auto:{value:'Auto',active_when:[{entity:'fan.demo',attribute:'preset_mode',value:'Auto'}],action:{action:'perform-action',perform_action:'script.device_auto'}}};
test('direct ownership keeps HA, native Auto and manual distinct',()=>{
  const hass={states:{'fan.demo':s('on',{preset_mode:'Auto'}),'input_boolean.lock':s('off')}};
  assert.equal(ownerModel(hass,item).owner,'ha');
  assert.equal(ownerAction(hass,item,'ha'),null);
  assert.equal(ownerAction(hass,item,'device').perform_action,'script.device_auto');
  assert.equal(ownerAction(hass,item,'manual').perform_action,'input_boolean.turn_on');
  hass.states['input_boolean.lock']=s('on');hass.states['fan.demo'].attributes.preset_modes=['Auto','low','high'];assert.equal(ownerModel(hass,item).owner,'device');
  assert.equal(ownerAction(hass,item,'manual').data.value,'low');
  hass.states['fan.demo']=s('on',{preset_mode:'low'});assert.equal(ownerModel(hass,item).owner,'manual');
  assert.equal(ownerAction(hass,item,'ha').perform_action,'input_boolean.turn_off');
  hass.states['input_boolean.lock']=s('unavailable');assert.throws(()=>ownerAction(hass,item,'ha'));
  assert.deepEqual(ownerModel(hass,{...item,auto:undefined}).choices,['ha','manual']);
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
