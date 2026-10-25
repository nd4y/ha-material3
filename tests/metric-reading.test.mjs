import test from 'node:test';
import assert from 'node:assert/strict';
import {readingNumber,readingColor,validateReadingColor,validateRoomMetrics} from '../src/reading-colors.js';
import {roomMetricReading,roomReading} from '../src/room-reading.js';

const now=1800000000000;
const state=(value,attributes={},age=0)=>({state:value,attributes,last_reported:new Date(now-age*1000).toISOString(),last_updated:new Date(now-age*1000).toISOString(),last_changed:new Date(now-age*1000).toISOString()});
const metric=(extra={})=>({id:'co2',name:'CO₂',entity:'sensor.room_co2',unit:'ppm',freshness:{max_age:300,timestamp:'last_reported'},color:{ranges:[{min:0,max:800,tone:'good',label:'Low'},{min:800,max:1200,tone:'notice',label:'Raised'},{min:1200,tone:'high',label:'High'}]},...extra});

test('numeric readings preserve measured zero and reject malformed coercions',()=>{
  for(const [value,want]of [[0,0],[-0,0],['0',0],['0.0',0],[' 24.5 ',24.5],['1e2',100],['-.5',-.5],['',null],['  ',null],['unknown',null],['unavailable',null],['0x10',null],['NaN',null],['Infinity',null],[NaN,null],[Infinity,null],[true,null],[false,null],[null,null],[undefined,null],[{},null],[[],null]])assert.equal(readingNumber(value),want);
});

test('range colors use only configured bounds and exact inclusive flags',()=>{
  const co2=metric().color;
  for(const [value,tone]of [[0,'good'],[799.99,'good'],[800,'notice'],[1199.99,'notice'],[1200,'high'],[9000,'high'],[-1,'unknown']])assert.equal(readingColor({},value,co2).tone,tone);
  const particles={ranges:[{min:0,max:15,max_inclusive:true,tone:'good',label:'Low'},{min:15,max:35,max_inclusive:true,tone:'notice'},{min:35,min_inclusive:false,tone:'high'}]};
  for(const [value,tone]of [[0,'good'],[15,'good'],[15.01,'notice'],[35,'notice'],[35.01,'high']])assert.equal(readingColor({},value,particles).tone,tone);
  assert.equal(readingColor({},15,particles).label,'Low');
  const custom={ranges:[{max:42,tone:'cool'},{min:42,tone:'warm'}]};assert.equal(readingColor({},41,custom).tone,'cool');assert.equal(readingColor({},42,custom).tone,'warm');
});

test('temperature indication compares measured temperature with configured target and tolerance',()=>{
  const color={target_entity:'input_number.room_target',tolerance:1,below_tone:'cool',within_tone:'good',above_tone:'warm',below_label:'Below',within_label:'Near',above_label:'Above'},hass={states:{'input_number.room_target':state('24')}};
  for(const [value,tone]of [[22.99,'cool'],[23,'good'],[24,'good'],[25,'good'],[25.01,'warm']])assert.equal(readingColor(hass,value,color).tone,tone);
  assert.equal(readingColor(hass,23,color).label,'Near');hass.states['input_number.room_target'].state='30';assert.equal(readingColor(hass,25,color).tone,'cool');
  for(const value of ['unknown','unavailable','',null,'bad']){hass.states['input_number.room_target'].state=value;assert.equal(readingColor(hass,25,color).tone,'unknown');}
});

test('unknown, stale and invalid scales always use neutral semantic tone',()=>{
  for(const quality of ['unknown','stale','future',''])assert.deepEqual(readingColor({},1000,metric().color,quality),{tone:'unknown',label:''});
  assert.equal(readingColor({},1000).tone,'unknown');assert.equal(readingColor({},'unknown',metric().color).tone,'unknown');
  const invalid=[{},null,[],{ranges:[]},{ranges:[{min:0,max:10,tone:'invented'}]},{ranges:[{min:10,max:1,tone:'high'}]},{ranges:[{min:0,max:10,tone:'good'},{min:5,tone:'high'}]},{ranges:[{max:Infinity,tone:'good'}]},{ranges:[{max:10,max_inclusive:'yes',tone:'good'}]},{target_entity:'invalid',tolerance:1},{target_entity:'input_number.target',tolerance:-1},{target_entity:'input_number.target',tolerance:'1'},{target_entity:'input_number.target',tolerance:1,ranges:[]}];
  for(const color of invalid){assert.throws(()=>validateReadingColor(color));assert.equal(readingColor({},10,color).tone,'unknown');}
});

test('four metric declarations are configurable, preserve their sources and reject ambiguous definitions',()=>{
  const config={room_metrics:[metric({id:'temperature',name:'Temperature',entity:'sensor.temperature',color:{target_entity:'input_number.target',tolerance:1}}),metric({id:'humidity',name:'Humidity',entity:'sensor.humidity',unit:'%'}),metric(),metric({id:'pm25',name:'Particles',entity:'sensor.pm25',unit:'µg/m³'})]};
  const before=structuredClone(config);assert.doesNotThrow(()=>validateRoomMetrics(config));assert.deepEqual(config,before);assert.doesNotThrow(()=>validateRoomMetrics({}));
  for(const change of [c=>c.room_metrics={},c=>c.room_metrics=[],c=>c.room_metrics.push(c.room_metrics[0]),c=>c.room_metrics[0].id='unsafe id',c=>c.room_metrics[0].entity='bad',c=>c.room_metrics[0].name='',c=>c.room_metrics[0].freshness={max_age:0,timestamp:'last_reported'},c=>c.room_metrics[0].freshness={max_age:30,timestamp:'unknown'},c=>c.room_metrics[0].freshness={max_age:'30',timestamp:'last_reported'},c=>c.room_metrics[0].color={ranges:[{min:'1',tone:'good'}]}]){const invalid=structuredClone(config);change(invalid);assert.throws(()=>validateRoomMetrics(invalid));}
});

