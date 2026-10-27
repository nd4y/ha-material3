import test from 'node:test';import assert from 'node:assert/strict';
import {validateQuickSettings,settingsState,settingsAction} from '../src/quick-settings-model.js';
const sw=(id,entity)=>({id,name:id,type:'switch',entity,on_action:{action:'perform-action',perform_action:'switch.turn_on',target:{entity_id:entity}},off_action:{action:'perform-action',perform_action:'switch.turn_off',target:{entity_id:entity}}});
const one=sw('ion1','switch.purifier1_ion'),two=sw('uv2','switch.purifier2_uv');
const hass={states:{[one.entity]:{state:'off',attributes:{}},[two.entity]:{state:'on',attributes:{}}}};
test('explicit switches address only the selected device and produce no action merely by reading',()=>{
 const before=structuredClone(hass);validateQuickSettings({groups:[{name:'Air treatment',items:[one,two]}]});
 assert.equal(settingsState(hass,one).value,'off');assert.equal(settingsAction(hass,one,true).target.entity_id,one.entity);assert.equal(settingsAction(hass,two,false).target.entity_id,two.entity);assert.deepEqual(hass,before);
});
test('unknown states or misdirected switches never emit a command',()=>{
 for(const value of ['unknown','unavailable','other']){const h=structuredClone(hass);h.states[one.entity].state=value;assert.equal(settingsState(h,one).available,false);assert.throws(()=>settingsAction(h,one,true));}
 const bad=structuredClone(one);bad.on_action.target.entity_id=two.entity;assert.throws(()=>validateQuickSettings({groups:[{name:'x',items:[bad]}]}));
});
test('select only forwards a confirmed supported option to its script gateway',()=>{
 const item={id:'mode',name:'Mode',type:'select',entity:'select.mode',action:{action:'perform-action',perform_action:'script.gateway',value_field:'choice'}};
 const h={states:{'select.mode':{state:'a',attributes:{options:['a','b']}}}};validateQuickSettings({groups:[{name:'Modes',items:[item]}]});
 assert.equal(settingsAction(h,item,'b').data.choice,'b');assert.throws(()=>settingsAction(h,item,'not-supported'));h.states['select.mode'].state='unknown';assert.throws(()=>settingsAction(h,item,'b'));
});
test('select can use an explicitly configured climate attribute and capability list',()=>{
 const item={id:'swing',name:'Swing',type:'select',entity:'climate.ac',attribute:'swing_mode',options_attribute:'swing_modes',action:{action:'perform-action',perform_action:'script.gateway',value_field:'choice'}};
 const h={states:{'climate.ac':{state:'fan_only',attributes:{swing_mode:'off',swing_modes:['off','both']}}}};
 validateQuickSettings({groups:[{name:'x',items:[item]}]});assert.equal(settingsAction(h,item,'both').data.choice,'both');
 h.states['climate.ac'].attributes.swing_mode='unknown';assert.throws(()=>settingsAction(h,item,'both'));
});
test('independent display select is constrained to its own exact entity',()=>{
 const item={id:'display',name:'Brightness',type:'select',entity:'select.brightness',action:{action:'perform-action',perform_action:'select.select_option',target:{entity_id:'select.brightness'},value_field:'option'}};
 const h={states:{'select.brightness':{state:'Dim',attributes:{options:['Dim','Bright']}}}};
 validateQuickSettings({groups:[{name:'x',items:[item]}]});assert.equal(settingsAction(h,item,'Bright').data.option,'Bright');
 const bad=structuredClone(item);bad.action.target.entity_id='select.other';assert.throws(()=>validateQuickSettings({groups:[{name:'x',items:[bad]}]}));
});
test('links only navigate or open info and repeated ids are rejected',()=>{
 const link={id:'help',name:'Info',type:'link',action:{action:'more-info',entity:'sensor.air'}};assert.doesNotThrow(()=>validateQuickSettings({groups:[{name:'x',items:[link]}]}));
 assert.throws(()=>validateQuickSettings({groups:[{name:'x',items:[one,one]}]}));
 assert.throws(()=>validateQuickSettings({groups:[{name:'x',items:[{...link,action:{action:'perform-action',perform_action:'script.any'}}]}]}));
});
test('readings expose only state and unit without a service action',()=>{
 for(const entity of ['sensor.filter','binary_sensor.error','update.firmware']){
  const item={id:'info',name:'Info',type:'reading',entity},h={states:{[entity]:{state:'on',attributes:{unit_of_measurement:'%'}}}};
  assert.doesNotThrow(()=>validateQuickSettings({groups:[{name:'x',items:[item]}]}));assert.deepEqual(settingsState(h,item),{available:true,value:'on',unit:'%'});assert.throws(()=>settingsAction(h,item,true));
  assert.throws(()=>validateQuickSettings({groups:[{name:'x',items:[{...item,action:{action:'perform-action',perform_action:'update.install'}}]}]}));
 }
 assert.throws(()=>validateQuickSettings({groups:[{name:'x',items:[{id:'bad',name:'x',type:'reading',entity:'climate.device'}]}]}));
});
test('filter reset needs explicit confirmation, availability, and its exact configured button',()=>{
 const item={id:'reset',name:'Reset filter',type:'filter-reset',entity:'button.filter_reset',action:{action:'perform-action',perform_action:'button.press',target:{entity_id:'button.filter_reset'}}};
 const h={states:{[item.entity]:{state:'2026-10-27',attributes:{}}}};
 assert.doesNotThrow(()=>validateQuickSettings({groups:[{name:'x',items:[item]}]}));assert.throws(()=>settingsAction(h,item));assert.throws(()=>settingsAction(h,item,false));assert.deepEqual(settingsAction(h,item,true),item.action);
 for(const bad of [{...item,action:{...item.action,target:{entity_id:'button.other'}}},{...item,action:{...item.action,perform_action:'homeassistant.toggle'}},{...item,action:{...item.action,data:{value:1}}},{...item,entity:'switch.filter'}])assert.throws(()=>validateQuickSettings({groups:[{name:'x',items:[bad]}]}));
 h.states[item.entity].state='unknown';assert.equal(settingsState(h,item).available,true);assert.deepEqual(settingsAction(h,item,true),item.action);
 h.states[item.entity].state='unavailable';assert.throws(()=>settingsAction(h,item,true));delete h.states[item.entity];assert.throws(()=>settingsAction(h,item,true));
});
