import defaults from '../tokens/design-system.json' with {type:'json'};
import foundation from '../tokens/foundation.json' with {type:'json'};
export const designSystem=defaults;
export function resolveDesignSystem(overrides={}){
  const c={...defaults,...overrides,shape:{...defaults.shape,...overrides.shape},spacing:{...defaults.spacing,...overrides.spacing},layout:{...defaults.layout,...overrides.layout}};
  if(!/^#[a-f0-9]{6}$/i.test(c.seed_color)||typeof c.name!=='string'||!c.name.trim())throw new Error('Invalid theme name or seed_color');
  if(typeof c.font_family!=='string'||/[\r\n]/.test(c.font_family))throw new Error('Invalid font_family');
  if(c.neutral_palette!==null){
    const n=c.neutral_palette;
    if(!n||typeof n!=='object'||Array.isArray(n)||Object.keys(n).some(k=>!['hue','chroma','variant_chroma'].includes(k)))throw new Error('Invalid neutral_palette');
    const variant=n.variant_chroma??n.chroma+2;
    if(!Number.isFinite(n.hue)||n.hue<0||n.hue>=360||![n.chroma,variant].every(v=>Number.isFinite(v)&&v>=0&&v<=200))throw new Error('Invalid neutral_palette');
    c.neutral_palette={hue:n.hue,chroma:n.chroma,variant_chroma:variant};
  }
  for(const group of ['shape','spacing','layout'])for(const value of Object.values(c[group]))if(!Number.isFinite(value)||value<=0||value>4096)throw new Error('Invalid design dimension');
  if(!['surface','surface-container-low','surface-container','surface-container-high','surface-container-highest'].includes(c.temperature_surface))throw new Error('Invalid temperature_surface');
  for(const[mode,roles]of Object.entries(c.color_overrides||{})){
    if(!['dark','light'].includes(mode)||!roles||typeof roles!=='object'||Array.isArray(roles))throw new Error('Invalid color overrides');
    for(const[role,value]of Object.entries(roles))if(!/^[a-z][a-z-]+$/.test(role)||!/^#[a-f0-9]{6}$/i.test(value))throw new Error('Invalid color role');
  }
  return c;
}
export function appTokens(c=defaults){return{'card-radius':c.shape.card+'px','temperature-radius':c.shape.temperature+'px','card-padding':c.spacing.card+'px','compact-card-padding':c.spacing.compact_card+'px','section-gap':c.spacing.section+'px','row-gap':c.spacing.row+'px','content-width':c.layout.max_width+'px','primary-track':c.layout.primary_ratio+'fr','font-family':c.font_family,'temperature-background':`var(--md-sys-color-${c.temperature_surface})`};}
const mapping={'primary-color':'primary','accent-color':'primary','primary-background-color':'surface','secondary-background-color':'surface-container-low','card-background-color':'surface-container','ha-card-background':'surface-container','primary-text-color':'on-surface','secondary-text-color':'on-surface-variant','divider-color':'outline-variant','disabled-text-color':'outline','error-color':'error','app-header-background-color':'surface','app-header-text-color':'on-surface','sidebar-background-color':'surface','sidebar-text-color':'on-surface-variant','sidebar-icon-color':'on-surface-variant','sidebar-selected-text-color':'on-secondary-container','sidebar-selected-icon-color':'on-secondary-container','sidebar-selected-background-color':'secondary-container','state-icon-color':'on-surface-variant','state-icon-active-color':'primary','state-active-color':'primary'};
export function themeDefinition(modes,settings=defaults){
  const c=resolveDesignSystem(settings),theme={'ha-m3-seed-color':c.seed_color,'primary-font-family':c.font_family,'ha-font-family-body':c.font_family,'ha-font-family-heading':c.font_family,'md-ref-typeface-plain':c.font_family,'md-ref-typeface-brand':c.font_family,'ha-card-border-radius':c.shape.card+'px','ha-card-border-width':'0px','ha-card-box-shadow':'none',modes:{}};
  for(const[k,v]of Object.entries(appTokens(c)))theme['ha-m3-'+k]=v;
  for(const[role,tuple]of Object.entries(foundation.typography))['size','line-height','tracking','weight'].forEach((field,i)=>{const value=String(tuple[i])+(i===3?'':'px');theme[`ha-m3-type-${role}-${field}`]=value;theme[`md-sys-typescale-${role}-${field}`]=value;});
  for(const[mode,roles]of Object.entries(modes)){
    const values={};for(const[ha,md]of Object.entries(mapping))values[ha]=roles[md];
    for(const[role,value]of Object.entries(roles)){values['ha-m3-color-'+role]=value;values['md-sys-color-'+role]=value;}
    theme.modes[mode]=values;
  }
  return{[c.name]:theme};
}
