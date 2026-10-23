// All services are mocked. This fixture cannot unlock a real door.
import fs from 'node:fs/promises';
const root=process.argv[2]||process.cwd(),renderer=await fs.readFile(root+'/docs/tools/render-public-media.mjs','utf8'),setup=renderer.slice(0,renderer.indexOf('const report='));
const checks=String.raw`
let browser;let count=0;const errors=[];
const expect=(ok,message)=>{count++;if(!ok)throw Error(message);};
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'ru-RU',hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/public-preview.html');await page.waitForFunction(()=>!!window.publicPreview);
 const climate=page.locator('ha-m3-climate-card');
 await climate.getByRole('button',{name:'Автоматика',exact:true}).click();
 const settings=climate.locator('#automation-menu');
 await page.waitForFunction(()=>Math.abs(window.publicPreview.summary.renderRoot.querySelector('#automation-menu').getBoundingClientRect().bottom-innerHeight)<2);
 const sheet=await settings.boundingBox();expect(Math.abs(sheet.y+sheet.height-844)<2,'Settings not at bottom');
 expect(sheet.height<=844*.8+2,'Settings exceed mobile height limit');
 await settings.getByRole('button',{name:'Закрыть',exact:true}).click();
 expect(await settings.evaluate(el=>!el.matches(':popover-open')),'Settings close unavailable');
 await page.evaluate(async()=>{const d=document.createElement('ha-m3-dialog');d.heading='Параметры';d.lang='ru';d.motion='reduced';d.textContent='Пример';document.body.append(d);await d.show();});
 await page.waitForFunction(()=>Math.abs(document.querySelector('ha-m3-dialog').renderRoot.querySelector('dialog').getBoundingClientRect().bottom-innerHeight)<2);
 const generic=page.locator('ha-m3-dialog'),gb=await generic.locator('dialog').boundingBox();
 expect(Math.abs(gb.y+gb.height-844)<2,'Generic dialog not at bottom');
 await generic.getByRole('button',{name:'Закрыть',exact:true}).click();
 await generic.locator('dialog').waitFor({state:'hidden'});
 await page.evaluate(()=>{
  document.body.replaceChildren();window.writes=[];
  window.config={language:'ru',mobile_floating:false,actions:[{name:'Открыть дверь',icon:'meeting_room',activation:'hold',hold_duration:800,confirmation:'Открыть входную дверь?',action:{action:'perform-action',perform_action:'script.demo_open'}}]};
  const bar=document.createElement('ha-m3-action-bar');bar.setConfig(window.config);
  bar.hass={states:{},callService:async(...args)=>{window.writes.push(args);}};
  document.body.append(bar);window.bar=bar;
 });
 const bar=page.locator('ha-m3-action-bar'),hold=bar.locator('ha-m3-hold-button').getByRole('button');
 const writes=()=>page.evaluate(()=>window.writes.length);
 const down=async()=>{const b=await hold.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();};
 await hold.click();await hold.dblclick();expect(await writes()===0,'Short and double taps submitted');
 await down();await page.waitForTimeout(900);expect(await writes()===0,'Duration submitted without release');
 expect(await hold.getAttribute('class')==='holding ready','Ready feedback missing');
 await page.mouse.up();expect(await writes()===1,'Ready release must submit once');
 await down();await page.waitForTimeout(900);await page.mouse.move(0,400);await page.mouse.up();expect(await writes()===1,'Release outside submitted');
 for(const event of ['pointercancel','lostpointercapture','blur']){
  await down();await page.waitForTimeout(850);await hold.dispatchEvent(event);await page.mouse.up();expect(await writes()===1,event+' submitted');
 }
 for(const target of ['window','document']){
  await down();await page.waitForTimeout(850);await page.evaluate(target=>target==='window'?window.dispatchEvent(new Event('blur')):document.dispatchEvent(new Event('visibilitychange')),target);await page.mouse.up();expect(await writes()===1,target+' interruption submitted');
 }
 await down();await page.waitForTimeout(850);await bar.locator('ha-m3-hold-button').evaluate(el=>el.disabled=true);await page.mouse.up();expect(await writes()===1,'Disabled during hold submitted');
 await bar.locator('ha-m3-hold-button').evaluate(el=>el.disabled=false);
 await down();await page.waitForTimeout(850);await hold.dispatchEvent('pointerdown',{pointerId:12,isPrimary:false,button:0});await page.mouse.up();expect(await writes()===1,'Multitouch submitted');
 await hold.focus();await page.keyboard.down('Space');await page.waitForTimeout(850);expect(await writes()===1,'Keyboard duration submitted early');await page.keyboard.up('Space');expect(await writes()===2,'Keyboard release or duplicate click failed');
 await hold.focus();await page.keyboard.down('Enter');await page.waitForTimeout(850);await page.keyboard.press('Escape');await page.keyboard.up('Enter');expect(await writes()===2,'Escape submitted');
 await page.waitForTimeout(550);await hold.dispatchEvent('click',{detail:0});expect(await writes()===2,'Assistive activation bypassed confirmation');
 const dialog=bar.locator('dialog');expect(await dialog.evaluate(el=>el.open),'Assistive confirmation missing');
 const bounds=await dialog.boundingBox();expect(Math.abs(bounds.y+bounds.height-844)<2,'Confirmation not at bottom');
 expect(await dialog.getByRole('button',{name:'Отмена'}).boundingBox()!==null,'Cancel unavailable');
 await dialog.getByRole('button',{name:'Отмена'}).click();expect(await writes()===2,'Cancel submitted');
 await page.waitForTimeout(550);await hold.dispatchEvent('click',{detail:0});await dialog.getByRole('button',{name:'Открыть дверь',exact:true}).click();expect(await writes()===3,'Assistive confirmation not exactly once');
 await page.evaluate(()=>{window.bar.hass={states:{},callService:async(...args)=>{window.writes.push(args);await new Promise(resolve=>window.resolveWrite=resolve);}};});
 await down();await page.waitForTimeout(850);await page.mouse.up();expect(await writes()===4,'Pending command missing');expect(await hold.isDisabled(),'Pending action not disabled');
 await page.waitForTimeout(900);expect(await writes()===4,'Pending action retried');await page.evaluate(()=>window.resolveWrite());
 await page.evaluate(()=>{window.bar.hass={states:{},callService:async(...args)=>{window.writes.push(args);throw Error('mock unavailable');}};});
 await down();await page.waitForTimeout(850);await page.mouse.up();await bar.getByRole('alert').waitFor();await page.waitForTimeout(850);expect(await writes()===5,'Error retried');
 expect(await bar.getByRole('button',{name:'Повторить',exact:true}).count()===0,'Unsafe retry button');
 await down();await page.waitForTimeout(850);await page.evaluate(()=>window.bar.setConfig(window.config));await page.mouse.up();expect(await writes()===5,'Config change submitted');
 await down();await page.waitForTimeout(850);await page.evaluate(()=>window.bar.remove());await page.mouse.up();expect(await writes()===5,'Unmount submitted');
 for(const width of [320,390,700,1280]){
  await page.setViewportSize({width,height:844});await page.evaluate(()=>document.body.append(window.bar));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width);
 }
 expect(errors.length===0,JSON.stringify(errors));
 await fs.writeFile(root+'/hold-browser-report.json',JSON.stringify({passed:true,checks:count,errors,live_ha_connection:false},null,2));
 await page.screenshot({path:root+'/hold-public-mobile.png'});console.log('Hold/sheets: '+count+' checks passed');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
`;
const tmp=root+'/docs/tools/.hold-browser-run.mjs';try{await fs.writeFile(tmp,setup+checks);await import(new URL('file://'+tmp));}finally{await fs.unlink(tmp).catch(()=>{});}
