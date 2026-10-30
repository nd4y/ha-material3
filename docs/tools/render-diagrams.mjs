// Render only the controller diagrams. No HA credentials or frontend build needed.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const root=path.resolve(process.argv[2]||'.'),tools=path.resolve(process.argv[3]||'/work/tools');
const require=createRequire(path.join(tools,'loader.cjs')),{chromium}=require('playwright-core');
const mermaidRoot=path.join(tools,'node_modules/mermaid/dist');
const server=http.createServer(async(req,res)=>{try{
  const route=new URL(req.url,'http://localhost').pathname;
  if(route==='/'){res.end('<!doctype html><html lang="ru"><body style="margin:0;background:#101317"></body></html>');return;}
  if(!route.startsWith('/mermaid/')){res.statusCode=404;res.end();return;}
  const file=path.resolve(mermaidRoot,route.slice(9));
  if(!file.startsWith(mermaidRoot+path.sep))throw Error('Path outside renderer assets');
  res.setHeader('Content-Type','text/javascript');res.end(await fs.readFile(file));
}catch{res.statusCode=500;res.end('Render asset error');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const report={backend_version:'0.4.42',mermaid_version:require('mermaid/package.json').version,diagrams:[],external_requests:[],page_errors:[]};
let browser;
try{
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1600,height:1200},locale:'ru-RU'});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin===base)return route.continue();report.external_requests.push(route.request().url());return route.abort();});
  const page=await context.newPage();page.on('pageerror',e=>report.page_errors.push(e.message));await page.goto(base);
  const directory=path.join(root,'docs/diagrams');
  for(const file of (await fs.readdir(directory)).filter(x=>x.endsWith('.mmd')).sort()){
    const source=await fs.readFile(path.join(directory,file),'utf8');
    const svg=await page.evaluate(async({source,id,base})=>{
      const {default:mermaid}=await import(base+'/mermaid/mermaid.esm.min.mjs');
      mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'base',themeVariables:{darkMode:true,background:'#101317',primaryColor:'#24364a',primaryTextColor:'#e9eff7',primaryBorderColor:'#9ccaff',lineColor:'#9ccaff',secondaryColor:'#1b2633',tertiaryColor:'#1b2633',edgeLabelBackground:'#101317',fontFamily:'Arial, sans-serif',fontSize:'16px'},flowchart:{htmlLabels:false,curve:'linear',padding:16}});
      await mermaid.parse(source);return(await mermaid.render(id,source)).svg;
    },{source,id:'controller-'+file.slice(0,2),base});
    await fs.writeFile(path.join(directory,file.replace('.mmd','.svg')),svg);
    await page.evaluate(svg=>document.body.innerHTML=svg,svg);
    const bounds=await page.locator('svg').boundingBox();if(!bounds||bounds.width<100||bounds.height<100)throw Error('Empty diagram '+file);
    // Small QA contact sheets are captured by the build wrapper; only overview is public PNG.
    if(file==='01-overview.mmd')await page.locator('svg').screenshot({path:path.join(directory,'01-overview.png')});
    if(process.env.DIAGRAM_QA){await fs.mkdir(process.env.DIAGRAM_QA,{recursive:true});await page.locator('svg').screenshot({path:path.join(process.env.DIAGRAM_QA,file.replace('.mmd','.png'))});}
    report.diagrams.push({file,source_sha256:crypto.createHash('sha256').update(source).digest('hex'),svg_sha256:crypto.createHash('sha256').update(svg).digest('hex'),rendered:true});
  }
  if(report.external_requests.length||report.page_errors.length)throw Error('Unexpected renderer errors');
  report.passed=true;
}finally{
  await browser?.close();await new Promise(resolve=>server.close(resolve));
  await fs.writeFile(path.join(root,'docs/diagrams/render-report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
}
