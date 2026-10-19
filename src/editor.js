import {LitElement,html,css} from 'lit';
import {common} from './components.js';
// Uses HA selectors when available. Advanced composition stays in the YAML editor.
export class M3Editor extends LitElement{
  static properties={hass:{attribute:false},_config:{state:true}};
  static styles=[common,css`:host{display:grid;gap:16px}label{display:grid;gap:6px}input{min-height:48px;background:var(--card-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:4px;padding:12px;font-size:16px}`];
  setConfig(config){this._config=structuredClone(config);}
  change(path,value){const config=structuredClone(this._config);let obj=config;for(const key of path.slice(0,-1))obj=obj[key]||=( {} );obj[path.at(-1)]=value;this._config=config;this.dispatchEvent(new CustomEvent('config-changed',{detail:{config},bubbles:true,composed:true}));}
  field(label,path,domain){let value=this._config;for(const k of path)value=value?.[k];return html`<label>${label}${customElements.get('ha-selector')?html`<ha-selector .hass=${this.hass} .selector=${{entity:domain?{domain}: {}}} .value=${value||''} @value-changed=${event=>this.change(path,event.detail.value)}></ha-selector>`:html`<input type="text" .value=${value||''} @change=${event=>this.change(path,event.target.value)}>`}</label>`;}
  render(){const type=this._config?.type||'';return html`<label>Название / Title<input .value=${this._config?.title||this._config?.name||''} @change=${event=>this.change([type.includes('climate')||type.includes('journal')||type.includes('dashboard')?'title':'name'],event.target.value)}></label>${type.includes('climate')?html`${this.field('Температура / Room temperature',['entities','room_temperature'],'sensor')}${this.field('Цель / Target',['entities','target_temperature'],'input_number')}${this.field('Климат-контроль / Enabled',['entities','enabled'],'input_boolean')}`:type.includes('dashboard')?html`<p>Комнаты, карточки и действия настраиваются в YAML. / Configure rooms, cards and actions in YAML.</p>`:this.field('Сущность / Entity',['entity'],type.includes('camera')?'camera':null)}`;}
}
customElements.define('ha-m3-editor',M3Editor);
