import {available,stateOf,validateAction} from './ha.js';
import {valueAction} from './quick-controls.js';
const entityId=x=>typeof x==='string'&&/^[a-z_][a-z0-9_]*\.[a-z0-9_]+$/.test(x);
function validFilterReset(item){const action=item.action;return /^button\.[a-z0-9_]+$/.test(item.entity||'')&&action?.action==='perform-action'&&action.perform_action==='button.press'&&action.target?.entity_id===item.entity&&Object.keys(action.target).length===1&&Object.keys(action).every(k=>['action','perform_action','target'].includes(k));}
export function validateQuickSettings(menu){
  if(menu===undefined)return;
  if(!menu||!Array.isArray(menu.groups)||!menu.groups.length||menu.groups.length>8)throw new Error('Settings need groups');
  const ids=new Set();
  for(const group of menu.groups){
    if(typeof group.name!=='string'||!group.name.trim()||!Array.isArray(group.items)||!group.items.length||group.items.length>20)throw new Error('Settings group invalid');
    if(group.controls!==undefined&&(!Array.isArray(group.controls)||group.controls.some(x=>typeof x!=='string'||!/^[-a-z0-9_]+$/.test(x))))throw new Error('Invalid settings scope');
    for(const item of group.items){
      if(!item||typeof item.id!=='string'||!/^[-a-z0-9_]+$/.test(item.id)||ids.has(item.id)||typeof item.name!=='string'||!item.name.trim())throw new Error('Settings item invalid');ids.add(item.id);
      if(item.type==='switch'){
        if(!entityId(item.entity))throw new Error('Switch needs entity');
        for(const [action,service]of [[item.on_action,'switch.turn_on'],[item.off_action,'switch.turn_off']]){
          validateAction(action);
          // Switch actions are explicitly bound to exactly this switch. No
          // arbitrary data, group target or homeassistant.toggle fallback.
          if(!item.entity.startsWith('switch.')||action.action!=='perform-action'||action.perform_action!==service||action.target?.entity_id!==item.entity||Object.keys(action.target).length!==1||action.data!==undefined)throw new Error('Switch action must target its exact entity');
        }
      }else if(item.type==='select'){
        if(!entityId(item.entity))throw new Error('Select needs entity');validateAction(item.action);
        for(const key of ['attribute','options_attribute'])if(item[key]!==undefined&&(typeof item[key]!=='string'||!/^[-a-z0-9_]+$/.test(item[key])))throw new Error('Invalid select attribute');
        const script=item.action.action==='perform-action'&&item.action.perform_action.startsWith('script.');
        const exactSelect=item.entity.startsWith('select.')&&item.action.action==='perform-action'&&item.action.perform_action==='select.select_option'&&item.action.target?.entity_id===item.entity&&Object.keys(item.action.target).length===1&&item.action.value_field==='option'&&item.action.data===undefined;
        if(!script&&!exactSelect)throw new Error('Select needs a script gateway or exact select target');
        valueAction(item.action,'test');
      }else if(item.type==='link'){
        validateAction(item.action);if(item.action.action!=='more-info'||!/^sensor\.[a-z0-9_]+$/.test(item.action.entity||''))throw new Error('Link must open sensor information');
      }else if(item.type==='reading'){
        if(!/^(sensor|binary_sensor|update)\.[a-z0-9_]+$/.test(item.entity||'')||item.action!==undefined)throw new Error('Reading must be a read-only sensor or update state');
      }else if(item.type==='filter-reset'){
        validateAction(item.action);if(!validFilterReset(item))throw new Error('Filter reset must target its exact permitted button');
      }else if(item.type==='scale-native-auto'){
        if(typeof item.control_id!=='string'||!/^[-a-z0-9_]+$/.test(item.control_id)||item.action!==undefined||item.entity!==undefined)throw new Error('Native Auto must reference a scale');
      }else throw new Error('Unknown settings item');
    }
  }
}
export function settingsState(hass,item){
  if(item.type==='link')return {available:true};
  const state=stateOf(hass,item.entity);
  // HA button state is often "unknown" until its first press; the entity
  // still exists. Missing and unavailable entities remain disabled.
  if(item.type==='filter-reset')return {available:!!state&&typeof state.state==='string'&&state.state!=='unavailable',value:null};
  if(!available(state))return {available:false,value:null};
  if(item.type==='reading')return {available:true,value:state.state,unit:typeof state.attributes?.unit_of_measurement==='string'?state.attributes.unit_of_measurement:''};
  if(item.type==='switch')return {available:['on','off'].includes(state.state),value:['on','off'].includes(state.state)?state.state:null};
  const values=state.attributes?.[item.options_attribute||'options'];
  const value=item.attribute?state.attributes?.[item.attribute]:state.state;
  return {available:Array.isArray(values)&&values.length>0&&values.every(x=>typeof x==='string')&&values.includes(value),value,options:values};
}
export function settingsAction(hass,item,value){
  const state=settingsState(hass,item);if(!state.available)throw new Error('Setting unavailable');
  if(item.type==='link')return structuredClone(item.action);
  if(item.type==='reading')throw new Error('Reading is read-only');
  if(item.type==='filter-reset'){
    if(value!==true||!validFilterReset(item))throw new Error('Filter reset requires explicit confirmation');
    return structuredClone(item.action);
  }
  if(item.type==='switch'){
    if(typeof value!=='boolean')throw new Error('Invalid switch value');
    return structuredClone(value?item.on_action:item.off_action);
  }
  if(typeof value!=='string'||!state.options.includes(value))throw new Error('Unsupported option');
  return valueAction(item.action,value);
}
