import {available,finite,stateOf} from './ha.js';

export function roomReading(hass,config,now=Date.now()){
  const current=stateOf(hass,config.entities?.room_temperature);
  const value=available(current)?finite(current.state):null;
  if(value!==null)return {value,unit:current.attributes?.unit_of_measurement||'°C',qualified:true};
  const fallback=config.temperature_display;
  const raw=stateOf(hass,fallback?.entity),number=finite(raw?.state);
  const stamp=Date.parse(raw?.last_changed||''),age=(now-stamp)/1000;
  // Display-only: never feeds the controller or qualifies a stale source.
  if(available(raw)&&number!==null&&Number.isFinite(age)&&age>=0&&age<=fallback.max_age)
    return {value:number,unit:raw.attributes?.unit_of_measurement||'°C',qualified:false,age};
  return {value:null,unit:'°C',qualified:false};
}
