import {Hct,SchemeTonalSpot,MaterialDynamicColors,TonalPalette,argbFromHex,hexFromArgb} from '@material/material-color-utilities';

export function createColorRoles(seed,dark,neutralPalette=null){
  const scheme=new SchemeTonalSpot(Hct.fromInt(argbFromHex(seed)),dark,0,'2025','phone');
  if(neutralPalette){
    scheme.neutralPalette=TonalPalette.fromHueAndChroma(neutralPalette.hue,neutralPalette.chroma);
    scheme.neutralVariantPalette=TonalPalette.fromHueAndChroma(neutralPalette.hue,neutralPalette.variant_chroma);
  }
  const roles={};
  for(const color of new MaterialDynamicColors().allColors)roles[color.name.replaceAll('_','-')]=hexFromArgb(color.getArgb(scheme));
  return roles;
}
