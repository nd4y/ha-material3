import {createColorRoles} from './color-scheme.js';
import foundation from '../tokens/foundation.json' with {type:'json'};
import {designSystem,appTokens} from './design-system.js';
import {assetUrl} from './asset-url.js';
const cache=new Map();
export function colorRoles(seed=designSystem.seed_color,dark=true){
  const key=seed+dark;if(cache.has(key))return cache.get(key);
  const roles=createColorRoles(seed,dark,designSystem.neutral_palette);
  cache.set(key,roles);return roles;
}
export function applyTheme(host,config,hass){
  const a=config?.appearance||{},scheme=a.scheme||'auto',dark=scheme==='auto'?hass?.themes?.darkMode??true:scheme==='dark',inherit=!a.seed_color&&(!a.scheme||a.scheme==='auto');
  host.style.setProperty('--ha-m3-motion-reduced',a.motion==='reduced'?'1':'0');
  host.style.setProperty('--ha-m3-effects-duration',a.motion==='reduced'?'0ms':'150ms');
  host.style.setProperty('--ha-m3-scrim-duration',a.motion==='reduced'?'0ms':'200ms');
  host.style.setProperty('--ha-m3-progress-animation',a.motion==='reduced'?'none':'m3-spin');
  const key=(a.seed_color||designSystem.seed_color)+dark+inherit;if(host._themeKey===key)return;host._themeKey=key;
  for(const[k,v]of Object.entries(colorRoles(a.seed_color,dark)))host.style.setProperty(`--md-sys-color-${k}`,inherit?`var(--ha-m3-color-${k},${v})`:v);
  for(const[role,v]of Object.entries(foundation.typography))['size','line-height','tracking','weight'].forEach((field,i)=>host.style.setProperty(`--md-sys-typescale-${role}-${field}`,`var(--ha-m3-type-${role}-${field},${v[i]+(i===3?'':'px')})`));
  for(const[k,v]of Object.entries(appTokens()))host.style.setProperty('--ha-m3-ui-'+k,k==='temperature-background'&&!inherit?v:`var(--ha-m3-${k},${v})`);
  host.style.colorScheme=dark?'dark':'light';
}
const asset=(name)=>assetUrl(name,import.meta.url,__VERSION__);
export function loadFonts(){
  if(document.getElementById('ha-material3-fonts'))return;
  const style=document.createElement('style');style.id='ha-material3-fonts';
  style.textContent=`@font-face{font-family:'HA M3 Roboto';font-style:normal;font-weight:100 900;font-display:swap;src:url('${asset('roboto-latin.woff2')}') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD} @font-face{font-family:'HA M3 Roboto';font-style:normal;font-weight:100 900;font-display:swap;src:url('${asset('roboto-cyrillic.woff2')}') format('woff2');unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116} @font-face{font-family:'HA M3 Symbols';font-style:normal;font-weight:400;font-display:block;src:url('${asset('material-symbols-rounded.woff2')}') format('woff2')}`;
  document.head.append(style);
}
