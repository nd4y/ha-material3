import {LitElement,html,css,nothing} from 'lit';
import {common} from './components.js';
import {Motion} from './motion.js';
// Compact Expressive slider: 12px tracks, 6px gaps, 4x44 handle,
// 2px handle for focus/pressed, 4px stop indicators. Native range semantics.
export class M3Slider extends LitElement{
  static properties={label:{},valueText:{},value:{type:Number},min:{type:Number},max:{type:Number},step:{type:Number},disabled:{type:Boolean},motion:{},_draft:{state:true},_pressed:{state:true},_focused:{state:true}};
  static styles=[common,css`
    :host{display:block;min-width:0}.root{position:relative;height:48px;min-height:48px;--position:0;--handle-width:4px;--handle-gap:calc(var(--handle-width)/2 + 6px)}.track{position:absolute;left:0;right:0;top:50%;height:12px;transform:translateY(-50%)}.active,.inactive{position:absolute;top:0;height:12px}.active{left:0;width:max(0px,calc(var(--position)*100% - var(--handle-gap)));border-radius:9999px 2px 2px 9999px;background:var(--ha-m3-slider-active-color,var(--md-sys-color-primary))}.inactive{left:min(100%,calc(var(--position)*100% + var(--handle-gap)));right:0;border-radius:2px 9999px 9999px 2px;background:var(--ha-m3-slider-inactive-color,var(--md-sys-color-secondary-container))}
    .handle{position:absolute;left:calc(var(--position)*100%);top:50%;transform:translate(-50%,-50%);height:44px;width:var(--handle-width);border-radius:9999px;background:var(--ha-m3-slider-handle-color,var(--ha-m3-slider-active-color,var(--md-sys-color-primary)))}.halo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;background:var(--ha-m3-slider-active-color,var(--md-sys-color-primary));opacity:0;transition:opacity var(--fx-fast)}.root:hover:not(.disabled) .halo{opacity:.08}.root.focused:not(.disabled) .halo,.root.pressed:not(.disabled) .halo{opacity:.1}
    .root:has(input:focus-visible) .handle::after{content:'';position:absolute;inset:-6px;border-radius:8px;border:3px solid var(--md-sys-color-secondary)}
    .stop{position:absolute;top:50%;transform:translateY(-50%);width:4px;height:4px;border-radius:50%;background:var(--md-sys-color-on-secondary-container)}.stop.end{right:4px}.stop.start{left:4px;background:var(--md-sys-color-on-primary)}
    input{appearance:none;-webkit-appearance:none;position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;opacity:0;cursor:pointer;touch-action:pan-y}input::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:0;height:48px}input::-moz-range-thumb{width:0;height:48px;border:0}
    .disabled .active{background:color-mix(in srgb,var(--md-sys-color-on-surface) 38%,transparent)}.disabled .inactive{background:color-mix(in srgb,var(--md-sys-color-on-surface) 12%,transparent)}.disabled .handle,.disabled .stop{background:color-mix(in srgb,var(--md-sys-color-on-surface) 38%,transparent)}.disabled input{cursor:default}
    @media(forced-colors:active){.active,.handle,.stop{background:Highlight}.inactive{background:GrayText}input{opacity:1;appearance:auto}}
    :host([motion=reduced]) .halo{transition:none}
  `];
  constructor(){super();this.label='';this.value=0;this.min=0;this.max=100;this.step=1;this.disabled=false;this._draft=null;this._pressed=false;this._focused=false;this._editing=false;this._uncommitted=false;this._cancelled=false;this.anim=new Motion(this);this._windowBlur=()=>this.cancelEdit('blur');this._visibilityChanged=()=>{if(this.ownerDocument.hidden)this.cancelEdit('hidden');};}
  connectedCallback(){super.connectedCallback();this.ownerDocument.defaultView.addEventListener('blur',this._windowBlur);this.ownerDocument.addEventListener('visibilitychange',this._visibilityChanged);}
  get shown(){return this._draft??this.value;}
  focus(){this.renderRoot.querySelector('input')?.focus();}
  willUpdate(changed){if(changed.has('disabled')&&this.disabled)this.cancelEdit('disabled');if((changed.has('value')&&!this._editing)||(changed.has('disabled')&&!this.disabled))this._draft=null;}
  updated(){const root=this.renderRoot.querySelector('.root'),p=this.max>this.min?Math.max(0,Math.min(1,(this.shown-this.min)/(this.max-this.min))):0;if(this._draft!==null)this.anim.snap(root,'--position',p,'');else this.anim.number(root,'--position',p,'fastSpatial','');this.anim.number(root,'--handle-width',!this.disabled&&(this._pressed||this._focused)?2:4);}
  disconnectedCallback(){this.cancelEdit('disconnect');this.ownerDocument.defaultView.removeEventListener('blur',this._windowBlur);this.ownerDocument.removeEventListener('visibilitychange',this._visibilityChanged);super.disconnectedCallback();this.anim.stop();}
  beginEdit(){if(!this._editing){this._editStart=this.value;this._editing=true;}}
  input(event){
    if(this.disabled||this._cancelled){event.target.value=String(this.shown);return;}
    this.beginEdit();this._uncommitted=true;this._draft=Number(event.target.value);
    this.dispatchEvent(new CustomEvent('m3-input',{detail:{value:this._draft},bubbles:true,composed:true}));
  }
  change(event){
    if(this.disabled||this._cancelled){event.target.value=String(this.shown);return;}
    this._draft=Number(event.target.value);this._editing=false;this._uncommitted=false;
    this.dispatchEvent(new CustomEvent('m3-change',{detail:{value:this._draft},bubbles:true,composed:true}));
  }
  cancelEdit(reason){
    const pending=this._uncommitted,value=this._editStart;
    this._pressed=false;
    if(this._editing)this._cancelled=true;
    this._editing=false;this._uncommitted=false;
    if(!pending)return;
    // Parent previews may already have fed the draft back through .value.
    // Restore the gesture baseline first, then let consumers read fresh HA data.
    this._draft=null;this.value=value;
    const input=this.renderRoot?.querySelector('input');if(input)input.value=String(value);
    this.dispatchEvent(new CustomEvent('m3-cancel',{detail:{value,reason},bubbles:true,composed:true}));
  }
  pointerDown(event){if(this.disabled||event.isPrimary===false||event.button!==0)return;this._cancelled=false;this.beginEdit();this._pressed=true;}
  keyDown(event){
    if(event.key==='Escape'){this.cancelEdit('escape');return;}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)){this._cancelled=false;this.beginEdit();}
  }
  render(){const p=(this.shown-this.min)/(this.max-this.min);return html`<div class="root ${this.disabled?'disabled':''} ${this._pressed?'pressed':''} ${this._focused?'focused':''}"><div class="track" aria-hidden="true"><span class="active"></span><span class="inactive"></span>${p>.02?html`<span class="stop start"></span>`:''}${p<.98?html`<span class="stop end"></span>`:''}</div><span class="handle" aria-hidden="true"><span class="halo"></span></span><input type="range" aria-label=${this.label} aria-valuetext=${this.valueText||nothing} .min=${String(this.min)} .max=${String(this.max)} .step=${String(this.step)} .value=${String(this.shown)} ?disabled=${this.disabled} @input=${this.input} @change=${this.change} @pointerdown=${this.pointerDown} @pointerup=${()=>{this._pressed=false;if(!this._uncommitted)this._editing=false;}} @pointercancel=${()=>this.cancelEdit('pointercancel')} @keydown=${this.keyDown} @focus=${()=>{this._focused=true;this._cancelled=false;}} @blur=${()=>{this._focused=false;this.cancelEdit('blur');}}></div>`;}
}
customElements.define('ha-m3-slider',M3Slider);
