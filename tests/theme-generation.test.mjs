import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {generateThemeData} from '../scripts/theme.mjs';
import {resolveDesignSystem} from '../src/design-system.js';

const presets=JSON.parse(await fs.readFile(new URL('../tokens/theme-presets.json',import.meta.url),'utf8'));
const graphite=presets.find(p=>p.name==='Material 3 Expressive - Graphite Blue');
const luminance=hex=>{
  const c=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
};
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(values[0]+.05)/(values[1]+.05);};

test('graphite surfaces match the chosen preview and retain the blue accent',async()=>{
  assert.ok(graphite);
  const theme=(await generateThemeData(graphite))[graphite.name];
  const dark=theme.modes.dark;
  assert.equal(dark['primary-background-color'],'#0e0e0e');
  assert.equal(dark['card-background-color'],'#191919');
  assert.equal(dark['primary-color'],'#b4c7ed');
  for(const mode of Object.values(theme.modes)){
    for(const role of ['surface','surface-container-low','surface-container','surface-container-high','surface-container-highest']){
      const hex=mode['ha-m3-color-'+role];
      assert.equal(hex.slice(1,3),hex.slice(3,5));assert.equal(hex.slice(3,5),hex.slice(5,7));
      assert.ok(contrast(mode['ha-m3-color-on-surface'],hex)>=4.5);
    }
    assert.ok(contrast(mode['ha-m3-color-on-primary'],mode['ha-m3-color-primary'])>=4.5);
    assert.ok(contrast(mode['ha-m3-color-on-secondary-container'],mode['ha-m3-color-secondary-container'])>=4.5);
    assert.equal(mode['primary-color'],mode['md-sys-color-primary']);
    assert.equal(mode['sidebar-selected-background-color'],mode['md-sys-color-secondary-container']);
  }
});

test('a different neutral configuration changes surfaces without replacing the source accent',async()=>{
  const plain=(await generateThemeData(graphite))[graphite.name];
  const warm=(await generateThemeData({...graphite,neutral_palette:{hue:80,chroma:4}}))[graphite.name];
  const standard=(await generateThemeData({...graphite,neutral_palette:null}))[graphite.name];
  for(const mode of ['dark','light']){
    assert.notEqual(warm.modes[mode]['card-background-color'],plain.modes[mode]['card-background-color']);
    assert.notEqual(standard.modes[mode]['card-background-color'],plain.modes[mode]['card-background-color']);
    assert.equal(warm.modes[mode]['primary-color'],plain.modes[mode]['primary-color']);
  }
});

test('invalid neutral settings fail before generating CSS and explicit zero chroma is retained',()=>{
  for(const neutral_palette of [false,[],{}, {hue:360,chroma:0},{hue:-1,chroma:0},{hue:NaN,chroma:0},{hue:0,chroma:-1},{hue:0,chroma:'0'},{hue:0,chroma:201},{hue:0,chroma:0,variant_chroma:Infinity},{hue:0,chroma:0,unknown:2}])assert.throws(()=>resolveDesignSystem({neutral_palette}));
  assert.deepEqual(resolveDesignSystem({neutral_palette:{hue:0,chroma:0,variant_chroma:0}}).neutral_palette,{hue:0,chroma:0,variant_chroma:0});
  assert.equal(resolveDesignSystem().neutral_palette,null);
});
test('Ice uses neutral surfaces and distinct accessible HA and native Auto colors',async()=>{
  const ice=presets.find(p=>p.name==='Material 3 Expressive - Ice');assert.ok(ice);
  const theme=(await generateThemeData(ice))[ice.name],dark=theme.modes.dark;
  assert.equal(dark['primary-background-color'],'#101317');assert.equal(dark['card-background-color'],'#1A1E24');
  assert.notEqual(dark['md-sys-color-primary'],dark['md-sys-color-tertiary']);
  for(const mode of Object.values(theme.modes))for(const role of ['primary','tertiary'])assert.ok(contrast(mode['md-sys-color-'+role],mode['md-sys-color-surface-container'])>=4.5);
  assert.ok(contrast(dark['primary-text-color'],dark['card-background-color'])>=7);
  for(const color_overrides of [{bad:{surface:'#ffffff'}},{dark:{surface:'red'}},{dark:{'x;bad':'#ffffff'}}])assert.throws(()=>resolveDesignSystem({color_overrides}));
  await assert.rejects(()=>generateThemeData({color_overrides:{dark:{'unknown-role':'#ffffff'}}}));
});
