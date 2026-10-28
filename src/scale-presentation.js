// Presentation only: a draft is never an observed device mode or a command.
export function scalePresentation(item,model,operation,draft,snapshot){
  if(draft===undefined)return {...operation,preview:false};
  const choice=model.choices[draft],kind=item.mode_scale.kind;
  const show=(mode,tone,icon)=>({mode,tone,icon,preview:true,activity:null,activityKey:null});
  if(choice==='auto')return show('auto','auto','auto_awesome');
  if(choice==='off')return kind==='breather-temperature'?show('heat-off','cool','air'):show('off','off','power_settings_new');
  if(kind==='ac-temperature'){
    const room=snapshot?.value??model.room?.value;
    if(!Number.isFinite(room)||!Number.isFinite(choice))return show('unknown','unknown','info');
    return choice<room-1?show('cool','cool','ac_unit'):choice>room+1?show('heat','warm','thermostat'):show('fan','fan','air');
  }
  if(kind.endsWith('temperature'))return show('heat','warm','thermostat');
  return kind==='purifier-speed'?show('clean','clean','mode_fan'):show('fan','fan','air');
}
