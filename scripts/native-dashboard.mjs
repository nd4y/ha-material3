import fs from 'node:fs/promises';
import {createNativeDashboard} from '../src/native-dashboard.js';
const args=process.argv.slice(2),value=flag=>args.includes(flag)?args[args.indexOf(flag)+1]:null;
const input=value('--input'),output=value('--output'),dashboard_path=value('--dashboard-path'),settings=value('--options');
if(!input||!output||!dashboard_path||input===output)throw new Error('Usage: node scripts/native-dashboard.mjs --input old.json --output native.json --dashboard-path /your-dashboard [--options options.json]. Input and output must differ.');
const options=settings?JSON.parse(await fs.readFile(settings,'utf8')):{};
const result=createNativeDashboard(JSON.parse(await fs.readFile(input,'utf8')),{...options,dashboard_path});
await fs.writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({views:result.views.length,output,offline:true}));
