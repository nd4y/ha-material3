import {LitElement,html,css,nothing} from 'lit';
import {Motion} from './motion.js';
export const symbols=['ac_unit','add','air','arrow_back','arrow_forward','auto_awesome','check','check_circle','chevron_right','close','delete','devices','eco','error','expand_more','home','humidity_percentage','info','kitchen','lightbulb','lock','meeting_room','menu','menu_book','mode_fan','more_horiz','open_in_full','pause','play_arrow','power_settings_new','refresh','remove','settings','thermostat','thermostat_auto','tune','vacuum','videocam','water_drop'];
const symbolSet=new Set(symbols);
export const icon=(name)=>html`<span class="symbol" aria-hidden="true">${symbolSet.has(name)?name:'devices'}</span>`;
export const common=css`
  :host{display:block;font-family:'HA M3 Roboto',Roboto,Arial,sans-serif;color:var(--md-sys-color-on-surface);font-size:14px;line-height:20px;letter-spacing:.25px;--fx-fast:var(--ha-m3-effects-duration,150ms) cubic-bezier(.31,.94,.34,1)}
  *,*::before,*::after{box-sizing:border-box} [hidden]{display:none!important}
  .symbol{font-family:'HA M3 Symbols';font-size:24px;line-height:1;font-weight:400;font-style:normal;letter-spacing:normal;white-space:nowrap;direction:ltr;font-feature-settings:'liga';display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
  h1,h2,h3,p{margin:0} h1,h2,h3{font-weight:400;letter-spacing:0}button,input,select{font:inherit}button{color:inherit}
  .support{color:var(--md-sys-color-on-surface-variant)}.headline{font-size:var(--md-sys-typescale-headline-small-size,24px);line-height:var(--md-sys-typescale-headline-small-line-height,32px)}.title{font-size:var(--md-sys-typescale-title-large-size,22px);line-height:var(--md-sys-typescale-title-large-line-height,28px)}
  .error{border-radius:12px;padding:16px;color:var(--md-sys-color-on-error-container);background:var(--md-sys-color-error-container);font-size:14px;line-height:20px}
  .live{font-size:14px;line-height:20px;color:var(--md-sys-color-on-surface-variant)}
  .spinner{width:20px;height:20px;display:inline-block;border:3px solid color-mix(in srgb,currentColor 24%,transparent);border-top-color:currentColor;border-radius:50%;animation:var(--ha-m3-progress-animation,m3-spin) 1s linear infinite}
  @keyframes m3-spin{to{transform:rotate(360deg)}}
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;scroll-behavior:auto!important}}
  @media(forced-colors:active){button{border:1px solid ButtonText!important}.error{border:1px solid CanvasText}}
`;

