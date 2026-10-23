import {html,css,nothing} from 'lit';
import {M3BaseCard} from './cards.js';
import {validateAction,actionAvailable} from './ha.js';

export class M3ActionBar extends M3BaseCard{
  static properties={...M3BaseCard.properties,_confirm:{state:true}};
  static styles=[M3BaseCard.styles,css`
    :host{display:block}.surface{padding:8px}.actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.actions ha-m3-button{min-width:0}dialog{border:0;border-radius:24px;padding:24px;background:var(--md-sys-color-surface-container-high);color:var(--md-sys-color-on-surface);max-width:min(360px,calc(100vw - 48px))}dialog::backdrop{background:#0008}.confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
    @media(max-width:700px){:host([floating]){position:fixed;bottom:max(8px,env(safe-area-inset-bottom));left:8px;right:8px;z-index:5}.surface{box-shadow:0 4px 20px #0005;border:1px solid var(--md-sys-color-outline-variant)}.actions ha-m3-button{font-size:12px}}
  `];
  setConfig(config){
    if(!Array.isArray(config.actions)||!config.actions.length||config.actions.length>4)throw new Error('Configure one to four quick actions');
    for(const item of config.actions){if(!item.name)throw new Error('Action name required');validateAction(item.action);if(item.confirmation!==undefined&&typeof item.confirmation!=='string')throw new Error('Confirmation must be text');}
    super.setConfig(config);this.toggleAttribute('floating',config.mobile_floating!==false);
  }
  getCardSize(){return 1;}
  feedback(){return this._error?html`<p role="alert">${this.t('error')}</p>`:nothing;}
  async select(item){
    if(item.confirmation){this._confirm=item;await this.updateComplete;this.renderRoot.querySelector('dialog').showModal();}
    else await this.run(item.action);
  }
  render(){const item=this._confirm;return html`<section class="surface" aria-label=${this._config.title||this.t('quickAccess')}><div class="actions">${this._config.actions?.map(a=>html`<ha-m3-button full kind="text" .icon=${a.icon||''} .disabled=${this._busy||!actionAvailable(this.hass,a.action)} @click=${()=>this.select(a)}>${a.name}</ha-m3-button>`)}</div>${this.feedback()}</section><dialog @cancel=${()=>this._confirm=null}><h2>${item?.name}</h2><p>${item?.confirmation}</p><div class="confirm-actions"><ha-m3-button kind="text" @click=${()=>this.renderRoot.querySelector('dialog').close()}>${this.t('cancel')}</ha-m3-button><ha-m3-button kind="filled" .disabled=${this._busy||!item||!actionAvailable(this.hass,item.action)} @click=${async()=>{this.renderRoot.querySelector('dialog').close();if(item)await this.run(item.action);this._confirm=null;}}>${item?.name}</ha-m3-button></div></dialog>`;}
}
customElements.define('ha-m3-action-bar',M3ActionBar);
