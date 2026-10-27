// Acceptance tests for shipped components with synthetic state and intercepted services.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const root=path.resolve(process.argv[2]||'.');
const selectedTheme=process.env.M3_UNIFIED_PRESET||'Material 3 Expressive - Graphite Blue';
const reportPrefix=process.env.M3_UNIFIED_REPORT_PREFIX||'unified';
if(!/^[a-z][a-z0-9-]{0,47}$/.test(reportPrefix))throw new Error('M3_UNIFIED_REPORT_PREFIX must be a safe lowercase filename prefix');
const artifactName=reportPrefix+'-browser-artifacts',reportName=reportPrefix+'-browser-report.json';
const tools=path.resolve(process.argv[3]||'/work/tools');
const require=createRequire(path.join(tools,'loader.cjs'));
const {chromium}=require('playwright-core');
const {generateThemeData}=await import(pathToFileURL(path.join(root,'scripts/theme.mjs')));
const preset=JSON.parse(await fs.readFile(path.join(root,'tokens/theme-presets.json'),'utf8')).find(p=>p.name===selectedTheme);
if(!preset)throw new Error('M3_UNIFIED_PRESET must name an existing theme preset');
const theme=(await generateThemeData(preset))[preset.name];
const manifest=JSON.parse(await fs.readFile(path.join(root,'dist/release-manifest.json'),'utf8'));
const fixed=Object.fromEntries(manifest.files.map(item=>['/'+item.path,'dist/'+item.path]));
Object.assign(fixed,{'/unified.html':'dev/unified.html','/unified-demo.js':'dev/unified-demo.js','/public-preview.js':'dev/public-preview.js','/quick-demo.js':'dev/quick-demo.js'});
const server=http.createServer(async(req,res)=>{
  try{
    const route=new URL(req.url,'http://localhost').pathname;
    if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
    if(route==='/theme.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(theme));return;}
    if(route==='/frame.png'){res.setHeader('Content-Type','image/png');res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64'));return;}
    if(!fixed[route]){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',route.endsWith('.js')?'text/javascript':route.endsWith('.woff2')?'font/woff2':'text/html');
    res.end(await fs.readFile(path.join(root,fixed[route])));
  }catch{res.writeHead(500);res.end('Synthetic fixture error');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const report={version:manifest.version,selected_theme:preset.name,report_prefix:reportPrefix,synthetic_data_only:true,live_ha_connection:false,physical_actions:false,widths:[320,390,768,1024,1440],schemes:['light','dark'],motion:['expressive','reduced'],matrix:[],cases:[],page_errors:[],external_requests:[],screenshots:[]};
let browser,activeCase,page;
const check=(ok,message)=>{if(!ok)throw Error(message);activeCase.assertions++;};
async function scenario(id,body){activeCase={id,assertions:0,passed:false};report.cases.push(activeCase);try{await body();activeCase.passed=true;}catch(error){activeCase.error=error.message;throw error;}}
try{
  browser=await chromium.launch({headless:true,channel:process.env.M3_BROWSER_CHANNEL||undefined,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'ru-RU',hasTouch:true});
  await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin===base)return route.continue();report.external_requests.push(url.origin);return route.abort();});
  page=await context.newPage();page.on('pageerror',error=>report.page_errors.push(error.message));
  await page.goto(base+'/unified.html');await page.waitForFunction(()=>window.unifiedFixture?.ready);
  const group=page.locator('ha-m3-device-group-card');
  const ac=group.locator('ha-m3-quick-device-card').nth(0),breather=group.locator('ha-m3-quick-device-card').nth(1),purifier=group.locator('ha-m3-quick-device-card').nth(2);
  const field=(card,id)=>card.locator('[data-control-id="'+id+'"]');
  const owner=(card,id)=>field(card,id).locator('button.owner');
  const writes=()=>page.evaluate(()=>window.unifiedFixture.writes.length);
  const setState=(entity,value,attributes)=>page.evaluate(({entity,value,attributes})=>window.unifiedFixture.setState(entity,value,attributes),{entity,value,attributes});
  async function layout(cell){
    await page.setViewportSize({width:cell.width,height:900});
    await page.emulateMedia({reducedMotion:cell.motion==='reduced'?'reduce':'no-preference',colorScheme:cell.scheme});
    await page.evaluate(({scheme,motion})=>window.unifiedFixture.appearance(scheme,motion),cell);
    await page.waitForFunction(()=>{const group=document.querySelector('ha-m3-device-group-card');return group?._children?.every(c=>c.hasUpdated);});
    const snapshot=await page.evaluate(()=>{
      const all=[];function visit(root){for(const e of root.children||[]){all.push(e);if(e.shadowRoot)visit(e.shadowRoot);visit(e);}}visit(document.body);
      const visible=e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none'&&!e.closest('[hidden]');};
      const controls=all.filter(e=>e.matches('button,input[type=range],select,summary')&&visible(e));
      const small=controls.map(e=>({tag:e.tagName,label:e.getAttribute('aria-label')||e.textContent.trim().slice(0,80),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,mode:e.classList.contains('owner')})).filter(b=>b.width<(b.mode?48:44)-.5||b.height<(b.mode?48:44)-.5);
      const labels=all.filter(e=>e.matches('.owner-label,.quick-operation,.field-heading label,.field-heading output,.quick-title h2,.group-title,.sample-label')&&visible(e));
      const nodeDetail=e=>{
        const rect=e.getBoundingClientRect(),style=getComputedStyle(e),parent=e.parentElement||e.getRootNode().host;
        const metrics=node=>{if(!node)return null;const r=node.getBoundingClientRect(),s=getComputedStyle(node);return {tag:node.localName,class:node.className?.baseVal??node.className,text:node.textContent.trim().slice(0,100),clientWidth:node.clientWidth,scrollWidth:node.scrollWidth,clientHeight:node.clientHeight,scrollHeight:node.scrollHeight,rect:{x:r.x,y:r.y,width:r.width,height:r.height},display:s.display,lineHeight:s.lineHeight,fontSize:s.fontSize,fontFamily:s.fontFamily,overflow:s.overflow,overflowX:s.overflowX,overflowY:s.overflowY,whiteSpace:s.whiteSpace,flexShrink:s.flexShrink,minWidth:s.minWidth,maxWidth:s.maxWidth,alignItems:s.alignItems,gridTemplateColumns:s.gridTemplateColumns};};
        const hosts=[];let root=e.getRootNode();while(root.host){hosts.push({tag:root.host.localName,entity:root.host._config?.entity});root=root.host.getRootNode();}
        return {...metrics(e),hosts,parent:metrics(parent),children:[...e.children].map(metrics),html:e.outerHTML.slice(0,1200)};
      };
      const clipped=labels.filter(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1).map(nodeDetail);
      const tiny=labels.filter(e=>parseFloat(getComputedStyle(e).fontSize)<(e.matches('.owner-label,.quick-operation')?12:14)).map(e=>({text:e.textContent.trim(),size:getComputedStyle(e).fontSize}));
      const inventory=window.unifiedFixture.inventory.map(tag=>({tag,count:all.filter(e=>e.localName===tag).length}));
      const quick=all.find(e=>e.localName==='ha-m3-quick-device-card');
      const primary={resolved:getComputedStyle(quick).getPropertyValue('--md-sys-color-primary').trim().toLowerCase(),selected:getComputedStyle(document.documentElement).getPropertyValue('--ha-m3-color-primary').trim().toLowerCase()};
      return {overflow:document.documentElement.scrollWidth>innerWidth,small,clipped,tiny,inventory,primary,owners:all.filter(e=>e.classList.contains('owner')).length};
    });
    report.last_layout_snapshot={cell,...snapshot};
    check(!snapshot.overflow,'Horizontal overflow '+JSON.stringify(cell));
    check(!snapshot.small.length,'Touch targets '+JSON.stringify(snapshot.small));
    check(!snapshot.clipped.length,'Essential text clipped '+JSON.stringify(snapshot.clipped));
    check(!snapshot.tiny.length,'Text too small '+JSON.stringify(snapshot.tiny));
    check(snapshot.primary.selected!==''&&snapshot.primary.resolved===snapshot.primary.selected,'Selected HA theme not inherited '+JSON.stringify(snapshot.primary));
    check(snapshot.inventory.every(item=>item.count>0),'Missing actual component '+JSON.stringify(snapshot.inventory.filter(item=>!item.count)));
    check(snapshot.owners===8,'Expected independent power/temperature/speed controls');
    const dock=await page.locator('ha-m3-action-bar').boundingBox();
    if(cell.width<=700)check(dock.y+dock.height<=901&&dock.y>=0,'Mobile dock unreachable');
    check(await group.locator('.devices').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)===(cell.width>=1024?3:1),'Group layout columns');
    cell.passed=true;cell.components=snapshot.inventory.map(item=>item.tag);report.matrix.push(cell);
  }
  for(const width of report.widths)for(const scheme of report.schemes)for(const motion of report.motion){const cell={width,scheme,motion};await scenario('layout-'+width+'-'+scheme+'-'+motion,()=>layout(cell));}
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.unifiedFixture.appearance('dark','reduced'));
  await scenario('owner-two-state-independent',async()=>{
    await page.evaluate(()=>window.unifiedFixture.resetOwners());
    const button=owner(ac,'temperature');check(await button.count()===1,'One owner button required');
    check(await button.getAttribute('data-owner')==='ha'&&await button.getAttribute('data-next-owner')==='manual','Initial/current-next owner');
    check((await button.getAttribute('aria-label')).includes('Автоматика дома')&&(await button.getAttribute('aria-label')).includes('Следующий режим: Ручное управление'),'Full current/next owner labels missing');
    check(await button.getAttribute('aria-pressed')===null,'Three-state owner must not claim binary pressed');
    await button.click();await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_temperature'].state==='on');
    check(await button.getAttribute('data-owner')==='manual','Manual not reflected');
    check(await page.evaluate(()=>['power','speed'].every(p=>window.unifiedFixture.states['input_boolean.lock_ac_'+p].state==='off')),'Independent locks changed');
    await button.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_temperature'].state==='off');
    check(await button.evaluate(e=>e.matches(':focus-visible')),'Keyboard focus lost on cycle');
  });
  await scenario('owner-three-state-native-auto-exit',async()=>{
    const button=owner(ac,'speed');await button.click();await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_speed'].state==='on');
    check(await button.getAttribute('data-owner')==='manual','HA -> manual failed');
    await button.click();await page.waitForFunction(()=>window.unifiedFixture.states['climate.ac'].attributes.fan_mode==='auto');check(await button.getAttribute('data-owner')==='device','Manual -> device failed');
    check((await button.getAttribute('aria-label')).includes('Автоматика прибора'),'Native Auto accessible name is ambiguous');
    await button.click();await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_speed'].state==='off');check(await button.getAttribute('data-owner')==='ha','Device -> HA failed');
    // Native Auto alone is not evidence of a manual speed. The cycle must
    // remain in HA mode and avoid a write until a genuine value is available.
    const beforeUnknown=await writes();await button.click();await field(ac,'speed').locator('.owner-error').waitFor();
    check(await writes()===beforeUnknown,'Unknown native speed sent a command');check(await page.evaluate(()=>window.unifiedFixture.states['input_boolean.lock_ac_speed'].state==='off'&&window.unifiedFixture.states['climate.ac'].attributes.fan_mode==='auto'),'Unknown speed was presented as manual');
    await page.evaluate(()=>{window.unifiedFixture.states['climate.ac'].attributes.fan_mode='low';window.unifiedFixture.update();});await button.click();
    await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_speed'].state==='on'&&window.unifiedFixture.states['climate.ac'].attributes.fan_mode==='low');
    check(await button.getAttribute('data-owner')==='manual','Native Auto -> manual not resolved');
    check(await page.evaluate(()=>window.unifiedFixture.states['input_boolean.lock_ac_temperature'].state==='off'),'Speed changed temperature permission');
  });
  await scenario('owner-pending-error-unavailable',async()=>{
    await page.evaluate(()=>{window.unifiedFixture.resetOwners();window.unifiedFixture.setPending(true);});
    const button=owner(ac,'power'),before=await writes();await button.click();await page.waitForFunction(()=>window.unifiedFixture.writes.length>0);
    check(await button.isDisabled(),'Pending owner not disabled');check(await writes()===before+1,'Pending request duplicated');
    await group.evaluate(element=>{const first=element._children[0];element._fixtureFirst=first;element.setConfig(JSON.parse(JSON.stringify(element._config)));});
    check(await group.evaluate(element=>element._children[0]===element._fixtureFirst),'Equivalent group config replaced active child');
    check(await button.isDisabled(),'Equivalent group config lost pending guard');check(await writes()===before+1,'Equivalent group config duplicated action');
    await page.evaluate(()=>window.unifiedFixture.resolvePending());await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_power'].state==='on');
    await page.evaluate(()=>window.unifiedFixture.setFailure(true));await button.click();await ac.getByRole('alert').waitFor();
    check(await button.getAttribute('data-owner')==='manual','Failed owner appeared confirmed');
    await page.evaluate(()=>window.unifiedFixture.setFailure(false));await setState('input_boolean.lock_ac_power','unavailable');check(await button.isDisabled(),'Unavailable permission enabled');
    check(await button.getAttribute('data-owner')==='unknown','Unavailable permission falsely described as manual');
    check((await field(ac,'power').locator('.owner-label').innerText()).toLowerCase().includes('недоступ'),'Unknown owner label missing');
    await setState('input_boolean.lock_ac_power','off');
  });
  await scenario('off-device-edit-intent-keyboard',async()=>{
    await setState('climate.ac','off');const input=field(ac,'temperature').getByRole('slider');await input.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Tab');
    await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_temperature'].state==='on');
    check(await page.evaluate(()=>window.unifiedFixture.states['climate.ac'].state==='off'),'Off-device edit turned power on');
    check((await field(ac,'temperature').locator('output').innerText()).trim()!=='','Edited value disappeared');
  });
  await scenario('owner-service-ack-awaits-observed-state',async()=>{
    await page.evaluate(()=>{window.unifiedFixture.resetOwners();window.unifiedFixture.setDeferredObservation(true);});
    const button=owner(ac,'power'),before=await writes();await button.click();
    await page.waitForFunction(()=>window.unifiedFixture.acknowledged.length===1&&!window.unifiedFixture.group._children[0]._busy);
    check(await button.isDisabled(),'Service acknowledgement incorrectly released unobserved owner');
    check(await button.getAttribute('data-owner')==='ha','Acknowledgement presented requested owner as observed');
    check(!await owner(ac,'temperature').isDisabled()&&!await owner(ac,'speed').isDisabled(),'One pending owner blocked independent permissions');
    await button.evaluate(element=>element.click());check(await writes()===before+1,'Repeated unobserved owner emitted a duplicate command');
    await page.evaluate(()=>window.unifiedFixture.applyAcknowledged());await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_power'].state==='on');
    check(await button.getAttribute('data-owner')==='manual','Observed owner not reflected');check(!await button.isDisabled(),'Observed state failed to release owner guard');
  });
  await scenario('owner-timeout-explicit-retry-only',async()=>{
    await page.evaluate(()=>{window.unifiedFixture.resetOwners();window.unifiedFixture.setDeferredObservation(true);});
    const button=owner(ac,'power'),before=await writes();await button.click();
    const feedback=ac.locator('.owner-error');await feedback.waitFor({state:'visible',timeout:12000});
    check(await writes()===before+1,'Ownership timeout automatically repeated service');check(!await button.isDisabled(),'Timeout never released pending owner');
    check(await button.getAttribute('data-owner')==='ha','Timeout invented observed owner');
    await feedback.getByRole('button',{name:'Повторить',exact:true}).click();
    await page.waitForFunction(()=>window.unifiedFixture.acknowledged.length===2);check(await writes()===before+2,'Explicit retry did not submit exactly once');check(await button.getAttribute('data-requested-owner')==='manual','Retry cycled away from original requested owner');
    await page.evaluate(()=>window.unifiedFixture.applyAcknowledged());await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_power'].state==='on');check(await feedback.count()===0,'Confirmed retry retained error');
  });
  await scenario('owner-unmount-clears-pending-no-repeat',async()=>{
    await page.evaluate(()=>{window.unifiedFixture.resetOwners();window.unifiedFixture.setDeferredObservation(true);});
    const before=await writes();await owner(ac,'power').click();await page.waitForFunction(()=>window.unifiedFixture.acknowledged.length===1);
    await group.evaluate(element=>element.remove());check(await page.evaluate(()=>Object.keys(window.unifiedFixture.group._children[0]._ownerRequests).length)===0,'Unmount retained owner pending timer');
    check(await writes()===before+1,'Unmount emitted an extra request');
    await page.evaluate(()=>{window.unifiedFixture.acknowledged.splice(0);window.unifiedFixture.setDeferredObservation(false);document.getElementById('devices').append(window.unifiedFixture.group);window.unifiedFixture.update();});
    await group.waitFor({state:'visible'});check(!await owner(ac,'power').isDisabled(),'Remounted owner retained stale pending guard');
  });
  await scenario('operating-color-state-matrix',async()=>{
    for(const [state,tone]of [['cool','cool'],['heat','warm'],['fan_only','fan'],['off','off'],['unknown','unknown']]){await setState('climate.ac',state);check(await ac.locator('.quick-operation').getAttribute('data-tone')===tone,'AC tone '+state);check((await ac.locator('.quick-operation').innerText()).trim()!=='','Missing redundant mode label');}
    await setState('climate.ac','cool',{temperature:27,min_temp:16,max_temp:32,target_temp_step:1,fan_mode:'low',fan_modes:['auto','low','medium','high'],hvac_action:'idle'});
    check(await ac.locator('.operation-activity').count()===1,'Selected mode missing separate activity detail');
    for(const [value,tone]of [['on','warm'],['off','cool'],['unknown','unknown'],['unavailable','unknown']]){await setState('binary_sensor.heater',value);check(await field(breather,'temperature').getAttribute('data-tone')===tone,'Breather explicit indicator '+value);check(!await field(breather,'temperature').getByRole('slider').isDisabled(),'Unknown heating disabled valid temperature input');check(await field(breather,'speed').getAttribute('data-tone')==='fan','Airflow must remain separate');}
    await setState('climate.breather','off');check(await field(breather,'temperature').getAttribute('data-tone')==='off','Off heater evidence overrode power');await setState('climate.breather','fan_only');
    await setState('fan.purifier','on');check(await purifier.locator('.quick-operation').getAttribute('data-tone')==='clean','Cleaning color missing');await setState('fan.purifier','off');check(await purifier.locator('.quick-operation').getAttribute('data-tone')==='off','Purifier off color missing');
  });
  await scenario('unknown-operation-not-control-availability',async()=>{
    await breather.evaluate(card=>card.setConfig({...card._config,operation:{kind:'breather',entity:'sensor.missing'}}));await page.evaluate(()=>window.unifiedFixture.update());
    check(await breather.locator('.quick-operation').getAttribute('data-tone')==='unknown','Unknown evidence guessed an operation');
    check(!await field(breather,'temperature').getByRole('slider').isDisabled(),'Operation gap disabled valid control');
  });
  await scenario('sensor-values-and-gaps',async()=>{
    const sensor=page.locator('ha-m3-sensor-card');await setState('sensor.room','0',{unit_of_measurement:'°C'});check((await sensor.locator('.surface').innerText()).includes('0,0'),'Zero measurement lost');
    await setState('sensor.room','unknown');check((await sensor.locator('.surface').innerText()).includes('Нет данных'),'Unknown measurement rendered as numeric');
    await setState('binary_sensor.leak','on',{device_class:'moisture'});check(await sensor.locator('[data-state=alarm]').count()===1,'Alarm not distinguishable');
    await setState('sensor.room','24.6',{unit_of_measurement:'°C'});
    const before=await writes();await sensor.locator('.main').first().click();check(await writes()===before,'Sensor details emitted command');check(await page.evaluate(()=>window.unifiedFixture.events.includes('sensor.room')),'Sensor more-info lost');
  });
  await scenario('history-empty-error-popup-keyboard',async()=>{
    const history=ac.locator('ha-m3-history').first();await page.evaluate(()=>window.unifiedFixture.setHistory('empty'));await history.getByRole('button',{name:/Развернуть историю/}).click();
    const popup=history.getByRole('dialog');await popup.waitFor({state:'visible'});await history.getByText('Нет записей за этот период',{exact:true}).last().waitFor();
    check((await popup.boundingBox()).width<=390,'History sheet exceeds viewport');await page.keyboard.press('Escape');await popup.waitFor({state:'hidden'});
    await page.evaluate(()=>window.unifiedFixture.setHistory('error'));await history.getByRole('button',{name:/Развернуть историю/}).click();await history.getByText('История недоступна',{exact:true}).last().waitFor();await popup.getByRole('button',{name:'Закрыть',exact:true}).click();await popup.waitFor({state:'hidden'});
  });
  await scenario('journal-empty-unavailable',async()=>{
    const journal=page.locator('ha-m3-journal-card');await setState('sensor.demo_journal','demo',{entries:[]});check((await journal.locator('.surface').innerText()).trim()!=='','Empty journal blank');await setState('sensor.demo_journal','unavailable');check(await journal.getByRole('status').count()===1,'Unavailable journal state missing');
  });
  await scenario('camera-placeholder-unavailable-image-error',async()=>{
    const camera=page.locator('ha-m3-camera-card');await camera.scrollIntoViewIfNeeded();check(await camera.locator('.placeholder').isVisible(),'Camera placeholder missing');
    await setState('camera.demo','unavailable');check(await camera.locator('.preview').isDisabled(),'Unavailable camera still actionable');check((await camera.locator('.support').innerText()).toLowerCase().includes('недоступ'),'Unavailable camera not described');
    const errorText=await camera.evaluate(element=>element.t('error'));
    await setState('camera.demo','idle',{entity_picture:'/missing-frame.png'});
    await page.waitForFunction(expected=>document.querySelector('ha-m3-camera-card')?.renderRoot.querySelector('.support')?.textContent.trim()===expected,errorText);
    check(await camera.locator('.support').innerText()===errorText,'Failed frame still presented as usable preview');
    check(await camera.locator('.placeholder').getByText(errorText,{exact:true}).isVisible(),'Failed image lacks its explicit placeholder');
    await setState('camera.demo','idle',{entity_picture:'/frame.png'});await camera.locator('img').waitFor();await page.waitForFunction(()=>{const c=document.querySelector('ha-m3-camera-card');return c.renderRoot.querySelector('img')?.naturalWidth>0;});
    check(!await camera.locator('.preview').isDisabled(),'Recovered camera disabled');check(!await camera.locator('.placeholder').count(),'Recovered camera retained error placeholder');
    const before=await writes();await camera.locator('.preview').click();check(await writes()===before,'Camera more-info emitted command');
  });
  await scenario('dialog-open-escape-close-focus',async()=>{
    const trigger=page.locator('#dialog-open').getByRole('button');await trigger.focus();await page.keyboard.press('Enter');const dialog=page.locator('#sample-dialog').getByRole('dialog');await dialog.waitFor({state:'visible'});await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});check(await trigger.evaluate(e=>e.matches(':focus-visible')),'Dialog did not restore trigger focus');await trigger.click();await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();await dialog.waitFor({state:'hidden'});
  });
  await scenario('native-switch-and-connected-keyboard',async()=>{
    const sw=page.locator('#sample-switch').getByRole('switch');await sw.focus();await page.keyboard.press('Space');check(await sw.getAttribute('aria-checked')==='true','Keyboard switch failed');
    const radio=page.locator('#sample-group').getByRole('radio',{name:'Обычно'});await radio.focus();await page.keyboard.press('ArrowRight');check(await page.locator('#sample-group').getByRole('radio',{name:'Ярко'}).getAttribute('aria-checked')==='true','Connected keyboard navigation failed');
  });
  await scenario('hold-visible-outside-finger-cancel-no-command',async()=>{
    const bar=page.locator('ha-m3-action-bar'),hold=bar.locator('ha-m3-hold-button'),button=hold.getByRole('button');const before=await writes();await button.scrollIntoViewIfNeeded();const b=await button.boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;await page.mouse.move(x,y);await page.mouse.down();const feedback=hold.locator('#hold-feedback');await feedback.waitFor({state:'visible'});const f=await feedback.boundingBox();check(f.y+f.height<=y-63||f.y>=y+63,'Hold progress hidden by finger');await button.dispatchEvent('pointercancel');await page.mouse.up();check(await writes()===before,'Cancelled hold emitted service');check(await feedback.isHidden(),'Cancelled hold remained visible');
    await button.click();await button.dblclick();check(await writes()===before,'Tap/doubletap bypassed hold');
  });
  await scenario('dock-navigation-one-tap-mocked',async()=>{
    const before=await writes();await page.locator('ha-m3-action-bar').getByRole('button',{name:'Камеры',exact:true}).click();check(await writes()===before+1,'Navigation needs extra interaction');check(await page.evaluate(()=>window.unifiedFixture.writes.at(-1).service)==='navigation','Unexpected navigation command');
  });
  await scenario('network-and-runtime-isolation',async()=>{check(report.external_requests.length===0,'External requests escaped fixture');check(report.page_errors.length===0,JSON.stringify(report.page_errors));check(report.matrix.length===20&&report.matrix.every(cell=>cell.passed),'Incomplete layout matrix');});
  const artifact=path.join(root,artifactName);await fs.mkdir(artifact,{recursive:true});
  for(const [width,scheme]of [[390,'dark'],[1440,'light']]){await page.setViewportSize({width,height:1000});await page.evaluate(({scheme})=>window.unifiedFixture.appearance(scheme,'reduced'),{scheme});const file=reportPrefix+'-'+width+'-'+scheme+'.png';await page.screenshot({path:path.join(artifact,file),fullPage:true,animations:'disabled'});report.screenshots.push(artifactName+'/'+file);}
  report.passed=true;
}catch(error){
  report.passed=false;report.error=error.message;process.exitCode=1;
  const artifact=path.join(root,artifactName);await fs.mkdir(artifact,{recursive:true});
  await fs.writeFile(path.join(artifact,'failure-layout.json'),JSON.stringify(report.last_layout_snapshot||{case:activeCase?.id,error:error.message},null,2)+'\n');
  if(page&&!page.isClosed()){
    try{
      report.fixture_snapshot=await page.evaluate(()=>{const fixture=window.unifiedFixture;if(!fixture)return null;return {writes:fixture.writes.slice(-8),acknowledged:fixture.acknowledged,children:fixture.group._children.map(card=>({entity:card._config.entity,busy:card._busy,requested:card._ownerRequests,errors:card._ownerErrors,permissions:Object.fromEntries(Object.entries(fixture.states).filter(([entity])=>entity.startsWith('input_boolean.lock_')).map(([entity,state])=>[entity,state.state]))}))};});
      await fs.writeFile(path.join(artifact,'failure-state.json'),JSON.stringify(report.fixture_snapshot,null,2)+'\n');
    }catch(stateError){report.state_snapshot_error=stateError.message;}
    try{const file=artifactName+'/failure.png';await page.screenshot({path:path.join(root,file),fullPage:true,animations:'disabled'});report.screenshots.push(file);}catch(screenshotError){report.screenshot_error=screenshotError.message;}
  }
}
finally{await browser?.close();await new Promise(resolve=>server.close(resolve));report.assertions=report.cases.reduce((n,test)=>n+test.assertions,0);await fs.writeFile(path.join(root,reportName),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,selected_theme:preset.name,report:reportName,cases:report.cases.length,assertions:report.assertions,matrix:report.matrix.length,error:report.error}));}
