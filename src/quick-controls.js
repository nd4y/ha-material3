import {available,finite,stateOf,matches,validateAction,runtimeSafetyReady} from './ha.js';
import {validateOperation} from './operation-colors.js';

const read=(state,attribute)=>attribute?state?.attributes?.[attribute]:state?.state;
export function automationTrustReady(hass,config){const reset=config.automation_reset,id=reset?.runtime_ready_entity;return (id===undefined||stateOf(hass,id)?.state==='on')&&runtimeSafetyReady(hass,reset?.runtime_safety);}
export function automationTrustState(hass,config){
  if(!automationTrustReady(hass,config))return 'unknown';
  const locks=config.automation_reset?.lock_entities??(config.automation_groups||[]).flatMap(group=>(group.controls||[]).map(item=>item.lock_entity));
  const enabled=[config.entities?.enabled,...(config.automation_reset?.enabled_entities||[])].map(entity=>stateOf(hass,entity));
  if(enabled.some(state=>state?.state==='off'))return 'partial';
  if(!enabled.every(state=>available(state)&&state.state==='on')||!locks.length||locks.some(entity=>!entity))return 'unknown';
  const values=locks.map(entity=>stateOf(hass,entity));
  if(values.some(state=>state?.state==='on'))return 'partial';
  return values.every(state=>available(state)&&state.state==='off')?'all':'unknown';
}
export function automationTrustScope(reset,state,language='ru',ready=true,safetyReady=true){
  if(!reset.scope)return null;
  const ru=language.startsWith('ru'),scope=reset.scope,name=ru?'Передать управление автоматике':'Use automatic control';
  const details=ru?`Входят: ${scope.included.join(', ')}. Не входят: ${scope.excluded.join(', ')||'нет'}.`:`Includes: ${scope.included.join(', ')}. Excludes: ${scope.excluded.join(', ')||'none'}.`;
  const status=!safetyReady?(ru?'Защита недоступна':'Protection is unavailable'):!ready?(ru?'Управление временно недоступно':'Control is temporarily unavailable'):state==='all'?(ru?`Автоматика включена: ${scope.label}`:`Automatic control enabled: ${scope.label}`):state==='partial'?(ru?`Есть ручные настройки или автоматика выключена: ${scope.label}`:`Manual settings remain or automation is off: ${scope.label}`):(ru?`Состояние автоматики неизвестно: ${scope.label}`:`Automation state is unknown: ${scope.label}`);
  const help=ru?'Нажатие включает автоматику и снимает ручные ограничения только для указанной группы. Цвет показывает состояние этой группы.':'Tap to enable automation and release manual restrictions only for the listed group. The color represents this group.';
  return {name,status,details,help,label:scope.label};
}
export function automationPermission(hass,item){
  const state=stateOf(hass,item.lock_entity),known=available(state)&&['on','off'].includes(state.state);
  return {available:known,automatic:known&&state.state==='off'};
}
export function manualReadbackAvailable(hass,item){
  const config=item.manual_readback;if(config===undefined)return true;
  const source=stateOf(hass,config.entity);
  if(!available(source)||source.attributes?.source_qualified!==true||source.attributes?.health==='fault')return false;
  if(!config.attribute)return ['on','off','heat','cool','dry','fan_only','auto'].includes(source.state);
  const value=source.attributes?.[config.attribute];
  return typeof value==='number'?Number.isFinite(value):typeof value==='boolean'||typeof value==='string'&&!!value.trim()&&!['unknown','unavailable','auto','авто'].includes(value.toLowerCase());
}
export function automationAction(item,automatic){
  if(typeof automatic!=='boolean')throw new Error('Automatic permission must be boolean');
  return item.lock_action?valueAction(item.lock_action,!automatic):{action:'perform-action',perform_action:`input_boolean.turn_${automatic?'off':'on'}`,target:{entity_id:item.lock_entity}};
}
export function automationSummary(hass,group){
  const online=available(stateOf(hass,group.entity));
  return {available:online,automatic:(group.controls||[]).filter(item=>online&&automationPermission(hass,item).automatic).map(item=>item.name),manual:(group.controls||[]).filter(item=>!online||!automationPermission(hass,item).automatic).map(item=>item.name)};
}
export function controlModel(hass,item){
  const state=stateOf(hass,item.entity),lock=stateOf(hass,item.lock_entity),locked=lock?.state==='on';
  const saved=stateOf(hass,item.value_entity),actual=read(state,item.attribute);
  const value=locked&&item.value_entity?read(saved,item.value_attribute):actual;
  const auto=!!item.auto&&(locked&&item.value_entity?String(value)===String(item.auto.value):matches(hass,item.auto.active_when));
  const metadata=stateOf(hass,item.bounds?.entity||item.entity)?.attributes||{};
  const raw=item.options_attribute?state?.attributes?.[item.options_attribute]:null;
  const options=Array.isArray(raw)?raw.filter(v=>!item.auto||String(v)!==String(item.auto.value)).map(v=>({value:String(v),label:item.option_labels?.[v]||String(v)})):null;
  const usable=available(state)&&(!item.lock_entity||available(lock)&&['on','off'].includes(lock.state))&&(!locked||!item.value_entity||available(saved));
  if(options){
    const index=options.findIndex(o=>o.value===String(auto?actual:value));
    return {available:usable&&options.length>0&&(auto||index>=0),locked,auto,value,actual,options,min:0,max:options.length-1,step:1,position:Math.max(0,index),label:auto?null:options[index]?.label,unit:item.unit||''};
  }
  const min=finite(metadata[item.bounds?.min||'min']),max=finite(metadata[item.bounds?.max||'max']),step=finite(metadata[item.bounds?.step||'step']);
  const number=finite(value),valid=min!==null&&max!==null&&step!==null&&step>0&&max>min&&number!==null&&number>=min&&number<=max;
  return {available:usable&&valid,locked,auto,value:number,actual,options:null,min,max,step,position:number,unit:item.unit??metadata.unit_of_measurement??''};
}
export function controlValue(model,position){
  if(!model.available||!Number.isFinite(Number(position)))throw new Error('Unavailable control');
  const value=Number(position);
  if(model.options){if(!Number.isInteger(value)||!model.options[value])throw new Error('Invalid option');return model.options[value].value;}
  if(value<model.min||value>model.max)throw new Error('Value outside device bounds');
  const steps=(value-model.min)/model.step;
  if(Math.abs(steps-Math.round(steps))>1e-5)throw new Error('Value outside device step');
  return value;
}
export function valueAction(action,value){
  if(!action||action.action!=='perform-action'||!action.value_field||!/^[a-z_][a-z0-9_]*$/.test(action.value_field))throw new Error('Invalid value action');
  const result=structuredClone(action);delete result.value_field;result.data={...result.data,[action.value_field]:value};return result;
}
export function validateControls(config){
  validateOperation(config);
  const ids=new Set();
  for(const item of config.quick_controls||[]){
    if(!item.id||ids.has(item.id)||!item.name||!item.entity||!item.set_action)throw new Error('Controls need unique IDs, names, entities and set actions');
    ids.add(item.id);
    if(item.lock_entity&&!/^input_boolean\.[a-z0-9_]+$/.test(item.lock_entity))throw new Error('Lock must be input_boolean');
    for(const action of [item.set_action,item.lock_action].filter(Boolean)){validateAction(action);valueAction(action,0);}
    if(item.auto){validateAction(item.auto.action);if(item.auto.effective_readback!==undefined&&typeof item.auto.effective_readback!=='boolean')throw new Error('effective_readback must be boolean');}
  }
  if(config.power){validateAction(config.power.action);valueAction(config.power.action,true);if(config.power.lock_action){validateAction(config.power.lock_action);valueAction(config.power.lock_action,true);}if(config.power.lock_entity&&!/^input_boolean\.[a-z0-9_]+$/.test(config.power.lock_entity))throw new Error('Power lock must be input_boolean');}
}
