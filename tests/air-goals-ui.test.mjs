import test from 'node:test';
import assert from 'node:assert/strict';
import {airGoalModel,airGoalValue,airBoostModel,airBoostAction,airCountdown,airHealthAlerts,airHealthAcknowledgementAvailable,commitAirGoal,commitAirAutomatic,syncAirGoalDrafts,clearAirGoalTimers,renderAirGoals,renderHealthAlerts} from '../src/air-goals.js';
import {validateConfig} from '../src/ha.js';

const state=(value,attributes={})=>({state:String(value),attributes});
const action=(service,field)=>({action:'perform-action',perform_action:'script.'+service,...(field?{value_field:field}:{})});
const goal=()=>({id:'fresh-air',name:'Fresh air',entity:'input_number.air_wish',automatic_entity:'input_boolean.air_auto',set_action:action('wish','value'),automatic_action:action('automatic','automatic'),boost:{active_entity:'input_boolean.air_boost',deadline_entity:'input_datetime.air_deadline',start_action:action('boost','duration'),cancel_action:action('cancel'),durations:[10,15],default_duration:15}});
const now=1800000000000;
function fixture(){return {states:{'input_number.air_wish':state(40,{min:0,max:100,step:1}),'input_boolean.air_auto':state('on'),'input_boolean.air_boost':state('off'),'input_datetime.air_deadline':state('2027-01-15 08:00:00',{timestamp:now/1000+900})}};}
const climate=()=>({entities:{room_temperature:'sensor.room',target_temperature:'input_number.target',enabled:'input_boolean.enabled'},air_goals:[goal()]});

test('air intention source matrix fails closed for numeric, automatic and availability failures',()=>{
  let cases=0;
  for(const value of [-1,0,50,100,101,'unknown','unavailable','bad','',null])for(const auto of ['on','off','unknown','unavailable','bad'])for(const availability of ['on','off','unknown','unavailable']){
    const hass=fixture(),item={...goal(),availability_entity:'binary_sensor.ready'};hass.states[item.entity]=state(value,{min:0,max:100,step:1});hass.states[item.automatic_entity]=state(auto);hass.states[item.availability_entity]=state(availability);
    assert.equal(airGoalModel(hass,item).available,[0,50,100].includes(value)&&['on','off'].includes(auto)&&availability==='on');cases++;
  }
  assert.equal(cases,200);assert.equal(airGoalModel({states:{}},goal()).available,false);
  for(const attrs of [{min:1,max:100,step:1},{min:0,max:99,step:1},{min:0,max:100,step:0},{min:0,max:100,step:-1},{min:0,max:100},{min:0,max:100,step:'bad'}]){const hass=fixture();hass.states[goal().entity].attributes=attrs;assert.equal(airGoalModel(hass,goal()).available,false);}
});

test('manual intentions preserve bounds and steps without translating to motor percentage',()=>{
  const hass=fixture(),item=goal();hass.states[item.entity].attributes.step=5;const model=airGoalModel(hass,item);
  for(const value of [0,5,50,100])assert.equal(airGoalValue(model,value),value);
  for(const value of [-1,3,101,NaN,Infinity,'',null,undefined])assert.throws(()=>airGoalValue(model,value));
  assert.throws(()=>airGoalValue({...model,available:false},50));
});

test('boost helper matrix uses absolute server time and never assumes unknown is inactive',()=>{
  let cases=0;
  for(const active of ['on','off','unknown','unavailable','bad'])for(const deadline of [now/1000+900,now/1000,now/1000-1,undefined,null,'bad',0])for(const ready of ['on','off','unknown']){
    const hass=fixture(),item=goal();item.boost.availability_entity='binary_sensor.boost_ready';hass.states[item.boost.availability_entity]=state(ready);hass.states[item.boost.active_entity]=state(active);hass.states[item.boost.deadline_entity].attributes.timestamp=deadline;
    const model=airBoostModel(hass,item,now),known=['on','off'].includes(active)&&typeof deadline==='number'&&deadline>0;
    assert.equal(model.available,known&&ready==='on');assert.equal(model.active,active==='on');assert.equal(model.remaining,known&&active==='on'?Math.max(0,deadline-now/1000):null);cases++;
  }
  assert.equal(cases,105);
  const hass=fixture(),item=goal();delete hass.states[item.boost.deadline_entity];assert.equal(airBoostModel(hass,item,now).available,false);
  assert.deepEqual(airBoostModel(hass,{...item,boost:undefined},now),{available:false,active:false,remaining:null,expired:false});
});

