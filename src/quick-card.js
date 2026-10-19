import {html,css,nothing} from 'lit';
import {popoverStyles,openPopover} from './popover.js';
import {M3DeviceCard} from './cards.js';
import {common,icon} from './components.js';
import {available,matches} from './ha.js';
import {controlModel,controlValue,valueAction,validateControls,automationPermission,automationAction} from './quick-controls.js';

export class M3QuickDeviceCard extends M3DeviceCard{
  static properties={...M3DeviceCard.properties,_drafts:{state:true},_permissionDrafts:{state:true}};
  static styles=[M3DeviceCard.styles,common,popoverStyles,css`
    .surface{padding:var(--ha-m3-ui-card-padding);overflow:visible}.quick-header{display:flex;align-items:center;gap:12px;margin-bottom:0}.quick-title{flex:1;min-width:0}.quick-title h2{font-size:16px;line-height:24px;font-weight:500}.quick-title small{font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant);display:block}.quick-header>.symbol{color:var(--md-sys-color-primary)}
    .power-policy{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:48px;margin-bottom:12px;border-bottom:1px solid var(--md-sys-color-outline-variant)}.power-policy>span{font-size:12px;color:var(--md-sys-color-on-surface-variant)}
    .quick-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 24px}.quick-field:only-child{grid-column:1/-1}.field-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;min-height:28px}.field-heading label{font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}output{font-size:20px;line-height:28px;font-variant-numeric:tabular-nums;min-width:5ch;text-align:right;white-space:nowrap}
    .field-actions{display:flex;justify-content:space-between;align-items:center;gap:4px;min-height:48px}.auto-permission{display:flex;align-items:center;gap:4px;min-height:48px;min-width:0;font-size:12px;line-height:16px;cursor:pointer;color:var(--md-sys-color-on-surface-variant)}.auto-permission[automatic]{color:var(--md-sys-color-primary)}.auto-permission[disabled]{cursor:default;opacity:.6}.auto-permission ha-m3-md-checkbox{flex-shrink:0;--md-checkbox-state-layer-size:32px}.auto-permission span{min-width:0}.saved-hint{display:block;min-height:16px;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}
    .endpoints{display:flex;justify-content:space-between;gap:8px;color:var(--md-sys-color-on-surface-variant);font-size:12px;line-height:16px;min-height:16px}.quick-status{margin-top:8px;height:32px;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.footer-actions{display:flex;justify-content:flex-end;margin-top:4px}.quick-field ha-m3-slider{display:block;min-width:0}
    @container(max-width:420px){.quick-fields{grid-template-columns:1fr;gap:16px}.quick-header{gap:8px}.surface{padding:var(--ha-m3-ui-compact-card-padding)}}
    .quick-fields{grid-template-columns:1fr;gap:12px}.quick-header{margin-bottom:8px}.power-policy{min-height:32px;margin:0 0 8px;border:0}.field-actions{min-height:32px}.owner{display:inline-flex;align-items:center;gap:6px;border:0;background:transparent;color:var(--md-sys-color-on-surface-variant);border-radius:12px;min-height:40px;padding:4px 8px;margin-left:-8px;cursor:pointer;font-size:12px;line-height:16px}.owner[data-owner=ha]{color:var(--md-sys-color-primary)}.owner[data-owner=device]{color:var(--md-sys-color-tertiary)}.owner .symbol{font-size:16px}.owner:hover{background:color-mix(in srgb,currentColor 8%,transparent)}.owner:focus-visible{outline:3px solid var(--md-sys-color-primary);outline-offset:2px}.endpoints{display:none}.saved-hint:empty{display:none}.footer-actions{border-top:1px solid var(--md-sys-color-outline-variant);margin-top:8px}.quick-status{height:auto;max-height:32px}.field-heading output{font-size:18px;line-height:24px}.popover-row ha-m3-switch{flex-shrink:0}
  `];
  constructor(){super();this._drafts={};this._permissionDrafts={};this._draftTimers=new Map();}
  setConfig(config){validateControls(config);super.setConfig(config);}
  getCardSize(){return this._config.quick_controls?.length>1?6:5;}
  disconnectedCallback(){super.disconnectedCallback();for(const timer of this._draftTimers.values())clearTimeout(timer);}
  willUpdate(changed){super.willUpdate(changed);for(const item of this._config.quick_controls||[]){const m=controlModel(this.hass,item),draft=this._drafts[item.id];if(draft!==undefined&&Number(m.position)===Number(draft)){delete this._drafts[item.id];clearTimeout(this._draftTimers.get(item.id));this._draftTimers.delete(item.id);}}for(const item of [...(this._config.quick_controls||[]),{...this._config.power,id:'power'}]){const p=automationPermission(this.hass,item);if(p.available&&this._permissionDrafts[item.id]===p.automatic){delete this._permissionDrafts[item.id];clearTimeout(this._draftTimers.get('permission:'+item.id));}}}
  async commit(item,position){
    const m=controlModel(this.hass,item);let action;
    try{action=valueAction(item.set_action,controlValue(m,position));}catch{this._error=true;return;}
    this._drafts={...this._drafts,[item.id]:position};await this.run(action,item.id);
    if(this._error){delete this._drafts[item.id];this.requestUpdate();return;}
    clearTimeout(this._draftTimers.get(item.id));this._draftTimers.set(item.id,setTimeout(()=>{delete this._drafts[item.id];this.requestUpdate();},8000));
  }
  permission(item,name){
    if(!item.lock_entity)return nothing;
    const p=automationPermission(this.hass,item),disabled=!p.available||this._busy,checked=this._permissionDrafts[item.id]??p.automatic;
    const native=!!item.auto&&controlModel(this.hass,item).auto,owner=checked?'ha':native?'device':'manual',title=checked?this.t('haAuto'):native?this.t('deviceAuto'):this.t('manualSetting'),id='permission-'+item.id;
    return html`<button type="button" class="owner" data-owner=${owner} aria-haspopup="dialog" aria-controls=${id} ?disabled=${disabled} @click=${event=>openPopover(this,id,event)}>${icon(checked?'auto_awesome':native?'settings':'tune')}${title}${icon('expand_more')}</button><div id=${id} popover role="dialog" aria-label=${name}><h3>${name}</h3><div class="popover-row"><span>${this.t('managedAutomatically')}</span><ha-m3-switch .selected=${checked} .disabled=${disabled} .label=${`${name}: ${this.t('managedAutomatically')}`} motion=${this.motion} @m3-change=${event=>this.setAutomatic(item,event.detail.selected)}></ha-m3-switch></div><p>${this.t('manualHint')}</p>${item.auto?html`<ha-m3-button kind="text" .disabled=${disabled} @click=${()=>this.run(item.auto.action,'auto:'+item.id)}>${item.auto.name||this.t('deviceAuto')}</ha-m3-button>`:nothing}</div>`;
  }
  async setAutomatic(item,automatic){
    this._permissionDrafts={...this._permissionDrafts,[item.id]:automatic};await this.run(automationAction(item,automatic),'permission:'+item.id);
    const key='permission:'+item.id;clearTimeout(this._draftTimers.get(key));
    if(this._error){delete this._permissionDrafts[item.id];this.requestUpdate();}
    else this._draftTimers.set(key,setTimeout(()=>{delete this._permissionDrafts[item.id];this.requestUpdate();},8000));
  }
  field(item){
    const m=controlModel(this.hass,item),draft=this._drafts[item.id],position=draft??m.position,option=m.options?.[position],value=draft!==undefined?(m.options?option?.label:this.n(position)):m.auto?this.t('automatic'):m.options?m.label:m.value===null?this.t('noData'):this.n(m.value),disabled=!m.available||this._busy;
    return html`<div class="quick-field"><div class="field-heading"><label>${item.name}</label><output aria-live="off">${value}${!m.options&&m.unit?html`<span> ${m.unit}</span>`:nothing}</output></div><ha-m3-slider .label=${item.name} .value=${Number(position)} .min=${m.min??0} .max=${m.max??1} .step=${m.step??1} .disabled=${disabled} motion=${this.motion} @m3-input=${event=>{this._drafts={...this._drafts,[item.id]:event.detail.value};}} @m3-change=${event=>this.commit(item,event.detail.value)}></ha-m3-slider><div class="field-actions">${this.permission(item,item.name)}</div><small class="saved-hint">${!m.available?this.t('unavailable'):m.locked&&this.entityState()?.state==='off'?this.t('savedUntilOn'):nothing}</small></div>`;
  }
  render(){
    const c=this._config,s=this.entityState(),ok=available(s),p=c.power,power=p?.on_when?matches(this.hass,p.on_when):ok&&!['off','idle'].includes(s.state);
    return html`<section class="surface" aria-label=${this.deviceName()}><div class="quick-header">${icon(c.icon||'devices')}<div class="quick-title"><h2>${this.deviceName()}</h2><small>${this.deviceValue()}</small></div>${p?html`<ha-m3-switch .selected=${power} .label=${`${this.deviceName()}: ${this.t('power')}`} .disabled=${!ok||this._busy} .loading=${this._pending==='power'} motion=${this.motion} @m3-change=${event=>this.run(valueAction(p.action,event.detail.selected),'power')}></ha-m3-switch>`:nothing}</div>${p?.lock_entity?html`<div class="power-policy">${this.permission({...p,id:'power'},this.t('power'))}</div>`:nothing}<div class="quick-fields">${(c.quick_controls||[]).map(item=>this.field(item))}</div>${this.feedback()}${c.actions?.length?html`<div class="footer-actions">${c.actions.map(a=>html`<ha-m3-button kind="text" .icon=${a.icon||'tune'} @click=${()=>this.run(a.action)}>${a.name}</ha-m3-button>`)}</div>`:nothing}</section>`;
  }
}
customElements.define('ha-m3-quick-device-card',M3QuickDeviceCard);
