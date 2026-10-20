import test from 'node:test';
import assert from 'node:assert/strict';
import {nothing} from 'lit';
import {presetControlsModel,renderPresetControls,presetControlStyles} from '../src/preset-controls.js';

const state=value=>({state:value,attributes:{}});
const action=entity=>({action:'perform-action',perform_action:'script.apply_profile',...(entity?{target:{entity_id:entity}}:{})});
function fixture(){
  return {_config:{presets_name:'Air profile',presets:[{id:'arbitrary-a',name:'Calm',icon:'eco',action:action('script.apply_profile'),active_when:[{entity:'input_select.profile',value:'calm'}]},{id:'arbitrary-b',name:'Fresh',icon:'air',action:action('script.apply_profile'),active_when:[{entity:'input_select.profile',value:'fresh'}]}]},hass:{states:{'script.apply_profile':state('off'),'input_select.profile':state('calm')}},_busy:false,_pending:'',motion:'reduced',t:key=>key};
}
function templates(value){
  if(Array.isArray(value))return value.flatMap(templates);
  if(!value?.strings)return [];
  return [value,...value.values.flatMap(templates)];
}
const buttons=result=>templates(result).filter(part=>part.strings.join('').includes('class="preset-icon"'));
const eventHandler=template=>template.values[template.strings.findIndex(text=>text.endsWith('@click='))];

test('preset style defaults to labeled controls and arbitrary configured IDs determine selection',()=>{
  const card=fixture(),before=structuredClone(card._config),model=presetControlsModel(card);
  assert.equal(model.icons,false);assert.equal(model.current,'Calm');assert.equal(model.label,'Air profile');
  assert.deepEqual(model.choices.map(item=>item.selected),[true,false]);
  assert.equal(buttons(renderPresetControls(card,()=>{})).length,0);
  assert.match(renderPresetControls(card,()=>{}).strings.join(''),/calm-presets/);
  assert.deepEqual(card._config,before);
  delete card._config.presets;assert.equal(renderPresetControls(card,()=>{}),nothing);
});

test('icon presentation preserves configured icons, accessible labels, title, selected toggle and visible current name',()=>{
  const card=fixture();card._config.preset_style='icons';
  const result=renderPresetControls(card,()=>{}),items=buttons(result);
  assert.equal(items.length,2);assert.match(result.strings.join(''),/aria-live=/);
  assert.ok(result.values.includes('Calm'));
  for(const [index,item] of items.entries()){
    const preset=card._config.presets[index],markup=item.strings.join('');
    for(const marker of ['kind="icon"','.label=','title=','.toggle=','.selected='])assert.ok(markup.includes(marker));
    assert.ok(item.values.includes(preset.icon));assert.equal(item.values.filter(value=>value===preset.name).length,2);
  }
  assert.equal(presetControlsModel(card).icons,true);
  card.hass.states['input_select.profile'].state='other';assert.equal(presetControlsModel(card).current,'custom');
});

test('preset buttons fail closed for target availability and busy while pending action remains identifiable',()=>{
  for(const source of ['off','on','unknown','unavailable'])for(const busy of [false,true]){
    const card=fixture();card._busy=busy;card._pending='arbitrary-a';card.hass.states['script.apply_profile']=state(source);
    const choices=presetControlsModel(card).choices;
    for(const item of choices)assert.equal(item.disabled,busy||['unknown','unavailable'].includes(source));
    assert.deepEqual(choices.map(item=>item.loading),[true,false]);
  }
  const card=fixture();delete card.hass.states['script.apply_profile'];assert.ok(presetControlsModel(card).choices.every(item=>item.disabled));
  card.hass.states['script.apply_profile']=state('off');card._config.presets[0].disabled=true;assert.equal(presetControlsModel(card).choices[0].disabled,true);
});

test('icon events retain the configured chooser and maximum gateway availability without bypassing disabled state',()=>{
  const card=fixture(),calls=[];card._config.preset_style='icons';
  card._config.maximum={preset_id:'arbitrary-b',start_action:action('script.start_window')};
  card.hass.states['script.start_window']=state('off');card._pending='maximum';
  let choices=presetControlsModel(card).choices;assert.equal(choices[1].loading,true);assert.equal(choices[1].disabled,false);
  const choose=(...args)=>calls.push(args),event={currentTarget:{name:'trigger'}};
  eventHandler(buttons(renderPresetControls(card,choose))[1])(event);
  assert.equal(calls.length,1);assert.equal(calls[0][0],card);assert.equal(calls[0][1].id,'arbitrary-b');assert.equal(calls[0][2],event);
  card.hass.states['script.start_window']=state('unavailable');choices=presetControlsModel(card).choices;assert.equal(choices[1].disabled,true);
  eventHandler(buttons(renderPresetControls(card,choose))[1])(event);assert.equal(calls.length,1);
});

test('compact presentation retains six independent 48px touch targets and wrap without a fixed total width',()=>{
  const card=fixture();card._config.preset_style='icons';card._config.presets=Array.from({length:6},(_,index)=>({...card._config.presets[0],id:`configured-${index}`,name:`Configured ${index}`}));
  assert.equal(buttons(renderPresetControls(card,()=>{})).length,6);
  const styles=presetControlStyles.cssText;assert.match(styles,/flex-wrap:wrap/);assert.match(styles,/flex:0 0 48px/);assert.match(styles,/width:48px;height:48px/);assert.match(styles,/overflow-wrap:anywhere/);
});
