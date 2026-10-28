import test from 'node:test';
import assert from 'node:assert/strict';
import {scalePresentation} from '../src/scale-presentation.js';
const item=kind=>({mode_scale:{kind}});
const observed={mode:'off',tone:'off',icon:'power_settings_new',activity:'off'};
test('AC draft boundaries match command model without altering observed state',()=>{
  const choices=['off',18,19,20,21,22,'auto'],model={choices,room:{value:20}};
  assert.deepEqual(choices.map((_,i)=>scalePresentation(item('ac-temperature'),model,observed,i).mode),['off','cool','fan','fan','fan','heat','auto']);
  assert.equal(observed.mode,'off');assert.equal(scalePresentation(item('ac-temperature'),model,observed,undefined).preview,false);
  assert.equal(scalePresentation(item('ac-temperature'),model,observed,1).activity,null);
});
test('Preview uses the gesture snapshot and never invents a missing room measurement',()=>{
  const model={choices:[22],room:{value:24}};
  assert.equal(scalePresentation(item('ac-temperature'),model,observed,0,{value:20}).mode,'heat');
  assert.equal(scalePresentation(item('ac-temperature'),{choices:[22]},observed,0).mode,'unknown');
});
test('Off and Auto retain parameter-specific semantics for every scale family',()=>{
  for(const kind of ['ac-temperature','breather-temperature','heater-temperature','ac-speed','breather-speed','purifier-speed']){
    const model={choices:['off',kind.endsWith('temperature')?22:'3','auto'],room:{value:20}};
    assert.equal(scalePresentation(item(kind),model,observed,0).mode,kind==='breather-temperature'?'heat-off':'off');
    assert.equal(scalePresentation(item(kind),model,observed,2).mode,'auto');
    assert.equal(scalePresentation(item(kind),model,observed,1).preview,true);
    assert.equal(scalePresentation(item(kind),model,observed,undefined).mode,'off');
  }
});
