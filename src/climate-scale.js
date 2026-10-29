// Pure scale semantics. This module does not call HA or infer device state.
// The adapter must validate and apply these intentions through the existing
// server-side ownership, interlock, and device-control scripts.
const OFF='off', AUTO='auto';
const integerRange=(min,max,step)=>{
  if(!Number.isFinite(min)||!Number.isFinite(max)||!Number.isFinite(step)||step<=0||max<min)throw new Error('Invalid range');
  const count=(max-min)/step;
  if(Math.abs(count-Math.round(count))>1e-7||count>500)throw new Error('Invalid steps');
  return Array.from({length:Math.round(count)+1},(_,i)=>Number((min+i*step).toFixed(6)));
};
export function scaleChoices({kind,min,max,step=1,options=[],turbo=false}){
  let values;
  if(kind==='breather-temperature'){
    if(min!==5)throw new Error('Breather minimum must be confirmed as 5 °C');
    values=integerRange(min,max,step).slice(1);
  }else if(['ac-temperature','heater-temperature'].includes(kind))values=integerRange(min,max,step);
  else if(['breather-speed','ac-speed','purifier-speed'].includes(kind)){
    if(!Array.isArray(options)||!options.length)throw new Error('No supported speeds');
    values=options.map(String);
    if(values.some(x=>!x||[OFF,AUTO,'turbo'].includes(x.toLowerCase()))||new Set(values).size!==values.length)throw new Error('Invalid speeds');
    if(turbo){if(kind!=='breather-speed')throw new Error('Turbo unsupported');values.push('turbo');}
  }else throw new Error('Unsupported scale');
  return [OFF,...values,AUTO];
}
function scaleIntent(kind,choice,{roomTemperature,roomQualified,roomAgeSeconds}={}){
  if(choice===AUTO)return {type:'automatic'};
  if(choice===OFF)return kind==='breather-temperature'?{type:'manual',parameter:'temperature',value:5,heatOff:true}:{type:'power-off'};
  if(kind==='ac-temperature'){
    const decimal=typeof roomTemperature==='number'||typeof roomTemperature==='string'&&/^-?\d+(?:\.\d+)?$/.test(roomTemperature);
    const room=decimal?Number(roomTemperature):NaN;
    // A cached number by itself is not a qualified, fresh control source.
    if(roomQualified!==true||!Number.isFinite(roomAgeSeconds)||roomAgeSeconds<0||roomAgeSeconds>5400||!Number.isFinite(room)||room<5||room>40||typeof choice!=='number'||!Number.isFinite(choice))throw new Error('Room temperature unavailable');
    return {type:'manual',parameter:'temperature',value:choice,mode:choice<room-1?'cool':choice>room+1?'heat':'fan_only'};
  }
  return {type:'manual',parameter:kind.endsWith('temperature')?'temperature':'speed',value:choice};
}
export function scaleSelection(config,choice,context){
  const choices=scaleChoices(config);
  if(!choices.includes(choice))throw new Error('Unsupported scale position');
  return scaleIntent(config.kind,choice,context);
}
export function effectivePosition(config,{owner,deviceOff,effective}){
  const choices=scaleChoices(config);
  if(!['manual','ha','native'].includes(owner))return null;
  // Breather heat is independent of airflow/power. Its Off endpoint means
  // 5 degrees, never whole-device Off. Other primary scales retain Off.
  if(deviceOff===true&&config.kind!=='breather-temperature')return choices.indexOf(OFF);
  if(deviceOff===null||effective===null||effective===undefined)return null;
  const value=config.kind==='breather-temperature'&&Number(effective)===5?OFF:effective;
  const position=choices.indexOf(value);
  // Auto is ownership, not the visible slider value after confirmation.
  return position<0||value===AUTO?null:position;
}
