import {LitElement,html,css,nothing} from 'lit';
import {common} from './components.js';
import {perform} from './ha.js';
import {validateQuickSettings,settingsState,settingsAction} from './quick-settings-model.js';

// No service is called by opening this component. Switch/select changes are
// explicit user actions and remain pending until the exact entity readback.
export class M3QuickSettingsMenu extends LitElement{
  static properties={hass:{attribute:false},config:{attribute:false},heading:{},motion:{},controlId:{},_pending:{state:true},_errors:{state:true},_messages:{state:true},_confirmItem:{state:true}};
  static styles=[common,css`
    :host{display:block}.group{margin:0 0 18px}.group h3{font-size:14px;line-height:20px;font-weight:500;color:var(--md-sys-color-primary);margin:0 0 4px}.row{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:52px;border-bottom:1px solid var(--md-sys-color-outline-variant)}.row label,.row .name{flex:1;min-width:0}.row select{max-width:60%;min-height:44px;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface);border:1px solid var(--md-sys-color-outline);border-radius:12px;padding:4px 10px}.link{background:transparent;border:0;text-align:left;min-height:48px;width:100%;color:var(--md-sys-color-primary)}.error{font-size:12px;line-height:16px;margin:4px 0}.status{font-size:12px;color:var(--md-sys-color-on-surface-variant)}
  `];
  constructor(){super();this.heading='';this.controlId='';this.config={groups:[]};this._pending={};this._errors={};this._messages={};this._confirmItem=null;this._timers=new Map();}
  connectedCallback(){super.connectedCallback();for(const[id,request]of Object.entries(this._pending))if(!request.maintenance)this.scheduleTimeout(id,request);}
  scheduleTimeout(id,request){clearTimeout(this._timers.get(id));this._timers.set(id,setTimeout(()=>this.finish(id,request,true),Math.max(0,request.deadline-Date.now())));}
  async show(){validateQuickSettings(this.config);await this.updateComplete;return this.renderRoot.querySelector('ha-m3-dialog.main').show();}
  close(){this.renderRoot.querySelector('ha-m3-dialog.confirm')?.close();this.renderRoot.querySelector('ha-m3-dialog.main')?.close();}
  disconnectedCallback(){for(const timer of this._timers.values())clearTimeout(timer);this._timers.clear();super.disconnectedCallback();}
  willUpdate(){
    for(const group of this.config?.groups||[])for(const item of group.items||[]){
      const request=this._pending[item.id];if(request===undefined||request.maintenance)continue;
      const current=settingsState(this.hass,item);
      if(current.available&&String(current.value)===String(request.expected))this.finish(item.id,request,false);
    }
  }
  finish(id,request,error){if(this._pending[id]!==request)return;clearTimeout(this._timers.get(id));this._timers.delete(id);const next={...this._pending};delete next[id];this._pending=next;this._errors={...this._errors,[id]:error};}
  async choose(item,value){
    if(this._pending[item.id]!==undefined)return;
    let action;try{action=settingsAction(this.hass,item,value);}catch{this._errors={...this._errors,[item.id]:true};return;}
    if(item.type==='link'){try{await perform(this,this.hass,action);}catch{this._errors={...this._errors,[item.id]:true};}return;}
    const expected=item.type==='switch'?(value?'on':'off'):value;
    if(settingsState(this.hass,item).value===expected)return;
    const request={expected,deadline:Date.now()+10000};this._errors={...this._errors,[item.id]:false};this._pending={...this._pending,[item.id]:request};
    this.scheduleTimeout(item.id,request);
    try{await perform(this,this.hass,action);}catch{this.finish(item.id,request,true);}
  }
  async askReset(item){
    if(this._pending[item.id]||!settingsState(this.hass,item).available)return;
    this._confirmItem=item;await this.updateComplete;await this.renderRoot.querySelector('ha-m3-dialog.confirm').show();
  }
  cancelReset(){this._confirmItem=null;this.renderRoot.querySelector('ha-m3-dialog.confirm')?.close();}
  async confirmReset(){
    const item=this._confirmItem;if(!item||this._pending[item.id])return;
    this.cancelReset();let action;
    try{if(!this.config.groups.some(g=>g.items.includes(item)))throw new Error('Setting changed');action=settingsAction(this.hass,item,true);}catch{this._errors={...this._errors,[item.id]:true};return;}
    const request={maintenance:true};this._pending={...this._pending,[item.id]:request};this._errors={...this._errors,[item.id]:false};this._messages={...this._messages,[item.id]:false};
    // HA buttons can legitimately have state "unknown" before their first
    // press. The exact button and service were revalidated above; the shared
    // perform() helper rejects unknown, so invoke only this fixed service.
    try{await this.hass.callService('button','press',{},action.target);if(this._pending[item.id]===request){this.finish(item.id,request,false);this._messages={...this._messages,[item.id]:true};}}catch{this.finish(item.id,request,true);}
  }
  item(item){
    const state=settingsState(this.hass,item),pending=this._pending[item.id]!==undefined,disabled=!state.available||pending;
    return html`<div class="row" data-item=${item.id}>${item.type==='link'?html`<button type="button" class="link" @click=${()=>this.choose(item)}>${item.name}</button>`:html`<span class="name">${item.name}</span>${item.type==='reading'?html`<span>${state.available?`${state.value}${state.unit?' '+state.unit:''}`:'—'}</span>`:item.type==='filter-reset'?html`<ha-m3-button kind="text" .disabled=${disabled} @click=${()=>this.askReset(item)}>Сбросить</ha-m3-button>`:item.type==='switch'?html`<ha-m3-switch .label=${item.name} .selected=${state.value==='on'} .disabled=${disabled} .loading=${pending} motion=${this.motion||'expressive'} @m3-change=${event=>this.choose(item,event.detail.selected)}></ha-m3-switch>`:html`<select aria-label=${item.name} .value=${state.value||''} ?disabled=${disabled} @change=${event=>this.choose(item,event.target.value)}>${(state.options||[]).map(value=>html`<option value=${value}>${item.option_labels?.[value]||value}</option>`)}</select>`}`}</div>${this._errors[item.id]?html`<div class="error" role="alert">Не удалось подтвердить изменение.</div>`:nothing}${this._messages[item.id]?html`<div class="status" role="status">Команда отправлена. Проверьте ресурс фильтра.</div>`:nothing}${!state.available?html`<div class="status">Нет данных</div>`:nothing}`;
  }
  render(){
    const groups=(this.config?.groups||[]).filter(g=>!this.controlId||g.controls?.includes(this.controlId));
    return html`<ha-m3-dialog class="main" .heading=${this.heading} motion=${this.motion||'expressive'} @m3-closed=${()=>this.dispatchEvent(new CustomEvent('m3-closed',{bubbles:true,composed:true}))}><slot></slot>${groups.map(g=>html`<section class="group"><h3>${g.name}</h3>${g.items.map(item=>this.item(item))}</section>`)}</ha-m3-dialog><ha-m3-dialog class="confirm" heading="Сбросить ресурс фильтра?" motion=${this.motion||'expressive'} @m3-closed=${()=>{this._confirmItem=null;}}><p>Выполняйте сброс после замены фильтра.</p><ha-m3-button slot="actions" kind="text" @click=${this.cancelReset}>Отмена</ha-m3-button><ha-m3-button slot="actions" kind="filled" @click=${this.confirmReset}>Сбросить</ha-m3-button></ha-m3-dialog>`;
  }
}
customElements.define('ha-m3-quick-settings-menu',M3QuickSettingsMenu);
