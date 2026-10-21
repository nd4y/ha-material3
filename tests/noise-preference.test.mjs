import test from 'node:test';
import assert from 'node:assert/strict';
import {airGoalModel,commitAirGoal,syncAirGoalDrafts,clearAirGoalTimers} from '../src/air-goals.js';
import {validateConfig} from '../src/ha.js';
const entity='input_number.generic_quiet',item={id:'noise',name:'Noise',entity,semantics:'preference',invert:true,neutral_value:50,value_labels:[{value:0,label:'Quiet'},{value:100,label:'Noise allowed'}],set_action:{action:'perform-action',perform_action:'script.generic_preference',value_field:'value',data:{axis:'existing-axis'}}};
const config={entities:{room_temperature:'sensor.room',target_temperature:'input_number.target',enabled:'input_boolean.master'},air_goals:[item]};
test('noise adapter preserves existing backend meaning at every supported scale value',async()=>{
  for(let raw=0;raw<=100;raw+=5){
    const hass={states:{[entity]:{state:String(raw),attributes:{min:0,max:100,step:5}}}},calls=[],card={hass,_config:config,_airDrafts:{},_airGoalErrors:{},_busy:false,run:async a=>calls.push(a)};
    assert.equal(airGoalModel(hass,item).value,100-raw);
    await commitAirGoal(card,item,100-raw);assert.equal(calls[0].data.value,raw);assert.equal(calls[0].data.axis,'existing-axis');
    syncAirGoalDrafts(card);assert.deepEqual(card._airDrafts,{});clearAirGoalTimers(card);
  }
});
test('noise remains unavailable for missing or malformed helper and inversion is validated',()=>{
  for(const value of ['unavailable','unknown','bad','101','-1'])assert.equal(airGoalModel({states:{[entity]:{state:value,attributes:{min:0,max:100,step:5}}}},item).available,false);
  assert.doesNotThrow(()=>validateConfig(config,'climate'));
  const bad=structuredClone(config);bad.air_goals[0].invert='yes';assert.throws(()=>validateConfig(bad,'climate'));
});
