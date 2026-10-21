import test from 'node:test';
import assert from 'node:assert/strict';
import {historyNumber,historyPoints,smoothValue,sampleAt,smoothPath,segments,validateHistory,validateHistorySources} from '../src/history-model.js';
import {loadHistory} from '../src/history-data.js';
const point=(t,v)=>({t,v}),record=(t,state,attributes={})=>({entity_id:'sensor.generic',last_updated:new Date(t).toISOString(),state,attributes});

test('numeric sources fail closed and use configured attributes, enums and inversion',()=>{
  for(const state of ['unknown','unavailable','', ' ', '0x10','NaN','Infinity'])assert.equal(historyNumber({state}),null);
  for(const state of [true,null,undefined,{},[]])assert.equal(historyNumber({state}),null);
  assert.equal(historyNumber({state:'off',attributes:{temperature:24}},{attribute:'temperature'}),24);
  assert.equal(historyNumber({state:'unavailable',attributes:{temperature:24}},{attribute:'temperature'}),null);
  assert.equal(historyNumber({state:'low'},{value_map:{low:1,high:3}}),1);
  assert.equal(historyNumber({state:'auto'},{value_map:{low:1,high:3}}),null);
  assert.equal(historyNumber({state:'75'},{invert:true}),25);
});
test('recorder normalization preserves unknown gaps, boundary state and unchanged raw input',()=>{
  const input=[record(0,'4'),record(5,'unavailable'),record(8,'7')],before=structuredClone(input),points=historyPoints(input,{},1,10);
  assert.deepEqual(points,[point(1,4),point(5,null),point(8,7),point(10,7)]);
  assert.equal(sampleAt(points,6),null);assert.equal(segments(points).length,2);assert.deepEqual(input,before);
  assert.deepEqual(historyPoints([record(1,'2'),record(1,'3'),record(50,'9')],{},0,10),[point(1,3),point(10,3)]);
  assert.deepEqual(historyPoints([],{},0,10),[]);
});
test('bounded smoothing covers plateaus, irregular intervals, reversals and settings without overshoot',()=>{
  for(const values of [[1,1,2,3,3,2,1],[22,22,22,5,5],[0,100,0,100],[3,3,3,3],[-5,-3,-4,0]]){
    const points=values.map((v,i)=>point(i*i*1000,v));
    for(let i=0;i<points.length-1;i++)for(let k=0;k<=100;k++){
      const v=smoothValue(points,points[i].t+(points[i+1].t-points[i].t)*k/100);
      assert.ok(v>=Math.min(values[i],values[i+1])-1e-9&&v<=Math.max(values[i],values[i+1])+1e-9);
    }
    const path=smoothPath(points,t=>t,v=>v);assert.match(path,/C/);assert.doesNotMatch(path,/[HV]/);
  }
  const points=[point(0,2),point(100,4)];assert.equal(sampleAt(points,50).recorded,2);assert.equal(sampleAt(points,50).smooth,3);
  assert.equal(sampleAt(points,-1),null);assert.equal(sampleAt(points,101),null);
});
test('configuration bounds reject malformed sources and excessive history windows',()=>{
  for(const h of [true,false,undefined,{hours:1},{hours:168}])assert.doesNotThrow(()=>validateHistory(h));
  for(const h of [null,[],{hours:0},{hours:169},{hours:NaN},'24'])assert.throws(()=>validateHistory(h));
  validateHistorySources([{entity:'sensor.any_name',name:'PM1',unit:'μg/m³'}]);
  for(const s of [[],[{entity:'bad',name:'x'}],[{entity:'sensor.a',name:''}],[{entity:'sensor.a',name:'x',invert:'yes'}],[{entity:'sensor.a',name:'x',value_map:{bad:NaN}}]])assert.throws(()=>validateHistorySources(s));
});
test('history requests batch by window, cache across HA snapshots and never query on sample/hover',async()=>{
  let calls=[];const connection={},hass={connection,callApi:async(method,path)=>{calls.push({method,path});return [[record(0,'2')]];}};
  const [a,b]=await Promise.all([loadHistory(hass,['sensor.generic'],24,3600000),loadHistory(hass,['sensor.other'],24,3600000)]);
  assert.equal(calls.length,1);assert.match(calls[0].path,/sensor.generic%2Csensor.other/);assert.equal(a[0].records.length,1);assert.deepEqual(b[0].records,[]);
  await loadHistory({...hass},['sensor.generic'],24,3601000);assert.equal(calls.length,1);
  await loadHistory(hass,['sensor.generic'],6,3601000);assert.equal(calls.length,2);
  await loadHistory(hass,['sensor.generic'],24,3800000);assert.equal(calls.length,3);
  for(let i=0;i<100;i++)sampleAt([point(0,1),point(10,3)],5);assert.equal(calls.length,3);
});
test('failed recorder queries do not poison the cache and can recover',async()=>{
  let fail=true,calls=0;const hass={connection:{},callApi:async()=>{calls++;if(fail)throw Error('offline');return [];}};
  await assert.rejects(loadHistory(hass,['sensor.generic'],24,3600000));fail=false;
  const result=await loadHistory(hass,['sensor.generic'],24,3600000);assert.equal(calls,2);assert.deepEqual(result[0].records,[]);
});