export class M3Button extends LitElement{
  static shadowRootOptions={mode:'open',delegatesFocus:true};
  static properties={label:{},icon:{},kind:{},selected:{type:Boolean},toggle:{type:Boolean},disabled:{type:Boolean},loading:{type:Boolean},position:{},tabOrder:{type:Number},controlRole:{},_pressed:{state:true},motion:{}};
  static styles=[common,css`
    :host{display:inline-flex;vertical-align:middle;min-width:48px} :host([full]){display:flex;width:100%}
    button{position:relative;isolation:isolate;display:flex;gap:8px;align-items:center;justify-content:center;min-height:48px;min-width:48px;width:100%;padding:4px 16px;background:transparent;border:0;outline:0;cursor:pointer;font-size:14px;line-height:20px;letter-spacing:.1px;font-weight:500;white-space:nowrap}
    .shape{position:absolute;inset:4px 0;z-index:-1;border-radius:var(--tl,20px) var(--tr,20px) var(--br,20px) var(--bl,20px);background:var(--md-sys-color-secondary-container);color:inherit;overflow:hidden;transition:background-color var(--fx-fast)}
    button{color:var(--md-sys-color-on-secondary-container)}.state{position:absolute;inset:0;background:currentColor;opacity:0;transition:opacity var(--fx-fast)}
    button:hover:not(:disabled) .state{opacity:.08}button:focus-visible:not(:disabled) .state{opacity:.1}button:active:not(:disabled) .state{opacity:.1}
    button:focus-visible{outline:3px solid var(--md-sys-color-secondary);outline-offset:2px;border-radius:12px;z-index:2}
    .icon{width:48px;padding:4px}.icon .shape{inset:4px}.icon .symbol{font-size:24px}
    .filled,.selected{color:var(--md-sys-color-on-primary)}.filled .shape,.selected .shape{background:var(--md-sys-color-primary)}
    .text{color:var(--md-sys-color-primary)}.text .shape,.row .shape{background:transparent}
    .row{padding:8px 16px;min-height:72px;justify-content:flex-start;text-align:left;white-space:normal;color:var(--md-sys-color-on-surface);font-weight:400;font-size:16px;line-height:24px;letter-spacing:.5px;gap:16px}
    .row .shape{inset:0}.row slot{flex:1}.row .symbol{color:var(--md-sys-color-on-surface-variant)}
    .connected{padding:4px 12px;min-width:48px}.connected .symbol{font-size:18px}
    button:disabled{cursor:default;color:color-mix(in srgb,var(--md-sys-color-on-surface) 38%,transparent)}button:disabled .shape{background:color-mix(in srgb,var(--md-sys-color-on-surface) 12%,transparent)}
    button.text:disabled .shape,button.row:disabled .shape{background:transparent}
    .check{width:18px;overflow:hidden;display:inline-flex}.check[hidden]{display:none}
    :host([motion=reduced]) *{animation:none!important;transition:none!important}
  `];
  constructor(){super();this.kind='tonal';this.label='';this.selected=false;this.disabled=false;this.loading=false;this.tabOrder=0;this._pressed=false;this.anim=new Motion(this);}
  focus(options){this.renderRoot.querySelector('button')?.focus(options);}
  disconnectedCallback(){super.disconnectedCallback();this.anim.stop();}
  updated(){
    const shape=this.renderRoot.querySelector('.shape'),connected=this.kind==='connected';
    let corners=connected?[8,8,8,8]:this.kind==='row'?[0,0,0,0]:[20,20,20,20];
    if(connected){if(this.position==='first')corners=[20,8,8,20];if(this.position==='last')corners=[8,20,20,8];if(this.position==='only')corners=[20,20,20,20];if(this.selected)corners=[20,20,20,20];}
    if(this._pressed&&!this.disabled&&!this.loading){corners=connected?[4,4,4,4]:this.kind==='row'?[0,0,0,0]:[8,8,8,8];if(connected&&this.position==='first')corners=[20,4,4,20];if(connected&&this.position==='last')corners=[4,20,20,4];}
    ['--tl','--tr','--br','--bl'].forEach((k,i)=>this.anim.number(shape,k,corners[i]));
  }
  render(){const disabled=this.disabled||this.loading;return html`<button type="button" class="${this.kind} ${this.selected?'selected':''}" ?disabled=${disabled} tabindex=${this.tabOrder} role=${this.controlRole||nothing} aria-label=${this.label||nothing} aria-pressed=${this.toggle?String(this.selected):nothing} aria-checked=${this.controlRole==='radio'?String(this.selected):nothing} aria-busy=${this.loading?'true':nothing} @pointerdown=${()=>this._pressed=true} @pointerup=${()=>this._pressed=false} @pointercancel=${()=>this._pressed=false} @pointerleave=${()=>this._pressed=false} @blur=${()=>this._pressed=false} @keydown=${e=>{if(e.key===' '||e.key==='Enter')this._pressed=true;}} @keyup=${()=>this._pressed=false}><span class="shape"><span class="state"></span></span>${this.loading?html`<span class="spinner" aria-hidden="true"></span>`:this.icon?icon(this.icon):nothing}<slot></slot></button>`;}
}
customElements.define('ha-m3-button',M3Button);

