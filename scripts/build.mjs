import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
await fs.mkdir(path.join(out,'assets'),{recursive:true});
const namespace={name:'namespace-material-web',setup(b){b.onLoad({filter:/@material[\\/]web[\\/].*\.js$/},async args=>{
  let contents=await fs.readFile(args.path,'utf8');
  if(/[\\/]menu[\\/]internal[\\/]menu\.js$/.test(args.path)){
    if(!contents.includes('const FULL_DURATION = 500;')||!contents.includes('const FULL_DURATION = 150;'))throw new Error('Vendor motion adapter needs review');
    // Dropdowns are non-gestural: use the M3 published Web conversion curves.
    const split=contents.indexOf('    animateClose()');
    const opening=contents.slice(0,split).replaceAll('easing: EASING.EMPHASIZED',"easing: 'cubic-bezier(.38,1.21,.22,1)' ").replace('const SURFACE_OPACITY_DURATION = 50;','const SURFACE_OPACITY_DURATION = 200;').replace('const ITEM_OPACITY_DURATION = 250;','const ITEM_OPACITY_DURATION = 150;');
    const closing=contents.slice(split).replace('const FULL_DURATION = 150;','const FULL_DURATION = 350;').replaceAll('easing: EASING.EMPHASIZED_ACCELERATE',"easing: 'cubic-bezier(.42,1.67,.21,.90)' ");
    contents=opening+closing;
  }
  if(args.path.endsWith('-styles.cssresult.js')){
    const end=contents.lastIndexOf('`;');
    if(end>=0)contents=contents.slice(0,end)+'\n:host([data-m3-reduced]) *, :host([data-m3-reduced]) *::before, :host([data-m3-reduced]) *::after {transition:none!important;animation:none!important}\n@media(prefers-reduced-motion:reduce){*,*::before,*::after{transition:none!important;animation:none!important}}\n'+contents.slice(end);
  }
  contents=contents.replace(/<\/md-([a-z][a-z0-9-]*)/g,'</ha-m3-md-$1').replace(/(?<![-/\w])md-(?=[a-z])/g,'ha-m3-md-');return{contents,loader:'js'};
});}};
await build({absWorkingDir:root,entryPoints:['src/index.js'],outfile:path.join(out,'ha-material3.js'),bundle:true,format:'iife',target:'es2022',minify:true,sourcemap:true,legalComments:'eof',banner:{js:'const __m3ModuleUrl = import.meta.url; if (!customElements.get("ha-m3-panel")) {'},footer:{js:`}\nexport const version = ${JSON.stringify(pkg.version)};`},define:{__VERSION__:JSON.stringify(pkg.version),'import.meta.url':'__m3ModuleUrl'},plugins:[namespace],metafile:true}).then(async r=>fs.writeFile(path.join(root,'build-meta.json'),JSON.stringify(r.metafile,null,2)));
const fontDir=path.join(root,'node_modules/@fontsource-variable/roboto');
for(const subset of ['latin','cyrillic'])await fs.copyFile(path.join(fontDir,`files/roboto-${subset}-wght-normal.woff2`),path.join(out,`assets/roboto-${subset}.woff2`));
await fs.copyFile(path.join(fontDir,'LICENSE'),path.join(out,'assets/roboto-LICENSE.txt'));
for(const file of ['material-symbols-rounded.woff2','material-symbols-LICENSE.txt','material-symbols-source.json'])await fs.copyFile(path.join(root,'assets',file),path.join(out,'assets',file));
await fs.copyFile(path.join(root,'LICENSE'),path.join(out,'LICENSE'));
await fs.copyFile(path.join(root,'THIRD_PARTY_NOTICES.md'),path.join(out,'THIRD_PARTY_NOTICES.md'));
const colorsBuild=await build({absWorkingDir:root,entryPoints:['scripts/generate-tokens.js'],bundle:true,platform:'node',format:'cjs',write:false,target:'node22'});
const colorsFile=path.join(root,'build/release-colors.cjs');await fs.mkdir(path.dirname(colorsFile),{recursive:true});await fs.writeFile(colorsFile,colorsBuild.outputFiles[0].text);
const palettes=createRequire(import.meta.url)(colorsFile).generatePalettes(),roles=palettes.violet.modes;
const mappings={'primary-color':'primary','accent-color':'primary','primary-background-color':'surface','secondary-background-color':'surface-container-low','card-background-color':'surface-container','ha-card-background':'surface-container','primary-text-color':'on-surface','secondary-text-color':'on-surface-variant','divider-color':'outline-variant','disabled-text-color':'outline','error-color':'error','sidebar-background-color':'surface','sidebar-text-color':'on-surface-variant','sidebar-selected-text-color':'primary'};
let theme='Material 3 Expressive:\n  modes:\n';for(const mode of ['dark','light']){theme+=`    ${mode}:\n`;for(const [ha,md]of Object.entries(mappings))theme+=`      ${ha}: "${roles[mode][md]}"\n`;}
await fs.mkdir(path.join(root,'themes'),{recursive:true});await fs.writeFile(path.join(root,'themes/ha-material3.yaml'),theme);
const files=['ha-material3.js','LICENSE','THIRD_PARTY_NOTICES.md',...(await fs.readdir(path.join(out,'assets'))).map(f=>'assets/'+f)];
const manifest={name:pkg.name,version:pkg.version,files:[],sources:{}};for(const file of files){const bytes=await fs.readFile(path.join(out,file));manifest.files.push({path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}
const sourceFiles=['package.json','package-lock.json',...(await fs.readdir(path.join(root,'scripts'))).filter(f=>/\.(mjs|js|py)$/.test(f)).map(f=>'scripts/'+f),...(await fs.readdir(path.join(root,'src'))).filter(f=>f.endsWith('.js')).map(f=>'src/'+f),...(await fs.readdir(path.join(root,'tokens'))).filter(f=>f.endsWith('.json')).map(f=>'tokens/'+f)];
for(const file of sourceFiles.sort())manifest.sources[file]=crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex');
await fs.writeFile(path.join(out,'release-manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({version:pkg.version,files:manifest.files.length,bytes:manifest.files.reduce((sum,f)=>sum+f.bytes,0)}));
