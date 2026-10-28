// Offline acceptance of the release bundle. No HA access or device commands.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=path.resolve(process.argv[2]||'.'),toolRoot=path.resolve(process.argv[3]||'/tools');
const {chromium}=createRequire(path.join(toolRoot,'loader.cjs'))('playwright-core');
const {generateThemeData}=await import(pathToFileURL(path.join(root,'scripts/theme.mjs')));
const presets=JSON.parse(await fs.readFile(path.join(root,'tokens/theme-presets.json'),'utf8'));
const preset=presets.find(p=>p.name==='Material 3 Expressive - Ice'),theme=(await generateThemeData(preset))[preset.name];
const manifest=JSON.parse(await fs.readFile(path.join(root,'dist/release-manifest.json'),'utf8'));
const routes=Object.fromEntries(manifest.files.map(f=>['/'+f.path,'dist/'+f.path]));
for(const f of ['unified.html','unified-demo.js','public-preview.js','quick-demo.js'])routes['/'+f]='dev/'+f;
const server=http.createServer(async(req,res)=>{const p=new URL(req.url,'http://local').pathname;try{
  if(p==='/theme.json'){res.setHeader('content-type','application/json');return res.end(JSON.stringify(theme));}
  if(p==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(!routes[p]){res.writeHead(404);return res.end();}
  res.setHeader('content-type',p.endsWith('.js')?'text/javascript':p.endsWith('.woff2')?'font/woff2':'text/html');res.end(await fs.readFile(path.join(root,routes[p])));
}catch{res.writeHead(500);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const report={version:manifest.version,synthetic:true,physical_actions:false,cases:[],errors:[],external_requests:[]};
let browser,page,current;const expect=(v,msg)=>{if(!v)throw Error(msg);current.assertions++;};
async function test(id,fn){current={id,assertions:0,passed:false};report.cases.push(current);await fn();current.passed=true;}
try{
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:900},locale:'ru-RU'});
  await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():(report.external_requests.push(r.request().url()),r.abort()));
  page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(base+'/unified.html');await page.waitForFunction(()=>window.unifiedFixture?.ready);
  await page.evaluate(async()=>{
    const f=window.unifiedFixture,stamp=new Date(Date.now()-1000).toISOString(),state=(v,a={})=>({state:String(v),attributes:a,last_updated:stamp,last_changed:stamp});
    f.states['sensor.room']=state(20,{unit_of_measurement:'°C'});f.states['sensor.source']=state(20);
    f.states['input_text.primary']=state('sensor.source');f.states['input_number.ttl']=state(3600);f.states['input_datetime.epoch']=state('valid',{timestamp:Date.now()/1000-100});
    f.states['input_text.revision']=state('prior');f.states['input_text.completed']=state('prior');f.states['input_select.ac_mode']=state('heat');f.states['input_boolean.writing']=state('off');f.states['input_boolean.pending']=state('off');
    f.states['climate.ac']=state('heat',{temperature:22,min_temp:16,max_temp:32,target_temp_step:1,fan_mode:'low',fan_modes:['auto','low','medium','high'],hvac_action:'heating'});
    const configs=f.group._config.cards.map(c=>({...c,appearance:{scheme:'auto',motion:'expressive'}}));
    const c=configs.find(c=>c.entity==='climate.ac'),item=c.quick_controls[0];item.bounds={min:'min_temp',max:'max_temp',step:'target_temp_step'};
    item.mode_scale={kind:'ac-temperature',gateway:{action:'perform-action',perform_action:'script.scale_gateway',data:{device:'ac',parameter:'temperature'},value_field:'choice'},revision_entity:'input_text.revision',completed_entity:'input_text.completed',room_entity:'sensor.room',room_freshness:{source_entity:'input_text.primary',ttl_entity:'input_number.ttl',epoch_entity:'input_datetime.epoch',expected_source:'sensor.source'},confirmation:{mode_entity:'input_select.ac_mode',writing_entity:'input_boolean.writing',pending_entity:'input_boolean.pending'}};
    f.group.setConfig({...f.group._config,cards:configs});
    const journal={type:'custom:ha-m3-journal-card',entity:'sensor.journal',title:'История автоматики'};f.states['sensor.journal']=state('ok',{entries:[]});
    const metrics=[['temperature','sensor.room','Температура','°C'],['humidity','sensor.humidity','Влажность','%'],['co2','sensor.co2','CO₂','ppm'],['pm25','sensor.pm','PM2.5','мкг/м³']].map(([id,entity,name,unit])=>({id,entity,name,unit}));
    const goals=[['fresh','Свежесть воздуха'],['clean','Очистка воздуха'],['noise','Допустимый шум']].map(([id,name])=>{const entity='input_number.'+id;f.states[entity]=state(50,{min:0,max:100,step:1});return {id,name,entity,semantics:'preference',set_action:{action:'perform-action',perform_action:'script.preference',value_field:'value'},value_labels:[{value:0,label:'Минимум'},{value:50,label:'Умеренно'},{value:100,label:'Максимум'}]};});
    f.summary.setConfig({...f.summary._config,layout:'calm',presentation:'unified',title:'Климат',room_name:'Кабинет',journal,room_metrics:metrics,air_goals:goals,history:{hours:24,presentation:'button'},appearance:{scheme:'auto',motion:'expressive'}});
    f.summary.id='motion-climate';document.querySelector('header').remove();document.querySelector('.secondary').remove();document.querySelector('#journal').remove();f.bar.remove();
    const old=f.hass.callService;f.hass.callService=async(domain,service,data,target)=>{if(service==='scale_gateway'){f.writes.push({domain,service,data,target});return;}return old(domain,service,data,target);};
    f.update();await f.group.updateComplete;const ac=[...f.group.renderRoot.querySelectorAll('ha-m3-quick-device-card')].find(e=>e._config.entity==='climate.ac');ac.id='motion-ac';await ac.updateComplete;
    window.motionFixture={f,ac,configs,theme:async scheme=>{const data=await(await fetch('/theme.json')).json();for(const [key,value]of Object.entries({...data,...data.modes[scheme]}))if(typeof value==='string')document.documentElement.style.setProperty('--'+key,value);f.summary.hass={...f.hass,themes:{darkMode:scheme==='dark'}};f.group.hass={...f.hass,themes:{darkMode:scheme==='dark'}};}};
    await document.fonts.ready;
  });
  const climate=page.locator('#motion-climate'),ac=page.locator('#motion-ac'),slider=ac.locator('[data-control-id=temperature] ha-m3-slider'),input=slider.locator('input');
  const writes=()=>page.evaluate(()=>window.unifiedFixture.writes.length);
  await test('responsive-unified-panel-and-drawer',async()=>{
    for(const scheme of ['dark','light'])for(const width of [320,390,768,1440]){
      await page.evaluate(s=>window.motionFixture.theme(s),scheme);await page.setViewportSize({width,height:1000});
      expect(await climate.locator('.room-metric').count()===4,'Four inline metrics');
      expect(await climate.locator('.calm-intent-modes').count()===0,'Ventilation modes must be in details');
      expect(await climate.locator('.room-metric ha-m3-history').count()===0,'No embedded history panels');
      const sizes=await climate.evaluate(el=>({w:el.clientWidth,s:el.scrollWidth,body:document.documentElement.scrollWidth,view:innerWidth,rows:[...el.renderRoot.querySelectorAll('.calm-body>div')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width};})}));
      expect(sizes.s<=sizes.w+1&&sizes.body<=sizes.view+1,'Overflow '+scheme+' '+width);
      expect(width<650?sizes.rows.every(r=>Math.abs(r.x-sizes.rows[0].x)<1):sizes.rows.some(r=>r.x>sizes.rows[0].x+30),'Responsive goal columns '+width);
    }
    await page.setViewportSize({width:390,height:900});await page.evaluate(()=>window.motionFixture.theme('dark'));
    const journal=climate.locator('ha-m3-journal-card'),button=journal.locator('.journal-launcher'),before=await writes();
    expect((await button.boundingBox()).width===48,'Round accessible history button');await button.click();expect(await journal.locator('dialog').evaluate(e=>e.open),'Drawer opens');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#motion-climate').renderRoot.querySelector('ha-m3-journal-card').renderRoot.querySelector('dialog').open);
    expect(await button.evaluate(e=>e.getRootNode().activeElement===e),'Drawer restores focus');expect(await writes()===before,'History is read-only');
  });
  await test('drag-preview-stable-bounded-icons-and-cancel',async()=>{
    await input.scrollIntoViewIfNeeded();const b=await input.boundingBox(),before=await writes();await page.mouse.move(b.x+b.width*.24,b.y+b.height/2);await page.mouse.down();
    const positions=[[.17,'cool'],[.28,'fan'],[.58,'heat'],[.17,'cool'],[.28,'fan'],[.58,'heat']];
    for(const [p,mode]of positions){await page.mouse.move(b.x+b.width*p,b.y+b.height/2,{steps:2});await page.waitForFunction(m=>window.motionFixture.ac.renderRoot.querySelector('section').dataset.operation===m,mode);
      expect(await writes()===before,'No gateway before release');expect(await ac.locator('.device-state ha-m3-state-icon .glyph').count()<=2,'Bounded icon layers');
    }
    const stable=await ac.locator('.device-state ha-m3-state-icon').evaluate(e=>{window.motionIcon=e;return e.name;});await page.mouse.move(b.x+b.width*.65,b.y+b.height/2);expect(await ac.locator('.device-state ha-m3-state-icon').evaluate(e=>e===window.motionIcon),'Stable host within mode');expect(stable==='thermostat','Warm preview icon');
    await page.keyboard.press('Escape');await page.mouse.up();expect(await writes()===before,'Cancelled gesture never commits');await page.waitForTimeout(300);
    expect(await ac.locator('[data-control-id=temperature]').getAttribute('data-preview')==='false','Cancel restores reported state');expect(await ac.locator('.device-state ha-m3-state-icon .old').count()===0,'Completed transitions cleaned up');
  });
  await test('release-once-pending-not-confirmed-and-auto-effective-position',async()=>{
    const before=await writes(),b=await input.boundingBox();await page.mouse.move(b.x+b.width*.15,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*.2,b.y+b.height/2,{steps:3});expect(await writes()===before,'Still no writes');await page.mouse.up();await page.waitForFunction(n=>window.unifiedFixture.writes.length===n+1,before);
    expect(await writes()===before+1,'Exactly one commit');expect(await ac.locator('[data-control-id=temperature]').getAttribute('data-preview')==='true','Service acknowledgement is not confirmed state');
    await page.evaluate(()=>{const {ac,f}=window.motionFixture;const request=f.writes.at(-1).data;f.states['input_text.revision'].state=request.request_id;f.states['input_text.completed'].state=request.request_id;f.states['input_boolean.lock_ac_power'].state='on';f.states['input_boolean.lock_ac_temperature'].state='on';f.states['input_number.manual_ac'].state=String(request.choice);f.states['input_select.ac_mode'].state='cool';f.states['climate.ac'].state='cool';f.states['climate.ac'].attributes.temperature=Number(request.choice);f.update();});
    await page.waitForFunction(()=>!window.motionFixture.ac._scaleRequests.temperature);
    await page.evaluate(()=>{const {f}=window.motionFixture;f.states['input_boolean.lock_ac_temperature'].state='off';f.states['input_boolean.lock_ac_power'].state='off';f.states['climate.ac'].attributes.temperature=23;f.update();});await page.waitForTimeout(350);
    expect((await ac.locator('[data-control-id=temperature] output').innerText()).includes('23'),'Auto shows actual target');expect(await slider.evaluate(e=>e.value<e.max),'Auto does not leave thumb on terminal endpoint');
  });
  await test('live-change-color-icon-and-reduced-motion',async()=>{
    await page.evaluate(()=>{const {f}=window.motionFixture;f.states['climate.ac'].state='heat';f.states['climate.ac'].attributes.hvac_action='heating';f.update();});
    await page.waitForFunction(()=>window.motionFixture.ac.renderRoot.querySelector('.device-state ha-m3-state-icon').name==='thermostat');
    expect(await ac.locator('.device-state ha-m3-state-icon').evaluate(e=>getComputedStyle(e).color===getComputedStyle(e.renderRoot.querySelector('.live')).color),'Icon inherits semantic color');
    await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{const {f}=window.motionFixture;f.states['climate.ac'].state='cool';f.update();});await page.waitForTimeout(30);
    expect(await ac.locator('.device-state ha-m3-state-icon').evaluate(e=>e.renderRoot.querySelectorAll('.old').length===0&&e._animations.length===0),'Reduced motion skips transition');
    await page.emulateMedia({reducedMotion:'no-preference'});
  });
  await test('disconnect-cleans-motion-and-reconnect-remains-functional',async()=>{
    expect(await ac.evaluate(async e=>{const parent=e.parentNode,next=e.nextSibling;e.remove();const stopped=e.stateMotion.animations.size===0;parent.insertBefore(e,next);await e.updateComplete;return stopped;}),'Detached card releases value animation');
    await page.evaluate(()=>{window.motionFixture.f.states['climate.ac'].state='heat';window.motionFixture.f.update();});await page.waitForTimeout(300);expect(await ac.locator('.device-state ha-m3-state-icon .old').count()===0,'Reconnected transition finishes');
  });
  await fs.mkdir(path.join(root,'state-motion-browser-artifacts'),{recursive:true});
  for(const width of [390,1440]){await page.setViewportSize({width,height:1100});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(root,'state-motion-browser-artifacts',width+'.png'),fullPage:true});}
  if(report.errors.length||report.external_requests.length)throw Error('Page error or external request: '+JSON.stringify(report.errors));
  report.passed=true;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;}
finally{await fs.writeFile(path.join(root,'state-motion-browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser?.close();await new Promise(r=>server.close(r));}