test('boost countdown is derived from deadline, includes expiry and ignores browser-local state formatting',()=>{
  const hass=fixture(),item=goal();hass.states[item.boost.active_entity].state='on';hass.states[item.boost.deadline_entity].state='arbitrary-localized-date';
  assert.equal(airCountdown(airBoostModel(hass,item,now+1001).remaining),'14:59');
  assert.equal(airBoostModel(hass,item,now+900000).expired,true);
  assert.equal(airCountdown(airBoostModel(hass,item,now+999999).remaining),'0:00');
  assert.equal(airCountdown(null),null);
});

test('boost action only submits selected duration, never silently extends an active boost',()=>{
  const hass=fixture(),item=goal();const before=structuredClone(item);
  for(const duration of [10,15])assert.deepEqual(airBoostAction(hass,item,duration,now),{action:'perform-action',perform_action:'script.boost',data:{duration}});
  assert.deepEqual(item,before);for(const duration of [0,11,'15',-1,NaN])assert.throws(()=>airBoostAction(hass,item,duration,now));
  hass.states[item.boost.active_entity].state='on';assert.throws(()=>airBoostAction(hass,item,15,now));
  hass.states[item.boost.active_entity].state='unknown';assert.throws(()=>airBoostAction(hass,item,15,now));
});

test('active boost can still be cancelled while intention, deadline, channel or device is unavailable',()=>{
  for(const failed of ['goal','auto','deadline','availability']){const hass=fixture(),item=goal();item.availability_entity='binary_sensor.ready';hass.states[item.availability_entity]=state('on');hass.states[item.boost.active_entity].state='on';const entity={goal:item.entity,auto:item.automatic_entity,deadline:item.boost.deadline_entity,availability:item.availability_entity}[failed];hass.states[entity]=state('unavailable');const model=airBoostModel(hass,item,now);assert.equal(model.available,false);assert.equal(model.can_cancel,true);}
  for(const active of ['off','unknown','unavailable']){const hass=fixture(),item=goal();hass.states[item.boost.active_entity].state=active;assert.equal(airBoostModel(hass,item,now).can_cancel,false);}
});

test('config validation rejects ambiguous schema and keeps household wiring out of rendering policy',()=>{
  assert.deepEqual(validateConfig(climate(),'climate'),climate());
  const corruptions=[c=>c.air_goals={},c=>c.air_goals.push(goal()),c=>c.air_goals[0].id='unsafe id',c=>c.air_goals[0].name='',c=>c.air_goals[0].entity='fan.motor',c=>c.air_goals[0].automatic_entity='sensor.auto',c=>delete c.air_goals[0].set_action,c=>c.air_goals[0].set_action.value_field='nested.value',c=>c.air_goals[0].automatic_action.action='toggle',c=>c.air_goals[0].status_entity='not-entity',c=>c.air_goals[0].boost.deadline_entity='timer.timer',c=>c.air_goals[0].boost.active_entity='sensor.active',c=>c.air_goals[0].boost.durations=[],c=>c.air_goals[0].boost.durations=[10,10],c=>c.air_goals[0].boost.durations=[10,1.5],c=>c.air_goals[0].boost.durations=[10,0],c=>c.air_goals[0].boost.default_duration=12,c=>c.air_goals[0].boost.cancel_action=null,c=>c.air_goals[0].boost.availability_entity='bad'];
  for(const corrupt of corruptions){const c=climate();corrupt(c);assert.throws(()=>validateConfig(c,'climate'));}
  const c=climate();delete c.air_goals;assert.doesNotThrow(()=>validateConfig(c,'climate'));
});

function cardFixture(){const item=goal(),card={_config:{air_goals:[item]},hass:fixture(),_airDrafts:{},_busy:false,_error:false,_airGoalErrors:{},calls:[],async run(a,key){this.calls.push({action:a,key});},s(entity){return this.hass.states[entity];},t:key=>key,n:value=>String(value),motion:'reduced',_now:now};return {card,item};}

test('manual commit submits only its gateway value, holds a draft until both value and mode are confirmed',async()=>{
  const {card,item}=cardFixture();card._config.air_goals.push({...item,id:'other'});card._airDrafts.other={value:75,automatic:false,editing:true};await commitAirGoal(card,item,60);
  assert.deepEqual(card.calls[0],{action:{action:'perform-action',perform_action:'script.wish',data:{value:60}},key:'air-goal:fresh-air'});
  assert.deepEqual(card._airDrafts[item.id],{value:60,automatic:false});assert.equal(card._airDrafts.other.value,75);
  card.hass.states[item.entity].state='60';syncAirGoalDrafts(card);assert.ok(card._airDrafts[item.id]);
  card.hass.states[item.automatic_entity].state='off';syncAirGoalDrafts(card);assert.equal(card._airDrafts[item.id],undefined);clearAirGoalTimers(card);
});

