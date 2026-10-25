import test from 'node:test';
import assert from 'node:assert/strict';
import {operationModel,parameterOperation,validateOperation,operationMotion} from '../src/operation-colors.js';
const state=(state,attributes={})=>({state,attributes});
const config={entity:'climate.example',operation:{kind:'climate'}};
const hass=(mode,attributes={},extra={})=>({states:{'climate.example':state(mode,attributes),...extra}});

test('climate modes have finite operating colors independent from target and permission',()=>{
  for(const [mode,tone]of [['heat','warm'],['cool','cool'],['fan_only','fan'],['off','off'],['auto','unknown'],['heat_cool','unknown'],['unavailable','unknown'],['unknown','unknown']]){
    const actual=operationModel(hass(mode,{temperature:35},{'input_boolean.lock':state('on')}),config);
    assert.equal(actual.tone,tone,mode);
  }
  assert.equal(operationModel(hass('cool',{temperature:35}),config).tone,'cool');
  assert.equal(operationModel(hass('heat',{temperature:10}),config).tone,'warm');
});
test('selected mode and actual HVAC activity stay separate',()=>{
  const m=operationModel(hass('heat',{hvac_action:'idle'}),config);
  assert.equal(m.mode,'heat');assert.equal(m.activityKey,'operationIdle');assert.equal(m.labelKey,'operationHeat');
  assert.equal(operationModel(hass('cool',{hvac_action:'cooling'}),config).activityKey,'operationCooling');
  assert.equal(operationModel(hass('heat',{hvac_action:'unavailable'}),config).activityKey,null);
});
test('explicit operation attribute/map is authoritative without a guessed mode fallback',()=>{
  const c={...config,operation:{kind:'climate',attribute:'hvac_action',states:{heating:'heat',cooling:'cool',idle:'idle'}}};
  assert.equal(operationModel(hass('heat',{hvac_action:'heating'}),c).tone,'warm');
  for(const value of [undefined,null,'other','unavailable'])assert.equal(operationModel(hass('heat',{hvac_action:value}),c).mode,'unknown');
  assert.equal(operationModel(hass('off',{hvac_action:'heating'}),c).mode,'off');
});
test('breather requires explicit on/off heater evidence, never fan_only or setpoint',()=>{
  const c={...config,operation:{kind:'breather'}};
  for(const value of [5,25,40])assert.equal(operationModel(hass('fan_only',{temperature:value,current_temperature:5}),c).mode,'unknown');
  const explicit={...c,operation:{kind:'breather',indicator:{entity:'binary_sensor.heater',active_value:'on',inactive_value:'off'}}};
  for(const [value,mode]of [['on','heat'],['off','fresh'],['unknown','unknown'],['unavailable','unknown'],['other','unknown']])assert.equal(operationModel(hass('fan_only',{}, {'binary_sensor.heater':state(value)}),explicit).mode,mode);
  assert.equal(operationModel(hass('fan_only'),explicit).labelKey,'operationHeaterUnknown');
  assert.equal(operationModel(hass('off',{}, {'binary_sensor.heater':state('on')}),explicit).mode,'off');
});
test('heater attribute supports typed finite values and rejects missing evidence',()=>{
  const c={...config,operation:{kind:'breather',indicator:{entity:'sensor.heater',attribute:'active',active_value:true,inactive_value:false}}};
  assert.equal(operationModel(hass('fan_only',{}, {'sensor.heater':state('ok',{active:true})}),c).tone,'warm');
  assert.equal(operationModel(hass('fan_only',{}, {'sensor.heater':state('ok',{active:false})}),c).tone,'cool');
  assert.equal(operationModel(hass('fan_only',{}, {'sensor.heater':state('ok')}),c).mode,'unknown');
});
test('airflow override affects only its parameter while off and unknown remain neutral',()=>{
  const heat=operationModel(hass('heat'),config);
  assert.equal(parameterOperation(heat,{operation:'airflow'}).tone,'fan');assert.equal(parameterOperation(heat,{}).tone,'warm');assert.equal(heat.tone,'warm');
  for(const mode of ['off','unknown'])assert.equal(parameterOperation(operationModel(hass(mode),config),{operation:'airflow'}).mode,mode);
});
test('known breather airflow stays teal independently from unknown heater evidence',()=>{
  const c={...config,operation:{kind:'breather'}},unknownHeater=operationModel(hass('fan_only'),c);
  assert.equal(unknownHeater.mode,'unknown');assert.equal(parameterOperation(unknownHeater,{operation:'airflow'}).tone,'fan');
  for(const state of ['off','unknown','unavailable','unrecognized'])assert.notEqual(parameterOperation(operationModel(hass(state),c),{operation:'airflow'}).tone,'fan');
});
test('purifier states and explicit intense map use green without thermal inference',()=>{
  const c={...config,operation:{kind:'purifier'}};
  assert.equal(operationModel(hass('on',{temperature:40}),c).tone,'clean');assert.equal(operationModel(hass('off'),c).tone,'off');
  const explicit={...c,operation:{kind:'purifier',attribute:'preset_mode',states:{favorite:'boost',auto:'clean',sleep:'clean'}}};
  assert.equal(operationModel(hass('on',{preset_mode:'favorite'}),explicit).mode,'boost');
  assert.equal(operationModel(hass('on',{preset_mode:'other'}),explicit).mode,'unknown');
});
test('missing/unavailable external operation source fails unknown without fake values',()=>{
  const c={...config,operation:{kind:'climate',entity:'sensor.operation',states:{heating:'heat'}}};
  for(const source of [undefined,state('unknown'),state('unavailable'),state('unmapped')])assert.equal(operationModel(hass('heat',{},source?{'sensor.operation':source}:{}),c).mode,'unknown');
  assert.equal(operationModel(hass('heat',{}, {'sensor.operation':state('heating')}),c).tone,'warm');
});
test('operation configuration is finite and contains no installation constants',()=>{
  validateOperation(config);validateOperation({...config,grouped:true});
  for(const operation of [null,{}, {kind:'guess'}, {kind:'climate',states:{}}, {kind:'climate',states:{unknown:'heat'}}, {kind:'climate',states:{on:'red'}}, {kind:'breather',indicator:{entity:'binary_sensor.heater',active_value:'on',inactive_value:'on'}}])assert.throws(()=>validateOperation({...config,operation}));
  assert.throws(()=>validateOperation({...config,grouped:'yes'}));assert.throws(()=>validateOperation({...config,quick_controls:[{operation:'guess'}]}));
});

