import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerModel,nextOwner,ownerCycleAction,ownerRequest,ownerRequestStatus} from '../src/ownership.js';
const s=(state,attributes={})=>({state,attributes});
const base={entity:'fan.example',lock_entity:'input_boolean.speed_lock',attribute:'preset_mode',options_attribute:'preset_modes',set_action:{action:'perform-action',perform_action:'script.manual_speed',value_field:'value'}};
const item={...base,auto:{value:'auto',active_when:[{entity:'fan.example',attribute:'preset_mode',value:'auto'}],action:{action:'perform-action',perform_action:'script.native_auto'}}};
const hass={states:{'fan.example':s('on',{preset_mode:'low',preset_modes:['auto','low','high']}),'input_boolean.speed_lock':s('off'),'input_boolean.power_lock':s('off'),'input_boolean.temperature_lock':s('on')}};

test('two-state owner button cycles HA -> manual -> HA',()=>{
  const h=structuredClone(hass);assert.equal(nextOwner(h,base),'manual');assert.equal(ownerCycleAction(h,base).perform_action,'input_boolean.turn_on');
  h.states[base.lock_entity]=s('on');assert.equal(nextOwner(h,base),'ha');assert.equal(ownerCycleAction(h,base).perform_action,'input_boolean.turn_off');
});
test('three-state cycle preserves native auto entry and release to HA',()=>{
  const h=structuredClone(hass);assert.equal(nextOwner(h,item),'manual');
  h.states[item.lock_entity]=s('on');assert.equal(nextOwner(h,item),'device');assert.equal(ownerCycleAction(h,item).perform_action,'script.native_auto');
  h.states[item.entity].attributes.preset_mode='auto';assert.equal(ownerModel(h,item).owner,'device');assert.equal(nextOwner(h,item),'ha');assert.equal(ownerCycleAction(h,item).perform_action,'input_boolean.turn_off');
});
test('cycle never touches power or temperature permissions',()=>{
  const h=structuredClone(hass),before=structuredClone(h);ownerCycleAction(h,item);
  assert.deepEqual(h,before);assert.deepEqual(ownerCycleAction(h,item).target,{entity_id:'input_boolean.speed_lock'});
});
test('unavailable permission does not produce a cycle action',()=>{
  for(const value of ['unknown','unavailable','missing']){const h=structuredClone(hass);h.states[item.lock_entity]=s(value);assert.throws(()=>nextOwner(h,item));assert.throws(()=>ownerCycleAction(h,item));}
});
test('device -> HA -> manual waits for a real manual-speed readback',()=>{
  const h=structuredClone(hass),seen=[];
  function execute(action){
    if(action.perform_action==='script.native_auto'){h.states[item.lock_entity]=s('on');h.states[item.entity].attributes.preset_mode='auto';}
    else if(action.perform_action==='script.manual_speed'){h.states[item.lock_entity]=s('on');h.states[item.entity].attributes.preset_mode=action.data.value;}
    else h.states[item.lock_entity]=s(action.perform_action==='input_boolean.turn_on'?'on':'off');
  }
  for(let i=0;i<3;i++){seen.push(ownerModel(h,item).owner);execute(ownerCycleAction(h,item));}
  assert.deepEqual(seen,['ha','manual','device']);assert.equal(ownerModel(h,item).owner,'ha');
  assert.throws(()=>ownerCycleAction(h,item));assert.equal(h.states[item.lock_entity].state,'off');
  h.states[item.entity].attributes.preset_mode='high';execute(ownerCycleAction(h,item));
  assert.equal(ownerModel(h,item).owner,'manual');assert.equal(h.states[item.entity].attributes.preset_mode,'high');
  assert.equal(h.states['input_boolean.power_lock'].state,'off');assert.equal(h.states['input_boolean.temperature_lock'].state,'on');
});
test('native Auto without a supported manual value fails safely instead of claiming manual',()=>{
  const h=structuredClone(hass);h.states[item.entity].attributes={preset_mode:'auto',preset_modes:['auto']};
  assert.equal(ownerModel(h,item).owner,'ha');assert.throws(()=>ownerCycleAction(h,item));assert.equal(h.states[item.lock_entity].state,'off');
});
test('service acknowledgement alone never confirms a requested owner',()=>{
  const h=structuredClone(hass),request=ownerRequest(h,item,undefined,1000,10000);
  assert.equal(request.owner,'manual');assert.equal(ownerRequestStatus(h,item,request,1001),'pending');
  // Even a successful service response does not mutate the cached HA state.
  const serviceResponse={success:true};assert.equal(serviceResponse.success,true);assert.equal(ownerRequestStatus(h,item,request,2000),'pending');
  h.states[item.lock_entity]=s('on');assert.equal(ownerRequestStatus(h,item,request,2001),'confirmed');
});
test('confirmation timeout is bounded and an already observed requested owner needs no retry command',()=>{
  const h=structuredClone(hass),request=ownerRequest(h,item,'manual',1000,10000);
  assert.equal(ownerRequestStatus(h,item,request,10999),'pending');assert.equal(ownerRequestStatus(h,item,request,11000),'timeout');
  h.states[item.lock_entity]=s('on');assert.equal(ownerRequestStatus(h,item,request,12000),'confirmed');assert.equal(ownerRequest(h,item,'manual',12000),null);
});
test('missing permission never confirms pending ownership and other parameter state stays independent',()=>{
  const h=structuredClone(hass),request=ownerRequest(h,item,undefined,1000),power={...base,entity:'fan.example',lock_entity:'input_boolean.power_lock',auto:undefined};
  h.states[item.lock_entity]=s('unavailable');assert.equal(ownerRequestStatus(h,item,request,2000),'pending');assert.equal(ownerRequestStatus(h,item,request,11000),'timeout');
  assert.equal(ownerModel(h,power).available,true);assert.equal(ownerRequest(h,power,undefined,2000).owner,'manual');
});
