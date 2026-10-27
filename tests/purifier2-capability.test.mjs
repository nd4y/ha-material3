import test from 'node:test';
import assert from 'node:assert/strict';
import {scaleChoices,scaleSelection} from '../src/climate-scale.js';
import {quickScaleModel,quickScaleRequest,quickScaleNativeAvailable,quickScaleNativeRequest,quickScaleConfirmed,deviceOwnerSnapshot,deviceOwnerRequest,deviceOwnerConfirmed,deviceOwnerManualReady,validateQuickScale} from '../src/quick-scale.js';
import {ownerAction,ownerModel,deviceOwnershipModel} from '../src/ownership.js';
import {validateAction} from '../src/ha.js';

const s=(state,attributes={})=>({state:String(state),attributes,last_changed:new Date().toISOString()});
const gateway={action:'perform-action',perform_action:'script.p2_gateway',value_field:'choice'};
const item={id:'speed',name:'Заданная мощность',entity:'select.favorite',options_attribute:'options',lock_entity:'input_boolean.speed_lock',value_entity:'input_text.saved_speed',set_action:{...gateway},auto:{value:'native_auto',active_when:[{entity:'fan.p2',attribute:'preset_mode',value:'Авто'}],action:{action:'perform-action',perform_action:'script.native_auto'}},mode_scale:{kind:'purifier-speed',gateway,revision_entity:'input_text.request',completed_entity:'input_text.completed',automatic_mode:'native',native_auto_preset:'Авто',freeze_allowed:false,confirmation:{manual_checks:[{entity:'fan.p2',attribute:'preset_mode',value:'Ручной'}]}}};
const card={entity:'fan.p2',runtime_ready_entity:'input_boolean.ready',power:{lock_entity:'input_boolean.power_lock',value_entity:'input_boolean.saved_power'},quick_controls:[item],device_ownership:{gateway:{action:'perform-action',perform_action:'script.owner',value_field:'owner'},revision_entity:'input_text.request',completed_entity:'input_text.completed'}};
const make=()=>({states:{'fan.p2':s('on',{preset_mode:'Ручной',preset_modes:['Авто','Ручной']}),'select.favorite':s('5',{options:['0','5','7']}),'input_boolean.ready':s('on'),'input_text.transition':s('idle'),'input_boolean.speed_lock':s('on'),'input_boolean.power_lock':s('on'),'input_boolean.saved_power':s('on'),'input_text.saved_speed':s('5'),'input_text.request':s('none'),'input_text.completed':s('none')}});