test('decorative operation motion needs matching observed HVAC activity rather than a selected mode or target',()=>{
  const expected={heat:{heating:'heat'},cool:{cooling:'cool'},fan_only:{fan:'flow'}};
  for(const mode of ['heat','cool','fan_only','off','unknown','unavailable'])for(const activity of ['heating','cooling','fan','idle','off',undefined,'unavailable']){
    const op=operationModel(hass(mode,{hvac_action:activity,temperature:mode==='cool'?35:10}),config);
    assert.equal(operationMotion(op),expected[mode]?.[activity]||'none',`${mode}/${activity}`);
  }
});

test('breather and purifier motion follows finite actual evidence, with unknown and conflicts static',()=>{
  const breather={...config,operation:{kind:'breather',indicator:{entity:'binary_sensor.heater',active_value:'on',inactive_value:'off'}}};
  for(const [heater,motion]of [['on','heat'],['off','flow'],['unknown','none'],['unavailable','none'],['other','none']])assert.equal(operationMotion(operationModel(hass('fan_only',{}, {'binary_sensor.heater':state(heater)}),breather)),motion);
  assert.equal(operationMotion(operationModel(hass('off',{}, {'binary_sensor.heater':state('on')}),breather)),'none');
  assert.equal(operationMotion(operationModel(hass('fan_only'),{...config,operation:{kind:'breather'}})),'none');
  const purifier={...config,operation:{kind:'purifier'}};
  assert.equal(operationMotion(operationModel(hass('on'),purifier)),'spin');
  for(const mode of ['off','unknown','unavailable'])assert.equal(operationMotion(operationModel(hass(mode),purifier)),'none');
  const cleaning=operationModel(hass('on'),purifier);assert.equal(parameterOperation(cleaning,{operation:'airflow'}).tone,'clean');
});
