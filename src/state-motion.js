import {LitElement,html,css,nothing} from 'lit';
import {common,icon} from './components.js';

// Two bounded layers. Changing state never queues an old transition or changes
// the action associated with a control. Only the current layer is semantic.
export class M3StateIcon extends LitElement {
  static properties={name:{},motion:{},_previous:{state:true}};
  static styles=[common,css`
    :host{display:inline-grid;position:relative;width:1em;height:1em;font-size:22px;flex:none;vertical-align:middle;color:inherit}
    .glyph{grid-area:1/1;display:grid;place-items:center;width:100%;height:100%;pointer-events:none;color:inherit}.symbol{font-size:inherit;line-height:1}
    .old{position:absolute;inset:0}
  `];
  constructor(){super();this.name='';this.motion='expressive';this._previous='';this._animations=[];this._generation=0;this._reduce=()=>{if(this.reduced())this.stop();};this._visible=()=>{if(document.hidden)this.stop();};}
  reduced(){return this.motion==='reduced'||this._media?.matches||document.hidden||getComputedStyle(this).getPropertyValue('--ha-m3-motion-reduced').trim()==='1';}
  connectedCallback(){super.connectedCallback();this._media=matchMedia('(prefers-reduced-motion: reduce)');this._media.addEventListener('change',this._reduce);document.addEventListener('visibilitychange',this._visible);}
  disconnectedCallback(){this.stop();this._media?.removeEventListener('change',this._reduce);document.removeEventListener('visibilitychange',this._visible);super.disconnectedCallback();}
  stop(){this._generation++;for(const a of this._animations)a.cancel();this._animations=[];this._previous='';}
  willUpdate(changed){if(changed.has('name')){const old=changed.get('name');this.stop();if(old&&old!==this.name&&!this.reduced())this._previous=old;}else if(this.reduced())this.stop();}
  updated(changed){
    if(!changed.has('name')||!this._previous||this.reduced())return;
    const generation=this._generation,live=this.renderRoot.querySelector('.live'),old=this.renderRoot.querySelector('.old'),options={duration:240,easing:'cubic-bezier(.2,.8,.2,1)'};
    this._animations=[old.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'translateY(-4px) scale(.65) rotate(16deg)'}],{...options,duration:170}),live.animate([{opacity:0,transform:'translateY(4px) scale(.65) rotate(-16deg)'},{opacity:1,transform:'none'}],options)];
    Promise.allSettled(this._animations.map(a=>a.finished)).then(()=>{if(this._generation===generation){this._animations=[];this._previous='';}});
  }
  render(){return html`${this._previous?html`<span class="glyph old" aria-hidden="true">${icon(this._previous)}</span>`:nothing}<span class="glyph live" aria-hidden="true">${icon(this.name)}</span>`;}
}
customElements.define('ha-m3-state-icon',M3StateIcon);
export const stateIcon=(name,motion='expressive')=>html`<ha-m3-state-icon aria-hidden="true" .name=${name} .motion=${motion}></ha-m3-state-icon>`;

// Text remains a single accessible value; only its visual layer moves.
export class StateMotion {
  constructor(host){this.host=host;this.values=new WeakMap();this.animations=new Map();}
  sync(){
    const reduced=this.host.motion==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden;
    for(const [el,a]of this.animations)if(reduced||!el.isConnected){a.cancel();this.animations.delete(el);}
    for(const el of this.host.renderRoot.querySelectorAll('[data-state-value],output')){
      const value=el.textContent,previous=this.values.get(el);this.values.set(el,value);if(previous===undefined||previous===value)continue;
      this.animations.get(el)?.cancel();if(reduced)continue;
      const animation=el.animate([{opacity:.6,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:160,easing:'ease-out'});this.animations.set(el,animation);
      animation.finished.catch(()=>{}).finally(()=>{if(this.animations.get(el)===animation)this.animations.delete(el);});
    }
  }
  stop(){for(const a of this.animations.values())a.cancel();this.animations.clear();}
}
