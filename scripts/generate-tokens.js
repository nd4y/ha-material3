import {createColorRoles} from '../src/color-scheme.js';

export function generatePalettes(seeds={violet:'#6750A4',teal:'#006A6A',blue:'#415F91'},neutralPalette=null){
  const palettes={};
  for(const [key,seed] of Object.entries(seeds)){
    palettes[key]={seed,modes:{}};
    for(const dark of [true,false]){
      palettes[key].modes[dark?'dark':'light']=createColorRoles(seed,dark,neutralPalette);
    }
  }
  return palettes;
}
