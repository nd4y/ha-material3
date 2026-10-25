import {automationPermission,controlModel,automationAction,controlValue,valueAction} from './quick-controls.js';

// Selecting a visible owner never silently transfers another parameter.
export function ownerModel(hass,item){
  const p=automationPermission(hass,item),m=controlModel(hass,item);
  return {available:p.available,owner:p.automatic?'ha':m.auto?'device':'manual',
    choices:item.auto?['ha','manual','device']:['ha','manual']};
}

export function ownerPresentation(owner){
  return {
    ha:{labelKey:'ownerAutomaticShort',accessibleKey:'ownerHomeAutomatic',icon:'lock_open',helpKey:'ownerHaHelp'},
    manual:{labelKey:'manualShort',accessibleKey:'ownerManualControl',icon:'lock',helpKey:'ownerManualHelp'},
    device:{labelKey:'ownerDeviceShort',accessibleKey:'ownerDeviceAutomatic',icon:'devices',helpKey:'ownerDeviceHelp'}
  }[owner]||{labelKey:'unavailable',accessibleKey:'unavailable',icon:'info',helpKey:'unavailable'};
}

// A whole-card restriction is an observed aggregate, never a new service.
// Unknown permissions must not be presented as a confirmed manual block.
export function deviceOwnershipModel(hass,config){
  const items=[config.power,...(config.quick_controls||[])].filter(item=>item?.lock_entity),permissions=[...new Map(items.map(item=>[item.lock_entity,item])).values()].map(item=>automationPermission(hass,item));
  const automatic=permissions.filter(item=>item.automatic).length,restricted=permissions.filter(item=>item.available&&!item.automatic).length,total=permissions.length,known=total>0&&permissions.every(item=>item.available);
  return {state:!known?'unknown':restricted===total?'blocked':automatic===total?'automatic':'mixed',known,automatic,restricted,total};
}
export function ownerAction(hass,item,owner){
  const m=ownerModel(hass,item);
  if(!m.available||!m.choices.includes(owner))throw new Error('Unavailable ownership');
  if(m.owner===owner)return null;
  if(owner==='manual'&&controlModel(hass,item).auto){
    const field=controlModel(hass,item);
    // Native Auto may not expose its actual fan speed. In that case position
    // resolves to the first supported manual step, also shown by the slider.
    return valueAction(item.set_action,controlValue(field,field.position));
  }
  // The configured device-auto action must acquire the manual permission in
  // the server adapter, just like the configured slider action.
  return owner==='device'?item.auto.action:automationAction(item,owner==='ha');
}

export function nextOwner(hass,item){
  const m=ownerModel(hass,item);
  if(!m.available)throw new Error('Unavailable ownership');
  return m.choices[(m.choices.indexOf(m.owner)+1)%m.choices.length];
}

export function ownerCycleAction(hass,item){
  return ownerAction(hass,item,nextOwner(hass,item));
}

export function ownerRequest(hass,item,owner=nextOwner(hass,item),now=Date.now(),timeout=10000){
  const action=ownerAction(hass,item,owner);
  return action?{owner,action,deadline:now+timeout}:null;
}

// A service acknowledgement is deliberately not an input. Only observed
// ownership confirms the request, including when a delayed readback arrives.
export function ownerRequestStatus(hass,item,request,now=Date.now()){
  if(!request)return 'idle';
  const actual=ownerModel(hass,item);
  if(actual.available&&actual.owner===request.owner)return 'confirmed';
  return now>=request.deadline?'timeout':'pending';
}
