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
 expect(await quick.locator('.owner').count()===3,'Missing independent ownership controls');
 expect(await quick.locator('[aria-haspopup=dialog]').count()===0,'Ownership opens a popup');
 const power=quick.locator('.power-policy');
 const powerOwner=power.locator('.owner');await powerOwner.click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_power'].state==='on');
 expect(await powerOwner.getAttribute('data-owner')==='manual','Manual not selected');
 expect(await powerOwner.getAttribute('aria-pressed')===null,'Owner control has misleading binary pressed state');
 await powerOwner.click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_power'].state==='off');
 const speed=quick.locator('.quick-field').last(),speedOwner=speed.locator('.owner');await speedOwner.click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_speed'].state==='on');await speedOwner.click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['climate.ac'].attributes.fan_mode==='auto');
 expect(await speedOwner.getAttribute('data-owner')==='device','Native Auto not selected');
 expect(await speedOwner.locator('.symbol').innerText()==='devices','Device Auto lacks device icon');
 expect((await speedOwner.getAttribute('aria-label')).includes('Автоматика прибора'),'Native Auto missing full accessible meaning');
 expect((await speedOwner.locator('.owner-copy').innerText())==='Прибор','Native Auto compact label missing');
 await speedOwner.click();await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_speed'].state==='off');await speedOwner.click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['climate.ac'].attributes.fan_mode==='low');
 expect(await speedOwner.getAttribute('data-owner')==='manual','Native Auto did not exit');
 expect((await speedOwner.getAttribute('aria-label')).includes('Ручное управление'),'Manual owner missing full accessible meaning');
 expect(await speedOwner.locator('.symbol').innerText()==='lock','Manual mode lacks lock');
 expect((await speedOwner.getAttribute('aria-description')).includes('не меняет этот параметр'),'Manual lock meaning is unclear');
 expect(await page.evaluate(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_temperature'].state==='off'),'Speed changed thermal permission');
 await speedOwner.click();await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['climate.ac'].attributes.fan_mode==='auto');await speedOwner.click();
 await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_speed'].state==='off');
 expect(await speedOwner.locator('.symbol').innerText()==='lock_open','HA Auto lacks open lock icon');
 expect(await speed.locator('.owner').count()===1,'More than one ownership button');
 const currentOwnerLabel=await speedOwner.getAttribute('aria-label');
 expect(currentOwnerLabel.includes('Автоматика дома')&&currentOwnerLabel.includes('Следующий режим: Ручное управление'),'Current and next owner missing from accessible label');
 expect((await speedOwner.locator('.owner-copy').innerText())==='Авто','Home automation compact label missing');
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
   const b=await button.boundingBox();expect(b.width>=48&&b.height>=48,'Owner touch target too small '+width);
  }
  for(const label of await quick.locator('.owner-label').all())expect(await label.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Owner label clipped '+width);
  if(width===390){
   await powerOwner.click();
   await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_power'].state==='on');
   await bar.evaluate(el=>el.style.display='none');
   await quick.screenshot({path:root+'/owner-controls-mobile.png'});
   await bar.evaluate(el=>el.style.display='');
   await powerOwner.click();
   await page.waitForFunction(()=>document.querySelector('ha-m3-quick-device-card').hass.states['input_boolean.lock_ac_power'].state==='off');
  }
  const b=await bar.boundingBox();if(width<=700)expect(b.y+b.height<=844,'Dock outside viewport');
 }
 expect(errors.length===0,JSON.stringify(errors));
 await fs.writeFile(root+'/mobile-browser-report.json',JSON.stringify({passed:true,checks:count,errors,live_ha_connection:false},null,2));console.log('Mobile/direct controls: '+count+' checks passed');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
`;
const tmp=root+'/docs/tools/.mobile-browser-run.mjs';try{await fs.writeFile(tmp,setup+checks);await import(new URL('file://'+tmp));}finally{await fs.unlink(tmp).catch(()=>{});}
