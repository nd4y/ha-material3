import test from 'node:test';
import assert from 'node:assert/strict';
import {roomMetricReading} from '../src/room-reading.js';
import {validateRoomMetrics} from '../src/reading-colors.js';

const now=Date.parse('2026-01-01T12:00:00Z');
const fresh=value=>({state:String(value),attributes:{unit_of_measurement:'µg/m³'},last_updated:new Date(now).toISOString()});
const metric={id:'pm25',name:'PM2.5',entity:'sensor.pm',unit:'µg/m³',freshness:{max_age:60,timestamp:'last_updated'},color:{ranges:[{max:15,max_inclusive:true,tone:'good',label:'Низкий PM2.5'},{min:15,min_inclusive:false,max:35,max_inclusive:true,tone:'notice',label:'Умеренный PM2.5'},{min:35,min_inclusive:false,tone:'high',label:'Высокий PM2.5'}]}};

test('mobile PM2.5 ranges keep exact boundaries and preserve a zero concentration',()=>{
  validateRoomMetrics({room_metrics:[metric]});
  for(const [value,tone]of [[0,'good'],[15,'good'],[15.01,'notice'],[35,'notice'],[35.01,'high']]){
    const result=roomMetricReading({states:{'sensor.pm':fresh(value)}},{},metric,now);
    assert.equal(result.value,value);assert.equal(result.tone,tone);assert.equal(result.quality,'fresh');assert.match(result.label,/PM2\.5/);
  }
});
test('mobile stale, missing and future-timestamp readings cannot retain a favorable colored status',()=>{
  for(const [state,timestamp,quality,value]of [['8',now-61000,'stale',8],['unknown',now,'unknown',null],['unavailable',now,'unknown',null],['8',now+1000,'unknown',8]]){
    const source={...fresh(state),last_updated:new Date(timestamp).toISOString()};
    const result=roomMetricReading({states:{'sensor.pm':source}},{},metric,now);
    assert.equal(result.quality,quality);assert.equal(result.value,value);assert.equal(result.tone,'unknown');assert.equal(result.label,'');
  }
});
test('mobile clock tolerance is explicit and bounded without extending old-data freshness',()=>{
  for(const [offset,tolerance,quality,age]of [[28000,undefined,'unknown',-28],[28000,0,'unknown',-28],[28000,60,'fresh',0],[60000,60,'fresh',0],[60001,60,'unknown',-60.001],[-61000,60,'stale',61],[120000,120,'fresh',0],[120001,120,'unknown',-120.001]]){
    const item={...metric,freshness:{...metric.freshness,...(tolerance===undefined?{}:{clock_tolerance:tolerance})}},source={...fresh(8),last_updated:new Date(now+offset).toISOString()};
    const result=roomMetricReading({states:{'sensor.pm':source}},{},item,now);
    assert.equal(result.quality,quality);assert.equal(result.age,age);assert.equal(result.tone,quality==='fresh'?'good':'unknown');assert.ok(!('last_reported' in source));
  }
});
test('mobile metric clock tolerance rejects invalid values and accepts only zero to 120 seconds',()=>{
  for(const tolerance of [0,60,120])assert.doesNotThrow(()=>validateRoomMetrics({room_metrics:[{...metric,freshness:{...metric.freshness,clock_tolerance:tolerance}}]}));
  for(const tolerance of [-1,120.001,null,'60',false,NaN,Infinity])assert.throws(()=>validateRoomMetrics({room_metrics:[{...metric,freshness:{...metric.freshness,clock_tolerance:tolerance}}]}));
});
test('mobile temperature fallback remains display-only and neutral despite a numerically favorable value',()=>{
  const config={entities:{room_temperature:'sensor.qualified'},temperature_display:{entity:'sensor.raw',max_age:3600}};
  const item={id:'temperature',name:'Температура',entity:'sensor.qualified',color:{target_entity:'input_number.goal',tolerance:1}};
  const raw={state:'24',attributes:{unit_of_measurement:'°C'},last_changed:new Date(now-5000).toISOString()};
  const hass={states:{'sensor.qualified':fresh('unavailable'),'sensor.raw':raw,'input_number.goal':fresh(24)}};
  const result=roomMetricReading(hass,config,item,now);
  assert.equal(result.value,24);assert.equal(result.quality,'stale');assert.equal(result.tone,'unknown');assert.equal(hass.states['sensor.qualified'].state,'unavailable');
});
test('mobile temperature color follows the configured target with inclusive tolerance boundaries',()=>{
  const item={id:'temperature',name:'Температура',entity:'sensor.room',freshness:{max_age:60,timestamp:'last_updated'},color:{target_entity:'input_number.goal',tolerance:1}};
  for(const [value,tone]of [[22.99,'cool'],[23,'good'],[25,'good'],[25.01,'warm']]){
    const hass={states:{'sensor.room':fresh(value),'input_number.goal':fresh(24)}};
    assert.equal(roomMetricReading(hass,{},item,now).tone,tone);
  }
});
