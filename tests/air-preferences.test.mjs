import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {airGoalModel,airGoalPresentation,airGoalValue,airPreferenceLabel,airBoostModel,airBoostAction,commitAirGoal,commitAirAutomatic,syncAirGoalDrafts,clearAirGoalTimers,renderAirGoals} from '../src/air-goals.js';
import {validateConfig} from '../src/ha.js';
import {M3Slider} from '../src/slider.js';
import {symbols} from '../src/icons.js';

const state=(value,attributes={})=>({state:String(value),attributes});
const action=(name,field)=>({action:'perform-action',perform_action:'script.'+name,...(field?{value_field:field}:{})});
const labels=[{value:0,label:'Минимум'},{value:25,label:'Поменьше'},{value:50,label:'Обычно'},{value:75,label:'Посвежее'},{value:100,label:'Больше'}];
const preference=()=>({id:'arbitrary-priority',name:'Свежесть',semantics:'preference',entity:'input_number.user_preference',set_action:action('preference','value'),value_labels:structuredClone(labels),neutral_value:50,preference_note:'Ваше пожелание',availability_entity:'binary_sensor.room_ready'});
const now=1800000000000;
function fixture(){
  const item=preference(),card={_config:{air_goals:[item]},hass:{states:{'input_number.user_preference':state(50,{min:0,max:100,step:5}),'binary_sensor.room_ready':state('off'),'sensor.actual_speed':state(100),'input_boolean.master':state('off')}},_airDrafts:{},_busy:false,_error:false,_airGoalErrors:{},calls:[],async run(a,key){this.calls.push({action:a,key});},s(entity){return this.hass.states[entity];},t:key=>key,n:value=>String(value),motion:'reduced',_now:now};
  return {card,item};
}
const climate=item=>({entities:{room_temperature:'sensor.room',target_temperature:'input_number.target',enabled:'input_boolean.master'},air_goals:[item]});
function templates(value){if(Array.isArray(value))return value.flatMap(templates);return value?.strings?[value,...value.values.flatMap(templates)]:[];}
function boost(item,card){item.boost={active_entity:'input_boolean.boost',deadline_entity:'input_datetime.deadline',availability_entity:'binary_sensor.boost_ready',start_action:action('boost','duration'),cancel_action:action('cancel'),durations:[10,15],default_duration:15};Object.assign(card.hass.states,{'input_boolean.boost':state('off'),'input_datetime.deadline':state('date',{timestamp:now/1000+900}),'binary_sensor.boost_ready':state('on')});}

test('a preference always shows the stored user value independently of master, health, sensors and computed speeds',()=>{
  const {card,item}=fixture();let cases=0;
  for(const value of [0,25,50,75,100])for(const master of ['on','off','unknown'])for(const ready of ['on','off','unknown','unavailable'])for(const actual of [0,100,'unknown']){
    card.hass.states[item.entity].state=String(value);card.hass.states['input_boolean.master'].state=master;card.hass.states[item.availability_entity].state=ready;card.hass.states['sensor.actual_speed'].state=String(actual);
    const model=airGoalModel(card.hass,item);assert.equal(model.available,true);assert.equal(model.value,value);assert.equal(model.display_value,value);assert.equal(model.automatic,false);assert.deepEqual(airGoalPresentation(model),{automatic:false,value,available:true,slider_value:value});cases++;
  }
  assert.equal(cases,180);
  item.automatic_value_entity='sensor.actual_speed';card.hass.states[item.entity].state='25';assert.equal(airGoalModel(card.hass,item).display_value,25);
});

test('qualitative names use configured marks and neutral tie breaking without implying device percentages',()=>{
  const item=preference();for(const mark of labels)assert.equal(airPreferenceLabel(item,mark.value),mark.label);
  assert.equal(airPreferenceLabel(item,40),'Обычно');assert.equal(airPreferenceLabel(item,62.5),'Обычно');assert.equal(airPreferenceLabel(item,12.5),'Поменьше');
  item.neutral_value=0;assert.equal(airPreferenceLabel(item,12.5),'Минимум');
  for(const value of [null,undefined,NaN,Infinity,'75'])assert.equal(airPreferenceLabel(item,value),null);
});

test('preference rendering has qualitative output and no automatic ownership switch',()=>{
  const {card,item}=fixture();card.hass.states[item.entity].state='75';item.status_entity='sensor.decision';card.hass.states[item.status_entity]=state('Actuator limited');
  const result=renderAirGoals(card),all=templates(result),markup=all.map(part=>part.strings.join('')).join('');
  assert.ok(!markup.includes('ha-m3-switch'));assert.match(markup,/data-semantics=/);assert.match(markup,/\.valueText=/);
  const root=result[0],output=root.values[root.strings.findIndex(part=>part.endsWith('<output>'))];assert.equal(output,'Посвежее');
  assert.ok(root.values.includes('Ваше пожелание'));assert.ok(root.values.includes('Actuator limited'));assert.ok(root.values.includes('Минимум'));assert.ok(root.values.includes('Больше'));
  assert.equal(card.calls.length,0);
});

test('committing a preference submits one typed value and does not disable automation or touch another wish',async()=>{
  const {card,item}=fixture();card._config.air_goals.push({...item,id:'other'});card._airDrafts.other={value:25,editing:true};const before=structuredClone(card.hass.states);
  await commitAirGoal(card,item,75);assert.deepEqual(card.calls,[{action:{action:'perform-action',perform_action:'script.preference',data:{value:75}},key:'air-goal:arbitrary-priority'}]);
  assert.deepEqual(card._airDrafts[item.id],{value:75});assert.deepEqual(card._airDrafts.other,{value:25,editing:true});assert.deepEqual(card.hass.states,before);
  clearAirGoalTimers(card);await commitAirAutomatic(card,item,false);assert.equal(card.calls.length,1);assert.equal(card._error,true);
});

