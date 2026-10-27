import test from 'node:test';
import assert from 'node:assert/strict';
import {scaleChoices,scaleSelection,effectivePosition} from '../src/climate-scale.js';
const b={kind:'breather-temperature',min:5,max:25,step:1};
const ac={kind:'ac-temperature',min:16,max:32,step:1};
test('Breather 5 is the unique heat-off endpoint and 6 follows it',()=>{
  const choices=scaleChoices(b);assert.deepEqual(choices.slice(0,3),['off',6,7]);assert.equal(choices.at(-1),'auto');assert.equal(choices.includes(5),false);
  assert.deepEqual(scaleSelection(b,'off'),{type:'manual',parameter:'temperature',value:5,heatOff:true});
  assert.deepEqual(scaleSelection(b,6),{type:'manual',parameter:'temperature',value:6});
  assert.equal(effectivePosition(b,{owner:'ha',deviceOff:false,effective:5}),0);
  assert.throws(()=>scaleSelection(b,5));
});
test('AC uses a validated room snapshot and inclusive one-degree ventilation band',()=>{
  const context={roomTemperature:20,roomQualified:true,roomAgeSeconds:0};
  for(const [target,mode]of [[18,'cool'],[19,'fan_only'],[20,'fan_only'],[21,'fan_only'],[22,'heat']])assert.equal(scaleSelection(ac,target,context).mode,mode);
  for(const value of [undefined,null,'',NaN,true,false,{},' 20 ','0x14',4,41])assert.throws(()=>scaleSelection(ac,20,{...context,roomTemperature:value}));
  for(const age of [-1,5401,NaN,undefined])assert.throws(()=>scaleSelection(ac,20,{...context,roomAgeSeconds:age}));
  assert.throws(()=>scaleSelection(ac,20,{...context,roomQualified:false}));
  assert.equal(scaleSelection(ac,20,{...context,roomAgeSeconds:5400}).mode,'fan_only');
  assert.throws(()=>scaleSelection(ac,100,context));
});
test('Power Off and HA automatic endpoints stay distinct for every remaining scale',()=>{
  for(const cfg of [ac,{kind:'heater-temperature',min:18,max:28},{kind:'breather-speed',options:['1','2','3','4','5','6','7'],turbo:true},{kind:'ac-speed',options:['low','medium','high']},{kind:'purifier-speed',options:['0','1','2']}]){
    const choices=scaleChoices(cfg);assert.equal(choices[0],'off');assert.equal(choices.at(-1),'auto');
    assert.deepEqual(scaleSelection(cfg,'off'),{type:'power-off'});assert.deepEqual(scaleSelection(cfg,'auto'),{type:'automatic'});
  }
});
test('Automatic ownership renders real setting, unknown never becomes Off',()=>{
  assert.equal(scaleChoices(ac)[effectivePosition(ac,{owner:'ha',deviceOff:false,effective:22})],22);
  assert.equal(effectivePosition(ac,{owner:'ha',deviceOff:false,effective:null}),null);
  assert.equal(effectivePosition(ac,{owner:'ha',deviceOff:null,effective:22}),null);
  assert.equal(effectivePosition(ac,{owner:'ha',deviceOff:false,effective:100}),null);
  assert.equal(effectivePosition(ac,{owner:'ha',deviceOff:true,effective:null}),0);
  assert.equal(effectivePosition(ac,{owner:'unknown',deviceOff:true,effective:null}),null);
});
test('Actual capabilities are authoritative, duplicates or unverified Turbo are rejected',()=>{
  const cfg={kind:'breather-speed',options:['1','2','3','4','5','6','7'],turbo:true};
  assert.deepEqual(scaleChoices(cfg),['off','1','2','3','4','5','6','7','turbo','auto']);
  assert.throws(()=>scaleChoices({...cfg,options:['1','1']}));
  assert.throws(()=>scaleChoices({...cfg,options:['1','auto']}));
  assert.throws(()=>scaleChoices({kind:'purifier-speed',options:['1'],turbo:true}));
  assert.throws(()=>scaleChoices({...b,min:6}));
});