test('metric freshness matrix retains last measured numbers and neutralizes stale or future reports',()=>{
  let count=0;for(const age of [0,299,300,300.001,900,-1])for(const value of ['0','812','unknown','unavailable','bad','  ']){
    const item=metric(),hass={states:{[item.entity]:state(value,{unit_of_measurement:'ppm'},age)}},result=roomMetricReading(hass,{},item,now),valid=['0','812'].includes(value);
    assert.equal(result.value,valid?Number(value):null);assert.equal(result.quality,!valid||age<0?'unknown':age>300?'stale':'fresh');assert.equal(result.tone,valid&&age>=0&&age<=300?Number(value)<800?'good':'notice':'unknown');count++;
  }
  assert.equal(count,36);
  const item=metric(),hass={states:{[item.entity]:{state:'812',attributes:{}}}};assert.equal(roomMetricReading(hass,{},item,now).quality,'unknown');assert.equal(roomMetricReading(hass,{},item,now).value,812);assert.equal(roomMetricReading(hass,{},item,now).age,null);
  const numeric=roomMetricReading(hass,{},metric({freshness:undefined}),now);assert.equal(numeric.quality,'fresh');assert.equal(numeric.tone,'notice');
});

test('explicit display clock tolerance clamps only bounded small future timestamps',()=>{
  let cases=0;for(const tolerance of [0,1,28,60,120])for(const ahead of new Set([0,Math.max(0,tolerance-.001),tolerance,tolerance+.001])){
    const item=metric({freshness:{max_age:300,timestamp:'last_updated',clock_tolerance:tolerance}}),hass={states:{'sensor.room_co2':state('812',{unit_of_measurement:'ppm'},-ahead)}},before=structuredClone(hass),result=roomMetricReading(hass,{},item,now),within=ahead<=tolerance;
    validateRoomMetrics({room_metrics:[item]});assert.equal(result.quality,within?'fresh':'unknown');assert.equal(result.tone,within?'notice':'unknown');assert.equal(result.age,within?0:-ahead);assert.equal(result.value,812);assert.deepEqual(hass,before);cases++;
  }
  assert.equal(cases,18);
  const hass={states:{'sensor.room_co2':state('812',{},-28)}},strict=metric({freshness:{max_age:300,timestamp:'last_updated'}}),allowed=metric({freshness:{max_age:300,timestamp:'last_updated',clock_tolerance:60}});
  assert.equal(roomMetricReading(hass,{},strict,now).quality,'unknown');assert.equal(roomMetricReading(hass,{},strict,now).age,-28);assert.equal(roomMetricReading(hass,{},allowed,now).quality,'fresh');assert.equal(roomMetricReading(hass,{},allowed,now).age,0);
  hass.states['sensor.room_co2']=state('812',{},301);const old=roomMetricReading(hass,{},allowed,now);assert.equal(old.quality,'stale');assert.equal(old.age,301);
});

test('clock tolerance is opt-in, bounded and never turns invalid or missing reports into fresh data',()=>{
  for(const tolerance of [-.001,120.001,NaN,Infinity,-Infinity,'60',true,false,null,{},[]]){
    const item=metric({freshness:{max_age:300,timestamp:'last_reported',clock_tolerance:tolerance}}),hass={states:{[item.entity]:state('812')}};
    assert.throws(()=>validateRoomMetrics({room_metrics:[item]}));assert.equal(roomMetricReading(hass,{},item,now).quality,'unknown');assert.equal(roomMetricReading(hass,{},item,now).tone,'unknown');
  }
  for(const timestamp of ['last_reported','last_updated','last_changed']){
    const item=metric({freshness:{max_age:300,timestamp,clock_tolerance:60}}),hass={states:{[item.entity]:state('812',{},-28)}};assert.equal(roomMetricReading(hass,{},item,now).quality,'fresh');delete hass.states[item.entity][timestamp];assert.equal(roomMetricReading(hass,{},item,now).quality,'unknown');
    hass.states[item.entity]=state('unknown',{},-28);assert.equal(roomMetricReading(hass,{},item,now).value,null);assert.equal(roomMetricReading(hass,{},item,now).quality,'unknown');
  }
});

test('temperature display fallback stays unqualified and neutral without entering controller source',()=>{
  const config={entities:{room_temperature:'sensor.qualified'},temperature_display:{entity:'sensor.raw',max_age:3600}},item=metric({id:'temperature',name:'Temperature',entity:'sensor.qualified',unit:'°C',color:{target_entity:'input_number.target',tolerance:1}}),hass={states:{'sensor.qualified':state('unavailable'), 'sensor.raw':state('24',{unit_of_measurement:'°C'},100),'input_number.target':state('24')}};
  const before=structuredClone(hass),result=roomMetricReading(hass,config,item,now);assert.equal(result.value,24);assert.equal(result.quality,'stale');assert.equal(result.tone,'unknown');assert.equal(result.age,100);assert.deepEqual(hass,before);
  hass.states['sensor.raw']=state('24',{},3601);assert.equal(roomMetricReading(hass,config,item,now).value,null);
  hass.states['sensor.qualified']=state('  ');hass.states['sensor.raw']=state('  ');assert.equal(roomReading(hass,config,now).value,null);
  hass.states['sensor.qualified']=state('24',{unit_of_measurement:'°C'},0);assert.equal(roomMetricReading(hass,config,item,now).tone,'good');
});