test('native option replaces HA auto; default scales stay unchanged',()=>{
 const native={kind:'purifier-speed',options:['0','5'],automatic:'native'};
 assert.deepEqual(scaleChoices(native),['off','0','5','native_auto']);
 assert.deepEqual(scaleSelection(native,'native_auto'),{type:'native-automatic'});
 assert.deepEqual(scaleChoices({...native,automatic:'none'}),['off','0','5']);
 assert.deepEqual(scaleChoices({kind:'purifier-speed',options:['0','5']}),['off','0','5','auto']);
 assert.throws(()=>scaleChoices({...native,options:['native_auto']}));
});
test('native Auto request carries UUID and waits for exact state, lock and marker',()=>{
 const {h,p}=startFixture();h.states['fan.p2'].state='on';const m=quickScaleModel(h,card,p); assert.equal(m.choices.at(-1),'native_auto'); assert(!m.choices.includes('auto'));
 const r=quickScaleRequest(h,card,p,m.choices.indexOf('native_auto')); assert.equal(r.action.data.choice,'native_auto'); assert.match(r.request_id,/^[0-9a-f-]{36}$/);
 h.states['input_text.request'].state=r.request_id; h.states['input_text.completed'].state=r.request_id;
 assert.equal(quickScaleConfirmed(h,card,p,r),false);
 h.states['fan.p2'].attributes.preset_mode='Авто';h.states['input_text.saved_speed'].state='native_auto';
 assert.equal(quickScaleConfirmed(h,card,p,r),true);
 h.states['input_boolean.speed_lock'].state='off'; assert.equal(quickScaleConfirmed(h,card,p,r),false);
});
test('no native Auto option if device off or unsupported; favorite is not Auto speed',()=>{
 const {h,p}=startFixture();h.states['fan.p2'].state='on';h.states['fan.p2'].attributes.preset_mode='Авто';h.states['input_text.saved_speed'].state='native_auto';
 let m=quickScaleModel(h,card,p);assert.equal(m.position,null);assert.equal(m.effective,null);assert(m.choices.includes('native_auto'));
 h.states['fan.p2'].attributes.preset_modes=['Ручной'];m=quickScaleModel(h,card,p);assert(!m.choices.includes('native_auto'));
 h.states['fan.p2'].state='off';h.states['fan.p2'].attributes.preset_modes=['Ручной','Авто'];p.mode_scale.numeric_start={enabled:false};m=quickScaleModel(h,card,p);assert(!m.choices.includes('native_auto'));assert(!m.choices.includes('auto'));assert.equal(m.reason,'backend-unavailable');assert.equal(m.selectable,false);assert.throws(()=>quickScaleRequest(h,card,p,m.choices.indexOf('7')),/unavailable/i);
});
test('missing or mismatched preset metadata never makes favorite an effective speed',()=>{
 const h=make();h.states['fan.p2'].attributes.preset_mode='unknown';assert.equal(quickScaleModel(h,card,item).effective,null);
 h.states['fan.p2'].attributes.preset_mode='Авто';h.states['input_text.saved_speed'].state='5';assert.equal(quickScaleModel(h,card,item).effective,null);
 const wrong={...item,auto:{...item.auto,active_when:[{entity:'fan.other',attribute:'preset_mode',value:'Авто'}]}};
 assert.throws(()=>quickScaleModel(h,card,wrong),/readback does not match/);
 const wrongManual={...item,mode_scale:{...item.mode_scale,confirmation:{manual_checks:[{entity:'fan.other',attribute:'preset_mode',value:'Ручной'}]}}};
 assert.throws(()=>quickScaleModel(h,card,wrongManual),/Manual preset readback does not match/);
});
test('unconfirmed HA automatic and freeze cannot be requested or reported',()=>{
 const h=make();assert.equal(deviceOwnerSnapshot(h,card),null);assert.throws(()=>deviceOwnerRequest(h,card,'manual'),/unavailable/i);assert.throws(()=>deviceOwnerRequest(h,card,'auto'),/unavailable/i);assert.throws(()=>ownerAction(h,item,'ha'),/unavailable/i);
 h.states['input_boolean.speed_lock'].state='off';assert.equal(ownerModel(h,item).available,false);assert.equal(deviceOwnershipModel(h,card).known,false);assert.equal(quickScaleModel(h,card,item).owner,'unknown');
});
test('native configuration requires real preset metadata and explicit readback',()=>{
 assert.doesNotThrow(()=>validateQuickScale(item));
 assert.throws(()=>validateQuickScale({...item,mode_scale:{...item.mode_scale,native_auto_preset:''}}));
 assert.throws(()=>validateQuickScale({...item,auto:undefined}));
 assert.throws(()=>validateQuickScale({...item,mode_scale:{...item.mode_scale,freeze_allowed:'false'}}));
});
test('service names can contain digits without admitting malformed services',()=>{
 assert.doesNotThrow(()=>validateAction({action:'perform-action',perform_action:'script.office_purifier2_scale_gateway'}));
 for(const id of ['script.2gateway','script.office-gateway','script.gateway.extra','script.','script.gateway\n','script.gateway\nservice'])assert.throws(()=>validateAction({action:'perform-action',perform_action:id}));
});
const sha='a'.repeat(64),oldId='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const start={enabled:true,backend_hash_entity:'input_text.backend_hash',backend_sha256:sha,independent_lock_entity:'input_boolean.independent',origin_entity:'input_text.origin',transition_entity:'input_text.transition',health_entity:'binary_sensor.health',fault_latched_entity:'input_boolean.fault',fault_sensor_entity:'sensor.fault',fault_clear_value:'No Faults',protection_entity_source:'input_text.protection',protection_id:'p2_protection'};
function startFixture(){const h=make(),p={...item,mode_scale:{...item.mode_scale,numeric_start:start}};Object.assign(h.states,{'input_text.backend_hash':s(sha),'input_boolean.independent':s('off'),'input_text.origin':s(`slider_off:${oldId}`),'binary_sensor.health':s('on'),'input_boolean.fault':s('off'),'sensor.fault':s('No Faults'),'input_text.protection':s('automation.p2_protection'),'automation.p2_protection':s('on',{id:'p2_protection'})});h.states['fan.p2'].state='off';h.states['input_boolean.saved_power'].state='off';h.states['input_text.request'].state=oldId;h.states['input_text.completed'].state=oldId;return {h,p};}
test('explicit numeric-start capability requires matching backend marker, protection and provenance',()=>{
 const {h,p}=startFixture();let m=quickScaleModel(h,card,p);assert.equal(m.selectable,true);assert(m.choices.includes('0'));
 for(const [entity,value] of [['input_boolean.independent','on'],['input_boolean.independent','unknown'],['input_text.backend_hash','unknown'],['input_text.origin','unknown'],['input_text.origin','independent'],['input_text.completed','other'],['input_text.request','other'],['input_boolean.saved_power','on'],['binary_sensor.health','unknown'],['input_boolean.fault','on'],['sensor.fault','unknown'],['automation.p2_protection','off']]){
  const prior=h.states[entity].state;h.states[entity].state=value;m=quickScaleModel(h,card,p);assert.equal(m.selectable,false,`${entity}:${value}`);assert.throws(()=>quickScaleRequest(h,card,p,m.choices.indexOf('7')));h.states[entity].state=prior;
 }
 h.states['input_boolean.power_lock'].state='off';h.states['input_text.origin'].state='unknown';assert.equal(quickScaleModel(h,card,p).selectable,false);h.states['input_text.origin'].state='none';assert.equal(quickScaleModel(h,card,p).selectable,true);
 assert.equal(quickScaleModel(h,card,{...p,mode_scale:{...p.mode_scale,numeric_start:{enabled:false}}}).selectable,false);
});
test('numeric start needs matching token and readback of on, mode, power lock, setting and origin',()=>{
 const {h,p}=startFixture(),m=quickScaleModel(h,card,p),r=quickScaleRequest(h,card,p,m.choices.indexOf('0'));assert.equal(r.choice,'0');assert.equal(r.action.data.choice,'0');
 h.states['input_text.request'].state=r.request_id;h.states['input_text.completed'].state=r.request_id;h.states['fan.p2'].state='on';h.states['fan.p2'].attributes.preset_mode='Ручной';h.states['select.favorite'].state='0';h.states['input_text.saved_speed'].state='0';h.states['input_boolean.saved_power'].state='on';h.states['input_text.origin'].state=`manual_on:${r.request_id}`;
 assert.equal(quickScaleConfirmed(h,card,p,r),true);
 for(const [entity,value] of [['input_text.completed','other'],['input_boolean.power_lock','off'],['input_boolean.saved_power','off'],['input_boolean.independent','on'],['input_text.origin',`manual_on:${oldId}`],['select.favorite','5'],['input_text.backend_hash','b'.repeat(64)],['binary_sensor.health','unknown']]){const prior=h.states[entity].state;h.states[entity].state=value;assert.equal(quickScaleConfirmed(h,card,p,r),false,entity);h.states[entity].state=prior;}
});
test('numeric start rechecks admission immediately before request',()=>{
 const {h,p}=startFixture(),m=quickScaleModel(h,card,p);assert.equal(m.selectable,true);h.states['input_boolean.independent'].state='on';assert.throws(()=>quickScaleRequest(h,card,p,m.choices.indexOf('7')),/unavailable/i);
});
const haAuto={enabled:true,controller_entity_source:'input_text.controller',controller_id:'p2_controller'};
function haFixture(){const {h,p}=startFixture();p.mode_scale={...p.mode_scale,automatic_mode:'ha',ha_auto:haAuto};const c={...card,quick_controls:[p]};h.states['input_text.controller']=s('automation.p2_controller');h.states['automation.p2_controller']=s('on',{id:'p2_controller'});return {h,p,c};}
function freezeFixture(){const {h,p,c}=haFixture();p.mode_scale.freeze_setting={enabled:true,ttl_entity:'input_number.ttl',setting_entity:'select.favorite',manual_preset:'Ручной'};h.states['input_number.ttl']=s('60');h.states['fan.p2'].state='on';h.states['fan.p2'].last_reported=new Date().toISOString();h.states['select.favorite'].last_reported=new Date().toISOString();h.states['input_boolean.power_lock'].state='off';h.states['input_boolean.speed_lock'].state='off';return {h,p,c};}
test('freeze is opt-in and captures a fresh manual setting without claiming physical speed',()=>{
 const {h,p,c}=freezeFixture();assert.doesNotThrow(()=>validateQuickScale(p));assert.equal(deviceOwnerManualReady(h,c),true);const snapshot=deviceOwnerSnapshot(h,c);assert.deepEqual(snapshot,{power:true,values:{speed:'5'},settingOnly:true});const r=deviceOwnerRequest(h,c,'manual');assert.equal(r.action.data.owner,'manual');assert.match(r.request_id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);assert.equal(deviceOwnerConfirmed(h,c,r),false);
 h.states['input_text.request'].state=r.request_id;h.states['input_text.completed'].state=r.request_id;h.states['input_boolean.speed_lock'].state='on';h.states['input_boolean.power_lock'].state='on';h.states['input_boolean.independent'].state='on';h.states['input_boolean.saved_power'].state='on';h.states['input_text.saved_speed'].state='5';h.states['input_text.origin'].state=`device_lock:${r.request_id}`;assert.equal(deviceOwnerConfirmed(h,c,r),true);
 for(const [id,bad] of [['input_text.completed','other'],['input_text.request','other'],['input_boolean.independent','off'],['input_text.origin','bad'],['input_boolean.speed_lock','off'],['input_boolean.power_lock','off'],['input_boolean.saved_power','off'],['input_text.saved_speed','7'],['select.favorite','7'],['binary_sensor.health','off']]){const before=h.states[id].state;h.states[id].state=bad;assert.equal(deviceOwnerConfirmed(h,c,r),false,id);h.states[id].state=before;}
});
test('freeze fails closed on missing, stale, future, invalid, native-auto and unready inputs',()=>{
 const {h,p,c}=freezeFixture();const cases=[['fan.p2','last_reported',undefined],['fan.p2','last_reported',new Date(Date.now()-61000).toISOString()],['select.favorite','last_reported',new Date(Date.now()+60000).toISOString()],['input_number.ttl','state','0'],['input_number.ttl','state','unknown'],['select.favorite','state','99'],['input_text.saved_speed','state','unavailable'],['binary_sensor.health','state','off'],['input_text.backend_hash','state','bad']];for(const [id,key,value] of cases){const before=h.states[id][key];h.states[id][key]=value;assert.equal(deviceOwnerManualReady(h,c),false,id+':'+key);assert.throws(()=>deviceOwnerRequest(h,c,'manual'));h.states[id][key]=before;}
 h.states['fan.p2'].attributes.preset_mode='Авто';assert.equal(deviceOwnerManualReady(h,c),false);assert.throws(()=>deviceOwnerRequest(h,c,'manual'));h.states['fan.p2'].attributes.preset_mode='unknown';assert.equal(deviceOwnerManualReady(h,c),false);h.states['fan.p2'].attributes.preset_mode='Ручной';p.mode_scale.freeze_setting.enabled=false;assert.equal(deviceOwnerManualReady(h,c),false);
});
test('websocket last_updated is a conservative freshness fallback, never a radio report',()=>{
 const {h,c}=freezeFixture(),fan=h.states['fan.p2'],level=h.states['select.favorite'];delete fan.last_reported;delete level.last_reported;fan.last_updated=new Date().toISOString();level.last_updated=new Date().toISOString();assert.equal(deviceOwnerManualReady(h,c),true);assert.equal(deviceOwnerSnapshot(h,c).values.speed,'5');
 for(const [state,value] of [[fan,undefined],[fan,'invalid'],[fan,new Date(Date.now()-61000).toISOString()],[level,new Date(Date.now()+60000).toISOString()]]){const old=state.last_updated;state.last_updated=value;assert.equal(deviceOwnerManualReady(h,c),false);state.last_updated=old;}
 fan.last_reported='invalid';assert.equal(deviceOwnerManualReady(h,c),false);fan.last_reported=new Date(Date.now()-61000).toISOString();assert.equal(deviceOwnerManualReady(h,c),false);
});
test('setting zero is a legitimate manual setting and Off-lock remains separately available',()=>{
 const {h,c}=freezeFixture();h.states['select.favorite'].state='0';assert.equal(deviceOwnerSnapshot(h,c).values.speed,'0');h.states['fan.p2'].state='off';assert.equal(deviceOwnerSnapshot(h,c).deviceOffOnly,true);const r=deviceOwnerRequest(h,c,'manual');h.states['input_text.request'].state=r.request_id;h.states['input_text.completed'].state=r.request_id;h.states['input_boolean.speed_lock'].state='on';h.states['input_boolean.power_lock'].state='on';h.states['input_boolean.saved_power'].state='off';h.states['input_boolean.independent'].state='on';h.states['input_text.origin'].state=`device_lock:${r.request_id}`;assert.equal(deviceOwnerConfirmed(h,c,r),true);
});
test('freeze rejects unsupported or malformed setting even if options claim it is supported',()=>{
 const {h,c}=freezeFixture();for(const v of ['oops','12','-1','1.5','Infinity','']){h.states['select.favorite'].state=v;h.states['select.favorite'].attributes.options=[v];assert.equal(deviceOwnerManualReady(h,c),false,v);assert.throws(()=>deviceOwnerRequest(h,c,'manual'));}for(const v of ['0','11']){h.states['select.favorite'].state=v;h.states['select.favorite'].attributes.options=[v];assert.equal(deviceOwnerManualReady(h,c),true,v);}
});
test('HA Auto is right endpoint only when actual controller and protection are ready; native Auto stays out of scale',()=>{
 const {h,p,c}=haFixture();let m=quickScaleModel(h,c,p);assert.equal(m.choices.at(-1),'auto');assert(!m.choices.includes('native_auto'));
 const r=quickScaleRequest(h,c,p,m.choices.indexOf('auto'));assert.equal(r.action.perform_action,'script.owner');assert.equal(r.action.data.owner,'auto');assert.equal(r.action.data.choice,undefined);
 h.states['input_text.request'].state=r.request_id;h.states['input_text.completed'].state=r.request_id;h.states['input_boolean.speed_lock'].state='off';h.states['input_boolean.power_lock'].state='off';h.states['input_text.origin'].state=`auto:${r.request_id}`;
 assert.equal(quickScaleConfirmed(h,c,p,r),true);h.states['input_boolean.independent'].state='on';assert.equal(quickScaleConfirmed(h,c,p,r),false);h.states['input_boolean.independent'].state='off';h.states['automation.p2_controller'].state='off';m=quickScaleModel(h,c,p);assert(!m.choices.includes('auto'));assert.throws(()=>quickScaleRequest(h,c,p,m.choices.indexOf('auto')));
});
test('HA Auto is available from Off even if numeric start is blocked by independent lock',()=>{
 const {h,p,c}=haFixture();h.states['input_boolean.independent'].state='on';const m=quickScaleModel(h,c,p);assert.equal(m.reason,'start-unavailable');assert.equal(m.available,false);assert.equal(m.selectable,true);assert.equal(m.choices.at(-1),'auto');assert.throws(()=>quickScaleRequest(h,c,p,m.choices.indexOf('7')),/Starting unavailable/);assert.equal(quickScaleRequest(h,c,p,m.choices.indexOf('auto')).action.data.owner,'auto');
});
test('native Auto menu request needs protection and verifies its own UUID, mode and marker',()=>{
 const {h,p,c}=haFixture();h.states['fan.p2'].state='on';assert(quickScaleNativeAvailable(h,c,p));const r=quickScaleNativeRequest(h,c,p);assert.equal(r.action.data.choice,'native_auto');assert.equal(r.action.perform_action,'script.p2_gateway');
 h.states['input_text.request'].state=r.request_id;h.states['input_text.completed'].state=r.request_id;h.states['fan.p2'].attributes.preset_mode='Авто';h.states['input_text.saved_speed'].state='native_auto';assert.equal(quickScaleConfirmed(h,c,p,r),true);h.states['input_text.completed'].state='other';assert.equal(quickScaleConfirmed(h,c,p,r),false);h.states['automation.p2_protection'].state='off';assert.equal(quickScaleNativeAvailable(h,c,p),false);
});
test('device owner freeze is unavailable while running; Off is locked only on exact backend readback',()=>{
 const {h,p,c}=haFixture();h.states['fan.p2'].state='on';assert.throws(()=>deviceOwnerRequest(h,c,'manual'),/Current settings unavailable/);h.states['fan.p2'].state='off';const r=deviceOwnerRequest(h,c,'manual');assert.equal(r.snapshot.deviceOffOnly,true);h.states['input_text.request'].state=r.request_id;h.states['input_text.completed'].state=r.request_id;h.states['input_boolean.power_lock'].state='on';h.states['input_boolean.speed_lock'].state='on';h.states['input_boolean.saved_power'].state='off';h.states['input_boolean.independent'].state='on';h.states['input_text.origin'].state=`device_lock:${r.request_id}`;assert.equal(deviceOwnerConfirmed(h,c,r),true);h.states['input_text.origin'].state='independent';assert.equal(deviceOwnerConfirmed(h,c,r),false);
});
