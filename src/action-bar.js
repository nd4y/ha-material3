import {html,css,nothing} from 'lit';
import {M3BaseCard} from './cards.js';
import {validateAction,actionAvailable} from './ha.js';
import {holdDuration} from './hold-session.js';
import {locale} from './localize.js';
import './hold-button.js';

export class M3ActionBar extends M3BaseCard{
  static properties={...M3BaseCard.properties,_confirm:{state:true},_sent:{state:true}};
  static styles=[M3BaseCard.styles,css`
    :host{display:block}.surface{padding:8px}.actions{display:grid;grid-template-columns:repeat(var(--action-count,4),minmax(0,1fr));gap:4px}.actions ha-m3-button{min-width:0}dialog{border:0;border-radius:28px;padding:24px;background:var(--md-sys-color-surface-container-high);color:var(--md-sys-color-on-surface);width:min(400px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto}dialog::backdrop{background:color-mix(in srgb,var(--md-sys-color-scrim) 40%,transparent)}dialog h2{font-size:22px;line-height:28px}dialog p{margin-top:12px;color:var(--md-sys-color-on-surface-variant)}.confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}.feedback{margin:4px 8px;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}.feedback:empty{display:none}
    @media(max-width:700px){:host([floating]){position:fixed;bottom:max(8px,env(safe-area-inset-bottom));left:8px;right:8px;z-index:5}.surface{box-shadow:0 4px 20px #0005;border:1px solid var(--md-sys-color-outline-variant)}.actions ha-m3-button{font-size:12px}}
    @media(max-width:700px){dialog{margin:auto 0 0;width:100%;max-width:none;max-height:80dvh;border-radius:28px 28px 0 0;padding:24px 20px max(16px,env(safe-area-inset-bottom))}.confirm-actions{position:sticky;bottom:0;background:var(--md-sys-color-surface-container-high);display:grid;grid-template-columns:1fr 1fr}.confirm-actions ha-m3-button{margin:0;min-width:0}}
  `];
  setConfig(config){
    if(!Array.isArray(config.actions)||!config.actions.length||config.actions.length>4)throw new Error('Configure one to four quick actions');
    for(const item of config.actions){if(!item.name)throw new Error('Action name required');validateAction(item.action);if(item.confirmation!==undefined&&typeof item.confirmation!=='string')throw new Error('Confirmation must be text');if(item.activation!==undefined&&!['tap','hold'].includes(item.activation))throw new Error('activation must be tap or hold');if(item.hold_duration!==undefined||item.activation==='hold')holdDuration(item.hold_duration);}
    this.renderRoot?.querySelectorAll('ha-m3-hold-button').forEach(button=>button.cancel());this.renderRoot?.querySelector('dialog')?.close();this._confirm=null;
    super.setConfig(config);this.toggleAttribute('floating',config.mobile_floating!==false);
  }
  getCardSize(){return 1;}
  feedback(){return this._error?html`<p class="feedback" role="alert">${this.t('error')}</p>`:html`<p class="feedback" role="status">${this._busy?this.t('pending'):this._sent?this.t('commandSent'):''}</p>`;}
  disconnectedCallback(){clearTimeout(this._sentTimer);super.disconnectedCallback();}
  async execute(item){if(this._busy||!actionAvailable(this.hass,item.action))return;this._sent=false;await this.run(item.action);if(!this._error){this._sent=true;clearTimeout(this._sentTimer);this._sentTimer=setTimeout(()=>this._sent=false,2000);}}
  async confirm(item){if(this._busy||!actionAvailable(this.hass,item.action))return;this._confirm=item;await this.updateComplete;this.renderRoot.querySelector('dialog').showModal();}
  dismiss(){this.renderRoot.querySelector('dialog').close();this._confirm=null;}
  async select(item){
    if(item.activation==='hold')return;
    if(item.confirmation)await this.confirm(item);
    else await this.execute(item);
  }
  render(){const item=this._confirm;return html`<section class="surface" aria-label=${this._config.title||this.t('quickAccess')}><div class="actions" style=${'--action-count:'+(this._config.actions?.length||1)}>${this._config.actions?.map(a=>a.activation==='hold'?html`<ha-m3-hold-button .compact=${this._config.actions.length>1} .label=${a.name} .icon=${a.icon||''} .duration=${a.hold_duration??1200} .language=${locale(this.hass,this._config)} .disabled=${this._busy||!actionAvailable(this.hass,a.action)} @m3-confirm=${()=>this.execute(a)} @m3-confirm-request=${()=>this.confirm(a)}></ha-m3-hold-button>`:html`<ha-m3-button full kind="text" .icon=${a.icon||''} .disabled=${this._busy||!actionAvailable(this.hass,a.action)} @click=${()=>this.select(a)}>${a.name}</ha-m3-button>`)}</div>${this.feedback()}</section><dialog aria-labelledby="confirm-heading" @cancel=${()=>this._confirm=null}><h2 id="confirm-heading">${item?.name}</h2><p>${item?.confirmation||this.t('confirmAction')}</p><div class="confirm-actions"><ha-m3-button kind="text" @click=${()=>this.dismiss()}>${this.t('cancel')}</ha-m3-button><ha-m3-button kind="filled" .disabled=${this._busy||!item||!actionAvailable(this.hass,item.action)} @click=${async()=>{this.dismiss();if(item)await this.execute(item);}}>${item?.name}</ha-m3-button></div></dialog>`;}
}
customElements.define('ha-m3-action-bar',M3ActionBar);
