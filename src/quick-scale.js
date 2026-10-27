import {available,stateOf,validateAction,matches,runtimeSafetyReady} from './ha.js';
import {automationPermission,controlModel,valueAction} from './quick-controls.js';
import {scaleChoices,effectivePosition} from './climate-scale.js';

const kinds=new Set(['breather-temperature','breather-speed','ac-temperature','ac-speed','purifier-speed','heater-temperature']);
const decimal=raw=>{if(typeof raw==='number')return Number.isFinite(raw)?raw:null;if(typeof raw!=='string'||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw.trim()))return null;const value=Number(raw);return Number.isFinite(value)?value:null;};
const actionValid=action=>{
  validateAction(action);
  if(action.action!=='perform-action'||!action.perform_action.startsWith('script.')||action.value_field!=='choice')throw new Error('Scale needs a script gateway with choice');
};
export function validateQuickScale(item){
  const s=item.mode_scale;if(s===undefined)return;
  if(!s||!kinds.has(s.kind)||!item.lock_entity||!/^input_text\.[a-z0-9_]+$/.test(s.revision_entity||'')||!/^input_text\.[a-z0-9_]+$/.test(s.completed_entity||'')||s.completed_entity===s.revision_entity)throw new Error('Invalid scale configuration');
  actionValid(s.gateway);
  const f=s.room_freshness;
  if(s.kind==='ac-temperature'&&(!/^sensor\.[a-z0-9_]+$/.test(s.room_entity||'')||!/^input_text\.[a-z0-9_]+$/.test(f?.source_entity||'')||!/^input_number\.[a-z0-9_]+$/.test(f?.ttl_entity||'')||!/^input_datetime\.[a-z0-9_]+$/.test(f?.epoch_entity||'')||!/^sensor\.[a-z0-9_]+$/.test(f?.expected_source||'')))throw new Error('AC scale needs qualified room, pinned primary source, TTL and epoch');
  if(s.kind==='ac-temperature'&&(!/^input_select\.[a-z0-9_]+$/.test(s.confirmation?.mode_entity||'')||!/^input_boolean\.[a-z0-9_]+$/.test(s.confirmation?.writing_entity||'')||!/^input_boolean\.[a-z0-9_]+$/.test(s.confirmation?.pending_entity||'')))throw new Error('AC scale needs saved intent and pending readback');
  if(s.kind==='ac-speed'&&!/^input_text\.[a-z0-9_]+$/.test(s.saved_entity||''))throw new Error('AC speed needs saved request readback');
  if(['breather-speed','purifier-speed','heater-temperature'].includes(s.kind)&&(!Array.isArray(s.confirmation?.manual_checks)||!s.confirmation.manual_checks.length))throw new Error('Scale needs explicit manual mode readback');
  if(s.confirmation?.manual_checks!==undefined&&(!Array.isArray(s.confirmation.manual_checks)||s.confirmation.manual_checks.some(c=>!c||!/^([a-z_][a-z0-9_]*)\.[a-z0-9_]+$/.test(c.entity||'')||typeof c.value!=='string'||(c.attribute!==undefined&&(typeof c.attribute!=='string'||!c.attribute)))))throw new Error('Invalid manual mode readback');
  if(s.turbo!==undefined&&typeof s.turbo!=='boolean')throw new Error('Invalid turbo flag');
  if(s.turbo&&s.kind!=='breather-speed')throw new Error('Turbo only supported on breather speed');
  if(s.turbo&&(!/^input_boolean\.[a-z0-9_]+$/.test(s.confirmation?.turbo_temperature_lock_entity||'')||!/^input_number\.[a-z0-9_]+$/.test(s.confirmation?.turbo_temperature_value_entity||'')))throw new Error('Turbo needs temperature lock and saved temperature readback');
  if(s.effective_entity!==undefined&&!/^[a-z_][a-z0-9_]*\.[a-z0-9_]+$/.test(s.effective_entity))throw new Error('Invalid effective source');
  if(s.effective_attribute!==undefined&&(typeof s.effective_attribute!=='string'||!s.effective_attribute||!s.effective_entity))throw new Error('Invalid effective attribute');
  if(s.automatic_mode!==undefined&&!['ha','native','none'].includes(s.automatic_mode))throw new Error('Invalid automatic mode');
  if(s.freeze_allowed!==undefined&&typeof s.freeze_allowed!=='boolean')throw new Error('Invalid freeze capability');
  if(s.native_auto_preset!==undefined&&(s.kind!=='purifier-speed'||typeof s.native_auto_preset!=='string'||!s.native_auto_preset||!item.auto||!Array.isArray(item.auto.active_when)||!item.auto.active_when.length||item.auto.value!=='native_auto'||!/^input_text\.[a-z0-9_]+$/.test(item.value_entity||'')))throw new Error('Native Auto needs preset, readback and saved marker');
  if(s.automatic_mode==='native'&&!s.native_auto_preset)throw new Error('Native Auto needs preset');
  if(s.numeric_start!==undefined){
    const n=s.numeric_start;
    if(!s.native_auto_preset||!n||typeof n.enabled!=='boolean')throw new Error('Invalid numeric-start capability');
    if(n.enabled&&(!/^input_text\.[a-z0-9_]+$/.test(n.backend_hash_entity||'')||!/^[a-f0-9]{64}$/.test(n.backend_sha256||'')||!/^input_boolean\.[a-z0-9_]+$/.test(n.independent_lock_entity||'')||!/^input_text\.[a-z0-9_]+$/.test(n.origin_entity||'')||!/^input_text\.[a-z0-9_]+$/.test(n.transition_entity||'')||!/^binary_sensor\.[a-z0-9_]+$/.test(n.health_entity||'')||!/^input_boolean\.[a-z0-9_]+$/.test(n.fault_latched_entity||'')||!/^sensor\.[a-z0-9_]+$/.test(n.fault_sensor_entity||'')||typeof n.fault_clear_value!=='string'||!n.fault_clear_value||!/^input_text\.[a-z0-9_]+$/.test(n.protection_entity_source||'')||!/^[a-z0-9_]+$/.test(n.protection_id||'')))throw new Error('Invalid numeric-start capability');
  }
  if(s.ha_auto!==undefined&&(!s.native_auto_preset||!s.ha_auto||typeof s.ha_auto.enabled!=='boolean'||(s.ha_auto.enabled&&(!/^input_text\.[a-z0-9_]+$/.test(s.ha_auto.controller_entity_source||'')||!/^[a-z0-9_]+$/.test(s.ha_auto.controller_id||'')||!s.numeric_start?.enabled))))throw new Error('Invalid HA auto capability');
  if(s.details_action!==undefined)throw new Error('Unverified direct device details are not a safe scale menu');
}
export function validateDeviceOwner(card){
  const d=card.device_ownership;if(d===undefined)return;
  validateAction(d.gateway);
  if(d.gateway.action!=='perform-action'||!d.gateway.perform_action.startsWith('script.')||d.gateway.value_field!=='owner')throw new Error('Device ownership needs a script gateway');
  if(!/^input_text\.[a-z0-9_]+$/.test(d.revision_entity||'')||!/^input_text\.[a-z0-9_]+$/.test(d.completed_entity||'')||d.completed_entity===d.revision_entity||!card.power?.lock_entity||!card.power?.value_entity||!card.quick_controls?.length||card.quick_controls.some(item=>!item.lock_entity||!item.value_entity||!item.mode_scale||item.mode_scale.revision_entity!==d.revision_entity||item.mode_scale.completed_entity!==d.completed_entity))throw new Error('Device ownership needs matching request ID and readback for power and every parameter');
}
export function requestId(source=globalThis.crypto){
  let id;
  if(typeof source?.randomUUID==='function')id=source.randomUUID();
  else if(typeof source?.getRandomValues==='function'){
    const bytes=source.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');id=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }else throw new Error('Secure request ID unavailable');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw new Error('Invalid request ID');return id;
}
export function deviceOwnerRequest(hass,card,owner){
  validateDeviceOwner(card);if(!['manual','auto'].includes(owner)||![card.device_ownership.revision_entity,card.device_ownership.completed_entity].every(id=>available(stateOf(hass,id))))throw new Error('Device ownership unavailable');
  if(owner==='auto'&&card.quick_controls.some(item=>['native','none'].includes(item.mode_scale?.automatic_mode)||(item.mode_scale?.ha_auto&&!haAutoReady(hass,card,item))))throw new Error('HA automatic control unavailable');
  if(owner==='manual'&&card.quick_controls.some(item=>item.mode_scale?.ha_auto&&!numericStartPrerequisites(hass,card,item.mode_scale.numeric_start,false)))throw new Error('Device protection unavailable');
  const snapshot=owner==='manual'?deviceOwnerSnapshot(hass,card):null;if(owner==='manual'&&!snapshot)throw new Error('Current settings unavailable');
  const id=requestId(),action=valueAction(card.device_ownership.gateway,owner);action.data.request_id=id;return {owner,snapshot,request_id:id,action};
}
export function deviceOwnerSnapshot(hass,card){
  validateDeviceOwner(card);
  const device=stateOf(hass,card.entity),power=automationPermission(hass,card.power);
  if(!available(device)||!power.available||!['on','off','heat','cool','dry','fan_only','auto'].includes(device.state))return null;
  const values={};
  for(const item of card.quick_controls){
    if(item.mode_scale?.freeze_allowed===false){if(device.state==='off'&&item.mode_scale?.ha_auto&&card.quick_controls.length===1)return {power:false,values:{},deviceOffOnly:true};return null;}
    const m=quickScaleModel(hass,card,item);
    if(!m.available||m.effective===null||m.effective===undefined)return null;
    values[item.id]=m.effective;
  }
  return {power:device.state!=='off',values};
}
export function deviceOwnerConfirmed(hass,card,request){
  if(stateOf(hass,card.device_ownership.revision_entity)?.state!==request.request_id||stateOf(hass,card.device_ownership.completed_entity)?.state!==request.request_id)return false;
  const items=[card.power,...card.quick_controls],permissions=items.map(item=>automationPermission(hass,item));
  if(!permissions.every(p=>p.available))return false;
  if(request.owner==='auto')return permissions.every(p=>p.automatic)&&card.quick_controls.every(item=>!item.mode_scale?.ha_auto||(haAutoReady(hass,card,item)&&stateOf(hass,item.mode_scale.numeric_start.independent_lock_entity)?.state==='off'&&stateOf(hass,item.mode_scale.numeric_start.origin_entity)?.state===`auto:${request.request_id}`));
  if(!permissions.every(p=>!p.automatic))return false;
  const device=stateOf(hass,card.entity);
  if(!available(device)||(device.state!=='off')!==request.snapshot.power)return false;
  const savedPower=stateOf(hass,card.power.value_entity);
  if(!available(savedPower)||!['on','off'].includes(savedPower.state)||(savedPower.state==='on')!==request.snapshot.power)return false;
  if(request.snapshot.deviceOffOnly){const n=card.quick_controls[0]?.mode_scale?.numeric_start;return !!n&&numericStartPrerequisites(hass,card,n,false)&&stateOf(hass,n.independent_lock_entity)?.state==='on'&&stateOf(hass,n.origin_entity)?.state===`device_lock:${request.request_id}`;}
  const same=(a,b)=>{const x=decimal(a),y=decimal(b);return x!==null&&y!==null?x===y:typeof a==='string'&&typeof b==='string'&&a===b;};
  return card.quick_controls.every(item=>{const saved=stateOf(hass,item.value_entity),current=quickScaleModel(hass,card,item),actual=request.snapshot.values[item.id];return available(saved)&&same(saved.state,actual)&&current.effective!==null&&current.effective!==undefined&&same(current.effective,actual);});
}
export function roomSnapshot(hass,item,now=Date.now()){
  if(item.mode_scale?.kind!=='ac-temperature')return null;
  const config=item.mode_scale,f=config.room_freshness,state=stateOf(hass,config.room_entity),sourceHelper=stateOf(hass,f.source_entity),ttlHelper=stateOf(hass,f.ttl_entity),epochHelper=stateOf(hass,f.epoch_entity);
  const source=sourceHelper?.state,primary=stateOf(hass,source),changed=state?.last_changed,sourceChanged=primary?.last_changed;
  const decimal=raw=>{if(typeof raw==='number')return Number.isFinite(raw)?raw:NaN;if(typeof raw!=='string'||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw.trim()))return NaN;return Number(raw);};
  const value=decimal(state?.state),sourceValue=decimal(primary?.state),ttl=decimal(ttlHelper?.state),epoch=decimal(epochHelper?.attributes?.timestamp),changedMs=Date.parse(changed),sourceMs=Date.parse(sourceChanged),age=(now-sourceMs)/1000;
  if(![state,sourceHelper,ttlHelper,epochHelper,primary].every(available)||source!==f.expected_source||!Number.isFinite(value)||value<5||value>40||!Number.isFinite(sourceValue)||sourceValue<5||sourceValue>40||value!==sourceValue||!Number.isFinite(ttl)||ttl<=0||ttl>86400||!Number.isFinite(epoch)||!Number.isFinite(changedMs)||changedMs>now||!Number.isFinite(sourceMs)||sourceMs<=epoch*1000||!Number.isFinite(now)||age<0||age>ttl)return null;
  return {value,last_changed:changed,source,source_last_changed:sourceChanged,ttl};
}
function numericStartPrerequisites(hass,card,n,requireUnlocked=true){
  if(!n||n.enabled!==true)return false;
  const hash=stateOf(hass,n.backend_hash_entity),independent=stateOf(hass,n.independent_lock_entity);
  const health=stateOf(hass,n.health_entity),fault=stateOf(hass,n.fault_latched_entity),sensor=stateOf(hass,n.fault_sensor_entity),protectionRef=stateOf(hass,n.protection_entity_source),protection=stateOf(hass,protectionRef?.state);
  if(![hash,independent,health,fault,sensor,protectionRef,protection].every(available)||hash.state!==n.backend_sha256||!['on','off'].includes(independent.state)||(requireUnlocked&&independent.state!=='off')||health.state!=='on'||fault.state!=='off'||sensor.state!==n.fault_clear_value||!String(protectionRef.state).startsWith('automation.')||protection.state!=='on'||protection.attributes?.id!==n.protection_id)return false;
  if(!card.runtime_ready_entity||stateOf(hass,card.runtime_ready_entity)?.state!=='on'||stateOf(hass,n.transition_entity)?.state!=='idle'||!runtimeSafetyReady(hass,card.runtime_safety))return false;
  return true;
}
export function haAutoReady(hass,card,item){
  const s=item.mode_scale,a=s.ha_auto;if(!a?.enabled||!numericStartPrerequisites(hass,card,s.numeric_start,false))return false;
  const ref=stateOf(hass,a.controller_entity_source),controller=stateOf(hass,ref?.state),device=stateOf(hass,card.entity),power=stateOf(hass,card.power?.lock_entity),speed=stateOf(hass,item.lock_entity),origin=stateOf(hass,s.numeric_start.origin_entity);
  return [ref,controller,device,power,speed,origin].every(available)&&['on','off'].includes(device.state)&&['on','off'].includes(power.state)&&['on','off'].includes(speed.state)&&String(ref.state).startsWith('automation.')&&controller.state==='on'&&controller.attributes?.id===a.controller_id;
}
function numericStartReady(hass,card,item){
  const scale=item.mode_scale,n=scale.numeric_start;if(!numericStartPrerequisites(hass,card,n))return false;
  const origin=stateOf(hass,n.origin_entity),powerLock=stateOf(hass,card.power?.lock_entity),savedPower=stateOf(hass,card.power?.value_entity),revision=stateOf(hass,scale.revision_entity),completed=stateOf(hass,scale.completed_entity);
  if(![origin,powerLock,savedPower,revision,completed].every(available)||!['on','off'].includes(powerLock.state)||!['on','off'].includes(savedPower.state))return false;
  // `none` is an explicitly bootstrapped neutral provenance. Unknown/missing
  // provenance must never permit a new start, even if the observed lock is off.
  if(powerLock.state==='off')return origin.state==='none';
  const match=/^slider_off:([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/.exec(origin.state);
  return !!match&&savedPower.state==='off'&&revision.state===match[1]&&completed.state===match[1];
}
export function quickScaleModel(hass,card,item){
  validateQuickScale(item);
  const scale=item.mode_scale,device=stateOf(hass,card.entity),control=controlModel(hass,item),permission=automationPermission(hass,item);
  if(scale.native_auto_preset&&!item.auto.active_when.some(c=>c.entity===card.entity&&c.attribute==='preset_mode'&&c.value===scale.native_auto_preset))throw new Error('Native preset readback does not match device');
  const manualPreset=scale.confirmation?.manual_checks?.find(c=>c.entity===card.entity&&c.attribute==='preset_mode')?.value;
  if(scale.native_auto_preset&&(!manualPreset||manualPreset===scale.native_auto_preset))throw new Error('Manual preset readback does not match device');
  const powerKnown=available(device)&&['on','off','heat','cool','dry','fan_only','auto'].includes(device.state);
  const deviceOff=powerKnown?device.state==='off':null;
  const opts=control.options?.map(o=>o.value)||[];
  const turboAvailable=scale.turbo===true&&device?.attributes?.preset_modes?.some(x=>String(x).toLowerCase()==='turbo')===true;
  const nativeAvailable=scale.automatic_mode==='native'&&numericStartPrerequisites(hass,card,scale.numeric_start,false)&&device?.state==='on'&&Array.isArray(device?.attributes?.preset_modes)&&device.attributes.preset_modes.includes(scale.native_auto_preset);
  const automatic=scale.automatic_mode==='native'?(nativeAvailable?'native':'none'):(scale.ha_auto&&!haAutoReady(hass,card,item)?'none':scale.automatic_mode||'ha');
  const caps={kind:scale.kind,min:control.min,max:control.max,step:control.step,options:opts,turbo:turboAvailable,automatic};
  let choices=[];
  try{choices=scaleChoices(caps);}catch{return {available:false,reason:'capabilities',choices:[],position:null};}
  const owner=permission.automatic?(['native','none'].includes(scale.automatic_mode)?'unknown':'ha'):control.auto?'native':'manual';
  let effective=control.actual;
  // A configured manual/favorite speed is not an actual speed during a
  // device program. Native Auto needs its own explicit effective source.
  if(control.auto||(item.auto&&matches(hass,item.auto.active_when))||(scale.native_auto_preset&&device?.attributes?.preset_mode!==manualPreset)){
    const source=scale.effective_entity?stateOf(hass,scale.effective_entity):null;
    effective=available(source)?(scale.effective_attribute?source.attributes?.[scale.effective_attribute]:source.state):null;
  }
  if(['breather-temperature','ac-temperature','heater-temperature'].includes(scale.kind))effective=decimal(effective);
  else if(effective!==null&&effective!==undefined)effective=String(effective);
  if(scale.turbo&&String(device?.attributes?.preset_mode).toLowerCase()==='turbo')effective='turbo';
  const position=effectivePosition(caps,{owner,deviceOff,effective});
  const room=roomSnapshot(hass,item);
  const admission=[scale.revision_entity,scale.completed_entity].every(id=>available(stateOf(hass,id)));
  // An explicitly configured marker is a gate, not proof of installation;
  // deployment must verify the exact backend independently before setting it.
  const backendUnavailable=!!scale.native_auto_preset&&!numericStartPrerequisites(hass,card,scale.numeric_start,false);
  const startUnavailable=!!scale.native_auto_preset&&deviceOff===true&&!numericStartReady(hass,card,item);
  const selectable=!!(admission&&powerKnown&&permission.available&&choices.length&&!backendUnavailable&&(!startUnavailable||haAutoReady(hass,card,item)));
  return {available:!!(selectable&&!startUnavailable&&control.available&&position!==null&&(scale.kind!=='ac-temperature'||room)),selectable,reason:!admission?'admission':backendUnavailable?'backend-unavailable':startUnavailable?'start-unavailable':position===null?'readback':!room&&scale.kind==='ac-temperature'?'room':null,choices,position,owner,deviceOff,effective,caps,room};
}
export function quickScaleOffRequest(hass,card,item){
  validateQuickScale(item);if(![item.mode_scale.revision_entity,item.mode_scale.completed_entity].every(id=>available(stateOf(hass,id))))throw new Error('Admission unavailable');
  if(item.mode_scale.native_auto_preset&&!numericStartPrerequisites(hass,card,item.mode_scale.numeric_start,false))throw new Error('Device control unavailable');
  const id=requestId(),action=valueAction(item.mode_scale.gateway,'off');action.data.request_id=id;
  const device=stateOf(hass,card.entity),powerKnown=available(device)&&['on','off','heat','cool','dry','fan_only','auto'].includes(device.state);
  return {choice:'off',intent:item.mode_scale.kind==='breather-temperature'?{type:'manual',parameter:'temperature',value:5,heatOff:true}:{type:'power-off'},action,request_id:id,originalPowerOff:powerKnown?device.state==='off':null};
}
export function quickScaleNativeAvailable(hass,card,item){
  validateQuickScale(item);const scale=item.mode_scale,device=stateOf(hass,card.entity),p=automationPermission(hass,item);
  return !!scale.native_auto_preset&&numericStartPrerequisites(hass,card,scale.numeric_start,false)&&available(device)&&device.state==='on'&&Array.isArray(device.attributes?.preset_modes)&&device.attributes.preset_modes.includes(scale.native_auto_preset)&&p.available&&available(stateOf(hass,item.value_entity))&&[scale.revision_entity,scale.completed_entity].every(id=>available(stateOf(hass,id)))&&item.auto.active_when.some(c=>c.entity===card.entity&&c.attribute==='preset_mode'&&c.value===scale.native_auto_preset);
}
export function quickScaleNativeRequest(hass,card,item){
  if(!quickScaleNativeAvailable(hass,card,item))throw new Error('Device Auto unavailable');
  const id=requestId(),action=valueAction(item.mode_scale.gateway,'native_auto');action.data.request_id=id;
  return {choice:'native_auto',intent:{type:'native-automatic'},action,request_id:id,originalPowerOff:false};
}
export function quickScaleRequest(hass,card,item,position,snapshot){
  const m=quickScaleModel(hass,card,item);
  if(!m.selectable||!Number.isInteger(position)||!m.choices[position])throw new Error('Scale unavailable');
  const choice=m.choices[position];
  if(m.reason==='start-unavailable'&&!['off','auto'].includes(choice))throw new Error('Starting unavailable');
  if(choice==='native_auto')return quickScaleNativeRequest(hass,card,item);
  if(item.mode_scale.kind==='ac-speed'&&m.deviceOff===true&&!['off','auto'].includes(choice)&&!available(stateOf(hass,item.mode_scale.saved_entity)))throw new Error('Saved request readback unavailable');
  let turboSnapshot=null;
  if(choice==='turbo'){
    const cfg=item.mode_scale.confirmation,tempLock=stateOf(hass,cfg.turbo_temperature_lock_entity),tempSaved=stateOf(hass,cfg.turbo_temperature_value_entity),powerLock=stateOf(hass,card.power?.lock_entity),powerSaved=stateOf(hass,card.power?.value_entity),completed=stateOf(hass,item.mode_scale.completed_entity);
    if(![tempLock,powerLock,powerSaved,completed].every(available)||![tempLock.state,powerLock.state,powerSaved.state].every(x=>['on','off'].includes(x))||m.deviceOff===null||(tempLock.state==='on'&&(!available(tempSaved)||decimal(tempSaved.state)!==5)))throw new Error('Turbo preflight unavailable or incompatible temperature lock');
    turboSnapshot={temperatureLock:tempLock.state,powerLock:powerLock.state,powerValue:powerSaved.state};
  }
  const room= item.mode_scale.kind==='ac-temperature'?snapshot:null;
  if(item.mode_scale.kind==='ac-temperature'&&!['auto','off'].includes(choice)&&!room)throw new Error('Room snapshot unavailable');
  if(room){const current=roomSnapshot(hass,item);if(!current||current.value!==room.value||current.last_changed!==room.last_changed||current.source!==room.source||current.source_last_changed!==room.source_last_changed)throw new Error('Room snapshot changed or stale');}
  // The gateway, not the browser, validates the room and chooses the mode.
  // This expected mode is used only to verify the subsequent HA readback.
  const kind=item.mode_scale.kind;
  const intent=choice==='auto'?{type:'automatic'}:choice==='native_auto'?{type:'native-automatic'}:choice==='off'&&kind!=='breather-temperature'?{type:'power-off'}:{type:'manual',parameter:kind.endsWith('temperature')?'temperature':'speed',value:choice==='off'?5:choice,...(kind==='ac-temperature'?{mode:choice<room.value-1?'cool':choice>room.value+1?'heat':'fan_only'}:{})};
  const id=requestId();let action;
  if(choice==='auto'&&item.mode_scale.ha_auto){validateDeviceOwner(card);if(!haAutoReady(hass,card,item))throw new Error('HA automatic control unavailable');action=valueAction(card.device_ownership.gateway,'auto');}
  else action=valueAction(item.mode_scale.gateway,choice);
  action.data.request_id=id;
  if(room){action.data.room_snapshot=room.value;action.data.room_last_changed=room.last_changed;action.data.room_source=room.source;action.data.room_source_last_changed=room.source_last_changed;}
  return {choice,intent,action,request_id:id,originalPowerOff:m.deviceOff,turboSnapshot};
}
// Service acknowledgement is deliberately absent. Confirmation requires HA readback.
export function quickScaleSaved(hass,card,item,request){
  if(item.mode_scale.kind==='ac-speed'&&request.originalPowerOff===true&&request.intent.type==='manual'){
    const permission=automationPermission(hass,item),device=stateOf(hass,card.entity),saved=stateOf(hass,item.value_entity);
    return stateOf(hass,item.mode_scale.revision_entity)?.state===request.request_id&&stateOf(hass,item.mode_scale.saved_entity)?.state===request.request_id&&permission.available&&!permission.automatic&&available(device)&&device.state==='off'&&available(saved)&&saved.state===String(request.intent.value);
  }
  if(item.mode_scale.kind!=='ac-temperature'||request.intent.type!=='manual'||!item.value_entity||stateOf(hass,item.mode_scale.revision_entity)?.state!==request.request_id)return false;
  const cfg=item.mode_scale.confirmation,mode=stateOf(hass,cfg.mode_entity),writing=stateOf(hass,cfg.writing_entity),pending=stateOf(hass,cfg.pending_entity),saved=stateOf(hass,item.value_entity),savedPower=stateOf(hass,card.power?.value_entity),lock=automationPermission(hass,item),power=card.power?automationPermission(hass,card.power):{available:false};
  const powerConfirmed=request.originalPowerOff===false||(request.originalPowerOff===true&&available(savedPower)&&savedPower.state==='on'&&power.available&&!power.automatic);
  return [mode,writing,pending,saved].every(available)&&['on','off'].includes(pending.state)&&writing.state==='off'&&powerConfirmed&&lock.available&&!lock.automatic&&decimal(saved.state)===request.intent.value&&mode.state===request.intent.mode;
}
function evenRound(n){const floor=Math.floor(n),fraction=n-floor;return fraction===0.5?(floor%2===0?floor:floor+1):Math.round(n);}
export function quickScaleConfirmed(hass,card,item,request){
  if(stateOf(hass,item.mode_scale.revision_entity)?.state!==request.request_id||stateOf(hass,item.mode_scale.completed_entity)?.state!==request.request_id)return false;
  const m=quickScaleModel(hass,card,item),p=automationPermission(hass,item),power=card.power?automationPermission(hass,card.power):{available:false};
  if(!p.available)return false;
  if(request.choice==='auto'){
    const primary=['ac-temperature','breather-speed','purifier-speed','heater-temperature'].includes(item.mode_scale.kind);
    const n=item.mode_scale.numeric_start;
    return p.automatic&&(!primary||(power.available&&power.automatic))&&(!item.mode_scale.ha_auto||(haAutoReady(hass,card,item)&&stateOf(hass,n.independent_lock_entity)?.state==='off'&&stateOf(hass,n.origin_entity)?.state===`auto:${request.request_id}`));
  }
  if(request.choice==='native_auto'){
    const device=stateOf(hass,card.entity),saved=stateOf(hass,item.value_entity);
    return !!item.mode_scale.native_auto_preset&&numericStartPrerequisites(hass,card,item.mode_scale.numeric_start,false)&&!p.automatic&&available(device)&&device.state==='on'&&device.attributes?.preset_mode===item.mode_scale.native_auto_preset&&available(saved)&&saved.state==='native_auto'&&matches(hass,item.auto.active_when);
  }
  if(item.mode_scale.numeric_start&&request.originalPowerOff===true&&request.intent.type==='manual'){
    const n=item.mode_scale.numeric_start,device=stateOf(hass,card.entity),saved=stateOf(hass,item.value_entity),savedPower=stateOf(hass,card.power?.value_entity),origin=stateOf(hass,n.origin_entity),independent=stateOf(hass,n.independent_lock_entity),hash=stateOf(hass,n.backend_hash_entity);
    return numericStartPrerequisites(hass,card,n)&&[device,saved,savedPower,origin,independent,hash].every(available)&&hash.state===n.backend_sha256&&device.state==='on'&&power.available&&!power.automatic&&savedPower.state==='on'&&independent.state==='off'&&origin.state===`manual_on:${request.request_id}`&&!p.automatic&&m.effective!==null&&m.effective!==undefined&&String(saved.state)===String(request.intent.value)&&String(m.effective)===String(request.intent.value)&&(item.mode_scale.confirmation?.manual_checks||[]).every(check=>{const state=stateOf(hass,check.entity),value=check.attribute?state?.attributes?.[check.attribute]:state?.state;return available(state)&&value===check.value;});
  }
  if(request.intent.type==='power-off')return m.deviceOff===true&&power.available&&!power.automatic;
  if(item.mode_scale.kind==='breather-temperature'&&request.originalPowerOff===true){const saved=stateOf(hass,item.value_entity);return !p.automatic&&m.deviceOff===true&&available(saved)&&decimal(saved.state)===request.intent.value;}
  if(request.choice==='turbo'){
    const cfg=item.mode_scale.confirmation,snapshot=request.turboSnapshot,device=stateOf(hass,card.entity),saved=stateOf(hass,item.value_entity),tempLock=stateOf(hass,cfg.turbo_temperature_lock_entity),tempSaved=stateOf(hass,cfg.turbo_temperature_value_entity),powerLock=stateOf(hass,card.power?.lock_entity),powerSaved=stateOf(hass,card.power?.value_entity);
    if(!snapshot||![device,saved,tempLock,powerLock,powerSaved].every(available)||!p.available||p.automatic)return false;
    const expectedPowerLock=request.originalPowerOff?'on':snapshot.powerLock,expectedPowerValue=request.originalPowerOff?'on':snapshot.powerValue;
    return device.state==='fan_only'&&device.attributes?.preset_mode==='turbo'&&decimal(device.attributes?.temperature)===5&&saved.state==='7'&&tempLock.state===snapshot.temperatureLock&&(snapshot.temperatureLock==='off'||(available(tempSaved)&&decimal(tempSaved.state)===5))&&powerLock.state===expectedPowerLock&&powerSaved.state===expectedPowerValue;
  }
  if(item.mode_scale.kind==='ac-temperature'){
    if(!quickScaleSaved(hass,card,item,request)||stateOf(hass,item.mode_scale.confirmation.pending_entity)?.state!=='off')return false;
    const device=stateOf(hass,card.entity),min=decimal(device?.attributes?.min_temp),max=decimal(device?.attributes?.max_temp),actual=decimal(device?.attributes?.temperature);
    if(min===null||max===null||min>max||actual===null)return false;
    return device?.state===request.intent.mode&&actual===evenRound(Math.max(min,Math.min(max,request.intent.value)));
  }
  if(p.automatic||m.effective===null||m.effective===undefined)return false;
  const requested=request.intent.value;
  if(String(m.effective)!==String(requested))return false;
  const saved=stateOf(hass,item.value_entity),actualSaved=decimal(saved?.state),wantedSaved=decimal(requested);
  if(!available(saved)||(wantedSaved!==null?actualSaved!==wantedSaved:saved.state!==String(requested)))return false;
  if(request.choice!=='turbo'&&(item.mode_scale.confirmation?.manual_checks||[]).some(check=>{const state=stateOf(hass,check.entity),value=check.attribute?state?.attributes?.[check.attribute]:state?.state;return !available(state)||value!==check.value;}))return false;
  if(item.mode_scale.kind==='breather-temperature')return request.originalPowerOff!==null&&m.deviceOff===request.originalPowerOff;
  return m.deviceOff===false;
}
