import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import{createRequire}from'node:module';import{pathToFileURL}from'node:url';
const root=path.resolve(process.argv[2]||'.'),tools=path.resolve(process.argv[3]||'/tools');
const{chromium}=createRequire(path.join(tools,'loader.cjs'))('playwright-core');
const{generateThemeData}=await import(pathToFileURL(path.join(root,'scripts/theme.mjs')));
const preset=JSON.parse(await fs.readFile(path.join(root,'tokens/theme-presets.json'),'utf8')).find(x=>x.name==='Material 3 Expressive - Graphite Blue'),theme=(await generateThemeData(preset))[preset.name];
const manifest=JSON.parse(await fs.readFile(path.join(root,'dist/release-manifest.json'),'utf8')),routes=Object.fromEntries(manifest.files.map(f=>['/'+f.path,'dist/'+f.path]));
for(const f of ['control-audit.html','control-audit.js','control-audit-fixture.json'])routes['/'+f]='dev/'+f;
const server=http.createServer(async(req,res)=>{const p=new URL(req.url,'http://fixture').pathname;try{if(p==='/theme.json'){res.setHeader('content-type','application/json');return res.end(JSON.stringify(theme));}if(p==='/favicon.ico'){res.writeHead(204);return res.end();}if(!routes[p]){res.writeHead(404);return res.end();}res.setHeader('content-type',p.endsWith('.js')?'text/javascript':p.endsWith('.json')?'application/json':p.endsWith('.woff2')?'font/woff2':'text/html');res.end(await fs.readFile(path.join(root,routes[p])));}catch{res.writeHead(500);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const selection=process.env.M3_AUDIT_CASES||'';
const report={version:manifest.version,synthetic:true,selection,cases:[],errors:[],external:[],inventory:[]};let browser,page,current;
const check=(value,message)=>{current.assertions++;if(!value)throw Error(message);};
async function scenario(name,fn){if(selection&&!new RegExp(selection).test(name))return;current={name,assertions:0,passed:false};report.cases.push(current);try{await page.evaluate(()=>window.controlAudit.reset());await fn();current.passed=true;}catch(e){current.error=e.message;await page.screenshot({path:path.join(root,'control-audit-failure.png'),fullPage:true});}}
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage'],...(process.env.M3_BROWSER_EXECUTABLE?{executablePath:process.env.M3_BROWSER_EXECUTABLE}:{})});const context=await browser.newContext({viewport:{width:390,height:900},locale:'ru-RU',hasTouch:true});await context.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():(report.external.push(r.request().url()),r.abort()));page=await context.newPage();await page.clock.install();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(base+'/control-audit.html');await page.waitForFunction(()=>window.controlAudit);
 page.setDefaultTimeout(5000);
 const summary=page.locator('ha-m3-climate-card'),device=i=>page.locator('ha-m3-quick-device-card').nth(i),writes=()=>page.evaluate(()=>window.controlAudit.writes),set=(id,value,attributes)=>page.evaluate(({id,value,attributes})=>window.controlAudit.set(id,value,attributes),{id,value,attributes});
 const config=await page.evaluate(()=>window.controlAudit.config);
 await scenario('feedback-heating-icons-co2-and-number-width',async()=>{
  await page.setViewportSize({width:1440,height:1000});
  await device(0).evaluate(e=>e.setConfig({...e._config,operation:{kind:'breather',heating_setpoint:{entity:e._config.entity,attribute:'temperature',off_value:5}}}));
  await set(config.cards[0].entity,'fan_only',{temperature:19,max_temp:25,source_qualified:true});
  check(await device(0).locator('.surface').getAttribute('data-tone')==='warm','Received enabled heating has warm surface');
  check(await device(0).locator('.operation-symbol').getAttribute('data-motion')==='heat','Received enabled heating is animated');
  check(await device(0).locator('.operation-symbol').getAttribute('aria-label')==='Нагрев разрешён','Heating permission is not presented as measured heater activity');
  await set(config.cards[0].entity,'fan_only',{temperature:5});
  check(await device(0).locator('.surface').getAttribute('data-tone')==='cool','5 degrees changes surface to cold');
  check(await device(0).locator('.operation-symbol').getAttribute('data-motion')==='flow','Heating off keeps ventilation animation');
  check(await device(0).locator('.device-owner ha-m3-state-icon').evaluate(e=>e.name)==='lock','Automatic state offers manual freeze action');
  for(const item of [config.cards[0].power,...config.cards[0].quick_controls])await set(item.lock_entity,'on');
  check(await device(0).locator('.device-owner ha-m3-state-icon').evaluate(e=>e.name)==='auto_awesome','Manual state offers Auto action');
  const ac=device(1),field=ac.locator('[data-control-id="temperature"]'),positions=[];
  for(const temperature of [21,21.5,22,22.5,23]){await set(config.cards[1].entity,'heat',{temperature,target_temp_step:.5});await page.clock.runFor(300);positions.push(await field.locator('.scale-mode').boundingBox());}
  check(positions.every(p=>p.x===positions[0].x&&p.width===positions[0].width),'Half degree values never shift the operation icon');
  const input=field.locator('input');await input.scrollIntoViewIfNeeded();const box=await input.boundingBox();await page.mouse.move(box.x+box.width*.3,box.y+box.height/2);await page.mouse.down();
  const preview=[];for(const fraction of [.31,.33,.35,.37,.39]){await page.mouse.move(box.x+box.width*fraction,box.y+box.height/2);await page.clock.runFor(30);preview.push(await field.locator('.scale-mode').boundingBox());}
  check(preview.every(p=>p.x===preview[0].x),'Dragged previews keep icon position');check((await writes()).length===0,'No writes during drag');await page.keyboard.press('Escape');await page.mouse.up();
  const co2='input_number.office_co2_target';await set(co2,800,{min:600,max:1400,step:50});
  await summary.evaluate((e,entity)=>e.setConfig({...e._config,air_goals:e._config.air_goals.map(g=>g.id==='fresh'?{id:'fresh',name:'Целевой CO₂',semantics:'co2-target',entity,low_label:'600 ppm',high_label:'1400 ppm',set_action:{action:'perform-action',perform_action:'input_number.set_value',target:{entity_id:entity},value_field:'value'}}:g)}),co2);
  const goal=summary.locator('[data-air-goal="fresh"]'),slider=goal.locator('input');
  check((await goal.locator('output').textContent()).includes('800 ppm'),'Target is shown in ppm');await slider.scrollIntoViewIfNeeded();const b=await slider.boundingBox();await page.mouse.move(b.x+b.width*.5,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width*.75,b.y+b.height/2,{steps:6});check((await writes()).length===0,'CO2 drag sends nothing until release');await page.mouse.up();
  const sent=(await writes()).at(-1);check((await writes()).length===1&&sent.domain==='input_number'&&sent.service==='set_value'&&sent.target.entity_id===co2&&sent.data.value>=600&&sent.data.value<=1400&&sent.data.value%50===0,'Exactly one valid CO2 target is committed');
  await set(co2,sent.data.value);check(!(await goal.textContent()).includes('Не удалось'),'Target readback is accepted');
  report.feedback={positions,preview,co2:sent.data.value};await page.screenshot({path:path.join(root,'feedback-desktop.png'),fullPage:true});
 });
 await scenario('stationary Off is an explicit released command but a canceled hold is not',async()=>{
  const c=config.cards[1],item=c.quick_controls[0];await set(c.entity,'off',{temperature:23,fan_mode:'low'});
  const input=device(1).locator('[data-control-id="temperature"] input');
  await input.press('Home');let calls=await writes();check(calls.length===1&&calls[0].data[item.mode_scale.gateway.value_field]==='off','Already selected Off must send a new explicit Stop');const first=calls[0].data.request_id;
  await set(item.mode_scale.revision_entity,first);await set(item.mode_scale.completed_entity,first);await set(c.power.lock_entity,'on');await set(c.power.value_entity,'off');await set(item.lock_entity,'on');
  await input.press('Home');calls=await writes();check(calls.length===2&&calls[1].data.request_id!==first,'A second released Stop has its own id');
  const count=calls.length;await input.scrollIntoViewIfNeeded();const box=await input.boundingBox();await page.mouse.move(box.x+1,box.y+box.height/2);await page.mouse.down();await page.keyboard.press('Escape');await page.mouse.up();check((await writes()).length===count,'Canceled same-position gesture sends nothing');
 });
 await scenario('new scale choice replaces a saved pending target and Auto cancels obsolete UI wait',async()=>{
  const c=config.cards[1],item=c.quick_controls[0],input=device(1).locator('[data-control-id="temperature"] input');
  await input.press('ArrowRight');let calls=await writes();check(calls.length===1,'First request sent');const old=calls[0].data.request_id;
  await set(item.lock_entity,'on');await set(c.power.lock_entity,'on');await set(c.power.value_entity,'on');await set(item.value_entity,23.5);await set(item.mode_scale.confirmation.mode_entity,'heat');await set(item.mode_scale.confirmation.writing_entity,'off');await set(item.mode_scale.confirmation.pending_entity,'on');await set(item.mode_scale.revision_entity,old);
  await input.press('ArrowRight');calls=await writes();check(calls.length===2,'Latest released value must not be ignored while waiting');const current=calls[1].data.request_id;check(current!==old,'New gesture has its own request ID');
  await set(item.mode_scale.completed_entity,old);check(await device(1).evaluate(e=>e._scaleRequests.temperature?.request_id)===current,'Old completion cannot satisfy or clear the replacement');
  check(await device(1).locator('.device-owner').isEnabled(),'Auto return must remain available while a value is pending');await device(1).locator('.device-owner').click();calls=await writes();check(calls.length===3&&calls[2].data.owner==='auto','Auto action supersedes the pending setting');check(await device(1).evaluate(e=>Object.keys(e._scaleRequests).length===0),'Old view waits canceled without retry');
  const owner=calls[2].data.request_id;for(const i of [c.power,...c.quick_controls])await set(i.lock_entity,'off');await set(c.device_ownership.revision_entity,owner);await set(c.device_ownership.completed_entity,owner);
  check(await device(1).evaluate(e=>!e._deviceError&&!e._deviceRequest&&!Object.values(e._scaleErrors).some(Boolean)),'Auto confirmation has no old timeout error');
 });
 for(const reason of ['source-loss','escape','blur'])await scenario('canceled stationary regulator hold never opens a delayed menu: '+reason,async()=>{
  const c=config.cards[0],slider=device(0).locator('[data-control-id="temperature"] input');await slider.scrollIntoViewIfNeeded();const box=await slider.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  if(reason==='source-loss')await set(c.entity,'unavailable');else if(reason==='escape')await page.keyboard.press('Escape');else await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await page.clock.runFor(700);await page.mouse.up();check(await device(0).locator('ha-m3-quick-settings-menu ha-m3-dialog.main dialog').isVisible()===false,'Canceled hold must not leave a modal over subsequent controls');check((await writes()).length===0,'Canceled gesture sends no setting');
 });
 await scenario('unavailable capture is disabled but explicit release of ownership remains possible',async()=>{
  const c=config.cards[0],speed=c.quick_controls[1];await set(c.entity,'off',{fan_mode:null,preset_mode:null});
  await summary.locator('.unified-goals-heading ha-m3-button button').click();
  const groupIndex=config.main.automation_groups.findIndex(g=>g.controls.some(x=>x.lock_entity===speed.lock_entity)),controlIndex=config.main.automation_groups[groupIndex].controls.findIndex(x=>x.lock_entity===speed.lock_entity);
  const permission=summary.locator('#automation-menu .automation-group').nth(groupIndex).locator('ha-m3-switch').nth(controlIndex);
  check(await permission.evaluate(e=>e.disabled),'Cannot capture an unknown current speed');
  await set(speed.lock_entity,'on');check(await permission.evaluate(e=>!e.disabled),'Releasing ownership must remain possible even without speed readback');
  await page.keyboard.press('Escape');await set(config.cards[3].entity,'unavailable');
  check(await device(3).locator('.device-owner').isDisabled(),'Unplugged heater cannot capture absent settings');
  check(await device(3).evaluate(e=>!e._deviceError),'Unavailability must not be a false partial-change error');
  check((await writes()).length===0,'Readiness checks must not send commands');
 });
 await scenario('known Off breather remains controllable and ownership freezes without a fabricated speed',async()=>{
  const c=config.cards[0],temp=c.quick_controls[0],speed=c.quick_controls[1];
  await set(c.entity,'off',{temperature:10,fan_mode:null,preset_mode:null,ownership_contract:'off-freeze-v1'});
  const card=device(0),field=id=>card.locator(`[data-control-id="${id}"]`);
  check(await field(temp.id).locator('output').textContent()==='10 °C','Independent heat target must remain visible while airflow is Off');
  check(await field(speed.id).locator('ha-m3-slider').evaluate(e=>e.disabled===false&&e.value===0),'Known Off speed must be adjustable at Off');
  check(await field(speed.id).locator('select').count()===0,'No duplicate fallback for a known Off position');
  check(!(await field(speed.id).textContent()).includes('Нет данных'),'Known Off is not missing data');
  await card.locator('.device-owner').click();
  const r=await card.evaluate(e=>e._deviceRequest);
  check(r?.snapshot?.power===false&&r.snapshot.values[speed.id]===null,'Freeze must keep power Off and unknown speed');
  check((await writes()).length===1,'One ownership request per actual click');
  for(const item of [c.power,...c.quick_controls])await set(item.lock_entity,'on');
  await set(c.power.value_entity,'off');await set(temp.value_entity,'10');await set(speed.value_entity,'');
  await set(c.device_ownership.revision_entity,r.request_id);await set(c.device_ownership.completed_entity,r.request_id);
  check(await card.evaluate(e=>!e._deviceRequest&&!e._deviceError),'Exact Off freeze confirmation must clear pending without an error');
  check(await field(speed.id).locator('ha-m3-slider').evaluate(e=>!e.disabled&&e.value===0),'Frozen Off scale must still be usable');
  await set(c.entity,'off',{temperature:5});await set(temp.value_entity,'5');
  check(await field(temp.id).locator('output').textContent()==='Без нагрева','5 degrees means heating off, not device Off');
  await set(c.entity,'on',{temperature:10,fan_mode:null});
  check(await field(speed.id).locator('ha-m3-slider').count()===0||await field(speed.id).locator('ha-m3-slider').evaluate(e=>e.disabled),'Unknown powered-on speed must remain unqualified');
 });
 const openDevice=async i=>{await device(i).locator('.quick-header>.scale-details').click();await device(i).locator('ha-m3-quick-settings-menu ha-m3-dialog.main dialog').waitFor({state:'visible'});};
 for(let i=0;i<config.cards.length;i++)for(const group of config.cards[i].settings_menu.groups)for(const item of group.items){
  report.inventory.push({device:config.cards[i].name,id:item.id,type:item.type});
  if(item.type==='switch')await scenario('aux-switch-'+i+'-'+item.id,async()=>{
   await openDevice(i);const control=device(i).locator(`[data-item="${item.id}"] ha-m3-switch button`);
   for(const next of ['on','off']){const before=(await writes()).length;await control.click();const sent=(await writes()).at(-1);check((await writes()).length===before+1,'One command');check(sent.domain==='switch'&&sent.service==='turn_'+next&&sent.target.entity_id===item.entity,'Exact action/target');check(await control.isDisabled(),'Wait for readback after service acknowledgement');await set(item.entity,next);await page.waitForTimeout(20);check(!await control.isDisabled(),'Readback re-enables');check(await control.getAttribute('aria-checked')===String(next==='on'),'Readback reflects state');}
   await set(item.entity,'unavailable');check(await control.isDisabled(),'Unavailable switch disabled');
  });
  if(item.type==='select')await scenario('aux-select-'+i+'-'+item.id,async()=>{await openDevice(i);const control=device(i).locator(`[data-item="${item.id}"] select`);const values=await control.locator('option').evaluateAll(es=>es.map(e=>e.value));check(values.length>1,'All options visible');for(const value of values.slice(1).concat(values[0])){const before=(await writes()).length;await control.selectOption(value);const sent=(await writes()).at(-1);check((await writes()).length===before+1&&sent.service==='select_option'&&sent.target.entity_id===item.entity&&sent.data.option===value,'Exact selection');check(await control.isDisabled(),'Selection waits readback');await set(item.entity,value);await page.waitForTimeout(20);check(await control.inputValue()===value&&!await control.isDisabled(),'Selection confirmed');}});
  if(item.type==='filter-reset')await scenario('filter-confirmation-'+i,async()=>{await openDevice(i);const menu=device(i).locator('ha-m3-quick-settings-menu'),button=menu.locator(`[data-item="${item.id}"] ha-m3-button button`);await button.click();const confirm=menu.locator('ha-m3-dialog.confirm');check(await confirm.locator('dialog').evaluate(e=>e.open),'Confirmation opens');check((await writes()).length===0,'No command before confirmation');await confirm.locator('ha-m3-button').filter({hasText:'Отмена'}).click();check((await writes()).length===0,'Cancel is read-only');await button.click();await confirm.locator('ha-m3-button').filter({hasText:'Сбросить'}).click();check((await writes()).length===1&&(await writes())[0].domain==='button'&&(await writes())[0].target.entity_id===item.entity,'Exactly one confirmed reset');});
 }
 await scenario('aux-error-and-reconnect',async()=>{await openDevice(0);const item=config.cards[0].settings_menu.groups[0].items[0],menu=device(0).locator('ha-m3-quick-settings-menu'),control=menu.locator(`[data-item="${item.id}"] ha-m3-switch button`);await page.evaluate(()=>window.controlAudit.fail=true);await control.click();check(await menu.locator('[role=alert]').count()===1&&!await control.isDisabled(),'Failure permits retry');await page.evaluate(()=>window.controlAudit.fail=false);await control.click();check(await control.isDisabled(),'Pending before detach');await menu.evaluate(e=>{const p=e.parentNode,n=e.nextSibling;e.remove();p.insertBefore(e,n);});await page.clock.fastForward(11000);check(!await control.isDisabled(),'Pending times out after reconnect');});
 const openAutomation=async()=>{await summary.locator('.unified-goals-heading ha-m3-button').click();await summary.locator('#automation-menu').waitFor({state:'visible'});};
 const verifyAction=(sent,action,extra={})=>{check(sent&&sent.domain+'.'+sent.service===action.perform_action,'Exact service');check(JSON.stringify(sent.target||{})===JSON.stringify(action.target||{}),'Exact target');for(const[k,v]of Object.entries({...action.data,...extra}))check(sent.data[k]===v,'Exact payload '+k);};
 for(const[groupIndex,group]of config.main.automation_groups.entries())for(const[itemIndex,item]of group.controls.entries())await scenario('permission-'+groupIndex+'-'+itemIndex,async()=>{
  await openAutomation();const button=summary.locator('.automation-group').nth(groupIndex).locator('ha-m3-switch button').nth(itemIndex);
  for(const value of ['on','off']){await button.click();verifyAction((await writes()).at(-1),item.lock_action,{value:value==='on'});check(await button.isDisabled(),'Permission waits for readback');await set(item.lock_entity,value);check(!await button.isDisabled(),'Permission confirmed');check(await button.getAttribute('aria-checked')===String(value==='off'),'Automatic permission reflects inverse lock');}
  await set(item.lock_entity,'unavailable');check(await button.isDisabled(),'Unknown permission disabled');
 });
 for(const item of [{id:'master',entity:config.main.entities.enabled},...config.main.actuators])await scenario('automation-switch-'+item.id,async()=>{
  await set(item.entity,'off');await openAutomation();const menu=summary.locator('#automation-menu');if(item.id!=='master')await menu.locator('details').filter({has:page.getByText(item.name,{exact:true})}).last().locator('summary').click();
  const button=item.id==='master'?menu.locator(':scope>.popover-row ha-m3-switch button'):menu.locator('details ha-m3-switch').filter({has:page.getByRole('switch',{name:item.name,exact:true})}).locator('button');
  for(const value of ['on','off']){await button.click();check((await writes()).at(-1).service==='turn_'+value&&(await writes()).at(-1).target.entity_id===item.entity,'Exact boolean command');check(await button.isDisabled(),'Boolean waits for readback');await set(item.entity,value);check(!await button.isDisabled(),'Boolean confirmed');}
 });
 await scenario('trust-all',async()=>{await set(config.main.entities.enabled,'on');await set(config.main.automation_groups[0].controls[0].lock_entity,'on');const b=summary.locator('.trust-automation');check(await b.getAttribute('data-trust')==='partial','Partial state');check(await b.getAttribute('icon')==='auto_awesome','Partial trust keeps distinct automation icon');await b.click();verifyAction((await writes()).at(-1),config.main.automation_reset.action);check(await b.locator('button').isDisabled(),'Trust waits readback');for(const g of config.main.automation_groups)for(const p of g.controls)await set(p.lock_entity,'off');for(const id of config.main.automation_reset.enabled_entities||[])await set(id,'on');check(await b.getAttribute('data-trust')==='all','Trust all confirmed');});
 for(let i=0;i<config.cards.length;i++)for(const owner of ['auto','manual'])await scenario('device-owner-'+i+'-'+owner,async()=>{
  const c=config.cards[i];for(const p of [c.power,...c.quick_controls])await set(p.lock_entity,owner==='auto'?'on':'off');
  const button=device(i).locator('.device-owner');await button.click();const request=(await writes()).at(-1);verifyAction(request,c.device_ownership.gateway,{owner});check(await button.isDisabled(),'Owner waits for completed receipt');check(await device(i).locator('.surface').getAttribute('data-ownership')===(owner==='auto'?'blocked':'automatic'),'No false optimistic ownership');
  await page.evaluate(({i,owner,id})=>{const f=window.controlAudit,c=f.config.cards[i];for(const p of[c.power,...c.quick_controls]){f.states[p.lock_entity].state=owner==='auto'?'off':'on';if(owner==='manual')f.states[p.value_entity].state=String(p===c.power?'on':f.states[c.entity].attributes[p.attribute]);}f.states[c.device_ownership.revision_entity].state=id;f.states[c.device_ownership.completed_entity].state=id;f.update();},{i,owner,id:request.data.request_id});
  check(!await button.isDisabled(),'Owner receipt and observed settings confirm');check(await button.getAttribute('data-owner')===(owner==='auto'?'ha':'manual'),'Confirmed owner icon');
 });
 for(let i=0;i<config.cards.length;i++)for(const item of config.cards[i].quick_controls){
  await scenario('scale-options-'+i+'-'+item.id,async()=>{
   await device(i).locator(`[data-control-id="${item.id}"] .scale-details`).click();const choices=await device(i).locator('.scale-choice option').evaluateAll(es=>es.filter(e=>e.value!=='').map(e=>({value:e.value,text:e.textContent})));
   check(choices[0].text===(item.mode_scale.kind==='breather-temperature'?'Без нагрева':'Выключен'),'Left endpoint label');check(choices.at(-1).text==='Авто','Right endpoint label');
   for(const choice of choices){await page.evaluate(()=>window.controlAudit.reset());await device(i).locator(`[data-control-id="${item.id}"] .scale-details`).click();await device(i).locator('.scale-choice').selectOption(choice.value);const sent=(await writes()).at(-1);verifyAction(sent,item.mode_scale.gateway);check((await writes()).length===1,'Single scale command');const expected=choice===choices[0]?'off':choice===choices.at(-1)?'auto':choice.text==='Турбо'?'turbo':item.mode_scale.kind==='ac-speed'?Object.entries(item.option_labels).find(([,text])=>text===choice.text)?.[0]:item.mode_scale.kind.endsWith('temperature')?Number(choice.text.replace(/[^0-9.,-]/g,'').replace(',','.')):choice.text;check(sent.data.choice===expected,'Exact selected scale value');check(typeof sent.data.request_id==='string'&&sent.data.request_id.length>8,'Request receipt identity');check(await device(i).locator('.scale-choice').isDisabled(),'Scale waits for completed receipt');if(choice===choices[0])check(sent.data.choice==='off','Off semantic endpoint');if(choice===choices.at(-1))check(sent.data.choice==='auto','Auto semantic endpoint');}
  });
  await scenario('scale-drag-cancel-'+i+'-'+item.id,async()=>{
   const slider=device(i).locator(`[data-control-id="${item.id}"] input[type=range]`);await slider.scrollIntoViewIfNeeded();const box=await slider.boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width*.85,box.y+box.height/2,{steps:8});check((await writes()).length===0,'Dragging sends nothing');await page.keyboard.press('Escape');await page.mouse.up();check((await writes()).length===0,'Cancelled drag sends nothing');
  });
 }
 for(const goal of config.main.air_goals){
  await scenario('goal-'+goal.id,async()=>{const slider=summary.locator(`[data-air-goal="${goal.id}"] input`);for(const key of ['Home','End']){await slider.press(key);const sent=(await writes()).at(-1),value=(key==='End')!==!!goal.invert?100:0;verifyAction(sent,goal.set_action,{value});await set(goal.entity,value);}await page.evaluate(()=>window.controlAudit.fail=true);await slider.press('Home');check(await summary.locator('[role=alert]').count()>0,'Goal reports failure');});
  if(goal.boost)for(const duration of goal.boost.durations)await scenario('boost-'+goal.id+'-'+duration,async()=>{await set(goal.availability_entity,'on');await set(goal.boost.availability_entity,'on');const block=summary.locator(`[data-air-goal="${goal.id}"]`);await block.locator('.air-boost ha-m3-button').last().click();await block.locator('.air-boost-choices ha-m3-button').filter({hasText:String(duration)}).click();verifyAction((await writes()).at(-1),goal.boost.start_action,{duration});await set(goal.boost.active_entity,'on');await set(goal.boost.deadline_entity,'2099-01-01',{timestamp:Date.now()/1000+duration*60});await block.locator('.air-boost ha-m3-button').first().click();await block.locator('.popover-actions ha-m3-button').last().click();verifyAction((await writes()).at(-1),goal.boost.cancel_action);});
 }
 for(const preset of config.main.presets.filter(p=>p.id!=='maximum'))await scenario('preset-'+preset.id,async()=>{await openAutomation();await summary.locator('#automation-menu>details').first().locator('summary').click();await summary.locator(`[data-preset-id="${preset.id}"]`).click();verifyAction((await writes()).at(-1),preset.action);});
 for(const option of config.main.maximum.return_options)await scenario('maximum-return-'+option.value,async()=>{await openAutomation();await summary.locator('#automation-menu>details').first().locator('summary').click();await summary.locator('[data-preset-id=maximum]').click();check((await writes()).length===0,'Opening maximum sends nothing');await summary.locator('#maximum-menu').getByRole('radio',{name:option.name,exact:true}).check();await summary.locator('#maximum-menu .popover-actions ha-m3-button').last().click();verifyAction((await writes()).at(-1),config.main.maximum.start_action,{return_mode:option.value});});
 for(const alert of config.main.health_alerts||[])await scenario('fault-acknowledgement-'+alert.id,async()=>{
  await set(alert.status_entity,'recovery_required');await set(alert.acknowledgement_entity,'off');const box=summary.locator('.health-alert').filter({hasText:alert.name}),button=box.locator('ha-m3-button button');check(await button.isDisabled(),'Acknowledgement blocked until allowed');await set(alert.acknowledgement_entity,'on');await button.click();verifyAction((await writes()).at(-1),alert.acknowledge_action);check((await writes()).length===1,'Explicit acknowledgement only');
 });
 await scenario('parameter-menu-navigation-and-hold',async()=>{for(let i=0;i<config.cards.length;i++){
  const c=config.cards[i],item=c.quick_controls[0],field=device(i).locator(`[data-control-id="${item.id}"]`);await field.locator('.scale-details').click();const menu=device(i).locator('ha-m3-quick-settings-menu');check(await menu.locator('dialog').first().evaluate(e=>e.open),'Parameter button opens menu');await device(i).locator('.parameter-settings ha-m3-button').click();check(await menu.locator('.group').count()===c.settings_menu.groups.length,'All device settings are reachable');await page.keyboard.press('Escape');await menu.locator('dialog').first().waitFor({state:'hidden'});await field.locator('.field-caption').scrollIntoViewIfNeeded();const b=await field.locator('.field-caption').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.clock.fastForward(650);await page.mouse.up();check(await menu.locator('dialog').first().evaluate(e=>e.open),'Long hold opens parameter menu');await page.keyboard.press('Escape');await menu.locator('dialog').first().waitFor({state:'hidden'});
 }check((await writes()).length===0,'All menu navigation is read only');});
 for(let i=0;i<config.cards.length;i++)await scenario('runtime-stop-recovery-'+i,async()=>{
  const c=config.cards[i];await set(c.runtime_ready_entity,'off');check(await device(i).locator('.device-owner').isDisabled(),'Ownership blocked when runtime unavailable');await openDevice(i);
  const stop=device(i).getByRole('button',{name:'Остановить сейчас',exact:true});await stop.click();const request=(await writes()).at(-1);verifyAction(request,c.stop_only.gateway);check(await stop.isDisabled(),'Stop waits for observation');await set(c.stop_only.completed_entity,request.data.request_id);await set(c.entity,'off');check(!await stop.isDisabled(),'Stop observation releases action');
  const recovery=device(i).getByRole('button',{name:'Проверить управление',exact:true});check(await recovery.isDisabled(),'Unavailable controller rejects recovery locally');await device(i).evaluate(e=>e.checkRecovery());check((await writes()).length===1,'Recovery guard sends nothing while runtime is off');await set(c.recovery.transition_entity,'recovery_required');await set(c.runtime_ready_entity,'on');await recovery.click();const second=(await writes()).at(-1);verifyAction(second,c.recovery.gateway);check(await recovery.isDisabled(),'Recovery waits for exact completion');await set(c.recovery.request_entity,second.data.request_id);await set(c.recovery.completed_entity,second.data.request_id);await set(c.recovery.status_entity,'ready');await set(c.recovery.transition_entity,'idle');await set(c.runtime_ready_entity,'on');check(await device(i).getByText('Управление временно недоступно',{exact:true}).count()===0&&!await device(i).locator('.device-owner').isDisabled(),'Confirmed runtime restores controls');check((await writes()).length===2,'Stop and recovery are explicit only');
 });
 await scenario('room-readback-failure-retry-reconnect',async()=>{await openAutomation();const button=summary.locator('#automation-menu>.popover-row ha-m3-switch button');await page.evaluate(()=>window.controlAudit.fail=true);await button.click();check(!await button.isDisabled()&&await summary.locator('#automation-menu [role=alert]').count()>0,'Failure visible and retry possible');await page.evaluate(()=>window.controlAudit.fail=false);await button.click();check(await button.isDisabled(),'Retry waits readback');await summary.evaluate(e=>{const p=e.parentNode;e.remove();p.append(e);});await page.clock.fastForward(11000);check(!await button.isDisabled(),'Reconnect timeout releases switch');check(await summary.locator('#automation-menu [role=alert]').count()>0,'Timeout visible');check((await writes()).length===2,'No automatic retry');});
 await scenario('room-target-readback-and-timeout',async()=>{const input=summary.locator('.room-target input');await input.press('Home');const sent=(await writes()).at(-1);verifyAction(sent,config.main.target_action,{value:16});check(await input.isDisabled(),'Target waits readback');await set(config.main.entities.target_temperature,'16.0');check(!await input.isDisabled(),'Decimal readback accepted');await input.press('End');check(await input.isDisabled(),'New target waits');await page.clock.fastForward(11000);check(!await input.isDisabled(),'Timeout releases target');check(await summary.locator('[role=alert]').count()>0,'Unconfirmed target is reported');check((await summary.locator('.room-target output').innerText()).includes('16'),'Unconfirmed preview reverts');});
 await scenario('journal-filters-and-close',async()=>{const journal=summary.locator('ha-m3-journal-card');await journal.locator('.journal-launcher').click();check(await journal.locator('dialog').evaluate(e=>e.open),'Drawer opens');for(const index of[1,0]){const b=journal.locator('.filters button').nth(index);await b.click();check(await b.getAttribute('aria-pressed')==='true','Journal filter selected');}await journal.locator('.drawer-close').click();await journal.locator('dialog').waitFor({state:'hidden'});check(!await journal.locator('dialog').evaluate(e=>e.open),'Drawer closes');check((await writes()).length===0,'History stays read only');});
 await scenario('layout-and-metrics',async()=>{for(const width of [390,1440]){await page.setViewportSize({width,height:1000});check(await summary.locator('.room-metric').count()===4,'Four inline metrics');check(!await summary.locator('.room-target .endpoints').isVisible(),'Compact target matches mockup');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');await page.screenshot({path:path.join(root,`control-audit-${width}.png`),fullPage:true});}for(let i=0;i<4;i++){await summary.locator('.room-metric-button').nth(i).click();check(await page.evaluate(()=>window.controlAudit.events.length)===i+1,'Metric details opens');}const goals=summary.locator('.unified-goals');await set(config.main.entities.enabled,'on');await page.waitForTimeout(300);const auto=await goals.evaluate(e=>getComputedStyle(e).backgroundColor);await set(config.main.entities.enabled,'off');await page.waitForTimeout(300);check(await goals.getAttribute('data-ownership')==='manual','Room manual state');check(await goals.evaluate(e=>getComputedStyle(e).backgroundColor)!==auto,'Room ownership changes surface');});
 await scenario('desktop-round-owner-buttons',async()=>{
  await page.setViewportSize({width:1440,height:1000});
  for(let i=0;i<config.cards.length;i++){const b=await device(i).locator('.device-owner').boundingBox();check(b.width===48&&b.height===48,'Device Auto/lock button is a 48px circle');}
 });
 await scenario('desktop-runtime-stable-controls',async()=>{
  await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>scrollTo(0,0));
  const positions=()=>page.locator('ha-m3-quick-device-card .quick-fields').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
  const before=await positions();await set(config.cards[0].runtime_ready_entity,'off');const after=await positions();report.runtimeLayout={before,after};
  check(JSON.stringify(before)===JSON.stringify(after),'Runtime loss keeps every regulator in place');
  for(let i=0;i<config.cards.length;i++)check(!await device(i).getByRole('button',{name:'Проверить управление',exact:true}).isVisible(),'Recovery cannot appear under regulator pointer');
  await openDevice(0);check(await device(0).getByRole('button',{name:'Остановить сейчас',exact:true}).isEnabled(),'Emergency stop remains reachable');
  check(await device(0).getByRole('button',{name:'Проверить управление',exact:true}).isDisabled(),'Recovery is disabled while controller is not ready');
  check((await writes()).length===0,'Readiness and menus send no commands');
 });
 await scenario('desktop-dialog-detach-and-reopen',async()=>{
  await openDevice(0);const menu=device(0).locator('ha-m3-quick-settings-menu');
  const state=await menu.evaluate(async e=>{const parent=e.parentNode,next=e.nextSibling,d=e.renderRoot.querySelector('ha-m3-dialog.main');e.remove();parent.insertBefore(e,next);await e.updateComplete;const native=d.renderRoot.querySelector('dialog');const closed=!native.open&&!d.open;await e.show();return {closed,modal:native.matches(':modal')};});
  check(state.closed,'Detached dialog closes and clears its open state');check(state.modal,'Reopened dialog is modal');
  check((await writes()).length===0,'Dialog reconnect is read-only');
 });
 await scenario('desktop-dialog-open-detach-race',async()=>{
  const state=await page.evaluate(async()=>{const d=document.createElement('ha-m3-dialog');document.body.append(d);await d.updateComplete;const showing=d.show();d.remove();try{await showing;return {safe:true,open:d.open};}catch(e){return {safe:false,error:e.name};}});
  check(state.safe&&!state.open,'Pending show cannot open a detached dialog');
 });
 await scenario('desktop-keyboard-menu-focus',async()=>{
  await page.setViewportSize({width:1440,height:1000});const trigger=summary.locator('.unified-goals-heading ha-m3-button button');await trigger.focus();await trigger.press('Enter');
  await summary.locator('#automation-menu').waitFor({state:'visible'});await page.keyboard.press('Escape');await summary.locator('#automation-menu').waitFor({state:'hidden'});
  await page.waitForFunction(e=>e.getRootNode().activeElement===e,await trigger.elementHandle(),{timeout:2000});
  check(await trigger.evaluate(e=>e.getRootNode().activeElement===e),'Escape restores keyboard focus');check((await writes()).length===0,'Keyboard menus are read-only');
 });
}catch(e){report.fatal=e.stack;}finally{report.passed=!report.fatal&&!report.errors.length&&!report.external.length&&report.cases.every(c=>c.passed);await fs.writeFile(path.join(root,'control-audit-browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser?.close();await new Promise(r=>server.close(r));if(!report.passed)process.exitCode=1;}
