import {html,css,nothing} from 'lit';
import {M3BaseCard} from './cards.js';
import './quick-card.js';
import {deviceGroupConfig} from './device-group-config.js';

// Configuration-only composition. Child controls retain their own actions,
// busy guards and state; the group never sends or combines service calls.
export class M3DeviceGroupCard extends M3BaseCard{
  static styles=[M3BaseCard.styles,css`
    .surface{padding:0;overflow:visible;background:transparent}.group-title{font-size:18px;line-height:24px;font-weight:500;margin:0 4px 12px}.devices{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;min-width:0}.device{display:block;min-width:0}
    @container(min-width:850px){.devices{grid-template-columns:repeat(var(--device-columns,3),minmax(0,1fr));gap:16px}}
    @container(max-width:350px){.surface{padding:8px}.devices{gap:10px}}
  `];
  constructor(){super();this._children=[];}
  setConfig(config){
    const next=deviceGroupConfig(config);
    // HA can deliver the same configuration while a child action is pending.
    // Retain its focus, draft and busy guard instead of creating a new control.
    if(JSON.stringify(next)===this._signature){this.requestUpdate();return;}
    const children=next.cards.map(card=>{
      const child=document.createElement('ha-m3-quick-device-card');child.setConfig(card);child.classList.add('device');return child;
    });
    this._config=next;this._signature=JSON.stringify(next);this._children=children;this.requestUpdate();
  }
  willUpdate(changed){super.willUpdate(changed);for(const child of this._children)child.hass=this.hass;}
  getCardSize(){return this._children.reduce((size,card)=>size+card.getCardSize(),0);}
  getGridOptions(){return{columns:12,rows:'auto',min_columns:6};}
  render(){return html`<section class="surface" aria-label=${this._config.title||this.t('devicesGroup')}>${this._config.title?html`<h2 class="group-title">${this._config.title}</h2>`:nothing}<div class="devices" style=${`--device-columns:${Math.min(3,this._children.length)}`}>${this._children}</div></section>`;}
}
customElements.define('ha-m3-device-group-card',M3DeviceGroupCard);
