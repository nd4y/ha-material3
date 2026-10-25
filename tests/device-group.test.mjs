import test from 'node:test';
import assert from 'node:assert/strict';
import {deviceGroupConfig} from '../src/device-group-config.js';

const quick=()=>({type:'custom:ha-m3-quick-device-card',entity:'climate.example',quick_controls:[],power:{action:{action:'perform-action',perform_action:'script.manual',value_field:'value'},lock_entity:'input_boolean.power_lock',lock_action:{action:'perform-action',perform_action:'script.manual',data:{operation:'lock'},value_field:'value'}}});

test('unified group composes without changing bindings or original configuration',()=>{
  const child=quick(),input={config_version:1,language:'ru',appearance:{scheme:'dark',motion:'reduced'},cards:[child]},before=structuredClone(input),out=deviceGroupConfig(input);
  assert.deepEqual(input,before);assert.equal(out.cards[0].grouped,true);assert.equal(out.cards[0].language,'ru');
  assert.deepEqual(out.cards[0].power,child.power);assert.deepEqual(out.cards[0].appearance,input.appearance);
  assert.equal(out.cards[0].entity,child.entity);
});
test('unified group preserves explicit child language and appearance',()=>{
  const out=deviceGroupConfig({language:'ru',appearance:{scheme:'dark',motion:'reduced'},cards:[{...quick(),language:'en',appearance:{scheme:'light'}}]});
  assert.equal(out.cards[0].language,'en');assert.deepEqual(out.cards[0].appearance,{scheme:'light',motion:'reduced'});
});
test('unified group fails malformed children before composition',()=>{
  for(const cards of [undefined,[],new Array(13).fill(quick()),[null],[{type:'button'}],[{...quick(),entity:null}]])assert.throws(()=>deviceGroupConfig({cards}));
  assert.throws(()=>deviceGroupConfig({title:' ',cards:[quick()]}));
  assert.throws(()=>deviceGroupConfig({appearance:{scheme:'invalid'},cards:[quick()]}));
  assert.throws(()=>deviceGroupConfig({cards:[{...quick(),quick_controls:'invalid'}]}));
});
