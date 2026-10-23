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
  if(owner==='manual'&&m.owner==='device'){
    const field=controlModel(hass,item);
    // Native Auto may not expose its actual fan speed. In that case position
    // resolves to the first supported manual step, also shown by the slider.
    return valueAction(item.set_action,controlValue(field,field.position));
  }
  // The configured device-auto action must acquire the manual permission in
  // the server adapter, just like the configured slider action.
  return owner==='device'?item.auto.action:automationAction(item,owner==='ha');
}
