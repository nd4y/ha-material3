// Shipped components, synthetic HA states and mocked service writes only.
// Run on the build host: node scripts/test-hold-help-browser.mjs /work /tools
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
const theme=(await generateThemeData(preset))[preset.name];
const manifest=JSON.parse(await fs.readFile(path.join(root,'dist/release-manifest.json'),'utf8'));
const files=Object.fromEntries(manifest.files.map(item=>['/'+item.path,'dist/'+item.path]));
Object.assign(files,{'/unified.html':'dev/unified.html','/unified-demo.js':'dev/unified-demo.js','/public-preview.js':'dev/public-preview.js','/quick-demo.js':'dev/quick-demo.js'});
const server=http.createServer(async(req,res)=>{
  try{
    const route=new URL(req.url,'http://localhost').pathname;
    if(route==='/theme.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(theme));return;}
    if(route==='/favicon.ico'){res.writeHead(204);res.end();return;}
    if(!files[route]){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',route.endsWith('.js')?'text/javascript':route.endsWith('.woff2')?'font/woff2':'text/html');
    res.end(await fs.readFile(path.join(root,files[route])));
  }catch{res.writeHead(500);res.end('Synthetic fixture failure');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const report={version:manifest.version,synthetic_data_only:true,live_ha_connection:false,physical_actions:false,cases:[],errors:[],external_requests:[],screenshots:[],diagnostics:{}};
let browser,page,current,cdp;
const expect=(value,message)=>{if(!value)throw Error(message);current.assertions++;};
async function scenario(id,run){current={id,assertions:0,passed:false};report.cases.push(current);await run();current.passed=true;}
try{
  browser=await chromium.launch({headless:true,channel:process.env.M3_BROWSER_CHANNEL||undefined,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,locale:'ru-RU',reducedMotion:'reduce'});
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===base)return route.continue();
    report.external_requests.push(route.request().url());return route.abort();
  });
  page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));
  cdp=await context.newCDPSession(page);
  await page.goto(base+'/unified.html');await page.waitForFunction(()=>window.unifiedFixture?.ready);
  await page.evaluate(async()=>{
    await window.unifiedFixture.appearance('dark','reduced');
    window.unifiedFixture.resetOwners();
    window.unifiedFixture.summary.id='help-climate';
    // A second instance covers the Cabinet summary using the same shipped CTA.
    const home=document.createElement('ha-m3-climate-card');home.id='help-home';
    home.setConfig({...window.unifiedFixture.summary._config,layout:'summary',title:'Кабинет',presets:[],context_sensors:[],air_goals:[]});
    home.hass=window.unifiedFixture.hass;document.getElementById('summary').prepend(home);
    window.helpFixture={home};
  });
  const ac=page.locator('ha-m3-device-group-card ha-m3-quick-device-card').nth(0);
  const owner=ac.locator('[data-control-id="temperature"] button.owner');
  const trust=page.locator('#help-climate .trust-automation').getByRole('button');
  const homeTrust=page.locator('#help-home .trust-automation').getByRole('button');
  const help=page.locator('ha-m3-dialog[data-hold-help]');
  const popup=help.locator('dialog[open]');
  // The body is light DOM projected through the dialog's shadow-root slot.
  // Native dialog.innerText contains its heading but does not include that body.
  const helpText=async()=>({heading:await popup.locator('h2').innerText(),body:await help.locator('p').innerText()});
  const writes=()=>page.evaluate(()=>window.unifiedFixture.writes.length);
  const focusIs=target=>target.evaluate(element=>element.matches(':focus'));
  const reset=async()=>{await page.evaluate(()=>window.unifiedFixture.resetOwners());await owner.waitFor({state:'visible'});};
  async function point(target){await target.evaluate(element=>element.scrollIntoView({block:'center',inline:'nearest'}));const r=await target.boundingBox();return{x:r.x+r.width/2,y:r.y+r.height/2};}
  async function hold(target){
    const p=await point(target);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1,radiusX:3,radiusY:3,force:1}]});
    await popup.waitFor({state:'visible',timeout:2000});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  async function mouseHold(target){const p=await point(target);await page.mouse.move(p.x,p.y);await page.mouse.down();await popup.waitFor({state:'visible',timeout:2000});await page.mouse.up();}
  async function close(target,{escape=false}={}){
    if(escape)await page.keyboard.press('Escape');else await help.getByRole('button',{name:'Закрыть',exact:true}).click();
    await popup.waitFor({state:'hidden'});
    await page.waitForFunction(()=>!document.querySelector('ha-m3-dialog[data-hold-help]')?.open);
    expect(await focusIs(target),'Closing help did not restore the initiating control focus');
  }
  async function synthetic(target,type,extra={}){
    await target.dispatchEvent(type,{pointerId:44,pointerType:'touch',isPrimary:true,button:0,buttons:type==='pointerup'?0:1,clientX:100,clientY:200,...extra});
  }

  await scenario('short-touch-preserves-single-action',async()=>{
    await reset();let before=await writes();await point(owner);await owner.tap();
    await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_temperature'].state==='on');
    expect(await writes()===before+1,'Owner short tap must issue exactly one existing action');
    expect(await popup.count()===0,'Short owner tap opened help');
    before=await writes();await point(trust);await trust.tap();
    await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.master'].state==='on'&&window.unifiedFixture.states['input_boolean.lock_ac_temperature'].state==='off');
    expect(await writes()===before+1,'Trust short tap must issue exactly one existing action');
    expect(await popup.count()===0,'Short trust tap opened help');
  });

  await scenario('touch-hold-owner-help-without-action',async()=>{
    await reset();const before=await writes();await hold(owner);
    const content=await helpText();report.diagnostics.owner_help={...content,owner:await owner.getAttribute('data-owner')};
    expect(content.heading==='Цель в комнате','Owner help lacks parameter context');
    expect(content.body.includes('Автоматика дома'),'Owner help lacks the current automation meaning');
    expect(await writes()===before,'Long touch or its release sent an owner action');
    await close(owner,{escape:true});expect(await writes()===before,'Closing owner help sent an action');
    await owner.tap();await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_temperature'].state==='on');
    expect(await writes()===before+1,'A new tap remained suppressed after closing help');
  });

  await scenario('touch-hold-trust-help-on-both-surfaces',async()=>{
    for(const button of [trust,homeTrust]){
      const before=await writes();await hold(button);
      const content=await helpText();report.diagnostics.trust_help=content;
      expect(content.heading==='Доверить всё автоматике','Trust help lacks its action title');
      expect(content.body.toLowerCase().includes('автомат'),'Trust help lacks its action explanation');
      expect(await writes()===before,'Trust hold or release changed automation');
      await close(button);expect(await writes()===before,'Trust help dismissal changed automation');
    }
  });

  await scenario('desktop-hold-contextmenu-and-keyboard-help',async()=>{
    await page.setViewportSize({width:1440,height:1000});await reset();
    const before=await writes();await mouseHold(owner);await close(owner);
    await owner.focus();await page.keyboard.press('F1');await popup.waitFor({state:'visible'});await close(owner,{escape:true});
    await trust.click({button:'right'});await popup.waitFor({state:'visible'});await close(trust,{escape:true});
    expect(await writes()===before,'Desktop help gesture issued an action');
    await owner.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>window.unifiedFixture.states['input_boolean.lock_ac_temperature'].state==='on');
    expect(await writes()===before+1,'Enter activation no longer performs exactly one action');
  });

  await scenario('cancelled-and-moved-gestures-never-activate',async()=>{
    await page.setViewportSize({width:390,height:844});await reset();
    for(const type of ['pointercancel','pointerleave','pointermove','blur']){
      const before=await writes();await owner.focus();await synthetic(owner,'pointerdown');
      if(type==='blur')await owner.evaluate(element=>element.blur());
      else await synthetic(owner,type,type==='pointermove'?{clientX:126}:{});
      await page.waitForTimeout(700);await synthetic(owner,'pointerup');
      await owner.dispatchEvent('click',{detail:1,button:0});
      expect(await popup.count()===0,'Cancelled '+type+' gesture opened help');
      expect(await writes()===before,'Cancelled '+type+' gesture emitted a click action');
    }
  });

  await scenario('scroll-cancels-pending-help',async()=>{
    await reset();const before=await writes();await owner.scrollIntoViewIfNeeded();await synthetic(owner,'pointerdown');
    await page.evaluate(()=>window.scrollBy(0,60));await page.waitForTimeout(700);
    await synthetic(owner,'pointerup');await owner.dispatchEvent('click',{detail:1,button:0});
    expect(await popup.count()===0,'Scroll left a pending help timer');expect(await writes()===before,'Scroll turned into an action');
  });

  await scenario('disconnect-cleans-pending-and-open-help',async()=>{
    const before=await writes();await synthetic(homeTrust,'pointerdown');
    await page.locator('#help-home').evaluate(element=>element.remove());await page.waitForTimeout(700);
    expect(await popup.count()===0,'Disconnected control opened delayed help');
    await page.evaluate(()=>document.getElementById('summary').prepend(window.helpFixture.home));
    await hold(homeTrust);await page.locator('#help-home').evaluate(element=>element.remove());
    await popup.waitFor({state:'hidden'});expect(await help.count()===0,'Disconnected control leaked its modal');
    expect(await writes()===before,'Disconnecting help emitted a service');
    await page.evaluate(()=>document.getElementById('summary').prepend(window.helpFixture.home));
  });

  await scenario('help-contained-in-mobile-and-desktop-viewport',async()=>{
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:844});await owner.focus();await page.keyboard.press('F1');await popup.waitFor({state:'visible'});
      const geometry=await popup.evaluate(element=>{const r=element.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:window.innerWidth,height:window.innerHeight,scroll:element.scrollWidth,client:element.clientWidth};});
      expect(geometry.x>=-1&&geometry.right<=geometry.width+1,'Help extends horizontally beyond '+width+'px viewport');
      expect(geometry.y>=-1&&geometry.bottom<=geometry.height+1,'Help extends vertically beyond '+width+'px viewport');
      expect(geometry.scroll<=geometry.client+1,'Help text produces horizontal scrolling');
      await fs.mkdir(path.join(root,'hold-help-browser-artifacts'),{recursive:true});
      const file='hold-help-browser-artifacts/help-'+width+'.png';await page.screenshot({path:path.join(root,file),animations:'disabled'});report.screenshots.push(file);
      await close(owner,{escape:true});
    }
  });

  await scenario('preset-icons-and-text-help-preserve-tap-action',async()=>{
    await page.evaluate(()=>{window.helpFixture.originalClimateConfig=window.unifiedFixture.summary._config;});
    for(const style of ['icons','text']){
      await page.evaluate(async style=>{
        const fixture=window.unifiedFixture,card=fixture.summary;
        fixture.setState('input_select.mode','quiet');
        card.setConfig({...window.helpFixture.originalClimateConfig,layout:'calm',preset_style:style});
        await card.updateComplete;
      },style);
      const choice=page.locator('#help-climate').getByRole('button',{name:'Стандартный',exact:true});
      const before=await writes();await choice.focus();await page.keyboard.press('F1');await popup.waitFor({state:'visible'});
      const content=await helpText();report.diagnostics['preset_help_'+style]=content;
      expect(content.heading==='Стандартный','Preset '+style+' help lost its name');
      expect(content.body.includes('Тихий'),'Preset '+style+' help lost the current mode');
      expect(await writes()===before,'Preset '+style+' help sent an action');
      await close(choice,{escape:true});
      await point(choice);await choice.tap();await page.waitForFunction(()=>window.unifiedFixture.states['input_select.mode'].state==='standard');
      expect(await writes()===before+1,'Preset '+style+' tap did not issue exactly one original action');
    }
    await page.evaluate(async()=>{window.unifiedFixture.summary.setConfig(window.helpFixture.originalClimateConfig);await window.unifiedFixture.summary.updateComplete;});
  });

  // Diagnostic only: reproduce browser cancellation without changing any real HA state.
  // If still present, report a separate defect rather than silently relaxing help tests.
  await scenario('slider-cancel-diagnostic-no-service',async()=>{
    await reset();const input=ac.locator('[data-control-id="temperature"] ha-m3-slider').getByRole('slider'),before=await writes();
    report.diagnostics.slider_before=await input.evaluate(element=>({value:Number(element.value),output:element.getRootNode().host.shown}));
    await input.dispatchEvent('pointerdown',{pointerId:91,pointerType:'touch',button:0,isPrimary:true});
    await input.evaluate(element=>{element.value=String(Math.min(Number(element.max),Number(element.value)+2));element.dispatchEvent(new Event('input',{bubbles:true,composed:true}));});
    await input.dispatchEvent('pointercancel',{pointerId:91,pointerType:'touch',isPrimary:true});
    await page.waitForTimeout(100);
    report.diagnostics.slider_after=await input.evaluate(element=>({value:Number(element.value),output:element.getRootNode().host.shown,pressed:element.getRootNode().host._pressed}));
    report.diagnostics.slider_cancel_retains_uncommitted_value=report.diagnostics.slider_after.value!==report.diagnostics.slider_before.value;
    expect(await writes()===before,'Cancelled slider diagnostic unexpectedly sent a service');
  });

  await scenario('runtime-and-network-isolation',async()=>{
    expect(report.errors.length===0,JSON.stringify(report.errors));expect(report.external_requests.length===0,'Unexpected external request');
  });
  report.passed=true;
}catch(error){report.passed=false;report.error=error.stack||error.message;process.exitCode=1;}
finally{
  const artifacts=path.join(root,'hold-help-browser-artifacts');await fs.mkdir(artifacts,{recursive:true});
  if(page&&!page.isClosed())try{const file='hold-help-browser-artifacts/'+(report.passed?'accepted':'failure')+'.png';await page.screenshot({path:path.join(root,file),fullPage:true,animations:'disabled'});report.screenshots.push(file);}catch(error){report.screenshot_error=error.message;}
  await browser?.close();await new Promise(resolve=>server.close(resolve));
  report.assertions=report.cases.reduce((sum,item)=>sum+item.assertions,0);
  await fs.writeFile(path.join(root,'hold-help-browser-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({passed:report.passed,cases:report.cases.length,assertions:report.assertions,diagnostics:report.diagnostics,error:report.error}));
}