export class M3Switch extends LitElement{
  static properties={selected:{type:Boolean},disabled:{type:Boolean},loading:{type:Boolean},label:{},motion:{},_pressed:{state:true}};
  static styles=[common,css`
    :host{display:inline-block;width:52px;flex:0 0 52px}button{position:relative;width:52px;height:48px;border:0;background:transparent;padding:8px 0;cursor:pointer;border-radius:20px;outline:0}
    .track{position:relative;display:block;width:52px;height:32px;border:2px solid var(--md-sys-color-outline);border-radius:9999px;background:var(--md-sys-color-surface-container-highest);transition:background-color var(--fx-fast),border-color var(--fx-fast)}
    .handle{position:absolute;left:var(--handle-x,2px);top:50%;width:var(--handle-size,24px);height:var(--handle-size,24px);transform:translateY(-50%);display:grid;place-items:center;border-radius:9999px;background:var(--md-sys-color-outline);color:var(--md-sys-color-surface-container-highest);transition:background-color var(--fx-fast),color var(--fx-fast)}
    .handle .symbol{font-size:16px}.state{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:9999px;background:var(--md-sys-color-on-surface);opacity:0;transition:opacity var(--fx-fast)}
    button:hover:not(:disabled) .state{opacity:.08}button:focus-visible .state{opacity:.1}button:active:not(:disabled) .state{opacity:.1}button:focus-visible{outline:3px solid var(--md-sys-color-secondary);outline-offset:2px}
    button[aria-checked=true] .track{background:var(--md-sys-color-primary);border-color:var(--md-sys-color-primary)}button[aria-checked=true] .handle{background:var(--md-sys-color-on-primary);color:var(--md-sys-color-on-primary-container)}button[aria-checked=true] .state{background:var(--md-sys-color-primary)}
    button:disabled{cursor:default}.disabled .track{background:color-mix(in srgb,var(--md-sys-color-on-surface) 12%,transparent);border-color:color-mix(in srgb,var(--md-sys-color-on-surface) 12%,transparent)}.disabled .handle{background:color-mix(in srgb,var(--md-sys-color-on-surface) 38%,transparent);color:var(--md-sys-color-surface)}.disabled[aria-checked=true] .handle{background:var(--md-sys-color-surface);color:color-mix(in srgb,var(--md-sys-color-on-surface) 38%,transparent)}
    :host([motion=reduced]) *{animation:none!important;transition:none!important}
  `];
  constructor(){super();this.selected=false;this.disabled=false;this.loading=false;this.label='';this._pressed=false;this.anim=new Motion(this);}
  focus(options){this.renderRoot.querySelector('button')?.focus(options);}
  disconnectedCallback(){super.disconnectedCallback();this.anim.stop();}
  updated(){const h=this.renderRoot.querySelector('.handle'),size=this._pressed&&!this.disabled&&!this.loading?28:24;this.anim.number(h,'--handle-size',size);this.anim.number(h,'--handle-x',(this.selected?34:14)-size/2);}
  render(){return html`<button class=${this.disabled||this.loading?'disabled':''} type="button" role="switch" aria-label=${this.label} aria-checked=${String(this.selected)} ?disabled=${this.disabled||this.loading} aria-busy=${this.loading?'true':nothing} @click=${()=>this.dispatchEvent(new CustomEvent('m3-change',{detail:{selected:!this.selected},bubbles:true,composed:true}))} @pointerdown=${()=>this._pressed=true} @pointerup=${()=>this._pressed=false} @pointerleave=${()=>this._pressed=false} @pointercancel=${()=>this._pressed=false} @blur=${()=>this._pressed=false} @keydown=${e=>{if([' ','Enter'].includes(e.key))this._pressed=true;}} @keyup=${()=>this._pressed=false}><span class="track"><span class="handle"><span class="state"></span>${this.loading?html`<span class="spinner" aria-hidden="true"></span>`:icon(this.selected?'check':'close')}</span></span></button>`;}
}
customElements.define('ha-m3-switch',M3Switch);

export class M3ConnectedGroup extends LitElement{
  static properties={options:{attribute:false},value:{},disabled:{type:Boolean},loading:{},label:{},motion:{}};
  static styles=[common,css`:host{display:block}.group{display:flex;gap:2px;align-items:center}ha-m3-button{flex:1 1 auto;min-width:48px}`];
  constructor(){super();this.options=[];this.value=null;this.label='';}
  async focus(){await this.updateComplete;const id=this.value||this.options.find(o=>!o.disabled)?.id;if(id){const button=this.renderRoot.querySelector(`[data-id="${CSS.escape(id)}"]`);await button?.updateComplete;button?.focus();}}
  key(event){const i=this.options.findIndex(o=>o.id===event.target.dataset.id);if(i<0||!['ArrowRight','ArrowLeft','ArrowDown','ArrowUp','Home','End'].includes(event.key))return;event.preventDefault();const enabled=this.options.filter(o=>!o.disabled&&!this.disabled);if(!enabled.length)return;const current=enabled.findIndex(o=>o.id===this.options[i].id);const n=event.key==='Home'?0:event.key==='End'?enabled.length-1:(current+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+enabled.length)%enabled.length;this.renderRoot.querySelector(`[data-id="${CSS.escape(enabled[n].id)}"]`).focus();this.choose(enabled[n].id);}
  choose(id){if(this.disabled||this.options.find(o=>o.id===id)?.disabled)return;this.dispatchEvent(new CustomEvent('m3-select',{detail:{value:id},bubbles:true,composed:true}));}
  render(){const first=this.options.find(o=>!o.disabled);return html`<div class="group" role="radiogroup" aria-label=${this.label} @keydown=${this.key}>${this.options.map((o,i)=>html`<ha-m3-button full kind="connected" .label=${o.name} .selected=${this.value===o.id} .disabled=${this.disabled||o.disabled} .loading=${this.loading===o.id} .position=${this.options.length===1?'only':i===0?'first':i===this.options.length-1?'last':'middle'} .tabOrder=${this.value===o.id||(!this.value&&o.id===first?.id)?0:-1} controlRole="radio" .icon=${this.value===o.id?'check':''} motion=${this.motion||'expressive'} data-id=${o.id} @click=${()=>this.choose(o.id)}>${o.name}</ha-m3-button>`)}</div>`;}
}
customElements.define('ha-m3-connected-group',M3ConnectedGroup);

