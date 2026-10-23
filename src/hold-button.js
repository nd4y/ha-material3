import {LitElement,html,css} from 'lit';
import {common,icon} from './components.js';
import {HoldSession} from './hold-session.js';

export class M3HoldButton extends LitElement{
  static properties={label:{},icon:{},disabled:{type:Boolean},compact:{type:Boolean,reflect:true},duration:{type:Number},language:{},_holding:{state:true},_ready:{state:true}};
  static styles=[common,css`
    :host{display:flex;min-width:0}button{position:relative;isolation:isolate;overflow:hidden;min-height:56px;width:100%;min-width:48px;padding:8px 12px;display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:20px;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);cursor:pointer;touch-action:pan-y;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
    .copy{min-width:0;display:flex;flex-direction:column;align-items:center;line-height:20px;font-weight:500}.hint{font-size:10px;line-height:14px;font-weight:400}.progress{position:absolute;bottom:0;left:0;right:0;height:4px;background:var(--md-sys-color-primary);transform:scaleX(0);transform-origin:left}.holding .progress{transform:scaleX(1);transition:transform var(--hold-duration) linear}.holding{background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container)}.ready{outline:2px solid var(--md-sys-color-primary);outline-offset:-2px}button:hover:not(:disabled){filter:brightness(1.08)}button:focus-visible{outline:3px solid var(--md-sys-color-primary);outline-offset:2px}button:disabled{opacity:.38;cursor:default}.hint{white-space:nowrap}
    :host([compact]) button{flex-direction:column;gap:0;padding:4px;min-height:68px}:host([compact]) .symbol{font-size:20px}:host([compact]) .hint{font-size:9px;line-height:12px}
    @media(prefers-reduced-motion:reduce){.holding .progress{transition:none;transform:scaleX(0)}.ready .progress{transform:scaleX(1)}}
  `];
  constructor(){super();this.duration=1200;this.label='';this.language='en';this.disabled=false;this._holding=false;this._ready=false;this.session=new HoldSession();this._abort=()=>this.cancel();}
  connectedCallback(){super.connectedCallback();window.addEventListener('blur',this._abort);document.addEventListener('visibilitychange',this._abort);}
  disconnectedCallback(){this.cancel();window.removeEventListener('blur',this._abort);document.removeEventListener('visibilitychange',this._abort);super.disconnectedCallback();}
  willUpdate(changes){if(changes.has('disabled')&&this.disabled||changes.has('duration')){this.cancel();this.session=new HoldSession(this.duration);}}
  focus(options){this.renderRoot.querySelector('button')?.focus(options);}
  cancel(){clearTimeout(this.timer);this.session.cancel();this._holding=false;this._ready=false;}
  start(id){if(this.disabled||document.hidden||!this.session.start(id,performance.now())){this.cancel();return false;}this._holding=true;this._ready=false;this.timer=setTimeout(()=>{if(this.session.id===id)this._ready=true;},this.duration);return true;}
  release(id){const confirmed=!this.disabled&&!document.hidden&&this.session.release(id,performance.now());this.cancel();this._lastGesture=performance.now();if(confirmed)this.dispatchEvent(new CustomEvent('m3-confirm',{bubbles:true,composed:true}));}
  pointerDown(e){if(!e.isPrimary||e.button!==0){this.cancel();return;}if(this.start(e.pointerId))e.currentTarget.setPointerCapture(e.pointerId);}
  pointerMove(e){if(this.session.id!==e.pointerId)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)this.cancel();}
  keyDown(e){if(e.key==='Escape'){this.cancel();return;}if(![' ','Enter'].includes(e.key))return;e.preventDefault();if(!e.repeat)this.start('key:'+e.key);}
  keyUp(e){if(![' ','Enter'].includes(e.key))return;e.preventDefault();this.release('key:'+e.key);}
  click(e){e.preventDefault();e.stopPropagation();if(e.detail===0&&!this.disabled&&performance.now()-(this._lastGesture??-Infinity)>500)this.dispatchEvent(new CustomEvent('m3-confirm-request',{bubbles:true,composed:true}));}
  render(){const ru=this.language.startsWith('ru'),hint=this._ready?(ru?(this.compact?'Отпустите':'Отпустите для подтверждения'):'Release to confirm'):(ru?(this.compact?'Держать ':'Удерживайте ')+(this.duration/1000).toLocaleString('ru')+' с':'Hold '+this.duration/1000+' s');return html`<button type="button" class="${this._holding?'holding':''} ${this._ready?'ready':''}" style=${'--hold-duration:'+this.duration+'ms'} ?disabled=${this.disabled} aria-label=${this.label} aria-describedby="hint" @pointerdown=${this.pointerDown} @pointermove=${this.pointerMove} @pointerup=${e=>this.release(e.pointerId)} @pointercancel=${this.cancel} @lostpointercapture=${this.cancel} @blur=${this.cancel} @keydown=${this.keyDown} @keyup=${this.keyUp} @contextmenu=${e=>e.preventDefault()} @click=${this.click}>${this.icon?icon(this.icon):''}<span class="copy"><span>${this.label}</span><span id="hint" class="hint" aria-live="polite">${hint}</span></span><span class="progress" aria-hidden="true"></span></button>`;}
}
customElements.define('ha-m3-hold-button',M3HoldButton);
