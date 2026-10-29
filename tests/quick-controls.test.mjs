import test from 'node:test';import assert from 'node:assert/strict';
import {controlModel,controlValue,valueAction,validateControls,manualReadbackAvailable} from '../src/quick-controls.js';
const s=(state,attributes={})=>({state:String(state),attributes});
test('explicit ownership readback never freezes missing, unqualified, faulted or native Auto values',()=>{
 const item={manual_readback:{entity:'sensor.source',attribute:'fan_mode'}},source=s('off',{source_qualified:true,health:'healthy',fan_mode:null}),h={states:{'sensor.source':source}};
 for(const value of [null,undefined,'','auto','unknown','unavailable',NaN,{},[]]){source.attributes.fan_mode=value;assert.equal(manualReadbackAvailable(h,item),false);}
 for(const value of ['0','3',0,false]){source.attributes.fan_mode=value;assert.equal(manualReadbackAvailable(h,item),true);}
 source.attributes.health='fault';assert.equal(manualReadbackAvailable(h,item),false);source.attributes.health='unknown';assert.equal(manualReadbackAvailable(h,item),true);
 source.attributes.source_qualified=false;assert.equal(manualReadbackAvailable(h,item),false);source.attributes.source_qualified=true;
 source.state='unavailable';assert.equal(manualReadbackAvailable(h,item),false);source.state='off';
 item.manual_readback={entity:'sensor.source'};assert.equal(manualReadbackAvailable(h,item),true);
 assert.equal(manualReadbackAvailable(h,{}),true);
});
const numeric={id:'target',name:'Target',entity:'climate.demo',attribute:'temperature',bounds:{min:'min_temp',max:'max_temp',step:'target_temp_step'},lock_entity:'input_boolean.lock',value_entity:'input_number.saved',set_action:{action:'perform-action',perform_action:'script.manual',value_field:'value'}};
test('numeric controls use device bounds and held intent, never fixed temperature limits',()=>{
  const hass={states:{'climate.demo':s('heat',{temperature:21,min_temp:10,max_temp:38,target_temp_step:.5}),'input_boolean.lock':s('off'),'input_number.saved':s(30)}};
  let m=controlModel(hass,numeric);assert.equal(m.value,21);assert.equal(controlValue(m,37.5),37.5);assert.throws(()=>controlValue(m,38.5));assert.throws(()=>controlValue(m,20.2));
  hass.states['input_boolean.lock']=s('on');m=controlModel(hass,numeric);assert.equal(m.value,30);assert.equal(m.locked,true);
  hass.states['input_boolean.lock']=s('unavailable');assert.equal(controlModel(hass,numeric).available,false);
});
test('option sliders translate indices to metadata values and preserve native Auto behind a lock',()=>{
  const item={...numeric,attribute:'fan_mode',options_attribute:'fan_modes',value_entity:'input_text.saved',auto:{value:'auto',active_when:[{entity:'climate.demo',attribute:'preset_mode',value:'auto'}]}};
  const hass={states:{'climate.demo':s('fan_only',{fan_mode:'4',fan_modes:['2','4','7'],preset_mode:'manual'}),'input_boolean.lock':s('off'),'input_text.saved':s('auto')}};
  let m=controlModel(hass,item);assert.equal(controlValue(m,1),'4');assert.equal(controlValue(m,2),'7');assert.throws(()=>controlValue(m,1.5));assert.throws(()=>controlValue(m,3));
  hass.states['input_boolean.lock']=s('on');m=controlModel(hass,item);assert.equal(m.auto,true);assert.equal(m.position,1);assert.equal(m.value,'auto');
  hass.states['climate.demo']=s('unavailable');assert.equal(controlModel(hass,item).available,false);
});
test('a missing option is unavailable instead of sending the wrong discrete speed',()=>{
  const item={...numeric,attribute:'fan_mode',options_attribute:'fan_modes'};
  const hass={states:{'climate.demo':s('fan_only',{fan_mode:'old',fan_modes:['low','high']}),'input_boolean.lock':s('off')}};
  assert.equal(controlModel(hass,item).available,false);
});
test('value actions inject typed values without altering configured bindings',()=>{
  const action={action:'perform-action',perform_action:'script.manual',data:{device:'example'},value_field:'value'};
  assert.deepEqual(valueAction(action,false),{action:'perform-action',perform_action:'script.manual',data:{device:'example',value:false}});
  assert.equal(action.data.value,undefined);assert.throws(()=>valueAction({...action,value_field:'__proto__.x'},1));
  assert.throws(()=>validateControls({quick_controls:[numeric,numeric]}));
});
