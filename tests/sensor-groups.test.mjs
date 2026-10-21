import test from 'node:test';
import assert from 'node:assert/strict';
import {sensorTileModel as model,sensorValue,validateSensorGroups} from '../src/sensor-model.js';
const s=(state,attributes={})=>({state,attributes});
const tile={entity:'sensor.room',battery:'sensor.battery',metrics:[{entity:'sensor.room'},{entity:'sensor.humidity'}]};
const states={'sensor.room':s('0'),'sensor.humidity':s('50'),'sensor.battery':s('100')};
test('zero, negative temperature and independent humidity are valid measurements',()=>{
  for(const value of ['0','-12.5','27.4'])assert.equal(model(tile,{...states,'sensor.room':s(value)}).status,'ready');
});
test('unavailable, missing and unknown primary values are never healthy',()=>{
  for(const value of ['unavailable','unknown',''])assert.notEqual(model(tile,{...states,'sensor.room':s(value)}).status,'ready');
  assert.equal(model(tile,{}).status,'unavailable');
});
test('missing secondary value gives partial state without losing a valid primary',()=>{
  const m=model(tile,{'sensor.room':s('23')});assert.equal(m.status,'partial');assert.equal(m.metrics[0].status,'available');assert.equal(m.metrics[1].status,'unavailable');
});
test('missing battery does not misreport primary connectivity or battery as zero',()=>{
  const m=model(tile,{'sensor.room':s('23'),'sensor.humidity':s('50')});assert.equal(m.status,'ready');assert.equal(m.batteryValue,null);
});
test('battery boundary, numeric strings, zero and configured threshold',()=>{
  for(const value of [0,19,20])assert.equal(model(tile,{...states,'sensor.battery':s(String(value))}).lowBattery,true);
  assert.equal(model(tile,{...states,'sensor.battery':s('21')}).lowBattery,false);
  assert.equal(model({...tile,low_battery:30},{...states,'sensor.battery':s('25')}).status,'lowBattery');
});
test('invalid battery readings never masquerade as healthy battery percentage',()=>{
  for(const value of ['unavailable','unknown','bad','-1','101','Infinity'])assert.equal(model(tile,{...states,'sensor.battery':s(value)}).batteryValue,null);
});
test('leak sensor states are explicit, unknown is never dry',()=>{
  for(const value of ['on','off','unknown','unavailable','unexpected']){
    const m=model({entity:'binary_sensor.leak',kind:'moisture'},{'binary_sensor.leak':s(value)});
    assert.equal(m.dry,value==='off');assert.equal(m.alarm,value==='on');
    assert.equal(m.status,{on:'alarm',off:'ready',unknown:'unknown',unavailable:'unavailable',unexpected:'unknown'}[value]);
  }
});
test('HA moisture device class works without specifying kind',()=>{
  assert.equal(model({entity:'binary_sensor.leak'},{'binary_sensor.leak':s('on',{device_class:'moisture'})}).status,'alarm');
});
test('alarm takes priority over secondary and low battery warnings',()=>{
  const m=model({...tile,kind:'moisture'},{...states,'sensor.room':s('on'),'sensor.battery':s('0'),'sensor.humidity':s('unavailable')});assert.equal(m.status,'alarm');assert.equal(m.lowBattery,true);
});
test('report timestamps are not used as a connectivity heuristic',()=>{
  assert.equal(model({entity:'sensor.room'},{'sensor.room':{...s('23'),last_changed:'2000-01-01',last_reported:'2000-01-01'}}).status,'ready');
});
test('valid configurable groups retain order and contain no household assumptions',()=>{
  const config={groups:[{name:'Outside',tiles:[{entity:'sensor.environment',metrics:[{entity:'sensor.environment',decimals:1}]}]},{name:'Unassigned',tiles:[{entity:'binary_sensor.leak'}]}]};
  assert.equal(validateSensorGroups(config),config);assert.equal(config.groups[1].name,'Unassigned');
});
test('malformed configurations fail before rendering',()=>{
  for(const config of [{},{groups:[]},{groups:[{name:'',tiles:[tile]}]},{groups:[{name:'Room',tiles:[]}]},...[
    {entity:'bad'}, {...tile,battery:'bad'}, {...tile,low_battery:101}, {...tile,kind:'custom'}, {...tile,metrics:[]}, {...tile,metrics:[{entity:'bad'}]}, {...tile,metrics:[{entity:'sensor.room',decimals:6}]}
  ].map(value=>({groups:[{name:'Room',tiles:[value]}]}))])assert.throws(()=>validateSensorGroups(config));
});
test('sensor availability distinguishes unknown and unavailable',()=>{
  assert.equal(sensorValue(null),'unavailable');assert.equal(sensorValue(s('unknown')),'unknown');assert.equal(sensorValue(s('off')),'available');
});