test('sensor updates neither rewrite preferences nor acknowledge their pending drafts',async()=>{
  const {card,item}=fixture();await commitAirGoal(card,item,75);
  for(const actual of [0,50,100,'unavailable']){card.hass.states['sensor.actual_speed'].state=String(actual);syncAirGoalDrafts(card);assert.deepEqual(card._airDrafts[item.id],{value:75});assert.equal(card.hass.states[item.entity].state,'50');assert.equal(card.calls.length,1);}
  card.hass.states[item.entity].state='75';syncAirGoalDrafts(card);assert.equal(card._airDrafts[item.id],undefined);clearAirGoalTimers(card);
});

test('a missing preference helper blocks edits while offline devices and stopped automation do not',async()=>{
  const {card,item}=fixture();assert.equal(airGoalValue(airGoalModel(card.hass,item),0),0);assert.equal(airGoalValue(airGoalModel(card.hass,item),100),100);
  for(const value of [-1,3,101,NaN,Infinity,'',false,{},null])assert.throws(()=>airGoalValue(airGoalModel(card.hass,item),value));
  card.hass.states[item.entity].state='unavailable';assert.equal(airGoalModel(card.hass,item).available,false);await commitAirGoal(card,item,75);assert.equal(card.calls.length,0);assert.equal(card._error,true);
});

test('failed and unconfirmed preference edits roll back the draft without writing the helper',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});const {card,item}=fixture();await commitAirGoal(card,item,75);t.mock.timers.tick(8000);assert.equal(card._airDrafts[item.id],undefined);assert.equal(card._airGoalErrors[item.id],true);assert.equal(card.hass.states[item.entity].state,'50');clearAirGoalTimers(card);
  const failed=fixture();failed.card.run=async()=>{failed.card._error=true;};await commitAirGoal(failed.card,failed.item,25);assert.equal(failed.card._airDrafts[failed.item.id],undefined);clearAirGoalTimers(failed.card);
});

test('preference editing stays available while boost starts require channel and master permissions; cancellation stays available',()=>{
  const {card,item}=fixture();boost(item,card);
  for(const room of ['on','off','unknown','unavailable'])for(const permission of ['on','off','unknown']){
    card.hass.states[item.availability_entity].state=room;card.hass.states[item.boost.availability_entity].state=permission;assert.equal(airGoalModel(card.hass,item).available,true);assert.equal(airBoostModel(card.hass,item,now).available,room==='on'&&permission==='on');
    if(room==='on'&&permission==='on')assert.equal(airBoostAction(card.hass,item,15,now).data.duration,15);else assert.throws(()=>airBoostAction(card.hass,item,15,now));
  }
  card.hass.states[item.boost.active_entity].state='on';assert.equal(airBoostModel(card.hass,item,now).can_cancel,true);
});

test('preference configuration rejects automatic values, ambiguous semantics, invalid qualitative labels and unsafe sources',()=>{
  assert.doesNotThrow(()=>validateConfig(climate(preference()),'climate'));
  const corruptions=[p=>p.semantics='computed',p=>p.automatic_entity='input_boolean.auto',p=>p.automatic_action=action('auto','automatic'),p=>p.automatic_value_entity='sensor.auto',p=>p.entity='sensor.value',p=>delete p.set_action,p=>delete p.value_labels,p=>p.value_labels=[],p=>p.value_labels[0].value=5,p=>p.value_labels.at(-1).value=99,p=>p.value_labels[1].value=0,p=>p.value_labels[1].value=NaN,p=>p.value_labels[1].value='25',p=>p.value_labels[1].label=' ',p=>p.neutral_value=true,p=>p.neutral_value=-1,p=>p.neutral_value=101,p=>p.neutral_value=NaN,p=>p.preference_note='',p=>p.low_label=10,p=>p.high_label=' ',p=>p.status_entity='unsafe'];
  for(const corrupt of corruptions){const item=preference();corrupt(item);assert.throws(()=>validateConfig(climate(item),'climate'));}
  const quiet=preference();quiet.id='noise-priority';quiet.neutral_value=0;assert.doesNotThrow(()=>validateConfig(climate(quiet),'climate'));
});

test('icon preset validation uses the bundled shared symbol inventory and keeps default text compatible',async()=>{
  const config=climate(preference());config.presets=[{id:'custom',name:'My profile',icon:'eco',action:action('profile')}];config.preset_style='icons';assert.doesNotThrow(()=>validateConfig(config,'climate'));
  for(const icon of ['not_bundled','',null])assert.throws(()=>validateConfig({...config,presets:[{...config.presets[0],icon}]},'climate'));
  assert.throws(()=>validateConfig({...config,preset_style:'tiny'},'climate'));assert.throws(()=>validateConfig({...config,presets:[{...config.presets[0],name:' '}]},'climate'));
  assert.doesNotThrow(()=>validateConfig({...config,preset_style:'text',presets:[{id:'old',action:action('profile')}]},'climate'));
  const source=JSON.parse(await readFile(new URL('../assets/material-symbols-source.json',import.meta.url),'utf8'));assert.deepEqual([...symbols].sort(),source.icons.sort());
});

test('sliders expose configured qualitative aria-valuetext while legacy numeric sliders omit it',()=>{
  const slider=new M3Slider();slider.value=75;slider.valueText='Посвежее';const template=slider.render();assert.match(template.strings.join(''),/aria-valuetext=/);assert.ok(template.values.includes('Посвежее'));
  slider.valueText=undefined;assert.ok(!slider.render().values.includes('Посвежее'));
});
