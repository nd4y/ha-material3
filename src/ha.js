export const available=(state)=>!!state&&!['unknown','unavailable'].includes(state.state);
export const finite=(value)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
export const stateOf=(hass,entity)=>entity?hass?.states?.[entity]:undefined;
export function actuatorState(hass,item){
  const state=stateOf(hass,item.entity),usable=!item.disabled&&available(state)&&['on','off'].includes(state.state);
  return {available:usable,selected:usable&&state.state==='on'};
}
export function actuatorAction(hass,item,selected){
  if(!actuatorState(hass,item).available)throw new Error('Unavailable actuator permission');
  return {action:'perform-action',perform_action:`input_boolean.turn_${selected?'on':'off'}`,target:{entity_id:item.entity}};
}
export function targetDecimals(state){
  const decimals=value=>{const n=finite(value);if(n===null)return 0;const[m,e='0']=String(n).split('e');return Math.max(0,(m.split('.')[1]?.length||0)-Number(e));};
  return Math.min(6,Math.max(...['step','min','max'].map(k=>decimals(state?.attributes?.[k]))));
}
export function stepTarget(state,direction){
  if(!available(state))return null;
  const a=state.attributes||{},v=finite(state.state),min=finite(a.min),max=finite(a.max),step=finite(a.step);
  if(v===null||min===null||max===null||step===null||step<=0||min>max)return null;
  return Number(Math.max(min,Math.min(max,v+Math.sign(direction)*step)).toFixed(6));
}
export function matches(hass,conditions){return Array.isArray(conditions)&&conditions.length>0&&conditions.every(c=>{const s=stateOf(hass,c.entity),value=c.attribute?s?.attributes?.[c.attribute]:s?.state;return available(s)&&(Object.hasOwn(c,'not_value')?String(value)!==String(c.not_value):String(value)===String(c.value));});}
export function selectedPreset(hass,config){
  if(config.maximum?.active_entity&&stateOf(hass,config.maximum.active_entity)?.state==='on')return config.maximum.preset_id||'maximum';
  return config.presets?.find(p=>matches(hass,p.active_when))?.id||null;
}
export function timerText(state,now=Date.now()){
  if(!available(state))return null;
  if(state.state==='paused')return state.attributes?.remaining||null;
  const end=Date.parse(state.attributes?.finishes_at||'');
  if(state.state!=='active'||!Number.isFinite(end))return null;
  const seconds=Math.max(0,Math.ceil((end-now)/1000));return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}