test('automatic selection sends a real Boolean, does not write another intention or device mode',async()=>{
  for(const automatic of [false,true]){const {card,item}=cardFixture();await commitAirAutomatic(card,item,automatic);assert.deepEqual(card.calls[0].action,{action:'perform-action',perform_action:'script.automatic',data:{automatic}});assert.equal(card.calls.length,1);clearAirGoalTimers(card);}
  const {card,item}=cardFixture();await commitAirAutomatic(card,item,'off');assert.equal(card.calls.length,0);assert.equal(card._error,true);
});

test('failed command rolls back optimistic intention immediately and source loss clears drafts',async()=>{
  const {card,item}=cardFixture();card.run=async()=>card._error=true;await commitAirGoal(card,item,60);assert.equal(card._airDrafts[item.id],undefined);
  card._airDrafts[item.id]={value:60,automatic:false,editing:true};card.hass.states[item.automatic_entity].state='unknown';syncAirGoalDrafts(card);assert.equal(card._airDrafts[item.id],undefined);
  const other=cardFixture();other.card._busy=true;other.card._airDrafts[item.id]={editing:true,value:70};await commitAirGoal(other.card,item,70);assert.equal(other.card.calls.length,0);assert.equal(other.card._airDrafts[item.id],undefined);
});

test('unconfirmed command rolls back on bounded timeout, preserving server value',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});const {card,item}=cardFixture();await commitAirGoal(card,item,60);assert.equal(card._airDrafts[item.id].value,60);t.mock.timers.tick(8000);assert.equal(card._airDrafts[item.id],undefined);assert.equal(card._airGoalErrors[item.id],true);assert.equal(card.hass.states[item.entity].state,'40');clearAirGoalTimers(card);
});

test('health alerts display both supported faults and every unexpected nonhealthy status',()=>{
  const statuses=['healthy','unavailable','error','health_unknown','recovery_required','unknown','unavailable','new_status'];const hass={states:{}},items=statuses.map((value,i)=>({id:String(i),name:'Device '+i,status_entity:'sensor.health_'+i}));for(const [i,value]of statuses.entries())hass.states[items[i].status_entity]=state(value);
  const result=airHealthAlerts(hass,items);assert.equal(result.length,7);assert.equal(result.filter(row=>row.severity==='error').length,2);assert.ok(result.some(row=>row.status==='new_status'));assert.equal(airHealthAlerts({states:{}},[items[0]]).length,1);assert.deepEqual(airHealthAlerts(hass),[]);
  for(const alerts of [{},[{id:'a',name:'A',status_entity:'bad'}],[{id:'a',name:'A',status_entity:'sensor.a'},{id:'a',name:'B',status_entity:'sensor.b'}]]){const c=climate();c.health_alerts=alerts;assert.throws(()=>validateConfig(c,'climate'));}
});

test('fault acknowledgement fails closed unless configured recovery permission is exactly on',()=>{
  const item={acknowledge_action:action('recover'),acknowledgement_entity:'binary_sensor.recovery'};
  for(const value of ['on','off','unknown','unavailable','error'])assert.equal(airHealthAcknowledgementAvailable({states:{[item.acknowledgement_entity]:state(value)}},item),value==='on');
  assert.equal(airHealthAcknowledgementAvailable({states:{}},item),false);assert.equal(airHealthAcknowledgementAvailable({states:{}},{...item,acknowledge_action:undefined}),false);assert.equal(airHealthAcknowledgementAvailable({states:{}},{acknowledge_action:action('recover')}),true);
});

test('rendering keeps goal and fault controls configured, no air goals is fully optional',()=>{
  const {card,item}=cardFixture();assert.equal(renderAirGoals(card).length,1);card._config.health_alerts=[{id:'fault',name:'Device',status_entity:'sensor.fault'}];assert.equal(renderHealthAlerts(card)._$litType$,1);card._config.air_goals=[];assert.deepEqual(renderAirGoals(card),[]);
  item.boost=undefined;card._config.air_goals=[item];assert.equal(renderAirGoals(card).length,1);
});
