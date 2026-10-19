import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
const manifest=JSON.parse(await fs.readFile(path.join(out,'release-manifest.json'),'utf8')),bundle=await fs.readFile(path.join(out,'ha-material3.js'),'utf8');
const failures=[];
for(const[file,expected]of Object.entries(manifest.sources||{}))if(crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex')!==expected)failures.push('Stale build: '+file);
for(const file of manifest.files){const bytes=await fs.readFile(path.join(out,file.path));if(crypto.createHash('sha256').update(bytes).digest('hex')!==file.sha256)failures.push('Hash mismatch: '+file.path);}
if(/<\/?md-[a-z]|["']md-(?:outlined-select|select-option|menu|slider|ripple|focus-ring)["']/.test(bundle))failures.push('Unprefixed Material element');
if(/\b(?:sensor|climate|fan|camera)\.[a-z_0-9]*_ru_\d{8,}|\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(bundle))failures.push('Unexpected installation identifier or literal IP');
if(/(?:fetch\(|new WebSocket|XMLHttpRequest|https:\/\/fonts\.)/.test(bundle))failures.push('Runtime external dependency');
const fontDefs=await fs.readFile(path.join(root,'src/theme.js'),'utf8'),assetDefs=await fs.readFile(path.join(root,'src/asset-url.js'),'utf8');if(!fontDefs.includes('assetUrl(name,import.meta.url,__VERSION__)')||!assetDefs.includes('new URL(`./${name}`,moduleUrl)')||!assetDefs.includes("url.searchParams.set('v',version)"))failures.push('Versioned local flat asset base missing');
if(manifest.files.some(f=>f.path.includes('/')||f.path.includes('\\')))failures.push('HACS release assets must have flat filenames');
const typeSource=await fs.readFile(path.join(root,'node_modules/@material/web/tokens/versions/latest/sass/_md-sys-typescale.scss'),'utf8'),foundation=JSON.parse(await fs.readFile(path.join(root,'tokens/foundation.json'),'utf8'));
let typeChecks=0;for(const[role,values]of Object.entries(foundation.typography)){for(const[i,field]of ['size','line-height','tracking'].entries()){const m=typeSource.match(new RegExp('\\$'+role+'-'+field+': ([\\d.-]+)rem;'));typeChecks++;if(!m||Math.abs(Number(m[1])*16-values[i])>.001)failures.push(role+'.'+field);}const w=typeSource.match(new RegExp('\\$'+role+"-wght: 'wght' (\\d+);"));typeChecks++;if(!w||Number(w[1])!==values[3])failures.push(role+'.weight');}
const shapes=await fs.readFile(path.join(root,'node_modules/@material/web/tokens/versions/latest/sass/_md-sys-shape.scss'),'utf8');let shapeChecks=0;for(const[role,value]of Object.entries(foundation.shape)){const m=shapes.match(new RegExp('\\$'+(role==='full'?'corner-full':'corner-value-'+role)+': ([\\d.]+)px;'));shapeChecks++;if(!m||Number(m[1])!==value)failures.push('shape.'+role);}
const report={version:manifest.version,files:manifest.files.length,bytes:manifest.files.reduce((s,f)=>s+f.bytes,0),typeChecks,shapeChecks,failures};
await fs.writeFile(path.join(root,'release-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