export function formatState(hass,state){
  if(!available(state))return null;
  try{return hass.formatEntityState?.(state)||String(state.state);}catch{return String(state.state);}
}
export function actionEntity(action){return action?.target?.entity_id||action?.entity;}
export function actionAvailable(hass,action){
  const ids=actionEntity(action);return action&&(!ids||(Array.isArray(ids)?ids:[ids]).every(e=>available(stateOf(hass,e))));
}
export async function perform(host,hass,action){
  if(!action)throw new Error('No action configured');
  if(action.action==='more-info'){host.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:action.entity}}));return;}
  if(action.action==='navigate'){
    if(!/^\/(?!\/)/.test(action.navigation_path))throw new Error('Only local HA paths are supported');
    history.pushState(null,'',action.navigation_path);window.dispatchEvent(new CustomEvent('location-changed'));return;
  }
  if(action.action==='toggle'){if(!actionAvailable(hass,action))throw new Error('Unavailable');return hass.callService('homeassistant','toggle',{entity_id:action.entity});}
  if(action.action!=='perform-action')throw new Error('Unsupported action');
  if(!actionAvailable(hass,action))throw new Error('Unavailable');
  const [domain,service]=action.perform_action.split('.');
  return hass.callService(domain,service,action.data||{},action.target||{});
}
export function validateAction(action){
  if(!action||!['perform-action','toggle','more-info','navigate'].includes(action.action))throw new Error('Unsupported action');
  if(action.action==='perform-action'&&!/^[a-z_]+\.[a-z_]+$/.test(action.perform_action||''))throw new Error('Invalid service');
  if(action.action==='navigate'&&!/^\/(?!\/)/.test(action.navigation_path||''))throw new Error('Invalid HA path');
}
const entityId=(value,domain)=>new RegExp(`^${domain||'[a-z_][a-z0-9_]*'}\\.[a-z0-9_]+$`).test(value||'');
function dynamicAction(action){validateAction(action);if(action.action!=='perform-action'||!/^[a-z_][a-z0-9_]*$/.test(action.value_field||''))throw new Error('A dynamic service action and value_field are required');}
export function validateAirGoals(config){
  if(config.air_goals!==undefined&&!Array.isArray(config.air_goals))throw new Error('air_goals must be an array');
  const ids=new Set();for(const item of config.air_goals||[]){
    if(!item||!/^[-a-z0-9_]+$/.test(item.id||'')||ids.has(item.id)||typeof item.name!=='string'||!item.name.trim())throw new Error('Air goals require unique safe IDs and names');ids.add(item.id);
    if(!entityId(item.entity,'input_number')||!entityId(item.automatic_entity,'input_boolean'))throw new Error('Air goal requires numeric intention and automatic helpers');
    for(const key of ['status_entity','availability_entity','automatic_value_entity'])if(item[key]!==undefined&&!entityId(item[key]))throw new Error('Invalid air goal source');
    dynamicAction(item.set_action);dynamicAction(item.automatic_action);
    if(item.boost!==undefined){const boost=item.boost;if(!boost||!entityId(boost.active_entity,'input_boolean')||!entityId(boost.deadline_entity,'input_datetime'))throw new Error('Air boost requires active and absolute deadline helpers');
      if(boost.availability_entity!==undefined&&!entityId(boost.availability_entity,'binary_sensor'))throw new Error('Air boost availability must be binary_sensor');
      dynamicAction(boost.start_action);validateAction(boost.cancel_action);
      if(!Array.isArray(boost.durations)||!boost.durations.length||boost.durations.some(value=>!Number.isSafeInteger(value)||value<=0)||new Set(boost.durations).size!==boost.durations.length||!boost.durations.includes(boost.default_duration))throw new Error('Air boost durations must be unique positive minutes and include the default');
    }
  }
  if(config.health_alerts!==undefined&&!Array.isArray(config.health_alerts))throw new Error('health_alerts must be an array');
  const alertIds=new Set();for(const item of config.health_alerts||[]){if(!item||typeof item.id!=='string'||!item.id||alertIds.has(item.id)||typeof item.name!=='string'||!item.name.trim()||!entityId(item.status_entity)||item.message_entity!==undefined&&!entityId(item.message_entity)||item.acknowledgement_entity!==undefined&&!entityId(item.acknowledgement_entity,'binary_sensor'))throw new Error('Health alerts require unique IDs, names and state sources');alertIds.add(item.id);if(item.acknowledge_action)validateAction(item.acknowledge_action);}
}
export function validateConfig(config,kind='panel'){
  if(!config||typeof config!=='object'||(config.config_version??1)!==1)throw new Error('Unsupported config_version');
  if(config.appearance?.seed_color&&!/^#[0-9a-f]{6}$/i.test(config.appearance.seed_color))throw new Error('seed_color must be #RRGGBB');
  if(config.appearance?.scheme&&!['dark','light','auto'].includes(config.appearance.scheme))throw new Error('Invalid scheme');
  if(config.appearance?.motion&&!['expressive','reduced'].includes(config.appearance.motion))throw new Error('Invalid motion');
  if(kind==='climate'){
    validateAirGoals(config);
    for(const k of ['room_temperature','target_temperature','enabled'])if(typeof config.entities?.[k]!=='string')throw new Error(`Missing entities.${k}`);
    if(!config.entities.target_temperature.startsWith('input_number.'))throw new Error('Target must be input_number');
    if(!config.entities.enabled.startsWith('input_boolean.'))throw new Error('Enabled control must be input_boolean');
    const ids=new Set();for(const p of config.presets||[]){if(!p.id||ids.has(p.id))throw new Error('Preset IDs must be unique');ids.add(p.id);validateAction(p.action);}
    if(config.maximum?.cancel_action)validateAction(config.maximum.cancel_action);
      if(config.maximum?.start_action){
        const m=config.maximum;validateAction(m.start_action);
        if(m.start_action.action!=='perform-action'||!m.start_action.value_field||!m.return_entity||!m.timer||!m.active_entity)throw new Error('Maximum popover needs backend timer, return entity and dynamic gateway');
        const values=new Set();for(const p of m.return_options||[]){if(!p.name||typeof p.value!=='string'||!p.value||values.has(p.value))throw new Error('Maximum return options need unique values');values.add(p.value);}
        if(!values.size)throw new Error('Maximum return options missing');
      }
    if(config.target_action){validateAction(config.target_action);if(config.target_action.action!=='perform-action'||!config.target_action.value_field)throw new Error('Target needs a dynamic value action');}
    if(config.automation_reset){if(!config.automation_reset.name)throw new Error('Automation reset needs a name');validateAction(config.automation_reset.action);}
      for(const group of config.automation_groups||[]){if(!group.name||!group.entity||!Array.isArray(group.controls))throw new Error('Automation groups need names, entities and controls');for(const item of group.controls){if(!item.name||!/^input_boolean\.[a-z0-9_]+$/.test(item.lock_entity||''))throw new Error('Automation control needs a name and lock helper');if(item.lock_action)validateAction(item.lock_action);}}
    if(config.actuators!==undefined&&!Array.isArray(config.actuators))throw new Error('Actuators must be an array');
    const actuatorIds=new Set();for(const item of config.actuators||[]){
      if(!item||typeof item.id!=='string'||!item.id||actuatorIds.has(item.id)||typeof item.name!=='string'||!item.name.trim())throw new Error('Actuators need unique IDs and names');
      actuatorIds.add(item.id);
      if(item.disabled!==undefined&&typeof item.disabled!=='boolean')throw new Error('Invalid actuator disabled flag');
      if((!item.disabled||item.entity!==undefined)&&!/^input_boolean\.[a-z0-9_]+$/.test(item.entity||''))throw new Error('Actuator permission must be input_boolean');
    }
  }
  if(kind==='device'&&!config.entity)throw new Error('Missing entity');
  if(kind==='camera'&&!config.entity)throw new Error('Missing camera entity');
  for(const link of config.links||[])validateAction(link.action);
  for(const item of config.actions||[])validateAction(item.action);
  for(const item of config.header_actions||[])validateAction(item.action);
  for(const card of config.home?.cards||[])validateConfig(card,card.kind||'device');
  for(const card of config.cameras||[])validateConfig(card,'camera');
  for(const room of config.rooms||[]){if(!room.id||!room.name)throw new Error('Room id/name required');for(const card of room.cards||[])validateConfig(card,card.kind||'device');}
  return structuredClone(config);
}
