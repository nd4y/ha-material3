import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath}from'node:url';import{createRequire}from'node:module';import{build}from'esbuild';
import{resolveDesignSystem,themeDefinition}from'../src/design-system.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function generateTheme(overrides={}){
  const settings=resolveDesignSystem(overrides);
  const result=await build({absWorkingDir:root,entryPoints:['scripts/generate-tokens.js'],bundle:true,platform:'node',format:'cjs',write:false,target:'node22'});
  const file=path.join(root,'build/theme-colors.cjs');await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,result.outputFiles[0].text);
  const modes=createRequire(import.meta.url)(file).generatePalettes({custom:settings.seed_color}).custom.modes;
  const definition=themeDefinition(modes,settings);
  function yaml(obj,indent=0){return Object.entries(obj).map(([k,v])=>' '.repeat(indent)+JSON.stringify(k)+':'+(v&&typeof v==='object'?'\n'+yaml(v,indent+2):' '+JSON.stringify(v)+'\n')).join('');}
  return yaml(definition);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),config=args.includes('--config')?args[args.indexOf('--config')+1]:null,output=args.includes('--output')?args[args.indexOf('--output')+1]:null;
  if(!output)throw new Error('Usage: node scripts/theme.mjs [--config settings.json] --output theme.yaml');
  const overrides=config?JSON.parse(await fs.readFile(config,'utf8')):{};await fs.writeFile(output,await generateTheme(overrides));console.log('Theme written: '+output);
}
