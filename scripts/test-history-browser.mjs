// Isolated synthetic fixture only; never connects to a real HA instance.
import fs from 'node:fs/promises';
const root=process.argv[2]||process.cwd(),renderer=await fs.readFile(root+'/docs/tools/render-public-media.mjs','utf8'),setup=renderer.slice(0,renderer.indexOf('const report='));
const checks=String.raw`
let browser;const errors=[];let count=0;
const expect=(ok,message)=>{count++;if(!ok)throw Error(message);};
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:1100},locale:'ru-RU',reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/public-preview.html');await page.waitForFunction(()=>!!window.publicPreview);
 await page.evaluate(()=>{
   const p=window.publicPreview,c=p.summary,config=structuredClone(c._config);config.history=true;
   const q=config.air_goals.find(x=>x.id==='quiet');q.id='noise';q.name='Шум';q.invert=true;q.neutral_value=50;q.value_labels=[{value:0,label:'Очень тихо'},{value:50,label:'Умеренно'},{value:100,label:'Шум допустим'}];
   config.context_sensors.find(x=>x.name==='PM2.5').details=[{name:'PM1',entity:'sensor.pm1',unit:'μg/m³'}];config.context_sensors.find(x=>x.name==='PM2.5').details_title='Качество воздуха';
   p.states['sensor.pm1']={state:'12',attributes:{unit_of_measurement:'μg/m³'}};p.states['sensor.pm'].attributes.unit_of_measurement='μg/m³';
   window.observation={requests:[],writes:[],c};
   c.setConfig(config);c.hass={...c.hass,connection:{},callApi:async(method,path)=>{
     window.observation.requests.push(path);const params=new URLSearchParams(path.split('?')[1]),end=Date.parse(params.get('end_time')),ids=params.get('filter_entity_id').split(',');
     return ids.map(entity=>[0,1,2,3,4,5,6].map(i=>({entity_id:entity,last_updated:new Date(end-(6-i)*3600000).toISOString(),state:i===3?'unavailable':String([2,2,4,4,7,4,3][i]),attributes:{}})));
   },callService:async(domain,service,data)=>{window.observation.writes.push({domain,service,data});if(data.axis==='quiet')p.states['input_number.preference_quiet'].state=String(data.value);c.hass={...c.hass};}};
 });
 const card=page.locator('ha-m3-climate-card');await page.waitForFunction(()=>[...window.observation.c.renderRoot.querySelectorAll('ha-m3-history')].every(el=>el._series.length));
 expect(await card.locator('ha-m3-history').count()===6,'Missing metric/preference histories');
 expect(await page.evaluate(()=>window.observation.requests.length===1),'Initial reads were not batched');
 expect(await page.evaluate(()=>!window.observation.requests.some(x=>x.includes('sensor.pm1'))),'PM1 loaded before expanding');
 expect(await page.evaluate(()=>[...window.observation.c.renderRoot.querySelectorAll('ha-m3-history')].every(el=>[...el.renderRoot.querySelectorAll('.trace')].every(p=>p.getAttribute('d').includes('C')&&!/[HV]/.test(p.getAttribute('d'))))),'A setting or metric remains stepped');
 const noise=card.locator('[data-air-goal=noise] ha-m3-slider');expect(await noise.evaluate(el=>el.value)===75,'Noise did not invert saved quietness');
 await noise.evaluate(el=>el.dispatchEvent(new CustomEvent('m3-change',{detail:{value:20},bubbles:true,composed:true})));
 await page.waitForFunction(()=>window.observation.writes.length===1);
 expect(await page.evaluate(()=>window.observation.writes[0].data.value===80),'Noise write did not invert backend value');
 expect(await page.evaluate(()=>window.observation.writes[0].data.axis==='quiet'),'Backend gateway changed');
 await page.evaluate(()=>{const el=[...window.observation.c.renderRoot.querySelectorAll('ha-m3-history')].find(el=>el.sources[0].entity==='sensor.pm');el.id='pm-history';});
 const pm=card.locator('#pm-history');await pm.getByRole('button',{name:'Развернуть историю: Качество воздуха'}).click();
 await page.waitForFunction(()=>window.observation.c.renderRoot.querySelector('#pm-history')._series.length===2);
 expect((await pm.locator('.legend').innerText()).includes('PM1'),'PM1 legend missing');
 expect(await pm.locator('.large .trace').count()===2,'Both particulate fractions not drawn');
 expect(await page.evaluate(()=>window.observation.requests.length===2),'Expanding PM1 bypassed history cache');
 const box=await pm.locator('.large .hit').boundingBox();await page.mouse.move(box.x+box.width*.8,box.y+box.height*.5);
 await pm.locator('.tip').waitFor();expect((await pm.locator('.tip').innerText()).includes('PM1'),'Cross-series tooltip missing PM1');
 expect(await page.evaluate(()=>window.observation.requests.length===2),'Hover queried recorder');
 await pm.getByRole('button',{name:'6 ч',exact:true}).click();await page.waitForFunction(()=>window.observation.requests.length===3);
 expect(await pm.getByRole('button',{name:'6 ч',exact:true}).getAttribute('aria-pressed')==='true','Period selection lost');
 await page.setViewportSize({width:320,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
 const sheet=await pm.locator('.detail').boundingBox();expect(Math.abs(sheet.y+sheet.height-1000)<2,'History is not at bottom on mobile');
 expect(sheet.height<=850+2,'History exceeds mobile sheet height');
 await pm.getByRole('button',{name:'Закрыть',exact:true}).click();
 expect(await page.evaluate(()=>window.observation.writes.length===1),'History interactions wrote device settings');
 await page.evaluate(async()=>{const el=window.observation.c.renderRoot.querySelector('#pm-history');el.hass={...el.hass,connection:{},callApi:async()=>{throw Error('unavailable');}};await el.load();});
 expect((await pm.locator('.empty').first().innerText()).includes('недоступна'),'Recorder error not visible');
 expect(errors.length===0,JSON.stringify(errors));
 await fs.writeFile(root+'/history-browser-report.json',JSON.stringify({passed:true,checks:count,errors,live_ha_connection:false},null,2));console.log('History/noise browser: '+count+' checks passed');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
`;
const tmp=root+'/docs/tools/.history-browser-run.mjs';try{await fs.writeFile(tmp,setup+checks);await import(new URL('file://'+tmp));}finally{await fs.unlink(tmp).catch(()=>{});}
