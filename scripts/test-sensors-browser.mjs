// Synthetic read-only fixture. Never connects to a real HA instance.
import fs from 'node:fs/promises';
const root=process.argv[2]||process.cwd(),renderer=await fs.readFile(root+'/docs/tools/render-public-media.mjs','utf8'),setup=renderer.slice(0,renderer.indexOf('const report='));
const checks=String.raw`
let browser;const errors=[];let count=0;
const expect=(ok,message)=>{count++;if(!ok)throw Error(message);};
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:1000},locale:'ru-RU',reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/public-preview.html');await page.waitForFunction(()=>!!window.publicPreview);
 await page.evaluate(()=>{
   const c=document.createElement('ha-m3-sensor-card');window.sensorFixture={c,events:[],writes:[]};
   c.setConfig({title:'Sensors',groups:[{name:'Room',tiles:[{name:'Air',entity:'sensor.temp',battery:'sensor.battery',metrics:[{entity:'sensor.temp',decimals:1},{entity:'sensor.humidity',decimals:0}]},{name:'Offline',entity:'sensor.offline'}]},{name:'Kitchen',tiles:[{name:'Leak',entity:'binary_sensor.leak',kind:'moisture',battery:'sensor.low_battery'}]}]});
   const state=(state,attributes={})=>({state,attributes,last_reported:'2026-01-01T12:00:00Z'});
   c.hass={language:'ru',locale:{language:'ru',number_format:'comma_decimal'},states:{'sensor.temp':state('0',{unit_of_measurement:'°C'}),'sensor.humidity':state('50',{unit_of_measurement:'%'}),'sensor.battery':state('100'),'sensor.low_battery':state('10'),'sensor.offline':state('unavailable'),'binary_sensor.leak':state('on',{device_class:'moisture'})},callService:async(...args)=>window.sensorFixture.writes.push(args)};
   c.addEventListener('hass-more-info',e=>window.sensorFixture.events.push(e.detail.entityId));
   document.body.replaceChildren(c);document.body.style.margin='8px';document.body.style.background='#101317';
 });
 const card=page.locator('ha-m3-sensor-card');await card.locator('.tile').first().waitFor();
 expect(await card.locator('.group').count()===2,'Room groups lost');
 expect(await card.locator('.tile').count()===3,'Missing tile');
 expect((await card.locator('.value').first().innerText()).includes('0,0 °C'),'Zero value lost or locale incorrect');
 expect(await card.locator('[data-state=alarm]').count()===1,'Leak not prominent');
 expect((await card.locator('[data-state=alarm]').innerText()).includes('Протечка'),'Leak state missing');
 expect(/недоступ/i.test(await card.locator('[data-state=unavailable]').innerText()),'Offline state missing');
 await card.locator('.main').first().click();expect(await page.evaluate(()=>window.sensorFixture.events[0])==='sensor.temp','Tile did not open native more-info');
 await card.locator('.foot button').first().click();expect(await page.evaluate(()=>window.sensorFixture.events[1])==='sensor.battery','Battery did not open native more-info');
 await card.locator('summary').first().click();expect((await card.locator('.reports').first().innerText()).includes('2026'),'Report timestamp missing');
 await card.locator('.report button').nth(1).click();expect(await page.evaluate(()=>window.sensorFixture.events[2])==='sensor.humidity','Metric detail lost');
 await page.evaluate(()=>{const c=window.sensorFixture.c;c.hass={...c.hass,states:{...c.hass.states,'binary_sensor.leak':{state:'unknown',attributes:{device_class:'moisture'}}}};});
 expect(await card.locator('[data-state=alarm]').count()===0,'Stale alarm after update');
 expect((await card.locator('.tile').last().innerText()).includes('Нет данных'),'Unknown rendered as dry');
 expect(await card.locator('details').first().getAttribute('open')!==null,'Live updates collapsed details');
 for(const width of [390,320]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow at '+width);}
 expect(await page.evaluate(()=>window.sensorFixture.writes.length)===0,'Read-only sensor interaction wrote state');
 expect(errors.length===0,JSON.stringify(errors));
 await fs.writeFile(root+'/sensors-browser-report.json',JSON.stringify({passed:true,checks:count,errors,live_ha_connection:false},null,2));console.log('Sensor mini-tiles browser: '+count+' checks passed');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
`;
const tmp=root+'/docs/tools/.sensors-browser-run.mjs';try{await fs.writeFile(tmp,setup+checks);await import(new URL('file://'+tmp));}finally{await fs.unlink(tmp).catch(()=>{});}
