import test from 'node:test';
import assert from 'node:assert/strict';
import {operationModel,operationMotion,validateOperation} from '../src/operation-colors.js';
import {airGoalModel,airGoalValue,commitAirGoal} from '../src/air-goals.js';
import {validateConfig} from '../src/ha.js';

test('breather confirmed heating setting controls tone and motion, not raw fan_only',()=>{
 const config={entity:'sensor.breather',operation:{kind:'breather',heating_setpoint:{entity:'sensor.breather',attribute:'temperature',off_value:5}}};
 validateOperation(config);
 const state={state:'fan_only',attributes:{source_qualified:true,temperature:19,max_temp:25}},hass={states:{'sensor.breather':state}};
 let op=operationModel(hass,config);assert.equal(op.tone,'warm');assert.equal(op.activity,'heat_enabled');assert.equal(operationMotion(op),'heat');
 state.attributes.temperature=5;op=operationModel(hass,config);assert.equal(op.tone,'cool');assert.equal(operationMotion(op),'flow');
 state.attributes.temperature=19;state.state='off';assert.equal(operationMotion(operationModel(hass,config)),'none');
 state.state='fan_only';state.attributes.source_qualified=false;assert.equal(operationModel(hass,config).mode,'unknown');
 state.attributes.source_qualified=true;delete state.attributes.max_temp;assert.equal(operationModel(hass,config).mode,'unknown');
});
test('CO2 is a numeric ppm room target, commits on change with exact value',async()=>{
 const item={id:'fresh',name:'Целевой CO₂',semantics:'co2-target',entity:'input_number.co2_target',set_action:{action:'perform-action',perform_action:'input_number.set_value',target:{entity_id:'input_number.co2_target'},value_field:'value'}};
 validateConfig({entities:{room_temperature:'sensor.room',target_temperature:'input_number.target',enabled:'input_boolean.master'},air_goals:[item]},'climate');
 const hass={states:{'input_number.co2_target':{state:'800',attributes:{min:600,max:1400,step:50}}}},m=airGoalModel(hass,item);
 assert.equal(m.available,true);assert.equal(m.target,true);assert.equal(m.min,600);assert.equal(airGoalValue(m,1000),1000);assert.throws(()=>airGoalValue(m,75));assert.throws(()=>airGoalValue(m,801));
 const calls=[],card={hass,_config:{air_goals:[item]},_airDrafts:{},_airGoalErrors:{},async run(a){calls.push(a);hass.states[item.entity].state=String(a.data.value);}};
 await commitAirGoal(card,item,1000);assert.equal(calls.length,1);assert.equal(calls[0].data.value,1000);assert.equal(card._airDrafts.fresh,undefined);
});
