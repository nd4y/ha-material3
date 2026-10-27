// Shipped-component acceptance only. Synthetic readings, local routes and mocked services.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const root=path.resolve(process.argv[2]||'.'),toolRoot=path.resolve(process.argv[3]||'/work/tools');
const require=createRequire(path.join(toolRoot,'loader.cjs')),{chromium}=require('playwright-core');
const {generateThemeData}=await import(pathToFileURL(path.join(root,'scripts/theme.mjs')));
const presets=JSON.parse(await fs.readFile(path.join(root,'tokens/theme-presets.json'),'utf8'));
const preset=presets.find(item=>item.name==='Material 3 Expressive - Ice');
if(!preset)throw Error('Existing Ice theme preset required');
const theme=(await generateThemeData(preset))[preset.name],manifest=JSON.parse(await fs.readFile(path.join(root,'dist/release-manifest.json'),'utf8'));
const files=Object.fromEntries(manifest.files.map(item=>['/'+item.path,'dist/'+item.path]));
Object.assign(files,{'/unified.html':'dev/unified.html','/unified-demo.js':'dev/unified-demo.js','/public-preview.js':'dev/public-preview.js','/quick-demo.js':'dev/quick-demo.js'});
const server=http.createServer(async(req,res)=>{try{const route=new URL(req.url,'http://localhost').pathname;if(route==='/theme.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(theme));return;}if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}if(!files[route]){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',route.endsWith('.js')?'text/javascript':route.endsWith('.woff2')?'font/woff2':'text/html');res.end(await fs.readFile(path.join(root,files[route])));}catch{res.writeHead(500);res.end('Synthetic fixture failure');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
const report={version:manifest.version,selected_theme:preset.name,synthetic_data_only:true,live_ha_connection:false,physical_actions:false,cases:[],errors:[],external_requests:[],screenshots:[]};
let browser,page,current;
const expect=(value,message)=>{if(!value)throw Error(message);current.assertions++;};
async function scenario(id,run){current={id,assertions:0,passed:false};report.cases.push(current);await run();current.passed=true;}
try{
  browser=await chromium.launch({headless:true,channel:process.env.M3_BROWSER_CHANNEL||undefined,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,locale:'ru-RU',reducedMotion:'reduce'});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin===base)return route.continue();report.external_requests.push(route.request().url());return route.abort();});
  page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  await page.goto(base+'/unified.html');await page.waitForFunction(()=>window.unifiedFixture?.ready);
  await page.evaluate(async()=>{
    const fixture=window.unifiedFixture,copy=value=>JSON.parse(JSON.stringify(value)),summary=fixture.summary;
    const now=()=>new Date().toISOString(),state=(value,attributes={})=>({state:String(value),attributes,last_updated:now(),last_reported:now(),last_changed:now()});
    fixture.states['sensor.humidity']=state(40,{unit_of_measurement:'%'});fixture.states['sensor.pm']=state(8,{unit_of_measurement:'µg/m³'});fixture.states['sensor.co2']=state(812,{unit_of_measurement:'ppm'});fixture.states['sensor.room']=state(23.6,{unit_of_measurement:'°C'});fixture.states['input_number.goal']=state(24.5,{min:16,max:30,step:.5,unit_of_measurement:'°C'});
    const metric=(id,entity,name,unit,color)=>({id,entity,name,unit,freshness:{max_age:120,timestamp:'last_updated'},color});
    const metrics=[metric('temperature','sensor.room','Температура','°C',{target_entity:'input_number.goal',tolerance:1,below_tone:'cool',within_tone:'good',above_tone:'warm'}),metric('humidity','sensor.humidity','Влажность','%',{ranges:[{max:30,tone:'high'},{min:30,max:35,tone:'notice'},{min:35,max:60,max_inclusive:true,tone:'good'},{min:60,min_inclusive:false,max:70,max_inclusive:true,tone:'notice'},{min:70,min_inclusive:false,tone:'high'}]}),metric('co2','sensor.co2','CO₂','ppm',{ranges:[{max:800,tone:'good'},{min:800,max:1200,tone:'notice'},{min:1200,tone:'high'}]}),metric('pm25','sensor.pm','PM2.5','µg/m³',{ranges:[{max:15,max_inclusive:true,tone:'good'},{min:15,min_inclusive:false,max:35,max_inclusive:true,tone:'notice'},{min:35,min_inclusive:false,tone:'high'}]})];
    const config={...copy(summary._config),room_metrics:metrics,appearance:{scheme:'auto',motion:'reduced'}};
    summary.id='polish-climate';summary.setConfig(config);
    const home=document.createElement('ha-m3-climate-card');home.id='polish-home';home.setConfig({...config,layout:'summary',title:'Кабинет',air_goals:[],presets:[],context_sensors:[]});document.getElementById('summary').prepend(home);
    const journal=document.querySelector('ha-m3-journal-card');journal.setConfig({...journal._config,presentation:'drawer',appearance:{scheme:'auto',motion:'reduced'}});
    const originalUpdate=fixture.update,originalService=fixture.hass.callService.bind(fixture.hass);
    const update=()=>{originalUpdate();home.hass={...fixture.hass,themes:{darkMode:true}};};
    fixture.hass.callService=async(...args)=>{await originalService(...args);update();};
    const set=(entity,value,stamp)=>{fixture.states[entity]={...state(value,fixture.states[entity]?.attributes),...(stamp?{last_updated:stamp}:{})};update();};
    const view=document.createElement('hui-view');view.id='polish-native-view';view.style.display='block';const main=document.querySelector('main');main.replaceWith(view);view.append(main,fixture.bar);
    const blank=document.createElement('div');blank.id='polish-swipe-area';blank.style.cssText='height:130px;margin:12px;background:var(--card-background-color);touch-action:pan-y';view.prepend(blank);
    const paths=['/demo/home','/demo/climate','/demo/plan'];home.setConfig({...home._config,swipe_navigation:{paths}});history.replaceState(null,'',paths[0]);
    const routes=[];window.addEventListener('location-changed',()=>routes.push(location.pathname));
    window.polishFixture={fixture,home,summary,journal,view,blank,paths,routes,set,update,metrics};update();await Promise.all([home.updateComplete,summary.updateComplete,journal.updateComplete]);await document.fonts.ready;
  });
  const home=page.locator('#polish-home'),climate=page.locator('#polish-climate'),journal=page.locator('ha-m3-journal-card');
  const writes=()=>page.evaluate(()=>window.unifiedFixture.writes.length);
  const set=(entity,value,stamp)=>page.evaluate(({entity,value,stamp})=>window.polishFixture.set(entity,value,stamp),{entity,value,stamp});
  async function tone(card,id,expected){await page.waitForFunction(({card,id,expected})=>document.getElementById(card)?.renderRoot.querySelector('[data-metric="'+id+'"]')?.dataset.level===expected,{card:await card.getAttribute('id'),id,expected});expect(await card.locator('[data-metric="'+id+'"]').getAttribute('data-level')===expected,'Metric tone '+id+' expected '+expected);}
  await scenario('summary-and-climate-four-metrics-and-local-cta',async()=>{
    for(const card of [home,climate]){expect(await card.locator('.room-metric').count()===4,'Exactly four configured room metrics required');expect(await card.locator('.trust-automation').count()===1,'One local automation CTA required');}
    expect(await page.locator('ha-m3-quick-device-card .trust-automation,ha-m3-camera-card .trust-automation,ha-m3-action-bar .trust-automation').count()===0,'Climate CTA leaked into unrelated components');
    await page.evaluate(()=>{window.unifiedFixture.states['input_boolean.master'].state='off';window.unifiedFixture.states['input_boolean.lock_ac_power'].state='on';window.polishFixture.update();});
    const before=await writes();await home.locator('.trust-automation').getByRole('button').click();await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.master'].state==='on');expect(await writes()===before+1,'Local CTA must call configured gateway exactly once');
    expect(await page.evaluate(()=>Object.entries(window.unifiedFixture.states).filter(([entity])=>entity.startsWith('input_boolean.lock_')).every(([,state])=>state.state==='off')),'CTA did not release configured manual permissions');
    for(const card of [home,climate])expect(await card.locator('.trust-automation').isVisible(),'CTA disappears when all permissions are automatic');
  });
  await scenario('climate-and-device-controls-share-segmented-visual-language',async()=>{
    const before=await writes();
    const sliders=climate.locator('.room-target ha-m3-slider, .air-goal ha-m3-slider');
    expect(await sliders.count()>=4,'Missing room preference controls');
    for(let i=0;i<await sliders.count();i++){
      const slider=sliders.nth(i);const detail=await slider.evaluate(el=>({segmented:el.segmented,terminalAccent:el.terminalAccent,count:el.renderRoot.querySelectorAll('.segment').length,role:el.renderRoot.querySelector('input')?.type}));
      expect(detail.segmented&&detail.count>=2&&detail.count<=15,'Room control must use usable bounded segments');
      expect(detail.terminalAccent===false,'Room control must not suggest an Auto endpoint');expect(detail.role==='range','Accessible range input missing');
    }
    for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});const box=await climate.boundingBox();const dimensions=await climate.evaluate(e=>({scroll:e.scrollWidth,client:e.clientWidth}));expect(box.width<=width&&dimensions.scroll<=dimensions.client+1,'Climate card overflows '+width);}
    expect(await writes()===before,'Inspecting segmented controls must not emit commands');
    await page.setViewportSize({width:390,height:900});const control=climate.locator('.air-goal ha-m3-slider').first().locator('input[type=range]');await control.scrollIntoViewIfNeeded();const b=await control.boundingBox();
    await page.mouse.move(b.x+b.width*.15,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*.8,b.y+b.height/2,{steps:4});expect(await writes()===before,'Dragging room preference sent a command before release');await page.mouse.up();await page.waitForFunction(n=>window.unifiedFixture.writes.length===n+1,before);expect(await writes()===before+1,'Release must send exactly one room preference command');
  });
  await scenario('climate-header-keeps-runtime-warning-visible',async()=>{
    const before=await writes();
    await page.evaluate(async()=>{const f=window.polishFixture; f.fixture.states['input_boolean.runtime_ready']={state:'off',attributes:{}}; const config=f.summary._config; f.summary.setConfig({...config,automation_reset:{...config.automation_reset,runtime_ready_entity:'input_boolean.runtime_ready'}});f.update();await f.summary.updateComplete;});
    for(const width of [320,390,1024]){await page.setViewportSize({width,height:900});const warning=climate.locator('.room-trust[data-not-ready] .trust-scope');expect(await warning.isVisible(),'Runtime warning hidden '+width);expect((await warning.innerText()).includes('недоступно'),'Runtime warning missing '+width);expect(await climate.locator('.trust-automation').getByRole('button').isDisabled(),'Unavailable automation action enabled '+width);}
    expect(await writes()===before,'Rendering a warning must not emit actions');
    await page.evaluate(async()=>{const f=window.polishFixture;f.fixture.states['input_boolean.runtime_ready'].state='on';f.update();await f.summary.updateComplete;});
  });
  await scenario('round-trust-button-confirmed-colors-and-unknown-state',async()=>{
    const before=await writes(),colors=[];
    for(const [value,expected] of [['off','all'],['on','partial'],['unavailable','unknown']]){
      await set('input_boolean.lock_ac_power',value);
      for(const card of [home,climate]){
        const button=card.locator('.trust-automation');
        await page.waitForFunction(({id,expected})=>document.getElementById(id).renderRoot.querySelector('.trust-automation').dataset.trust===expected,{id:await card.getAttribute('id'),expected});
        const box=await button.getByRole('button').boundingBox();expect(box.width===48&&box.height===48,'Trust button must be a 48px circle');
        expect((await button.getByRole('button').getAttribute('aria-label')).includes('автомат'),'Missing accessible action/status');
        const visual=await button.evaluate(el=>{const shape=el.shadowRoot.querySelector('.shape'),s=getComputedStyle(shape);return {radius:s.borderTopLeftRadius,color:s.backgroundColor};});
        expect(visual.radius==='24px','Trust shape must be circular');if(card===home)colors.push(visual.color);
      }
    }
    expect(new Set(colors).size===3,'All, partial and unknown colors must differ');
    expect(await writes()===before,'Observing trust state must not send actions');await set('input_boolean.lock_ac_power','off');
  });
  await scenario('metric-boundaries-target-relative-and-zero',async()=>{
    for(const [value,expected]of [[23.49,'cool'],[23.5,'good'],[25.5,'good'],[25.51,'warm']]){await set('sensor.room',value);await tone(home,'temperature',expected);await tone(climate,'temperature',expected);}
    for(const [entity,id,values]of [['sensor.humidity','humidity',[[29,'high'],[30,'notice'],[35,'good'],[60,'good'],[61,'notice'],[71,'high']]],['sensor.co2','co2',[[799,'good'],[800,'notice'],[1200,'high']]],['sensor.pm','pm25',[[0,'good'],[15,'good'],[15.01,'notice'],[35,'notice'],[35.01,'high']]]])for(const [value,expected]of values){await set(entity,value);await tone(home,id,expected);await tone(climate,id,expected);if(value===0)expect((await home.locator('[data-metric="'+id+'"] .room-metric-value').innerText()).includes('0'),'Zero reading disappeared');}
  });
  await scenario('all-metrics-missing-stale-future-neutral',async()=>{
    for(const [id,entity,value]of [['temperature','sensor.room',24.5],['humidity','sensor.humidity',40],['co2','sensor.co2',500],['pm25','sensor.pm',8]]){
      for(const missing of ['unknown','unavailable']){await set(entity,missing);for(const card of [home,climate]){await tone(card,id,'unknown');expect(await card.locator('[data-metric="'+id+'"]').getAttribute('data-quality')==='unknown','Missing quality is not explicit');}}
      for(const [stamp,quality]of [[new Date(Date.now()-180000).toISOString(),'stale'],[new Date(Date.now()+60000).toISOString(),'unknown']]){await set(entity,value,stamp);for(const card of [home,climate]){await tone(card,id,'unknown');expect(await card.locator('[data-metric="'+id+'"]').getAttribute('data-quality')===quality,'Old/future reading was qualified fresh');}}
      await set(entity,value);
    }
    expect((await home.locator('[data-metric=pm25]').innerText()).includes('PM2.5'),'Particulate reading presented as an unspecified general AQI');
  });
  await scenario('explicit-metric-clock-tolerance-with-frontend-timestamps',async()=>{
    await home.evaluate(async element=>{element.setConfig({...element._config,room_metrics:element._config.room_metrics.map(item=>item.id==='co2'?{...item,freshness:{...item.freshness,clock_tolerance:60}}:item)});await element.updateComplete;});
    const skew=seconds=>page.evaluate(seconds=>{const source=window.unifiedFixture.states['sensor.co2'];source.state='812';source.last_updated=new Date(Date.now()+seconds*1000).toISOString();delete source.last_reported;window.polishFixture.update();},seconds);
    await skew(28);await tone(home,'co2','notice');await tone(climate,'co2','unknown');
    expect(await home.locator('[data-metric=co2]').getAttribute('data-quality')==='fresh','Configured 60-second tolerance rejected a 28-second host clock lead');expect(await climate.locator('[data-metric=co2]').getAttribute('data-quality')==='unknown','Metric without explicit tolerance accepted a future timestamp');expect(await page.evaluate(()=>!('last_reported' in window.unifiedFixture.states['sensor.co2'])),'Clock-skew fixture accidentally supplied a frontend last_reported timestamp');
    await skew(90);for(const card of [home,climate]){await tone(card,'co2','unknown');expect(await card.locator('[data-metric=co2]').getAttribute('data-quality')==='unknown','Clock lead beyond configured tolerance was fresh');}
    await home.evaluate(async element=>{element.setConfig({...element._config,room_metrics:window.polishFixture.metrics});await element.updateComplete;});await set('sensor.co2',500);for(const card of [home,climate])await tone(card,'co2','good');
  });
  await scenario('mobile-native-swipe-anchor-is-visible-summary',async()=>{
    expect(await home.evaluate(element=>element._config.layout==='summary'&&element._config.swipe_navigation.paths.join('|')===window.polishFixture.paths.join('|')),'Native swipe binding is not on the home summary');
    expect(await page.evaluate(()=>!window.polishFixture.summary._config.swipe_navigation&&!window.polishFixture.fixture.bar._config.swipe_navigation),'Swipe binding duplicated on a different or conditional host');
    for(const width of [320,390]){await page.setViewportSize({width,height:900});const bounds=await home.boundingBox();expect(await home.isVisible()&&bounds?.width>0&&bounds?.height>0,'Native swipe host is hidden on mobile '+width);expect(await home.locator('.room-metrics').isVisible(),'Visible mobile swipe host has no rendered summary content '+width);}
  });
  await scenario('mobile-container-widths-and-selected-theme',async()=>{
    expect(await home.evaluate(element=>getComputedStyle(element).getPropertyValue('--md-sys-color-primary').trim().toLowerCase()===getComputedStyle(document.documentElement).getPropertyValue('--ha-m3-color-primary').trim().toLowerCase()),'Summary bypassed selected Ice theme');
    for(const width of [320,390,768,1024]){
      await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow '+width);
      for(const card of [home,climate]){
        expect(await card.locator('.room-metric').evaluateAll(elements=>elements.every(element=>element.scrollWidth<=element.clientWidth+1)),'Metric text clipped '+width);
        const target=await card.locator('.trust-automation').getByRole('button').boundingBox();expect(target.width>=44&&target.height>=44,'CTA touch target '+width);
      }
    }
    // A narrow card inside a desktop viewport must retain the mobile metric layout.
    await page.setViewportSize({width:1024,height:900});await home.evaluate(element=>element.style.width='300px');expect(await home.locator('.room-metrics').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length)===2,'Metrics respond to viewport rather than card width');await home.evaluate(element=>element.style.width='');
  });
  await scenario('reading-motion-respects-explicit-reduced-setting',async()=>{
    await page.emulateMedia({reducedMotion:'no-preference'});
    for(const card of [home,climate])expect(await card.locator('.room-metric-value').first().evaluate(element=>getComputedStyle(element).transitionDuration.split(',').every(value=>parseFloat(value)===0)),'Explicit reduced motion left a metric transition');
    await page.emulateMedia({reducedMotion:'reduce'});
  });
  await scenario('quick-operation-evidence-ownership-and-icon-motion',async()=>{
    const ac=page.locator('ha-m3-device-group-card ha-m3-quick-device-card').first();await ac.scrollIntoViewIfNeeded();
    await page.evaluate(()=>{const source=window.unifiedFixture.states['climate.ac'];source.state='cool';source.attributes.hvac_action='idle';window.polishFixture.update();});
    expect(await ac.locator('.operation-symbol').getAttribute('data-moving')==='false','Selected AC mode falsely animated as active cooling');
    expect((await ac.locator('.quick-operation').getAttribute('aria-label')).trim()!=='','Operation icon lacks its accessible state');
    await page.emulateMedia({reducedMotion:'no-preference'});await ac.evaluate(element=>element.setConfig({...element._config,appearance:{scheme:'auto',motion:'expressive'}}));
    await page.evaluate(()=>{window.unifiedFixture.states['climate.ac'].attributes.hvac_action='cooling';window.polishFixture.update();});
    expect(await ac.locator('.operation-symbol').getAttribute('data-motion')==='cool','Confirmed cooling lacks the matching icon motion');
    expect(await ac.locator('.operation-glyph').evaluate(element=>getComputedStyle(element).animationName)!=='none','Confirmed icon motion is absent');
    await page.evaluate(()=>{for(const parameter of ['power','temperature','speed'])window.unifiedFixture.states['input_boolean.lock_ac_'+parameter].state='on';window.polishFixture.update();});
    expect(await ac.locator('.surface').getAttribute('data-ownership')==='blocked','All manual permissions do not mark the device blocked');
    expect(await ac.locator('[data-control-id=temperature]').getAttribute('data-tone')==='cool','Manual ownership changed operating temperature color');
    for(const label of await ac.locator('.owner-copy').all())expect(await label.isVisible()&&(await label.innerText()).trim()!=='','Owner icon lacks visible meaning');
    await ac.evaluate(element=>element.setConfig({...element._config,appearance:{scheme:'auto',motion:'reduced'}}));
    expect(await ac.locator('.operation-glyph').evaluate(element=>getComputedStyle(element).animationName)==='none','Explicit reduced motion did not stop operation animation');
    await page.emulateMedia({reducedMotion:'reduce'});
  });
  await scenario('journal-side-drawer-keyboard-focus-readonly',async()=>{
    const before=await writes(),launcher=journal.locator('.journal-launcher');await launcher.focus();await page.keyboard.press('Enter');const drawer=journal.locator('dialog.journal-drawer');await drawer.waitFor({state:'visible'});
    for(const width of [320,390,1024]){await page.setViewportSize({width,height:900});const box=await drawer.boundingBox();expect(Math.abs(box.x+box.width-width)<2,'Journal is not a right-side drawer');expect(box.height<=902&&box.width<=width,'Journal drawer outside viewport');}
    await page.keyboard.press('Escape');await drawer.waitFor({state:'hidden'});expect(await launcher.evaluate(element=>element.matches(':focus-visible')),'Journal close lost launcher focus');await launcher.click();await journal.locator('.drawer-close').click();await drawer.waitFor({state:'hidden'});expect(await writes()===before,'Journal emitted a device service');
  });
  await scenario('journal-detach-reappend-cancels-stale-drawer-work',async()=>{
    const before=await writes();await page.emulateMedia({reducedMotion:'no-preference'});
    const lifecycle=await journal.evaluate(async element=>{
      element.setConfig({...element._config,appearance:{scheme:'auto',motion:'expressive'}});await element.updateComplete;
      const parent=element.parentNode,next=element.nextSibling,reappend=()=>parent.insertBefore(element,next),dialog=element.renderRoot.querySelector('.journal-drawer');
      // Detach before the async opening resumes, then reuse the same card instance.
      const opening=element.openJournal();element.remove();reappend();await opening;await element.updateComplete;
      const staleOpeningClosed=!dialog.open;
      element.renderRoot.querySelector('.journal-launcher').focus();await element.openJournal();
      const initialOpen=dialog.open&&dialog.matches(':modal'),closing=element.closeJournal();
      const closingAnimated=dialog.getAnimations().some(animation=>animation.playState==='running');
      // A previous close animation must not close the newly connected modal.
      element.remove();const detachedClosed=!dialog.open;reappend();await element.updateComplete;
      element.renderRoot.querySelector('.journal-launcher').focus();await element.openJournal();await closing;
      return {staleOpeningClosed,initialOpen,closingAnimated,detachedClosed,reopened:dialog.open&&dialog.matches(':modal')};
    });
    expect(lifecycle.staleOpeningClosed,'Detached pending opening displayed a stale modal');expect(lifecycle.initialOpen,'Journal did not open after the first reconnect');expect(lifecycle.closingAnimated,'Detach regression did not exercise the animated close path');expect(lifecycle.detachedClosed,'Disconnected journal left its native dialog open');expect(lifecycle.reopened,'A stale close completed against the reconnected journal');
    await page.keyboard.press('Escape');await journal.locator('.journal-drawer').waitFor({state:'hidden'});expect(await journal.evaluate(element=>element.renderRoot.activeElement===element.renderRoot.querySelector('.journal-launcher')),'Reconnected journal did not restore launcher focus');
    await journal.evaluate(async element=>{element.setConfig({...element._config,appearance:{scheme:'auto',motion:'reduced'}});await element.updateComplete;});await page.emulateMedia({reducedMotion:'reduce'});expect(await writes()===before,'Journal lifecycle emitted a device service');
  });
  async function touch(target,{dx=-140,dy=2,cancel=false,multi=false}={}){
    await target.scrollIntoViewIfNeeded();const bounds=await target.boundingBox(),x=Math.max(40,Math.min(280,bounds.x+bounds.width*.7)),y=bounds.y+bounds.height/2;
    await target.evaluate((element,{x,y,dx,dy,cancel,multi})=>{const point=(cx,cy,id=1)=>new Touch({identifier:id,target:element,clientX:cx,clientY:cy});const send=(type,touches,changed)=>element.dispatchEvent(new TouchEvent(type,{bubbles:true,composed:true,cancelable:true,touches,targetTouches:touches,changedTouches:changed}));const start=point(x,y);send('touchstart',multi?[start,point(x+10,y,2)]:[start],[start]);const end=point(x+dx,y+dy);send('touchmove',[end],[end]);send(cancel?'touchcancel':'touchend',[],[end]);},{x,y,dx,dy,cancel,multi});
  }
  await scenario('swipe-native-routes-and-gesture-exclusions',async()=>{
    await page.setViewportSize({width:390,height:900});const blank=page.locator('#polish-swipe-area');const reset=()=>page.evaluate(()=>history.replaceState(null,'',window.polishFixture.paths[0]));const before=await writes();
    await reset();await touch(blank);expect(await page.evaluate(()=>location.pathname)==='/demo/climate','Horizontal content swipe did not navigate');expect(await page.evaluate(()=>window.polishFixture.routes.length)===1,'Swipe dispatched multiple route changes');
    for(const gesture of [{dx:-10},{dy:180},{cancel:true},{multi:true}]){await reset();await touch(blank,gesture);expect(await page.evaluate(()=>location.pathname)==='/demo/home','Invalid gesture navigated '+JSON.stringify(gesture));}
    for(const target of [home.locator('.trust-automation').getByRole('button'),climate.locator('ha-m3-slider').first().getByRole('slider')]){await reset();await touch(target);expect(await page.evaluate(()=>location.pathname)==='/demo/home','Interactive control drag navigated');}
    await reset();await journal.locator('.journal-launcher').click();await touch(journal.locator('.journal-drawer'));expect(await page.evaluate(()=>location.pathname)==='/demo/home','Open journal permitted background swipe');await journal.locator('.drawer-close').click();expect(await writes()===before,'Swipe/ignored gesture emitted device service');
  });
  await scenario('external-card-hosts-preserve-their-own-gestures',async()=>{
    const before=await writes();await page.setViewportSize({width:390,height:900});
    // Inert shadow children test host exclusion only, not external card protocols.
    const hosts=['camera-cache-card','intercom-audio-call-card','apartment-3d-card'];
    await page.evaluate(hosts=>{for(const name of hosts){const host=document.createElement(name);host.dataset.polishExternal='true';host.style.cssText='display:block;height:100px;margin:12px';const child=document.createElement('div');child.dataset.externalSwipeSurface='true';child.style.cssText='height:100%;width:100%;touch-action:pan-y';child.addEventListener('touchmove',event=>{child.dataset.prevented=String(event.defaultPrevented);});host.attachShadow({mode:'open'}).append(child);window.polishFixture.view.prepend(host);}},hosts);
    for(const name of hosts){
      await page.evaluate(()=>history.replaceState(null,'',window.polishFixture.paths[0]));const routes=await page.evaluate(()=>window.polishFixture.routes.length),surface=page.locator(name+' [data-external-swipe-surface]');await touch(surface);
      expect(await page.evaluate(()=>location.pathname)==='/demo/home','External host swipe navigated '+name);expect(await page.evaluate(()=>window.polishFixture.routes.length)===routes,'External host emitted a route event '+name);expect(await surface.getAttribute('data-prevented')==='false','Dashboard prevented an external host gesture '+name);
    }
    await page.evaluate(()=>document.querySelectorAll('[data-polish-external]').forEach(element=>element.remove()));expect(await writes()===before,'External host gesture emitted a device service');
  });
  await scenario('door-tap-doubletap-and-cancel-remain-safe-with-swipe-binding',async()=>{
    await page.evaluate(()=>history.replaceState(null,'',window.polishFixture.paths[0]));
    const hold=page.locator('ha-m3-action-bar ha-m3-hold-button'),button=hold.getByRole('button'),before=await writes();await button.click();await button.dblclick();expect(await writes()===before,'Tap bypassed intentional door hold');
    const bounds=await button.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await hold.locator('#hold-feedback').waitFor({state:'visible'});await button.dispatchEvent('pointercancel');await page.mouse.up();expect(await writes()===before,'Cancelled door hold emitted a service');expect(await page.evaluate(()=>location.pathname)==='/demo/home','Door cancellation triggered navigation');
  });
  await scenario('runtime-and-network-isolation',async()=>{expect(report.errors.length===0,JSON.stringify(report.errors));expect(report.external_requests.length===0,'Unexpected external requests');});
  report.passed=true;
}catch(error){report.passed=false;report.error=error.message;process.exitCode=1;}
finally{
  const artifacts=path.join(root,'mobile-polish-browser-artifacts');await fs.mkdir(artifacts,{recursive:true});if(page&&!page.isClosed())try{const file='mobile-polish-browser-artifacts/'+(report.passed?'accepted':'failure')+'.png';await page.screenshot({path:path.join(root,file),fullPage:true,animations:'disabled'});report.screenshots.push(file);}catch(error){report.screenshot_error=error.message;}
  await browser?.close();await new Promise(resolve=>server.close(resolve));report.assertions=report.cases.reduce((sum,item)=>sum+item.assertions,0);await fs.writeFile(path.join(root,'mobile-polish-browser-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,assertions:report.assertions,error:report.error}));
}
