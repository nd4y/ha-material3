import {available,stateOf} from './ha.js';
import {readingNumber,readingColor} from './reading-colors.js';

export function roomReading(hass,config,now=Date.now()){
  const current=stateOf(hass,config.entities?.room_temperature);
  const value=available(current)?readingNumber(current.state):null;
  if(value!==null)return {value,unit:current.attributes?.unit_of_measurement||'°C',qualified:true};
  const fallback=config.temperature_display;
  const raw=stateOf(hass,fallback?.entity),number=readingNumber(raw?.state);
  const stamp=Date.parse(raw?.last_changed||''),age=(now-stamp)/1000;
  // Display-only: never feeds the controller or qualifies a stale source.
  if(available(raw)&&number!==null&&Number.isFinite(age)&&age>=0&&age<=fallback.max_age)
    return {value:number,unit:raw.attributes?.unit_of_measurement||'°C',qualified:false,age};
  return {value:null,unit:'°C',qualified:false};
}

// Display-only models. They do not qualify controller inputs or alter sensors.
export function roomMetricReading(hass,config,item,now=Date.now()){
  const source=stateOf(hass,item.entity),qualifiedTemperature=item.id==='temperature'&&item.entity===config.entities?.room_temperature;
  const reading=qualifiedTemperature?roomReading(hass,config,now):{value:available(source)?readingNumber(source.state):null,unit:source?.attributes?.unit_of_measurement||item.unit||'',qualified:true};
  const value=reading.value,unit=item.unit??reading.unit;
  let quality=value===null?'unknown':reading.qualified?'fresh':'stale',age=reading.age??null;
  if(value!==null&&reading.qualified&&item.freshness){
    const stamp=Date.parse(source?.[item.freshness.timestamp]||''),elapsed=(now-stamp)/1000;age=Number.isFinite(elapsed)?elapsed:null;
    if(!Number.isFinite(elapsed)||elapsed<0)quality='unknown';else if(elapsed>item.freshness.max_age)quality='stale';
  }
  const color=readingColor(hass,value,item.color,quality);
  return {value,unit,quality,age,tone:color.tone,label:color.label,entity:item.entity};
}
