import {automationPermission,controlModel,automationAction,controlValue,valueAction} from './quick-controls.js';

// Selecting a visible owner never silently transfers another parameter.
export function ownerModel(hass,item){
  const p=automationPermission(hass,item),m=controlModel(hass,item);
  return {available:p.available,owner:p.automatic?'ha':m.auto?'device':'manual',
    choices:item.auto?['ha','manual','device']:['ha','manual']};
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
