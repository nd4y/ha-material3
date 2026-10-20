// Run in the project's isolated Playwright environment; never connects to HA.
import fs from 'node:fs/promises';
const root=process.argv[2]||process.cwd();
const renderer=await fs.readFile(root+'/docs/tools/render-public-media.mjs','utf8');
// Share the public fixture server, dependency resolver and theme with media QA.
const setup=renderer.slice(0,renderer.indexOf('const report='));
const checks=String.raw`
let browser;
const errors=[],external=[];
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:1280,height:1000},locale:'ru-RU',reducedMotion:'reduce'});
 await context.route('**/*',route=>{if(new URL(route.request().url()).origin===base)return route.continue();external.push(route.request().url());return route.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/public-preview.html');await page.waitForFunction(()=>window.publicPreview);
 const journal=page.locator('ha-m3-journal-card');await journal.waitFor();
 const expect=(value,message)=>{if(!value)throw Error(message);};
 expect(await journal.locator('.feed li').count()===1,'Request and confirmation must be one action');
 expect((await journal.locator('.changes').innerText()).includes('50%'),'Before value missing');
 expect((await journal.locator('.changes').innerText()).includes('40%'),'Requested value missing');
 expect((await journal.locator('.cause').last().innerText()).includes('Воздух стал чище'),'Reason hidden');
 expect((await journal.locator('.result').innerText()).includes('подтвердил'),'Confirmation missing');
 await journal.getByText('Расчёт и исходные данные',{exact:true}).last().click();
 await page.evaluate(()=>window.publicPreview.update());
 expect(await journal.locator('.feed details[open]').count()===1,'Refresh collapsed open details');
 await journal.getByRole('button',{name:'Все записи',exact:true}).click();
 expect(await journal.locator('.feed li').count()===2,'All records must include plan without duplicating command');
 await journal.getByRole('button',{name:'Действия',exact:true}).click();
 await page.evaluate(()=>{const e=window.publicPreview.states['sensor.demo_journal'].attributes.entries;e[1].status='not_confirmed';window.publicPreview.update();});
 expect((await journal.locator('.result').innerText()).includes('не подтвердил'),'Timeout falsely confirmed');
 expect(await journal.locator('.badge.confirmed').count()===0,'Timeout marked as success');
 await page.evaluate(()=>{const p=window.publicPreview;p.states['sensor.demo_journal'].attributes.entries=[{id:'blocked',timestamp:'2026-01-01T12:00:03Z',status:'blocked',title:'Параметр сохранён',reason:'Питание сохранено вручную.'}];p.update();});
 expect((await journal.locator('.cause').innerText()).includes('вручную'),'Block reason hidden');
 expect((await journal.locator('.result').innerText()).includes('заблокировано'),'Block outcome missing');
 await page.setViewportSize({width:320,height:1000});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
 await page.evaluate(()=>{const p=window.publicPreview;p.states['sensor.demo_journal'].attributes.entries=[{id:'legacy1',timestamp:'2026-01-01T12:00:04Z',status:'requested',title:'<img src=x onerror="window.unsafe=true">',reason:'Same'},{id:'legacy2',timestamp:'2026-01-01T12:00:04Z',status:'confirmed',title:'<img src=x onerror="window.unsafe=true">',reason:'Same'}];p.update();});
 expect(await journal.locator('.feed li').count()===2,'Legacy records heuristically merged');
 expect(await journal.locator('img').count()===0&&!await page.evaluate(()=>window.unsafe),'Unsafe HTML evaluated');
 await page.evaluate(()=>{window.publicPreview.states['sensor.demo_journal'].state='unavailable';window.publicPreview.update();});
 expect(await journal.locator('.feed li').count()===0,'Unavailable feed leaked old results');
 expect((await journal.locator('.empty').innerText()).includes('недоступен'),'Missing source not explicit');
 expect(errors.length===0&&external.length===0,JSON.stringify({errors,external}));
 await fs.writeFile(root+'/journal-browser-report.json',JSON.stringify({passed:true,checks:17,errors,external_requests:external,live_ha_connection:false},null,2));
 console.log('Journal browser: 17 checks passed');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
`;
// Materialize beside the renderer so its relative module imports remain stable.
const tmp=root+'/docs/tools/.journal-browser-run.mjs';
try{await fs.writeFile(tmp,setup+checks);await import(new URL('file://'+tmp));}
finally{await fs.unlink(tmp).catch(()=>{});}