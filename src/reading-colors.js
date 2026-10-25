import {available,stateOf} from './ha.js';
import {isBundledIcon} from './icons.js';

const tones=new Set(['good','cool','warm','notice','high','unknown']);
const object=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const entity=value=>typeof value==='string'&&/^[a-z_][a-z0-9_]*\.[a-z0-9_]+$/.test(value);
const label=value=>value===undefined||typeof value==='string';
export function readingNumber(value){
  if(typeof value!=='number'&&(typeof value!=='string'||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value.trim())))return null;
  const number=Number(value);return Number.isFinite(number)?number===0?0:number:null;
}
export function validateReadingColor(color){
  if(color===undefined)return;
  if(!object(color))throw new Error('Reading color must be a configured scale');
  if(color.target_entity!==undefined){
    if(!entity(color.target_entity)||readingNumber(color.tolerance)===null||typeof color.tolerance!=='number'||color.tolerance<0||color.ranges!==undefined)throw new Error('Target-relative reading color needs entity and nonnegative numeric tolerance');
    for(const name of ['below','within','above']){if(color[name+'_tone']!==undefined&&!tones.has(color[name+'_tone']))throw new Error('Invalid reading tone');if(!label(color[name+'_label']))throw new Error('Invalid reading label');}
    return;
  }
  if(!Array.isArray(color.ranges)||!color.ranges.length)throw new Error('Reading color needs ranges or target comparison');
  let previous=-Infinity;
  for(const band of color.ranges){
    if(!object(band)||!tones.has(band.tone)||!label(band.label))throw new Error('Reading ranges need a semantic tone');
    for(const key of ['min_inclusive','max_inclusive'])if(band[key]!==undefined&&typeof band[key]!=='boolean')throw new Error('Reading range inclusivity must be boolean');
    if(band.min!==undefined&&(typeof band.min!=='number'||!Number.isFinite(band.min))||band.max!==undefined&&(typeof band.max!=='number'||!Number.isFinite(band.max)))throw new Error('Reading range bounds must be finite numbers');
    const min=band.min??-Infinity,max=band.max??Infinity;
    if(min>=max||min<previous)throw new Error('Reading ranges must be ordered without overlap');previous=max;
  }
}
export function validateRoomMetrics(config){
  if(config.room_metrics===undefined)return;
  if(!Array.isArray(config.room_metrics)||!config.room_metrics.length)throw new Error('Room metrics must be a nonempty array');
  const ids=new Set();for(const metric of config.room_metrics){
    if(!object(metric)||typeof metric.id!=='string'||!/^[-a-z0-9_]+$/.test(metric.id)||ids.has(metric.id)||!entity(metric.entity)||typeof metric.name!=='string'||!metric.name.trim())throw new Error('Room metrics need unique IDs, entities and names');ids.add(metric.id);
    if(metric.unit!==undefined&&typeof metric.unit!=='string'||metric.icon!==undefined&&!isBundledIcon(metric.icon))throw new Error('Invalid metric label or unbundled icon');
    if(metric.freshness!==undefined){const f=metric.freshness;if(!object(f)||typeof f.max_age!=='number'||!Number.isFinite(f.max_age)||f.max_age<=0||!['last_reported','last_updated','last_changed'].includes(f.timestamp))throw new Error('Metric freshness needs a positive age and an explicit HA timestamp');}
    validateReadingColor(metric.color);
  }
}
export function readingColor(hass,value,color,quality='fresh'){
  const neutral={tone:'unknown',label:''};if(quality!=='fresh'||readingNumber(value)===null||!color)return neutral;
  try{validateReadingColor(color);}catch{return neutral;}
  if(color.target_entity){
    const source=stateOf(hass,color.target_entity),target=available(source)?readingNumber(source.state):null;if(target===null)return neutral;
    const delta=Number(value)-target,side=Math.abs(delta)<=color.tolerance?'within':delta<0?'below':'above';
    return {tone:color[side+'_tone']||{below:'cool',within:'good',above:'warm'}[side],label:color[side+'_label']||''};
  }
  const number=Number(value),band=color.ranges.find(band=>(band.min===undefined||(band.min_inclusive===false?number>band.min:number>=band.min))&&(band.max===undefined||(band.max_inclusive===true?number<=band.max:number<band.max)));return band?{tone:band.tone,label:band.label||''}:neutral;
}