export class M3Dialog extends LitElement{
  static properties={heading:{},motion:{},open:{type:Boolean},_closing:{state:true}};
  static styles=[common,css`
    dialog{border:0;border-radius:28px;background:var(--md-sys-color-surface-container-high);color:var(--md-sys-color-on-surface);padding:24px;width:min(560px,calc(100vw - 32px));max-height:calc(100dvh - 48px);margin:auto;overflow:auto;box-shadow:0 8px 24px color-mix(in srgb,var(--md-sys-color-shadow) 24%,transparent);transform:translateY(var(--dialog-y,0px)) scale(var(--dialog-scale,1));opacity:var(--dialog-opacity,1)}
    dialog::backdrop{background:color-mix(in srgb,var(--md-sys-color-scrim) 32%,transparent);animation:m3-scrim-in var(--ha-m3-scrim-duration,200ms) cubic-bezier(.34,.80,.34,1) both}dialog.closing::backdrop{animation:m3-scrim-out var(--ha-m3-scrim-duration,200ms) cubic-bezier(.34,.80,.34,1) both}@keyframes m3-scrim-in{from{background:transparent}to{background:color-mix(in srgb,var(--md-sys-color-scrim) 32%,transparent)}}@keyframes m3-scrim-out{from{background:color-mix(in srgb,var(--md-sys-color-scrim) 32%,transparent)}to{background:transparent}}:host([motion=reduced]) dialog::backdrop{animation:none}@media(prefers-reduced-motion:reduce){dialog::backdrop{animation:none}}header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}h2{font-size:24px;line-height:32px}section{font-size:14px;line-height:20px;color:var(--md-sys-color-on-surface-variant)}footer{display:flex;justify-content:flex-end;padding-top:16px}ha-m3-button{margin:-8px -8px 0 0}
  `];
  constructor(){super();this.heading='';this.open=false;this._closing=false;this.anim=new Motion(this);}
  async show(){clearTimeout(this.closeTimer);this.open=true;this._closing=false;await this.updateComplete;const d=this.renderRoot.querySelector('dialog');if(!d.open){d.showModal();this.anim.number(d,'--dialog-y',24);this.anim.number(d,'--dialog-scale',.92,'defaultSpatial','');this.anim.number(d,'--dialog-opacity',0,'defaultEffects','');}this.anim.number(d,'--dialog-y',0,'defaultSpatial');this.anim.number(d,'--dialog-scale',1,'defaultSpatial','');this.anim.number(d,'--dialog-opacity',1,'defaultEffects','');}
  close(){if(!this.open||this._closing)return;this._closing=true;const d=this.renderRoot.querySelector('dialog');this.anim.number(d,'--dialog-y',16,'fastSpatial');this.anim.number(d,'--dialog-scale',.96,'fastSpatial','');this.anim.number(d,'--dialog-opacity',0,'fastEffects','');this.closeTimer=setTimeout(()=>{d.close();this.open=false;this._closing=false;this.dispatchEvent(new CustomEvent('m3-closed'));},this.anim.reduced()?0:200);}
  disconnectedCallback(){super.disconnectedCallback();clearTimeout(this.closeTimer);this.anim.stop();}
  render(){return html`<dialog class=${this._closing?'closing':''} aria-labelledby="heading" @cancel=${e=>{e.preventDefault();this.close();}} @click=${e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.close();}}}><header><h2 id="heading">${this.heading}</h2><ha-m3-button kind="icon" label="${this.lang.startsWith('en')?'Close':'Закрыть'}" icon="close" @click=${this.close}></ha-m3-button></header><section><slot></slot></section><footer><slot name="actions"></slot></footer></dialog>`;}
}
customElements.define('ha-m3-dialog',M3Dialog);
