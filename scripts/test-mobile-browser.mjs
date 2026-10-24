// Synthetic fixture: ownership and navigation tests cannot reach a real home.
import fs from 'node:fs/promises';
const root=process.argv[2]||process.cwd(),renderer=await fs.readFile(root+'/docs/tools/render-public-media.mjs','utf8'),setup=renderer.slice(0,renderer.indexOf('const report='));
const checks=String.raw`
let browser;const errors=[];let count=0;
const expect=(ok,message)=>{count++;if(!ok)throw Error(message);};
try{
 browser=await chromium.launch({headless:true,channel:process.env.M3_BROWSER_CHANNEL||undefined,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'ru-RU'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/public-preview.html');await page.waitForFunction(()=>!!window.publicPreview);
 const quick=page.locator('ha-m3-quick-device-card').first();
 expect(await quick.locator('.owners').count()===3,'Missing direct ownership controls');
 expect(await quick.locator('[aria-haspopup=dialog]').count()===0,'Ownership opens a popup');
 const power=quick.locator('.power-policy');
 await power.getByRole('button',{name:'Вручную',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_power'].state==='on');
 expect(await power.getByRole('button',{name:'Вручную',exact:true}).getAttribute('aria-pressed')==='true','Manual not selected');
 await power.getByRole('button',{name:'Авто HA',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_power'].state==='off');
 const speed=quick.locator('.quick-field').last();await speed.getByRole('button',{name:'Авто прибора',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['climate.ac'].attributes.fan_mode==='auto');
 expect(await speed.getByRole('button',{name:'Авто прибора',exact:true}).getAttribute('aria-pressed')==='true','Native Auto not selected');
 expect(await speed.getByRole('button',{name:'Авто прибора',exact:true}).locator('.symbol').innerText()==='devices','Device Auto lacks device icon');
 await speed.getByRole('button',{name:'Вручную',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['climate.ac'].attributes.fan_mode==='low');
 expect(await speed.getByRole('button',{name:'Вручную',exact:true}).getAttribute('aria-pressed')==='true','Native Auto did not exit');
 expect(await speed.getByRole('button',{name:'Вручную',exact:true}).locator('.symbol').innerText()==='lock','Manual mode lacks lock');
 expect((await speed.getByRole('button',{name:'Вручную',exact:true}).getAttribute('aria-description')).includes('не меняет этот параметр'),'Manual lock meaning is unclear');
 expect(await page.evaluate(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_temperature'].state==='off'),'Speed changed thermal permission');
 await speed.getByRole('button',{name:'Авто HA',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_speed'].state==='off');
 expect(await speed.getByRole('button',{name:'Авто HA',exact:true}).locator('.symbol').innerText()==='auto_awesome','HA Auto lacks automation icon');
 expect(await speed.locator('[aria-pressed=true]').count()===1,'More than one owner appears selected');
 await page.evaluate(()=>{
  window.doorWrites=[];const bar=document.createElement('ha-m3-action-bar');
  bar.setConfig({language:'ru',actions:[{name:'Дверь',icon:'door',confirmation:'Подтвердить действие?',action:{action:'perform-action',perform_action:'script.demo_open'}}]});
  bar.hass={states:{},callService:async(...args)=>window.doorWrites.push(args)};document.body.append(bar);window.bar=bar;
 });
 const bar=page.locator('ha-m3-action-bar');
 await bar.getByRole('button',{name:'Дверь',exact:true}).first().click();
 expect(await page.evaluate(()=>window.doorWrites.length)===0,'Door called before confirmation');
 await bar.getByRole('button',{name:'Отмена',exact:true}).click();
 expect(await page.evaluate(()=>window.doorWrites.length)===0,'Cancel called service');
 await bar.getByRole('button',{name:'Дверь',exact:true}).first().click();
 await bar.locator('dialog').getByRole('button',{name:'Дверь',exact:true}).click();
 expect(await page.evaluate(()=>window.doorWrites.length)===1,'Confirmation must submit exactly once');
 for(const width of [320,390,700,1280]){
  await page.setViewportSize({width,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow '+width);
  for(const button of await quick.locator('.owner').all()){
   const b=await button.boundingBox();expect(b.width>=44&&b.height>=48,'Owner touch target too small '+width);
   expect(await button.locator('.owner-label').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Owner label clipped '+width);
  }
  if(width===390){
   await power.getByRole('button',{name:'Вручную',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_power'].state==='on');
   await bar.evaluate(el=>el.style.display='none');
   await quick.screenshot({path:root+'/owner-controls-mobile.png'});
   await bar.evaluate(el=>el.style.display='');
   await power.getByRole('button',{name:'Авто HA',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_power'].state==='off');
  }
  const b=await bar.boundingBox();if(width<=700)expect(b.y+b.height<=844,'Dock outside viewport');
 }
 expect(errors.length===0,JSON.stringify(errors));
 await fs.writeFile(root+'/mobile-browser-report.json',JSON.stringify({passed:true,checks:count,errors,live_ha_connection:false},null,2));console.log('Mobile/direct controls: '+count+' checks passed');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
`;
const tmp=root+'/docs/tools/.mobile-browser-run.mjs';try{await fs.writeFile(tmp,setup+checks);await import(new URL('file://'+tmp));}finally{await fs.unlink(tmp).catch(()=>{});}
