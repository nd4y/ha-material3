import {Hct,SchemeTonalSpot,MaterialDynamicColors,argbFromHex,hexFromArgb} from '@material/material-color-utilities';

export function generatePalettes(){
  const dynamic=new MaterialDynamicColors();
  const palettes={};
  for(const [key,seed] of Object.entries({violet:'#6750A4',teal:'#006A6A',blue:'#415F91'})){
    palettes[key]={seed,modes:{}};
    for(const dark of [true,false]){
      const scheme=new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)),dark,0,'2025','phone');
      const roles={};
      for(const color of dynamic.allColors)roles[color.name.replaceAll('_','-')]=hexFromArgb(color.getArgb(scheme));
      palettes[key].modes[dark?'dark':'light']=roles;
    }
  }
  return palettes;
}
