import test from 'node:test';import assert from 'node:assert/strict';
import{designSystem,resolveDesignSystem,themeDefinition,appTokens}from'../src/design-system.js';
import{targetDecimals}from'../src/ha.js';
test('theme exports the same roles to native HA and owned components in both modes',()=>{
  const c=resolveDesignSystem({seed_color:'#006a6a',shape:{card:32},spacing:{card:28},font_family:'Example Font, sans-serif'});
  const modes={dark:{primary:'#abcd12',surface:'#121212','on-surface':'#ffffff','secondary-container':'#234567','on-secondary-container':'#eeeeee'},light:{primary:'#123456',surface:'#fefefe','on-surface':'#111111','secondary-container':'#cdefab','on-secondary-container':'#111111'}};
  const theme=themeDefinition(modes,c)[c.name];
  for(const mode of ['dark','light']){assert.equal(theme.modes[mode]['primary-color'],theme.modes[mode]['ha-m3-color-primary']);assert.equal(theme.modes[mode]['app-header-background-color'],theme.modes[mode]['ha-m3-color-surface']);assert.equal(theme.modes[mode]['sidebar-selected-background-color'],theme.modes[mode]['ha-m3-color-secondary-container']);}
  assert.equal(theme['ha-card-border-radius'],theme['ha-m3-card-radius']);assert.equal(theme['primary-font-family'],theme['ha-m3-font-family']);assert.equal(theme['ha-m3-card-padding'],'28px');assert.equal(appTokens(c)['card-radius'],'32px');assert.equal(designSystem.shape.card,28);
});
test('invalid design inputs are rejected rather than emitted as broken theme CSS',()=>{
  for(const value of [{seed_color:'red'},{spacing:{card:-1}},{layout:{max_width:NaN}},{temperature_surface:'arbitrary'},{font_family:'font\nother'}])assert.throws(()=>resolveDesignSystem(value));
});
test('target sizing precision comes from helper metadata including small/exponent steps',()=>{
  for(const[step,digits]of[[1,0],[.5,1],[.01,2],[.001,3],[1e-6,6]])assert.equal(targetDecimals({attributes:{min:16,max:30,step}}),digits);
  assert.equal(targetDecimals({attributes:{min:16.25,max:30,step:1}}),2);assert.equal(targetDecimals(undefined),0);
});
