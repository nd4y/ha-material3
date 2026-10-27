import test from 'node:test';
import assert from 'node:assert/strict';
import {ownerModel,ownerCycleAction} from '../src/ownership.js';
import {controlModel} from '../src/quick-controls.js';
import {operationModel,validateOperation} from '../src/operation-colors.js';

const state=(state,attributes={})=>({state,attributes});
const field={id:'speed',entity:'fan.demo',lock_entity:'input_boolean.speed_lock',attribute:'preset_mode',options_attribute:'preset_modes',set_action:{action:'perform-action',perform_action:'script.manual',value_field:'value'},auto:{value:'Auto',active_when:[{entity:'fan.demo',attribute:'preset_mode',value:'Auto'}],action:{action:'perform-action',perform_action:'script.device_auto'}}};
const input=(lock='off',mode='low')=>({states:{'fan.demo':state('on',{preset_mode:mode,preset_modes:['Auto','low','high']}),'input_boolean.speed_lock':state(lock),'input_boolean.power_lock':state('off'),'input_boolean.temperature_lock':state('on')}});
function apply(hass,action){
  if(action.perform_action==='input_boolean.turn_on')hass.states['input_boolean.speed_lock'].state='on';
  else if(action.perform_action==='input_boolean.turn_off')hass.states['input_boolean.speed_lock'].state='off';
  else if(action.perform_action==='script.device_auto'){hass.states['input_boolean.speed_lock'].state='on';hass.states['fan.demo'].attributes.preset_mode='Auto';}
  else if(action.perform_action==='script.manual'){hass.states['input_boolean.speed_lock'].state='on';hass.states['fan.demo'].attributes.preset_mode=action.data.value;}
  else throw Error('Unexpected configured action');
}

for(const native of [false,true])for(const initial of ['low','Auto']){
  test(`unified owner cycle retains independent permissions; native=${native}; reported=${initial}`,()=>{
    const hass=input('off',initial),item=native?field:{...field,auto:undefined};
    const expected=native?['manual','device','ha','manual']:['manual','ha','manual','ha'];
    for(const next of expected){
      if(native&&next==='manual'&&hass.states['fan.demo'].attributes.preset_mode==='Auto'){
        assert.throws(()=>ownerCycleAction(hass,item));
        hass.states['fan.demo'].attributes.preset_mode='high'; // later effective readback
      }
      apply(hass,ownerCycleAction(hass,item));assert.equal(ownerModel(hass,item).owner,next);assert.equal(hass.states['input_boolean.power_lock'].state,'off');assert.equal(hass.states['input_boolean.temperature_lock'].state,'on');
    }
  });
}
test('unified ownership fails closed for missing or invalid permission without emitting an action',()=>{
  for(const bad of [undefined,'unknown','unavailable','unexpected']){const hass=input();if(bad===undefined)delete hass.states['input_boolean.speed_lock'];else hass.states['input_boolean.speed_lock'].state=bad;assert.throws(()=>ownerCycleAction(hass,field));}
});

const climate={entity:'climate.demo',operation:{kind:'climate'}};
for(const [raw,mode,tone]of [['cool','cool','cool'],['heat','heat','warm'],['fan_only','fan','fan'],['off','off','off'],['idle','idle','off'],['unknown','unknown','unknown'],['unavailable','unknown','unknown'],['auto','unknown','unknown'],['dry','unknown','unknown']]){
  test(`unified selected climate operation ${raw} has explicit finite tone`,()=>{const model=operationModel({states:{'climate.demo':state(raw)}},climate);assert.equal(model.mode,mode);assert.equal(model.tone,tone);assert.ok(model.labelKey);assert.ok(model.icon);});
}
test('unified operation color does not infer physical activity from selected mode or desired temperature',()=>{
  const hass={states:{'climate.demo':state('heat',{temperature:5,current_temperature:35,hvac_action:'idle'})}};
  assert.equal(operationModel(hass,climate).mode,'heat');assert.equal(operationModel(hass,climate).activityKey,'operationIdle');
  hass.states['climate.demo'].attributes.temperature=30;assert.equal(operationModel(hass,climate).mode,'heat');
  delete hass.states['climate.demo'].attributes.hvac_action;assert.equal(operationModel(hass,climate).activityKey,null);
});
test('unified breather heater requires explicit evidence while control availability stays independent',()=>{
  const config={entity:'fan.demo',operation:{kind:'breather'}},hass=input();
  for(const [setpoint,current]of [[5,30],[25,5],[25,25]]){hass.states['fan.demo'].attributes.temperature=setpoint;hass.states['fan.demo'].attributes.current_temperature=current;assert.equal(operationModel(hass,config).mode,'unknown');assert.equal(controlModel(hass,field).available,true);}
  config.operation.indicator={entity:'binary_sensor.heater',active_value:'on',inactive_value:'off'};
  for(const [raw,mode]of [['on','heat'],['off','fresh'],['unknown','unknown'],['unavailable','unknown'],['other','unknown']]){hass.states['binary_sensor.heater']=state(raw);assert.equal(operationModel(hass,config).mode,mode);assert.equal(controlModel(hass,field).available,true);}
  hass.states['fan.demo'].state='off';hass.states['binary_sensor.heater']=state('on');assert.equal(operationModel(hass,config).mode,'off');
});
test('unified finite map respects configured source and unrecognized values remain unknown',()=>{
  const config={entity:'climate.demo',operation:{kind:'climate',entity:'sensor.operation',attribute:'mode',states:{warming:'heat',vent:'fan'}}};validateOperation(config);
  const hass={states:{'climate.demo':state('cool'),'sensor.operation':state('ready',{mode:'warming'})}};
  assert.equal(operationModel(hass,config).mode,'heat');hass.states['sensor.operation'].attributes.mode='unrecognized';assert.equal(operationModel(hass,config).mode,'unknown');delete hass.states['sensor.operation'];assert.equal(operationModel(hass,config).mode,'unknown');
  assert.throws(()=>validateOperation({...config,operation:{...config.operation,states:{unknown:'heat'}}}));
  assert.throws(()=>validateOperation({...config,operation:{kind:'breather',indicator:{entity:'binary_sensor.heater',active_value:'on',inactive_value:'on'}}}));
});
