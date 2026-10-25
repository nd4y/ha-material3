import {html,css,nothing} from 'lit';
import {renderHistory} from './history.js';
import {ownerModel,nextOwner,ownerRequest,ownerRequestStatus} from './ownership.js';
import {operationModel,parameterOperation} from './operation-colors.js';
import {M3DeviceCard} from './cards.js';
import {common,icon} from './components.js';
import {available,matches} from './ha.js';
import {controlModel,controlValue,valueAction,validateControls,automationPermission,automationAction} from './quick-controls.js';

export class M3QuickDeviceCard extends M3DeviceCard{
  static properties={...M3DeviceCard.properties,_drafts:{state:true},_permissionDrafts:{state:true},_ownerRequests:{state:true},_ownerErrors:{state:true}};
  static styles=[M3DeviceCard.styles,common,css`
    .surface{padding:var(--ha-m3-ui-card-padding);overflow:visible;--quick-tone:var(--ha-m3-operation-unknown,var(--md-sys-color-on-surface-variant));--quick-container:var(--ha-m3-operation-unknown-container,var(--md-sys-color-surface-container-high))}
    .surface.grouped{background:transparent;border-radius:0;padding:4px}
    [data-tone=warm]{--quick-tone:var(--ha-m3-operation-warm,var(--md-sys-color-primary));--quick-container:var(--ha-m3-operation-warm-container,var(--md-sys-color-secondary-container))}
    [data-tone=cool]{--quick-tone:var(--ha-m3-operation-cool,var(--md-sys-color-primary));--quick-container:var(--ha-m3-operation-cool-container,var(--md-sys-color-secondary-container))}
    [data-tone=fan]{--quick-tone:var(--ha-m3-operation-fan,var(--md-sys-color-primary));--quick-container:var(--ha-m3-operation-fan-container,var(--md-sys-color-secondary-container))}
    [data-tone=clean]{--quick-tone:var(--ha-m3-operation-clean,var(--md-sys-color-tertiary));--quick-container:var(--ha-m3-operation-clean-container,var(--md-sys-color-tertiary-container))}
    [data-tone=off]{--quick-tone:var(--ha-m3-operation-off,var(--md-sys-color-on-surface-variant));--quick-container:var(--ha-m3-operation-off-container,var(--md-sys-color-surface-container-high))}
    [data-tone=unknown]{--quick-tone:var(--ha-m3-operation-unknown,var(--md-sys-color-on-surface-variant));--quick-container:var(--ha-m3-operation-unknown-container,var(--md-sys-color-surface-container-high))}
    .quick-header{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;margin:0 2px 4px}
    .quick-title{display:flex;align-items:center;gap:7px;min-width:0}.quick-title h2{font-size:16px;line-height:22px;font-weight:500;overflow-wrap:anywhere}.quick-title>.symbol{font-size:22px;color:var(--quick-tone)}
    .quick-operation{display:flex;align-items:center;justify-content:flex-end;gap:5px;min-width:0;max-width:150px;color:var(--quick-tone);font-size:14px;line-height:18px;text-align:right;overflow-wrap:anywhere}.quick-operation>.symbol{font-size:18px;width:20px;height:20px;line-height:20px}.operation-copy{display:grid}.operation-activity{font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}
    .power-policy{display:grid;grid-template-columns:minmax(0,1fr) 52px auto;align-items:center;gap:10px;min-height:48px;margin:0 0 8px}.power-caption{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;min-width:0;font-size:14px;line-height:20px}.owner-label{font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant);min-width:0}
    .quick-fields{display:grid;grid-template-columns:minmax(0,1fr);gap:2px}.quick-field{min-width:0;border-radius:5px;padding:10px 12px;background:var(--quick-container);transition:background-color var(--fx-fast)}.quick-field:first-child{border-radius:20px 20px 5px 5px}.quick-field:last-child{border-radius:5px 5px 20px 20px}.quick-field:only-child{border-radius:20px}
    .field-heading{display:flex;justify-content:space-between;align-items:baseline;gap:8px;min-height:24px}.field-caption{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;min-width:0}.field-heading label{font-size:14px;line-height:20px;font-weight:500;overflow-wrap:anywhere}output{font-size:19px;line-height:26px;font-weight:500;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap;flex-shrink:0}
    .field-control{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;min-width:0;min-height:48px}.field-control ha-m3-slider{display:block;grid-column:auto;min-width:0;min-height:48px;width:100%;--ha-m3-slider-active-color:var(--quick-tone);--ha-m3-slider-handle-color:var(--quick-tone);--ha-m3-slider-inactive-color:color-mix(in srgb,var(--quick-tone) 22%,var(--md-sys-color-surface-container-highest))}
    .owner{display:flex;align-items:center;justify-content:center;width:48px;height:48px;min-width:48px;padding:0;border:0;border-radius:50%;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);cursor:pointer;touch-action:manipulation;transition:border-radius var(--fx-fast),background-color var(--fx-fast)}.owner[data-owner=ha]{background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container)}.owner>.symbol{font-size:22px}.owner:hover:not(:disabled){box-shadow:inset 0 0 0 24px color-mix(in srgb,currentColor 8%,transparent)}.owner:active:not(:disabled){border-radius:16px}.owner:focus-visible{outline:3px solid var(--md-sys-color-primary);outline-offset:2px}.owner:disabled{cursor:default;opacity:.5}
    .owner[data-owner=unknown]{background:var(--md-sys-color-surface-container-highest);color:var(--md-sys-color-on-surface-variant)}.owner-error{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--md-sys-color-error);font-size:12px;line-height:16px}.owner-label[aria-busy=true]{color:var(--md-sys-color-on-surface-variant)}
    .saved-hint{display:block;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}.saved-hint:empty{display:none}.footer-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid var(--md-sys-color-outline-variant);margin-top:8px;padding-top:2px}.popover-row ha-m3-switch{flex-shrink:0}
    @container(max-width:350px){.surface{padding:var(--ha-m3-ui-compact-card-padding)}.surface.grouped{padding:2px}.quick-field{padding:9px 10px}.quick-header{gap:6px}.quick-operation{max-width:122px}.quick-title h2{font-size:15px}.field-control{gap:10px}.power-policy{gap:8px}}
  `];
  constructor(){super();this._drafts={};this._permissionDrafts={};this._draftTimers=new Map();this._ownerRequests={};this._ownerErrors={};this._ownerTimers=new Map();}
  setConfig(config){validateControls(config);const signature=JSON.stringify(config);if(this._ownerConfig!==undefined&&this._ownerConfig!==signature)this.clearOwnerRequests();super.setConfig(config);this._ownerConfig=signature;}
  getCardSize(){return this._config.quick_controls?.length>1?6:5;}
  disconnectedCallback(){super.disconnectedCallback();for(const timer of this._draftTimers.values())clearTimeout(timer);this.clearOwnerRequests();}
  willUpdate(changed){super.willUpdate(changed);for(const item of this._config.quick_controls||[]){const m=controlModel(this.hass,item),draft=this._drafts[item.id];if(draft!==undefined&&Number(m.position)===Number(draft)){delete this._drafts[item.id];clearTimeout(this._draftTimers.get(item.id));this._draftTimers.delete(item.id);}}for(const item of [...(this._config.quick_controls||[]),{...this._config.power,id:'power'}]){const p=automationPermission(this.hass,item);if(p.available&&this._permissionDrafts[item.id]===p.automatic){delete this._permissionDrafts[item.id];clearTimeout(this._draftTimers.get('permission:'+item.id));}this.syncOwnerRequest(item);}}
  clearOwnerRequests(){for(const timer of this._ownerTimers.values())clearTimeout(timer);this._ownerTimers.clear();this._ownerRequests={};this._ownerErrors={};}
  finishOwnerRequest(id){clearTimeout(this._ownerTimers.get(id));this._ownerTimers.delete(id);const requests={...this._ownerRequests};delete requests[id];this._ownerRequests=requests;}
  syncOwnerRequest(item){
    const request=this._ownerRequests[item.id],status=ownerRequestStatus(this.hass,item,request);
    const error=this._ownerErrors[item.id],actual=error?ownerModel(this.hass,item):null;
    if(!request&&error?.owner&&actual.available&&actual.owner===error.owner){const errors={...this._ownerErrors};delete errors[item.id];this._ownerErrors=errors;return;}
    if(status==='confirmed'){this.finishOwnerRequest(item.id);const errors={...this._ownerErrors};delete errors[item.id];this._ownerErrors=errors;}
    else if(status==='timeout'){this.finishOwnerRequest(item.id);this._ownerErrors={...this._ownerErrors,[item.id]:{owner:request.owner,key:'ownerConfirmationTimeout'}};}
  }
  async requestOwner(item,requested){
    if(this._busy||this._ownerRequests[item.id])return;
    let request;try{request=ownerRequest(this.hass,item,requested);}catch{this._ownerErrors={...this._ownerErrors,[item.id]:{owner:requested,key:'unavailable'}};return;}
    const errors={...this._ownerErrors};delete errors[item.id];this._ownerErrors=errors;if(!request)return;
    this._ownerRequests={...this._ownerRequests,[item.id]:request};
    this._ownerTimers.set(item.id,setTimeout(()=>this.syncOwnerRequest(item),Math.max(0,request.deadline-Date.now())));
    await this.run(request.action,'owner:'+item.id);
    if(!this.isConnected){this._error=false;return;}
    if(this._error){this.finishOwnerRequest(item.id);this._ownerErrors={...this._ownerErrors,[item.id]:{owner:request.owner,key:'error'}};this._error=false;}
    else this.syncOwnerRequest(item);
  }
  ownerFeedback(item){const error=this._ownerErrors[item.id];return error?html`<div class="owner-error" role="alert"><span>${this.t(error.key)}</span><ha-m3-button kind="text" .disabled=${this._busy||!ownerModel(this.hass,item).available} @click=${()=>this.requestOwner(item,error.owner)}>${this.t('retry')}</ha-m3-button></div>`:nothing;}
  async commit(item,position){
    if(this._busy||this._ownerRequests[item.id])return;
    const m=controlModel(this.hass,item);let action;
    try{action=valueAction(item.set_action,controlValue(m,position));}catch{this._error=true;return;}
    this._drafts={...this._drafts,[item.id]:position};await this.run(action,item.id);
    if(this._error){delete this._drafts[item.id];this.requestUpdate();return;}
    clearTimeout(this._draftTimers.get(item.id));this._draftTimers.set(item.id,setTimeout(()=>{delete this._drafts[item.id];this.requestUpdate();},8000));
  }
  changePower(item,selected){if(this._busy||this._ownerRequests.power)return;return this.run(valueAction(item.action,selected),'power');}
  ownerLabel(item){
    if(!item.lock_entity)return nothing;
    const actual=ownerModel(this.hass,item),owner=actual.available?actual.owner:'unknown',pending=!!this._ownerRequests[item.id];
    return html`<span class="owner-label" data-owner=${owner} aria-busy=${pending?'true':nothing}>${this.t(owner==='unknown'?'unavailable':{ha:'haAuto',manual:'manualShort',device:'deviceAutoShort'}[owner])}${pending?html` · ${this.t('pending')}`:nothing}</span>`;
  }
  permission(item,name,unavailable=false){
    if(!item.lock_entity)return nothing;
    const m=ownerModel(this.hass,item),request=this._ownerRequests[item.id],disabled=unavailable||!m.available||this._busy||!!request,next=m.available?nextOwner(this.hass,item):null,owner=m.available?m.owner:'unknown';
    const labels={ha:this.t('haAuto'),manual:this.t('manualShort'),device:this.t('deviceAutoShort')},icons={ha:'lock_open',manual:'lock',device:'devices'},help={ha:this.t('ownerHaHelp'),manual:this.t('ownerManualHelp'),device:this.t('ownerDeviceHelp')};
    return html`<button type="button" class="owner" data-owner=${owner} data-next-owner=${next||nothing} data-requested-owner=${request?.owner||nothing} aria-busy=${request?'true':nothing} aria-label=${`${name}: ${labels[owner]||this.t('unavailable')}. ${request?this.t('pending')+': '+labels[request.owner]:next?this.t('ownerNext')+': '+labels[next]:this.t('unavailable')}`} aria-description=${help[owner]||this.t('unavailable')} ?disabled=${disabled} @click=${()=>this.requestOwner(item)}>${request?html`<span class="spinner" aria-hidden="true"></span>`:icon(icons[owner]||'info')}</button>`;
  }
  async setAutomatic(item,automatic){
    this._permissionDrafts={...this._permissionDrafts,[item.id]:automatic};await this.run(automationAction(item,automatic),'permission:'+item.id);
    const key='permission:'+item.id;clearTimeout(this._draftTimers.get(key));
    if(this._error){delete this._permissionDrafts[item.id];this.requestUpdate();}
    else this._draftTimers.set(key,setTimeout(()=>{delete this._permissionDrafts[item.id];this.requestUpdate();},8000));
  }
  field(item,operation){
    const m=controlModel(this.hass,item),draft=this._drafts[item.id],position=draft??m.position,option=m.options?.[position],value=draft!==undefined?(m.options?option?.label:this.n(position)):m.auto?this.t('automatic'):m.options?m.label:m.value===null?this.t('noData'):this.n(m.value),disabled=!m.available||this._busy||!!this._ownerRequests[item.id];
    const process=parameterOperation(operation,item);
    return html`<div class="quick-field" data-control-id=${item.id} data-tone=${process.tone}><div class="field-heading"><div class="field-caption"><label>${item.name}</label>${this.ownerLabel(item)}</div><output aria-live="off">${value}${!m.options&&m.unit?html`<span> ${m.unit}</span>`:nothing}</output></div><div class="field-control"><ha-m3-slider .label=${item.name} .value=${Number(position)} .min=${m.min??0} .max=${m.max??1} .step=${m.step??1} .disabled=${disabled} motion=${this.motion} @m3-input=${event=>{this._drafts={...this._drafts,[item.id]:event.detail.value};}} @m3-change=${event=>this.commit(item,event.detail.value)}></ha-m3-slider>${this.permission(item,item.name,!m.available)}</div><small class="saved-hint">${!m.available?this.t('unavailable'):m.locked&&this.entityState()?.state==='off'?this.t('savedUntilOn'):nothing}</small>${this.ownerFeedback(item)}${renderHistory(this,item.history_sources||[{entity:item.entity,attribute:item.attribute,name:item.name,unit:m.unit||"",kind:"setting",...(m.options?{value_map:Object.fromEntries(m.options.map((o,i)=>[o.value,i+1]))}:{})}])}</div>`;
  }
  render(){
    const c=this._config,s=this.entityState(),ok=available(s),p=c.power,power=p?.on_when?matches(this.hass,p.on_when):ok&&!['off','idle'].includes(s.state),operation=operationModel(this.hass,c),powerItem={...p,id:'power'};
    return html`<section class="surface ${c.grouped?'grouped':''}" data-operation=${operation.mode} data-tone=${operation.tone} aria-label=${this.deviceName()}><div class="quick-header"><div class="quick-title">${icon(c.icon||'devices')}<h2>${this.deviceName()}</h2></div><div class="quick-operation" data-operation=${operation.mode} data-tone=${operation.tone}>${c.operation?icon(operation.icon):nothing}<span class="operation-copy"><span>${c.operation?this.t(operation.labelKey):this.deviceValue()}</span>${operation.activityKey?html`<small class="operation-activity">${this.t(operation.activityKey)}</small>`:nothing}</span></div></div>${p?html`<div class="power-policy" data-control-id="power"><div class="power-caption"><span>${this.t('power')}</span>${this.ownerLabel(powerItem)}</div><ha-m3-switch .selected=${power} .label=${`${this.deviceName()}: ${this.t('power')}`} .disabled=${!ok||this._busy||!!this._ownerRequests.power} .loading=${this._pending==='power'} motion=${this.motion} @m3-change=${event=>this.changePower(p,event.detail.selected)}></ha-m3-switch>${this.permission(powerItem,this.t('power'),!ok)}</div>${this.ownerFeedback(powerItem)}`:nothing}<div class="quick-fields">${(c.quick_controls||[]).map(item=>this.field(item,operation))}</div>${this.feedback()}${c.actions?.length?html`<div class="footer-actions">${c.actions.map(a=>html`<ha-m3-button kind="text" .icon=${a.icon||'tune'} @click=${()=>this.run(a.action)}>${a.name}</ha-m3-button>`)}</div>`:nothing}</section>`;
  }
}
customElements.define('ha-m3-quick-device-card',M3QuickDeviceCard);
