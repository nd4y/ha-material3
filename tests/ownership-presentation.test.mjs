import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceOwnershipModel,ownerPresentation} from '../src/ownership.js';

const state=value=>({state:value,attributes:{}});
const config={power:{lock_entity:'input_boolean.power'},quick_controls:[{lock_entity:'input_boolean.temperature'},{lock_entity:'input_boolean.speed'}]};

test('whole-card manual fill needs every configured permission to be observed restricted, independently of parameter operation',()=>{
  let cases=0;
  for(const power of ['on','off','unknown','unavailable'])for(const temperature of ['on','off','unknown','unavailable'])for(const speed of ['on','off','unknown','unavailable']){
    const values=[power,temperature,speed],hass={states:Object.fromEntries(['power','temperature','speed'].map((id,index)=>['input_boolean.'+id,state(values[index])]))},before=structuredClone(hass),model=deviceOwnershipModel(hass,config),known=values.every(value=>['on','off'].includes(value));
    assert.equal(model.state,!known?'unknown':values.every(value=>value==='on')?'blocked':values.every(value=>value==='off')?'automatic':'mixed');
    assert.equal(model.known,known);assert.equal(model.restricted,values.filter(value=>value==='on').length);assert.equal(model.automatic,values.filter(value=>value==='off').length);assert.equal(model.total,3);assert.deepEqual(hass,before);cases++;
  }
  assert.equal(cases,64);
});

test('duplicate helpers count once and missing or unconfigured permissions never invent a blocked card',()=>{
  const hass={states:{'input_boolean.power':state('on')}};
  assert.deepEqual(deviceOwnershipModel(hass,{power:config.power,quick_controls:[config.power]}),{state:'blocked',known:true,automatic:0,restricted:1,total:1});
  assert.equal(deviceOwnershipModel(hass,config).state,'unknown');
  assert.deepEqual(deviceOwnershipModel(hass,{quick_controls:[]}),{state:'unknown',known:false,automatic:0,restricted:0,total:0});
});

test('compact ownership labels, glyphs and descriptions distinguish home auto, manual and native device auto',()=>{
  assert.deepEqual(ownerPresentation('ha'),{labelKey:'ownerAutomaticShort',accessibleKey:'ownerHomeAutomatic',icon:'lock_open',helpKey:'ownerHaHelp'});
  assert.deepEqual(ownerPresentation('manual'),{labelKey:'manualShort',accessibleKey:'ownerManualControl',icon:'lock',helpKey:'ownerManualHelp'});
  assert.deepEqual(ownerPresentation('device'),{labelKey:'ownerDeviceShort',accessibleKey:'ownerDeviceAutomatic',icon:'devices',helpKey:'ownerDeviceHelp'});
  for(const value of ['unknown','unavailable',undefined])assert.deepEqual(ownerPresentation(value),{labelKey:'unavailable',accessibleKey:'unavailable',icon:'info',helpKey:'unavailable'});
});
