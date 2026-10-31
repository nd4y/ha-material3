import {html,css,nothing} from 'lit';
import {stateIcon} from './state-motion.js';
import {scalePresentation} from './scale-presentation.js';
import {renderHistory} from './history.js';
import {ownerModel,nextOwner,ownerRequest,ownerRequestStatus,ownerPresentation,deviceOwnershipModel} from './ownership.js';
import {holdHelp} from './hold-help.js';
import {locale} from './localize.js';
import {operationModel,parameterOperation,operationMotion} from './operation-colors.js';
import {M3DeviceCard} from './cards.js';
import {common,icon} from './components.js';
import {available,matches,perform,validateRuntimeSafety,runtimeSafetyReady} from './ha.js';
import {controlModel,controlValue,valueAction,validateControls,automationPermission,automationAction} from './quick-controls.js';
import {validateQuickScale,quickScaleModel,quickScaleRequest,quickScaleOffRequest,quickScaleConfirmed,quickScaleQueued,quickScaleWaitReason,quickScaleSaved,quickScaleSuperseded,roomSnapshot,validateDeviceOwner,deviceOwnerSnapshot,deviceOwnerRequest,deviceOwnerConfirmed,requestId} from './quick-scale.js';
import {displayPrefix,scaleDisplayRecord,restoreScaleDisplay} from './scale-display.js';
import {validateQuickSettings} from './quick-settings-model.js';
import './quick-settings-menu.js';

export class M3QuickDeviceCard extends M3DeviceCard{
  static properties={...M3DeviceCard.properties,_drafts:{state:true},_permissionDrafts:{state:true},_ownerRequests:{state:true},_ownerErrors:{state:true},_operationVisible:{state:true},_pageVisible:{state:true},_scaleDrafts:{state:true},_scaleRequests:{state:true},_scaleErrors:{state:true},_deviceRequest:{state:true},_deviceError:{state:true},_stopRequest:{state:true},_stopStatus:{state:true},_recoveryRequest:{state:true},_recoveryStatus:{state:true},_settingsControlId:{state:true}};
  static styles=[M3DeviceCard.styles,common,css`
    .surface{padding:var(--ha-m3-ui-card-padding);overflow:visible;--quick-tone:var(--ha-m3-operation-unknown,var(--md-sys-color-on-surface-variant));--quick-container:var(--ha-m3-operation-unknown-container,var(--md-sys-color-surface-container-high))}
    .surface.grouped{background:var(--md-sys-color-surface-container-low);border-radius:20px;padding:10px}
    .surface[data-ownership=blocked]{background:var(--ha-m3-owner-manual-surface,color-mix(in srgb,var(--ha-m3-operation-warm-container,var(--md-sys-color-tertiary-container)) 48%,var(--md-sys-color-surface-container)));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ha-m3-owner-manual-color,var(--ha-m3-operation-warm,var(--md-sys-color-tertiary))) 28%,transparent)}
    [data-tone=warm]{--quick-tone:var(--ha-m3-operation-warm,var(--md-sys-color-primary));--quick-container:var(--ha-m3-operation-warm-container,var(--md-sys-color-secondary-container))}
    [data-tone=cool]{--quick-tone:var(--ha-m3-operation-cool,var(--md-sys-color-primary));--quick-container:var(--ha-m3-operation-cool-container,var(--md-sys-color-secondary-container))}
    [data-tone=fan]{--quick-tone:var(--ha-m3-operation-fan,var(--md-sys-color-primary));--quick-container:var(--ha-m3-operation-fan-container,var(--md-sys-color-secondary-container))}
    [data-tone=clean]{--quick-tone:var(--ha-m3-operation-clean,var(--md-sys-color-tertiary));--quick-container:var(--ha-m3-operation-clean-container,var(--md-sys-color-tertiary-container))}
    [data-tone=off]{--quick-tone:var(--ha-m3-operation-off,var(--md-sys-color-on-surface-variant));--quick-container:var(--ha-m3-operation-off-container,var(--md-sys-color-surface-container-high))}
    [data-tone=unknown]{--quick-tone:var(--ha-m3-operation-unknown,var(--md-sys-color-on-surface-variant));--quick-container:var(--ha-m3-operation-unknown-container,var(--md-sys-color-surface-container-high))}
    .quick-header{display:flex;align-items:center;gap:8px;margin:0 2px 4px}.quick-title{flex:1}
    .quick-header:not(:has(.device-owner)){grid-template-columns:minmax(0,1fr) auto}.device-owner{width:44px;height:44px;min-width:44px;border-radius:50%!important}
    .quick-title{display:flex;align-items:center;gap:7px;min-width:0}.quick-title h2{font-size:16px;line-height:22px;font-weight:500;overflow-wrap:anywhere}.quick-title>.symbol{font-size:22px;color:var(--quick-tone)}
    .quick-operation{position:relative;display:flex;align-items:center;justify-content:center;min-width:36px;min-height:36px;width:36px;color:var(--quick-tone);font-size:14px;line-height:18px}.operation-symbol{display:grid;place-items:center;width:36px;height:36px;border-radius:13px;background:var(--quick-container);color:var(--quick-tone)}.operation-glyph{display:grid;place-items:center;transform-origin:center}.operation-glyph>.symbol{font-size:23px;display:block;line-height:1}.operation-copy{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.operation-activity{font-size:12px;line-height:16px}
    .quick-operation:not([role=img]){width:auto;max-width:150px;overflow-wrap:anywhere}.owner[data-owner=unknown] .owner-copy{display:none}
    .power-policy{display:grid;grid-template-columns:minmax(0,1fr) 52px 56px;align-items:center;gap:10px;min-height:52px;margin:0 0 8px}.power-caption{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;min-width:0;font-size:14px;line-height:20px}.owner-label{font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant);min-width:0}.owner-label:not([data-owner=unknown]){display:none}
    .quick-fields{display:grid;grid-template-columns:minmax(0,1fr);gap:2px}.quick-field{min-width:0;border-radius:5px;padding:10px 12px;background:var(--quick-container);transition:background-color var(--fx-fast)}.quick-field:first-child{border-radius:20px 20px 5px 5px}.quick-field:last-child{border-radius:5px 5px 20px 20px}.quick-field:only-child{border-radius:20px}
    .field-heading{display:flex;justify-content:space-between;align-items:baseline;gap:8px;min-height:24px}.field-caption{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;min-width:0}.field-heading label{font-size:14px;line-height:20px;font-weight:500;overflow-wrap:anywhere}output{font-size:19px;line-height:26px;font-weight:500;font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap;flex-shrink:0}
    .field-control{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:12px;min-width:0;min-height:48px}.field-control ha-m3-slider{display:block;grid-column:auto;min-width:0;min-height:48px;width:100%;--ha-m3-slider-active-color:var(--quick-tone);--ha-m3-slider-handle-color:var(--quick-tone);--ha-m3-slider-inactive-color:color-mix(in srgb,var(--quick-tone) 22%,var(--md-sys-color-surface-container-highest))}
    .owner{position:relative;isolation:isolate;display:grid;align-content:center;justify-items:center;gap:2px;width:56px;height:52px;min-width:56px;padding:4px;border:0;border-radius:50%;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface-variant);cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;transition:transform var(--fx-fast),border-radius var(--fx-fast),background-color var(--fx-fast),color var(--fx-fast)}.owner[data-owner=ha]{color:var(--md-sys-color-primary)}.device-owner[data-owner=ha]{background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary)}.owner[data-owner=manual]{border-radius:16px;background:var(--ha-m3-owner-manual-container,var(--ha-m3-operation-warm-container,var(--md-sys-color-tertiary-container)));color:var(--ha-m3-owner-manual-color,var(--ha-m3-operation-warm,var(--md-sys-color-on-tertiary-container)))}.owner[data-owner=device]{border-radius:20px;background:var(--md-sys-color-tertiary-container);color:var(--md-sys-color-on-tertiary-container)}.owner-icon{display:grid;place-items:center;width:22px;height:22px;line-height:0}.owner-icon>.symbol{display:block;font-size:20px;line-height:1}.owner-copy{font-size:11px;line-height:14px;white-space:nowrap}.owner::after{content:'';position:absolute;inset:0;z-index:-1;border-radius:inherit;background:currentColor;opacity:0;pointer-events:none;transition:opacity var(--fx-fast)}.owner:hover:not(:disabled)::after{opacity:.08}.owner:active:not(:disabled){transform:scale(.95);border-radius:16px}.owner:active:not(:disabled)::after{opacity:.12}.owner:focus-visible{outline:3px solid var(--md-sys-color-primary);outline-offset:2px}.owner:disabled{cursor:default;opacity:.5}.owner .spinner{width:20px;height:20px}
    .owner[data-owner=unknown]{background:var(--md-sys-color-surface-container-highest);color:var(--md-sys-color-on-surface-variant)}.owner-error{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--md-sys-color-error);font-size:12px;line-height:16px}.owner-label[aria-busy=true]{color:var(--md-sys-color-on-surface-variant)}
    .saved-hint{display:block;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}.saved-hint:empty{display:none}.footer-actions{display:flex;justify-content:flex-end;flex-wrap:wrap;border-top:1px solid var(--md-sys-color-outline-variant);margin-top:8px;padding-top:2px}.popover-row ha-m3-switch{flex-shrink:0}
    .scale-head{display:flex;align-items:center;gap:4px}.scale-details{display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:50%;background:transparent;color:inherit}.scale-ticks{display:flex;justify-content:space-between;gap:4px;font-size:11px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}.scale-ticks span{text-align:center}.scale-error{font-size:12px;line-height:16px;color:var(--md-sys-color-error)}.runtime-warning{font-size:13px;line-height:18px;color:var(--md-sys-color-on-surface-variant);margin:0 0 8px}.scale-choice{min-height:48px;width:100%;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface);border:1px solid var(--md-sys-color-outline);border-radius:12px;padding:0 12px}
    .operation-symbol[data-moving=true][data-motion=heat] .operation-glyph{animation:quick-heat 3.2s ease-in-out infinite}.operation-symbol[data-moving=true][data-motion=cool] .operation-glyph{animation:quick-cool 4s ease-in-out infinite}.operation-symbol[data-moving=true][data-motion=flow] .operation-glyph{animation:quick-flow 3s ease-in-out infinite}.operation-symbol[data-moving=true][data-motion=spin] .operation-glyph{animation:quick-spin 4s linear infinite}
    .surface[data-operation-visible=false] .operation-glyph,.surface[data-page-visible=false] .operation-glyph{animation-play-state:paused!important}
    @keyframes quick-heat{0%,100%{transform:scale(.96)}50%{transform:scale(1.08)}}@keyframes quick-cool{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}@keyframes quick-flow{0%,100%{transform:translateX(-1.5px)}50%{transform:translateX(1.5px)}}@keyframes quick-spin{to{transform:rotate(360deg)}}
    .surface[data-motion=reduced] .operation-glyph{animation:none!important}.surface[data-motion=reduced] .owner,.surface[data-motion=reduced] .owner::after{transition:none!important}.surface[data-motion=reduced] .owner:active{transform:none}
    @media(prefers-reduced-motion:reduce){.operation-glyph{animation:none!important}.owner,.owner::after{transition:none!important}.owner:active{transform:none}}
    @container(max-width:350px){.surface{padding:var(--ha-m3-ui-compact-card-padding)}.surface.grouped{padding:8px}.quick-field{padding:9px 10px}.quick-header{gap:2px}.quick-header .scale-details{flex:0 0 44px}.quick-title{gap:4px}.quick-title h2{font-size:15px;overflow-wrap:normal}.field-control{gap:8px}.power-policy{gap:8px}}

    .surface,.surface.grouped{border-radius:28px;padding:10px;transition:background-color 260ms,box-shadow 260ms,color 220ms}
    .surface[data-ownership=automatic]{background:var(--ha-m3-owner-auto-surface,var(--md-sys-color-secondary-container))}
    .surface[data-ownership=blocked]{background:var(--ha-m3-owner-manual-surface,color-mix(in srgb,var(--md-sys-color-tertiary-container) 35%,var(--md-sys-color-surface-container)));box-shadow:none}
    .surface[data-ownership=mixed]{background:var(--md-sys-color-surface-container)}
    .quick-header{min-height:50px;margin:0 4px 4px;gap:8px}.quick-title{gap:12px}.device-state{display:grid;place-items:center;width:32px;height:32px;min-width:32px;min-height:32px;background:transparent;color:var(--quick-tone);transition:color 220ms}
    .device-heading{min-width:0}.runtime-header{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}
    .scale-head output{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.scale-head output[data-numeric]{inline-size:8ch;flex:0 0 8ch}.scale-mode{flex:0 0 24px;width:24px}.owner.device-owner{width:48px;height:48px;min-width:48px;padding:0;flex:0 0 48px}
    .runtime-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}

    .quick-field{padding:12px 14px;transition:background-color 220ms,color 220ms;--ha-m3-slider-active-color:var(--quick-tone);--ha-m3-slider-handle-color:var(--quick-tone)}
    .quick-field[data-tone=auto]{--quick-tone:var(--md-sys-color-primary);--quick-container:var(--md-sys-color-secondary-container)}
    .quick-field output{color:var(--quick-tone);font-size:18px;line-height:24px;transition:color 200ms}
    .scale-head{gap:6px}.scale-mode{display:grid;place-items:center;color:var(--quick-tone);transition:color 220ms}.scale-mode ha-m3-state-icon{font-size:20px}
    .scale-owner{display:flex;align-items:center;gap:4px;min-height:20px;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}.scale-owner ha-m3-state-icon{font-size:14px}.preview-note{margin-left:auto;color:var(--quick-tone)}
    .scale-details{cursor:pointer;transition:background-color 180ms,transform 180ms}.scale-details:active{transform:scale(.92);background:color-mix(in srgb,currentColor 10%,transparent)}
    .scale-ticks{padding-top:2px}.quick-header .owner-icon ha-m3-state-icon{font-size:22px}
    .surface[data-motion=reduced],.surface[data-motion=reduced] *{transition:none!important;animation:none!important}
    @media(prefers-reduced-motion:reduce){.surface,.surface *{transition:none!important;animation:none!important}}
  `];
  constructor(){super();this._drafts={};this._permissionDrafts={};this._draftTimers=new Map();this._ownerRequests={};this._ownerErrors={};this._ownerTimers=new Map();this._scaleDrafts={};this._scaleRequests={};this._scaleLate={};this._scaleErrors={};this._scaleSnapshots={};this._scaleTimers=new Map();this._deviceRequest=null;this._deviceLate=null;this._deviceError=false;this._deviceTimer=null;this._stopRequest=null;this._stopStatus='';this._stopTimer=null;this._recoveryRequest=null;this._recoveryStatus='';this._recoveryTimer=null;this._scaleHold=null;this._settingsControlId='';this._operationVisible=true;this._pageVisible=typeof document==='undefined'||!document.hidden;this._visibilityChanged=()=>{this._pageVisible=!document.hidden;if(document.hidden)this.clearScaleHold();};this._scaleScroll=()=>this.clearScaleHold();}
  connectedCallback(){super.connectedCallback();document.addEventListener('visibilitychange',this._visibilityChanged);window.addEventListener('scroll',this._scaleScroll,true);window.addEventListener('blur',this._scaleScroll);this._visibilityChanged();if(typeof IntersectionObserver!=='undefined'){this._operationObserver=new IntersectionObserver(entries=>{this._operationVisible=entries.at(-1)?.isIntersecting??false;});this._operationObserver.observe(this);}}
  setConfig(config){if(config.runtime_ready_entity!==undefined&&!/^input_boolean\.[a-z0-9_]+$/.test(config.runtime_ready_entity))throw new Error('Runtime readiness must be an input_boolean');validateRuntimeSafety(config.runtime_safety);if(config.runtime_safety&&!config.runtime_ready_entity)throw new Error('Runtime safety needs readiness');if(config.stop_only!==undefined){const s=config.stop_only,a=s?.gateway;if(!config.runtime_ready_entity||!/^input_text\.[a-z0-9_]+$/.test(s?.completed_entity||'')||a?.action!=='perform-action'||!/^script\.[a-z0-9_]+$/.test(a?.perform_action||'')||!a.data||Object.keys(a.data).length!==1||!/^[a-z0-9_]{1,64}$/.test(a.data.device||'')||Object.keys(a).some(k=>!['action','perform_action','data'].includes(k)))throw new Error('Stop-only needs an explicit script and one device');}if(config.recovery!==undefined){const r=config.recovery,a=r?.gateway;if(!config.runtime_ready_entity||!['request_entity','completed_entity','status_entity','transition_entity'].every(k=>/^input_text\.[a-z0-9_]+$/.test(r?.[k]||''))||new Set([r.request_entity,r.completed_entity,r.status_entity,r.transition_entity]).size!==4||a?.action!=='perform-action'||!/^script\.[a-z0-9_]+$/.test(a?.perform_action||'')||Object.keys(a).some(k=>!['action','perform_action'].includes(k)))throw new Error('Recovery needs an explicit script and separate readback entities');}validateControls(config);for(const item of config.quick_controls||[])validateQuickScale(item);validateDeviceOwner(config);validateQuickSettings(config.settings_menu);const signature=JSON.stringify(config);if(this._ownerConfig!==undefined&&this._ownerConfig!==signature){this.clearOwnerRequests();this.clearScaleRequests();}super.setConfig(config);this._ownerConfig=signature;}
  runtimeReady(){const id=this._config?.runtime_ready_entity;if(id===undefined)return true;return this.s(id)?.state==='on'&&runtimeSafetyReady(this.hass,this._config.runtime_safety)&&(!this._config?.recovery||this.s(this._config.recovery.transition_entity)?.state==='idle');}
  runtimeWarning(){const ru=locale(this.hass,this._config).startsWith('ru');return !runtimeSafetyReady(this.hass,this._config?.runtime_safety)?(ru?'Защита недоступна':'Protection is unavailable'):(ru?'Управление временно недоступно':'Control is temporarily unavailable');}
  syncStopRequest(){
    const request=this._stopRequest;if(!request)return;
    const observed=this.s(this._config.stop_only?.completed_entity)?.state===request.id&&this.s(this._config.entity)?.state==='off';
    if(observed){clearTimeout(this._stopTimer);request.pending=false;if(this._stopStatus!=='observed')this._stopStatus='observed';return;}
    if(this._stopStatus==='observed'){this._stopRequest=null;this._stopStatus='';return;}
    if(request.pending&&Date.now()>=request.deadline){request.pending=false;this._stopStatus='unconfirmed';}
  }
  async stopNow(){
    const config=this._config.stop_only;if(!config||this.runtimeReady()||this._stopRequest?.pending)return;
    let id;try{id=requestId();}catch{this._stopStatus='unconfirmed';return;}
    clearTimeout(this._stopTimer);const request={id,pending:true,deadline:Date.now()+30000};this._stopRequest=request;this._stopStatus='pending';
    this._stopTimer=setTimeout(()=>{if(this._stopRequest===request)this.syncStopRequest();},30000);
    const action=structuredClone(config.gateway);action.data.request_id=id;
    try{await perform(this,this.hass,action);}catch{if(this._stopRequest===request){request.pending=false;clearTimeout(this._stopTimer);this._stopStatus='unconfirmed';}return;}
    if(this._stopRequest===request)this.syncStopRequest();
  }
  stopFeedback(){
    if(!this._stopStatus)return nothing;const ru=locale(this.hass,this._config).startsWith('ru');
    const text=this._stopStatus==='pending'?(ru?'Проверяем состояние в Home Assistant':'Checking Home Assistant state'):this._stopStatus==='observed'?(ru?'В Home Assistant выключено; результат команды не подтверждён':'Home Assistant reports off; the command result is unconfirmed'):(ru?'Выключение в Home Assistant не подтверждено':'Off state in Home Assistant is unconfirmed');
    return html`<div class="runtime-warning" role="status">${text}</div>`;
  }
  syncRecoveryRequest(){
    const request=this._recoveryRequest;if(!request)return;const cfg=this._config.recovery;
    const confirmed=this.s(cfg?.request_entity)?.state===request.id&&this.s(cfg?.completed_entity)?.state===request.id&&available(this.s(cfg?.status_entity))&&this.runtimeReady()&&this.s(cfg?.transition_entity)?.state==='idle';
    if(confirmed){clearTimeout(this._recoveryTimer);request.pending=false;if(this._recoveryStatus!=='confirmed')this._recoveryStatus='confirmed';return;}
    if(this._recoveryStatus==='confirmed'){this._recoveryRequest=null;this._recoveryStatus='';return;}
    if(request.pending&&Date.now()>=request.deadline){request.pending=false;this._recoveryStatus='unconfirmed';}
  }
  async checkRecovery(){
    const config=this._config.recovery;if(!config||this.runtimeReady()||this.s(this._config.runtime_ready_entity)?.state!=='on'||this._recoveryRequest?.pending)return;
    let id;try{id=requestId();}catch{this._recoveryStatus='unconfirmed';return;}
    clearTimeout(this._recoveryTimer);const request={id,pending:true,deadline:Date.now()+30000};this._recoveryRequest=request;this._recoveryStatus='pending';
    this._recoveryTimer=setTimeout(()=>{if(this._recoveryRequest===request)this.syncRecoveryRequest();},30000);
    const action=structuredClone(config.gateway);action.data={request_id:id};
    try{await perform(this,this.hass,action);}catch{if(this._recoveryRequest===request){request.pending=false;clearTimeout(this._recoveryTimer);this._recoveryStatus='unconfirmed';}return;}
    if(this._recoveryRequest===request)this.syncRecoveryRequest();
  }
  recoveryFeedback(){
    if(!this._recoveryStatus)return nothing;const ru=locale(this.hass,this._config).startsWith('ru');
    const text=this._recoveryStatus==='pending'?(ru?'Проверяем управление':'Checking control'):this._recoveryStatus==='confirmed'?(ru?'Управление доступно':'Control is available'):(ru?'Результат проверки не подтверждён':'The check result is unconfirmed');
    return html`<div class="runtime-warning" role="status">${text}</div>`;
  }
  getCardSize(){return this._config.quick_controls?.length>1?6:5;}
  disconnectedCallback(){this._operationObserver?.disconnect();document.removeEventListener('visibilitychange',this._visibilityChanged);window.removeEventListener('scroll',this._scaleScroll,true);window.removeEventListener('blur',this._scaleScroll);super.disconnectedCallback();for(const timer of this._draftTimers.values())clearTimeout(timer);this.clearOwnerRequests();this.clearScaleRequests();}
  willUpdate(changed){super.willUpdate(changed);if(this._scaleHold?.sourceReady&&(!available(this.entityState())||!this.runtimeReady()))this.clearScaleHold();for(const item of this._config.quick_controls||[]){const m=controlModel(this.hass,item),draft=this._drafts[item.id];if(draft!==undefined&&Number(m.position)===Number(draft)){delete this._drafts[item.id];clearTimeout(this._draftTimers.get(item.id));this._draftTimers.delete(item.id);}if(item.mode_scale)this.syncScaleRequest(item);}for(const item of [...(this._config.quick_controls||[]),{...this._config.power,id:'power'}]){const p=automationPermission(this.hass,item);if(p.available&&this._permissionDrafts[item.id]===p.automatic){delete this._permissionDrafts[item.id];clearTimeout(this._draftTimers.get('permission:'+item.id));}this.syncOwnerRequest(item);}this.syncDeviceRequest();this.syncStopRequest();this.syncRecoveryRequest();}
  clearOwnerRequests(){for(const timer of this._ownerTimers.values())clearTimeout(timer);this._ownerTimers.clear();this._ownerRequests={};this._ownerErrors={};}
  clearScaleRequests(){for(const timer of this._scaleTimers.values())clearTimeout(timer);this._scaleTimers.clear();clearTimeout(this._deviceTimer);clearTimeout(this._stopTimer);clearTimeout(this._recoveryTimer);this.clearScaleHold();this._scaleRequests={};this._scaleLate={};this._scaleDrafts={};this._scaleSnapshots={};this._scaleErrors={};this._deviceRequest=null;this._deviceLate=null;this._deviceError=false;this._stopRequest=null;this._stopStatus='';this._recoveryRequest=null;this._recoveryStatus='';}
  scaleErrorText(){return locale(this.hass,this._config).startsWith('ru')?'Не удалось подтвердить настройку. Проверьте состояние устройства.':'The setting was not confirmed. Check the device state.';}
  deviceErrorText(){const ru=locale(this.hass,this._config).startsWith('ru');return this._deviceError==='preflight'?(ru?'Текущие настройки не подтверждены. Выберите значение на регуляторе, чтобы задать его вручную.':'Current settings are not confirmed. Select a regulator value to set it manually.'):ru?'Управление переключено не полностью или не подтверждено. Проверьте настройки устройства.':'The change may be partial or unconfirmed. Check device settings.';}
  syncScaleRequest(item){
    const request=this._scaleRequests[item.id];
    if(request&&this.s(item.mode_scale.revision_entity)?.state===request.request_id)request.admitted=true;
    if(request&&quickScaleSuperseded(this.hass,this._config,item,request)){this.clearPendingScales();return;}
    if(request&&quickScaleQueued(this.hass,this._config,item,request)){
      // Storage readback ends the browser's pending save, not device execution.
      // Durable selection and offline status survive a reload of this card.
      clearTimeout(this._scaleTimers.get(item.id));this._scaleTimers.delete(item.id);
      const requests={...this._scaleRequests},drafts={...this._scaleDrafts};delete requests[item.id];delete drafts[item.id];
      this._scaleRequests=requests;this._scaleDrafts=drafts;this._scaleErrors={...this._scaleErrors,[item.id]:false};return;
    }
    if(request?.admitted&&request.choice==='turbo'&&quickScaleModel(this.hass,this._config,item).turboCooldown>0){
      // Durable request is queued by the controller, not physically applied.
      // Show native readback and the firmware pause instead of a 90s error.
      clearTimeout(this._scaleTimers.get(item.id));this._scaleTimers.delete(item.id);
      const requests={...this._scaleRequests},drafts={...this._scaleDrafts};delete requests[item.id];delete drafts[item.id];
      this._scaleRequests=requests;this._scaleDrafts=drafts;this._scaleErrors={...this._scaleErrors,[item.id]:false};return;
    }
    if(!request){const late=this._scaleLate[item.id];if(late&&quickScaleSuperseded(this.hass,this._config,item,late)){delete this._scaleLate[item.id];this._scaleErrors={...this._scaleErrors,[item.id]:false};return;}if(late&&late.gatewaySettled!==false&&(quickScaleConfirmed(this.hass,this._config,item,late)||(item.mode_scale.kind==='ac-speed'&&quickScaleSaved(this.hass,this._config,item,late)))){delete this._scaleLate[item.id];this._scaleErrors={...this._scaleErrors,[item.id]:false};}return;}
    if(item.mode_scale.kind==='ac-speed'&&quickScaleSaved(this.hass,this._config,item,request)){
      clearTimeout(this._scaleTimers.get(item.id));this._scaleTimers.delete(item.id);const requests={...this._scaleRequests},drafts={...this._scaleDrafts};delete requests[item.id];delete drafts[item.id];this._scaleRequests=requests;this._scaleDrafts=drafts;this._scaleErrors={...this._scaleErrors,[item.id]:false};return;
    }
    if(!request.saved&&quickScaleSaved(this.hass,this._config,item,request)){
      request.saved=true;request.deadline=Date.now()+360000;clearTimeout(this._scaleTimers.get(item.id));
      this._scaleTimers.set(item.id,setTimeout(()=>{if(this._scaleRequests[item.id]?.request_id===request.request_id)this.syncScaleRequest(item);},360000));
      this._scaleRequests={...this._scaleRequests};
    }
    const expired=Date.now()>=request.deadline,confirmed=request.gatewaySettled!==false&&quickScaleConfirmed(this.hass,this._config,item,request);
    if(!confirmed&&!expired)return;
    clearTimeout(this._scaleTimers.get(item.id));this._scaleTimers.delete(item.id);
    const requests={...this._scaleRequests},drafts={...this._scaleDrafts};delete requests[item.id];delete drafts[item.id];this._scaleRequests=requests;this._scaleDrafts=drafts;if(!confirmed)this._scaleLate[item.id]=request;
    this._scaleErrors={...this._scaleErrors,[item.id]:!confirmed};
  }
  clearPendingScales(){for(const timer of this._scaleTimers.values())clearTimeout(timer);this._scaleTimers.clear();this._scaleRequests={};this._scaleDrafts={};this._scaleSnapshots={};this._scaleLate={};this._scaleErrors={};}
  async commitScale(item,position){
    if(!this.runtimeReady())return;
    const isOff=position==='force-off'||position===0,busy=this._busy||this._deviceRequest;
    if(busy&&!isOff){const drafts={...this._scaleDrafts};delete drafts[item.id];this._scaleDrafts=drafts;return;}
    let request;try{request=isOff?quickScaleOffRequest(this.hass,this._config,item):quickScaleRequest(this.hass,this._config,item,position,this._scaleSnapshots[item.id]);}catch{this._scaleErrors={...this._scaleErrors,[item.id]:true};const drafts={...this._scaleDrafts};delete drafts[item.id];this._scaleDrafts=drafts;return;}
    if(isOff&&busy){clearTimeout(this._deviceTimer);this._deviceRequest=null;}
    this.clearPendingScales();this._scaleDrafts={[item.id]:position==='force-off'?0:position};
    for(const id of Object.keys(this._scaleLate)){delete this._scaleLate[id];const errors={...this._scaleErrors};delete errors[id];this._scaleErrors=errors;}this._deviceLate=null;this._deviceError=false;
    const timeout=request.choice==='turbo'?90000:30000;request.gatewaySettled=false;
    delete this._scaleSnapshots[item.id];request.deadline=Date.now()+timeout;this._scaleErrors={...this._scaleErrors,[item.id]:false};this._scaleRequests={...this._scaleRequests,[item.id]:request};
    this._scaleTimers.set(item.id,setTimeout(()=>{if(this._scaleRequests[item.id]?.request_id===request.request_id)this.syncScaleRequest(item);},timeout));
    try{await perform(this,this.hass,request.action);}catch{if(this._scaleRequests[item.id]?.request_id!==request.request_id)return;clearTimeout(this._scaleTimers.get(item.id));this._scaleTimers.delete(item.id);const requests={...this._scaleRequests},drafts={...this._scaleDrafts};delete requests[item.id];delete drafts[item.id];this._scaleRequests=requests;this._scaleDrafts=drafts;this._scaleErrors={...this._scaleErrors,[item.id]:true};return;}
    if(this._scaleRequests[item.id]?.request_id===request.request_id||this._scaleLate[item.id]?.request_id===request.request_id){request.gatewaySettled=true;this.syncScaleRequest(item);}
  }
  syncDeviceRequest(){
    const request=this._deviceRequest;if(!request){if(this._deviceLate&&deviceOwnerConfirmed(this.hass,this._config,this._deviceLate)){this._deviceLate=null;this._deviceError=false;}else if(this._deviceError==='preflight'&&deviceOwnerSnapshot(this.hass,this._config))this._deviceError=false;return;}
    const confirmed=deviceOwnerConfirmed(this.hass,this._config,request),expired=Date.now()>=request.deadline;
    if(!confirmed&&!expired)return;
    clearTimeout(this._deviceTimer);this._deviceRequest=null;if(!confirmed)this._deviceLate=request;this._deviceError=!confirmed;
  }
  async toggleDeviceOwner(){
    if(!this.runtimeReady())return;
    if(this._busy||this._deviceRequest)return;
    const ownership=deviceOwnershipModel(this.hass,this._config);if(!ownership.known)return;
    const owner=ownership.state==='automatic'?'manual':'auto';let request;
    try{request=deviceOwnerRequest(this.hass,this._config,owner);}catch{this._deviceError='preflight';return;}
    this.clearPendingScales();this._deviceLate=null;request.deadline=Date.now()+90000;
    this._deviceError=false;this._deviceRequest=request;this._deviceTimer=setTimeout(()=>this.syncDeviceRequest(),90000);
    try{await perform(this,this.hass,request.action);}catch{if(this._deviceRequest?.request_id!==request.request_id)return;clearTimeout(this._deviceTimer);this._deviceRequest=null;this._deviceError=true;return;}
    if(this._deviceRequest?.request_id===request.request_id)this.syncDeviceRequest();
  }
  deviceOwnerButton(ownership){
    if(!this._config.device_ownership)return nothing;
    const ready=this.runtimeReady(),auto=ownership.state==='automatic',canFreeze=!auto||!!deviceOwnerSnapshot(this.hass,this._config),ru=locale(this.hass,this._config).startsWith('ru'),label=!ready?this.runtimeWarning():!ownership.known?this.t('unavailable'):!canFreeze?(ru?'Текущие настройки не подтверждены: фиксация недоступна':'Current settings are not confirmed: manual capture unavailable'):auto?(ru?'Сейчас автоматически. Зафиксировать текущие настройки':'Automatic control. Keep current settings manually'):(ru?'Передать управление автоматике':'Allow automatic control');
    return html`<button type="button" class="owner device-owner" data-owner=${!ready||!ownership.known?'unknown':auto?'ha':'manual'} aria-label=${label} title=${label} aria-busy=${this._deviceRequest?'true':nothing} ?disabled=${!ready||!ownership.known||!canFreeze||this._busy||!!this._deviceRequest} @click=${this.toggleDeviceOwner}><span class="owner-icon">${this._deviceRequest?html`<span class="spinner" aria-hidden="true"></span>`:stateIcon(!ready||!ownership.known?'info':auto?'lock':'auto_awesome',this.motion)}</span></button>`;
  }
  clearScaleHold(){if(this._scaleHold)clearTimeout(this._scaleHold.timer);this._scaleHold=null;}
  async openSettings(controlId=''){
    if(!this._config.settings_menu)return;this.clearScaleHold();this._settingsControlId=controlId;await this.updateComplete;
    await this.renderRoot.querySelector('ha-m3-quick-settings-menu')?.show();
  }
  startScaleHold(event,item){
    if(!this._config.settings_menu||event.isPrimary===false||event.button!==0||event.composedPath().some(node=>node?.tagName==='BUTTON'))return;
    this.clearScaleHold();const hold={id:event.pointerId,x:event.clientX,y:event.clientY,timer:null,sourceReady:available(this.entityState())&&this.runtimeReady()};
    hold.timer=setTimeout(()=>{if(this._scaleHold!==hold)return;this._scaleHold=null;this.renderRoot.querySelector(`[data-control-id="${item.id}"] ha-m3-slider`)?.cancelEdit('hold-menu');this.openSettings(item.id);},600);this._scaleHold=hold;
  }
  moveScaleHold(event){const h=this._scaleHold;if(h&&event.pointerId===h.id&&Math.hypot(event.clientX-h.x,event.clientY-h.y)>10)this.clearScaleHold();}
  scaleValueText(choice,item){if(choice===undefined||choice===null)return this.t('noData');if(choice==='auto')return this.t('automatic');if(choice==='off')return item.mode_scale.kind==='breather-temperature'?(locale(this.hass,this._config).startsWith('ru')?'Без нагрева':'Heating off'):this.t('off');if(choice==='turbo')return locale(this.hass,this._config).startsWith('ru')?'Турбо':'Turbo';return typeof choice==='number'?`${this.n(choice)} ${item.unit||'°C'}`:(item.option_labels?.[choice]||String(choice));}
  parameterSettings(item){
    const m=quickScaleModel(this.hass,this._config,item),permission=automationPermission(this.hass,item),ru=locale(this.hass,this._config).startsWith('ru');
    const ready=this.runtimeReady()&&!!(m.available||m.selectable)&&!this._busy&&!this._deviceRequest&&!this._scaleRequests[item.id];
    const value=this.scaleValueText(m.position===null?null:m.choices[m.position],item);
    const off=item.mode_scale.kind==='breather-temperature'?(ru?'«Без нагрева» задаёт 5 °C и не выключает приток воздуха.':'Heating off sets 5 °C without switching off airflow.'):(ru?'«Выключен» останавливает устройство.':'Off stops the device.');
    return html`<section class="parameter-settings" aria-label=${item.name}>
      <p>${ru?'Текущее значение':'Current value'}: <strong>${value}</strong></p>
      <p>${ru?'Управление':'Control'}: ${permission.available?(permission.automatic?this.t('automatic'):(ru?'Вручную':'Manual')):this.t('noData')}</p>
      <label for="parameter-choice">${ru?'Выбрать настройку':'Choose a setting'}</label>
      <select id="parameter-choice" class="scale-choice" aria-label=${item.name} .value=${''} ?disabled=${!ready} @change=${event=>{const raw=event.target.value;event.target.value='';if(!raw)return;const position=Number(raw);if(Number.isInteger(position)&&position>=0&&position<m.choices.length){this._scaleSnapshots[item.id]=roomSnapshot(this.hass,item);this.commitScale(item,position);}}}>
        <option value="" disabled selected>${ru?'Выберите значение':'Select a value'}</option>
        ${m.choices.map((v,i)=>html`<option value=${i} ?disabled=${item.mode_scale.kind==='ac-temperature'&&typeof v==='number'&&!m.room}>${this.scaleValueText(v,item)}</option>`)}
      </select>
      <p>${off} ${ru?'«Авто» передаёт этот параметр автоматике. Выбор применяется сразу.':'Auto delegates this parameter to automation. Selection applies immediately.'}</p>
      ${this._scaleRequests[item.id]?html`<p role="status">${this.t('pending')}</p>`:this._scaleErrors[item.id]?html`<p class="scale-error" role="alert">${this.scaleErrorText()}</p>`:nothing}
      <ha-m3-button kind="text" @click=${()=>{this._settingsControlId='';}}>${ru?'Все настройки устройства':'All device settings'}</ha-m3-button>
    </section>`;
  }
  settingsMenu(){
    const menu=this._config.settings_menu,item=this._config.quick_controls?.find(i=>i.id===this._settingsControlId&&i.mode_scale);
    return menu?html`<ha-m3-quick-settings-menu .hass=${this.hass} .config=${menu} .heading=${item?`${this.deviceName()}: ${item.name}`:this.deviceName()} .motion=${this.motion} .controlId=${this._settingsControlId}>${this.runtimeSettings()}${item?this.parameterSettings(item):nothing}</ha-m3-quick-settings-menu>`:nothing;
  }
  runtimeSettings(){
    const c=this._config,ru=locale(this.hass,c).startsWith('ru');
    return html`${!this.runtimeReady()?html`<p class="runtime-warning" role="status">${this.runtimeWarning()}</p><div class="runtime-actions">${c.stop_only?html`<ha-m3-button kind="text" .disabled=${!!this._stopRequest?.pending} @click=${this.stopNow}>${ru?'Остановить сейчас':'Stop now'}</ha-m3-button>`:nothing}${c.recovery?html`<ha-m3-button kind="text" .disabled=${this.s(c.runtime_ready_entity)?.state!=='on'||!!this._recoveryRequest?.pending} @click=${this.checkRecovery}>${ru?'Проверить управление':'Check control'}</ha-m3-button>`:nothing}</div>`:nothing}${this.stopFeedback()}${this.recoveryFeedback()}`;
  }
  displayScaleModel(item){
    const model=quickScaleModel(this.hass,this._config,item),card=this._config;
    const key=displayPrefix+JSON.stringify([this.hass?.user?.id||'anonymous',card.entity,item.id]);
    const signature=JSON.stringify([card.entity,item.mode_scale,item.value_entity,item.lock_entity]);
    this._scaleDisplay??=new Map();
    if(this.runtimeReady()&&this.s(card.entity)?.attributes?.control_contract==='durable-intent-v1'&&model.position!==null&&(model.available||model.selectionOnly&&model.selectable)){
      const record=scaleDisplayRecord(model,signature),previous=this._scaleDisplay.get(key);
      if(!previous||JSON.stringify({...record,savedAt:0})!==JSON.stringify({...previous,savedAt:0})||record.savedAt-previous.savedAt>60000){
        this._scaleDisplay.set(key,record);try{sessionStorage.setItem(key,JSON.stringify(record));}catch{}
      }
      return model;
    }
    if(model.position!==null&&model.choices.length)return model;
    let record=this._scaleDisplay.get(key);
    if(!record)try{record=JSON.parse(sessionStorage.getItem(key));}catch{}
    return restoreScaleDisplay(record,signature,model)||model;
  }
  scaleField(item,operation){
    const m=this.displayScaleModel(item),draft=this.runtimeReady()&&!m.displayOnly?this._scaleDrafts[item.id]:undefined,position=draft??m.position,choice=position===null?null:m.choices[position],disabled=!(m.available||m.selectionOnly&&m.selectable&&(item.mode_scale.kind!=='ac-temperature'||m.room))||!this.runtimeReady(),process=scalePresentation(item,m,parameterOperation(operation,item),draft,this._scaleSnapshots[item.id]);
    const waiting=this._scaleRequests[item.id],ru=locale(this.hass,this._config).startsWith('ru');
    let message=this._scaleErrors[item.id]?this.scaleErrorText():waiting?.saved?(ru?`Цель ${this.n(waiting.intent.value)} °C: ожидается применение`:`Target ${this.n(waiting.intent.value)} °C: awaiting application`):waiting?this.t('pending'):!m.available?this.t('noData'):'';
    const valueText=this.scaleValueText(choice,item);
    const saved=this.s(item.value_entity),savedValue=typeof saved?.state==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(saved.state)?Number(saved.state):NaN;
    const savedPermission=automationPermission(this.hass,item),savedOff=item.mode_scale.kind==='breather-temperature'&&m.deviceOff===true&&savedPermission.available&&!savedPermission.automatic&&available(saved)&&Number.isFinite(savedValue),savedSpeedOff=item.mode_scale.kind==='ac-speed'&&m.deviceOff===true&&savedPermission.available&&!savedPermission.automatic&&available(saved)&&m.choices.includes(saved.state);
    const savedPower=this.s(this._config.power?.value_entity),powerPermission=automationPermission(this.hass,this._config.power||{}),savedThermalPending=['ac-temperature','heater-temperature'].includes(item.mode_scale.kind)&&m.deviceOff===true&&savedPermission.available&&!savedPermission.automatic&&powerPermission.available&&!powerPermission.automatic&&savedPower?.state==='on'&&Number.isFinite(savedValue)&&!waiting?.saved;
    const waitReason=waiting?.saved||savedThermalPending?quickScaleWaitReason(this.hass,item):null;
    const waitText=waitReason?({cooldown:ru?'Защитная пауза компрессора - до 5 минут':'Compressor protection delay - up to 5 minutes',restart:ru?'Ожидание безопасного повторного включения':'Waiting for safe restart',thermal:ru?'Ожидание безопасного переключения нагрева и охлаждения':'Waiting for safe heating and cooling transition',room:ru?'Ожидание свежего показания комнатной температуры':'Waiting for a fresh room temperature reading'})[waitReason]:'';
    if(waitText&&!this._scaleErrors[item.id])message=waitText;
    if(m.turboCooldown>0)message=ru?`Турбо: пауза прибора. Повторный запуск через ${Math.ceil(m.turboCooldown/60)} мин.`:`Turbo: device cooldown. Restart in ${Math.ceil(m.turboCooldown/60)} min.`;
    if(m.selectionOnly&&!waiting&&!this._scaleErrors[item.id])message=ru?'Выбранная настройка сохранена. Ожидается связь с прибором.':'Selected setting saved. Waiting for the device connection.';
    if(m.displayOnly)message=ru?'Восстанавливается управление. Показана последняя настройка.':'Control is reconnecting. Showing the last setting.';
    return html`<div class="quick-field" data-control-id=${item.id} data-tone=${process.tone} data-preview=${String(process.preview)} @pointerdown=${event=>this.startScaleHold(event,item)} @pointermove=${this.moveScaleHold} @pointerup=${this.clearScaleHold} @pointercancel=${this.clearScaleHold} @keydown=${event=>{if(event.key==='Escape')this.clearScaleHold();}}>
      <div class="field-heading"><div class="field-caption"><label>${item.name}</label></div><div class="scale-head"><span class="scale-mode" aria-label=${process.preview?(ru?'Выбранная настройка':'Selected setting'):this.t(process.labelKey||'mode')}>${stateIcon(process.icon,this.motion)}</span><output data-state-value ?data-numeric=${/^[0-9]/.test(valueText)}>${valueText}</output>${this._config.settings_menu?html`<button type="button" class="scale-details" aria-label=${`${this.t('details')}: ${item.name}`} @click=${()=>this.openSettings(item.id)}>${icon('more_horiz')}</button>`:nothing}</div></div>
      ${position!==null?html`<div class="scale-owner">${stateIcon(m.owner==='ha'?'auto_awesome':'lock',this.motion)}<span>${draft!==undefined?(ru?'Выбор':'Preview'):m.owner==='ha'?this.t('automatic'):this.t('manualSetting')}</span>${draft!==undefined?html`<span class="preview-note">${waiting?(waitText?(ru?'Ожидание':'Waiting'):this.t('pending')):ru?'После отпускания':'On release'}</span>`:nothing}</div><div class="field-control"><ha-m3-slider .commitUnchanged=${true} .label=${item.name} .valueText=${valueText} .value=${Number(position)} .min=${0} .max=${Math.max(1,m.choices.length-1)} .step=${1} .disabled=${disabled} .haptics=${this.hass?.vibrate===true} .segmented=${true} motion=${this.motion} @m3-start=${()=>{this._scaleSnapshots[item.id]=roomSnapshot(this.hass,item);}} @m3-input=${event=>{this._scaleDrafts={...this._scaleDrafts,[item.id]:event.detail.value};}} @m3-change=${event=>this.commitScale(item,event.detail.value)} @m3-cancel=${()=>{this.clearScaleHold();const drafts={...this._scaleDrafts};delete drafts[item.id];this._scaleDrafts=drafts;delete this._scaleSnapshots[item.id];}}></ha-m3-slider></div><div class="scale-ticks" aria-hidden="true"><span>${item.mode_scale.kind==='breather-temperature'?this.scaleValueText('off',item):this.t('off')}</span><span>${this.t('automatic')}</span></div>`:nothing}
      ${!m.displayOnly&&!m.available&&(!m.selectionOnly||position===null||item.mode_scale.kind==='ac-temperature'&&!m.room)&&!waiting&&m.selectable?html`<select class="scale-choice" aria-label=${`${item.name}: ${ru?'выбрать настройку':'choose setting'}`} .value=${''} ?disabled=${!this.runtimeReady()} @change=${event=>{const position=Number(event.target.value);event.target.value='';if(Number.isInteger(position)){this._scaleSnapshots[item.id]=roomSnapshot(this.hass,item);this.commitScale(item,position);}}}><option value="" disabled selected>${ru?'Выберите настройку':'Choose a setting'}</option>${m.choices.map((v,i)=>html`<option value=${i} ?disabled=${item.mode_scale.kind==='ac-temperature'&&typeof v==='number'&&!m.room}>${this.scaleValueText(v,item)}</option>`)}</select>`:!m.displayOnly&&!m.available&&(!m.selectionOnly||position===null||item.mode_scale.kind==='ac-temperature'&&!m.room)&&!waiting?html`<ha-m3-button kind="text" .disabled=${!this.runtimeReady()||!available(this.s(item.mode_scale.revision_entity))||!available(this.s(item.mode_scale.completed_entity))} @click=${()=>this.commitScale(item,'force-off')}>${item.mode_scale.kind==='breather-temperature'?(ru?'Выключить нагрев':'Turn off heating'):(ru?'Выключить устройство':'Turn off device')}</ha-m3-button>`:nothing}
      ${savedOff?html`<div class="saved-hint">${ru?'Сохранено для включения':'Saved for startup'}: ${this.scaleValueText(savedValue===5?'off':savedValue,item)}</div>`:nothing}
      ${savedThermalPending&&!waitText?html`<div class="saved-hint">${ru?`Цель ${this.n(savedValue)} °C: ожидается применение`:`Target ${this.n(savedValue)} °C: awaiting application`}</div>`:nothing}
      ${savedSpeedOff?html`<div class="saved-hint">${ru?'Сохранено для включения':'Saved for startup'}: ${this.scaleValueText(saved.state,item)}</div>`:nothing}
      ${message?html`<div class="${this._scaleErrors[item.id]?'scale-error':'saved-hint'}" role=${this._scaleErrors[item.id]?'alert':'status'}>${message}</div>`:nothing}
    </div>`;
  }
  finishOwnerRequest(id){clearTimeout(this._ownerTimers.get(id));this._ownerTimers.delete(id);const requests={...this._ownerRequests};delete requests[id];this._ownerRequests=requests;}
  syncOwnerRequest(item){
    const request=this._ownerRequests[item.id],status=ownerRequestStatus(this.hass,item,request);
    const error=this._ownerErrors[item.id],actual=error?ownerModel(this.hass,item):null;
    if(!request&&error?.owner&&actual.available&&actual.owner===error.owner){const errors={...this._ownerErrors};delete errors[item.id];this._ownerErrors=errors;return;}
    if(status==='confirmed'){this.finishOwnerRequest(item.id);const errors={...this._ownerErrors};delete errors[item.id];this._ownerErrors=errors;}
    else if(status==='timeout'){this.finishOwnerRequest(item.id);this._ownerErrors={...this._ownerErrors,[item.id]:{owner:request.owner,key:'ownerConfirmationTimeout'}};}
  }
  async requestOwner(item,requested){
    if(!this.runtimeReady()||this._busy||this._ownerRequests[item.id])return;
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
    if(!this.runtimeReady()||this._busy||this._ownerRequests[item.id])return;
    const m=controlModel(this.hass,item);let action;
    try{action=valueAction(item.set_action,controlValue(m,position));}catch{this._error=true;return;}
    this._drafts={...this._drafts,[item.id]:position};await this.run(action,item.id);
    if(this._error){delete this._drafts[item.id];this.requestUpdate();return;}
    clearTimeout(this._draftTimers.get(item.id));this._draftTimers.set(item.id,setTimeout(()=>{delete this._drafts[item.id];this.requestUpdate();},8000));
  }
  cancelDraft(item){clearTimeout(this._draftTimers.get(item.id));this._draftTimers.delete(item.id);const drafts={...this._drafts};delete drafts[item.id];this._drafts=drafts;}
  changePower(item,selected){if(!this.runtimeReady()||this._busy||this._ownerRequests.power)return;return this.run(valueAction(item.action,selected),'power');}
  ownerLabel(item){
    if(!item.lock_entity)return nothing;
    const actual=ownerModel(this.hass,item),owner=actual.available?actual.owner:'unknown',pending=!!this._ownerRequests[item.id];
    return html`<span class="owner-label" data-owner=${owner} aria-busy=${pending?'true':nothing}>${this.t(ownerPresentation(owner).labelKey)}${pending?html` · ${this.t('pending')}`:nothing}</span>`;
  }
  permission(item,name,unavailable=false){
    if(!item.lock_entity)return nothing;
    const m=ownerModel(this.hass,item),request=this._ownerRequests[item.id],disabled=!this.runtimeReady()||unavailable||!m.available||this._busy||!!request,next=m.available?nextOwner(this.hass,item):null,owner=m.available?m.owner:'unknown';
    const presentation=ownerPresentation(owner),label=this.t(presentation.labelKey),accessibleLabel=this.t(presentation.accessibleKey),requestLabel=request?this.t(ownerPresentation(request.owner).accessibleKey):null,nextLabel=next?this.t(ownerPresentation(next).accessibleKey):null,description=`${name}: ${accessibleLabel}. ${request?this.t('pending')+': '+requestLabel:next?this.t('ownerNext')+': '+nextLabel:this.t('unavailable')}`;
    const help={heading:name,body:`${description}\n\n${this.t(presentation.helpKey)}\n\n${this.t('holdHelpHint')}`,motion:this.motion,language:locale(this.hass,this._config)};
    return html`<button type="button" class="owner" data-owner=${owner} data-next-owner=${next||nothing} data-requested-owner=${request?.owner||nothing} aria-busy=${request?'true':nothing} aria-label=${description} title=${description} aria-description=${`${this.t(presentation.helpKey)} ${this.t('holdHelpHint')}`} ?disabled=${disabled} ${holdHelp(help)} @click=${()=>this.requestOwner(item)}><span class="owner-icon">${request?html`<span class="spinner" aria-hidden="true"></span>`:icon(presentation.icon)}</span><span class="owner-copy">${label}</span></button>`;
  }
  async setAutomatic(item,automatic){
    if(!this.runtimeReady())return;
    this._permissionDrafts={...this._permissionDrafts,[item.id]:automatic};await this.run(automationAction(item,automatic),'permission:'+item.id);
    const key='permission:'+item.id;clearTimeout(this._draftTimers.get(key));
    if(this._error){delete this._permissionDrafts[item.id];this.requestUpdate();}
    else this._draftTimers.set(key,setTimeout(()=>{delete this._permissionDrafts[item.id];this.requestUpdate();},8000));
  }
  field(item,operation){
    if(item.mode_scale)return this.scaleField(item,operation);
    const m=controlModel(this.hass,item),draft=this.runtimeReady()?this._drafts[item.id]:undefined,position=draft??m.position,option=m.options?.[position],value=draft!==undefined?(m.options?option?.label:this.n(position)):m.auto?this.t('automatic'):m.options?m.label:m.value===null?this.t('noData'):this.n(m.value),disabled=!this.runtimeReady()||!m.available||this._busy||!!this._ownerRequests[item.id];
    const process=parameterOperation(operation,item);
    return html`<div class="quick-field" data-control-id=${item.id} data-tone=${process.tone}><div class="field-heading"><div class="field-caption"><label>${item.name}</label>${this.ownerLabel(item)}</div><output data-state-value aria-live="off">${value}${!m.options&&m.unit?html`<span> ${m.unit}</span>`:nothing}</output></div><div class="field-control"><ha-m3-slider .label=${item.name} .value=${Number(position)} .min=${m.min??0} .max=${m.max??1} .step=${m.step??1} .disabled=${disabled} motion=${this.motion} @m3-input=${event=>{this._drafts={...this._drafts,[item.id]:event.detail.value};}} @m3-change=${event=>this.commit(item,event.detail.value)} @m3-cancel=${()=>this.cancelDraft(item)}></ha-m3-slider>${this.permission(item,item.name,!m.available)}</div><small class="saved-hint">${!m.available?this.t('unavailable'):m.locked&&this.entityState()?.state==='off'?this.t('savedUntilOn'):nothing}</small>${this.ownerFeedback(item)}${renderHistory(this,item.history_sources||[{entity:item.entity,attribute:item.attribute,name:item.name,unit:m.unit||"",kind:"setting",...(m.options?{value_map:Object.fromEntries(m.options.map((o,i)=>[o.value,i+1]))}:{})}])}</div>`;
  }
  render(){
    const c=this._config,s=this.entityState(),ok=available(s),p=c.power,power=p?.on_when?matches(this.hass,p.on_when):ok&&!['off','idle'].includes(s.state),reported=operationModel(this.hass,c),draftItem=(c.quick_controls||[]).find(item=>item.mode_scale&&this._scaleDrafts[item.id]!==undefined),operation=draftItem?scalePresentation(draftItem,quickScaleModel(this.hass,c,draftItem),reported,this._scaleDrafts[draftItem.id],this._scaleSnapshots[draftItem.id]):reported,powerItem={...p,id:'power'},ownership=deviceOwnershipModel(this.hass,c),motion=operation.preview?'none':operationMotion(operation),operationLabel=operation.preview?(locale(this.hass,c).startsWith('ru')?'Предпросмотр выбранного режима':'Selected mode preview'):c.operation?[this.t(operation.labelKey),operation.activityKey?this.t(operation.activityKey):null].filter(Boolean).join(' - '):this.deviceValue();
    return html`<section class="surface ${c.grouped?'grouped':''}" data-operation=${operation.mode} data-tone=${operation.tone} data-ownership=${this.runtimeReady()?ownership.state:'unknown'} data-motion=${this.motion} data-operation-visible=${String(this._operationVisible)} data-page-visible=${String(this._pageVisible)} aria-label=${this.deviceName()}><div class="quick-header"><div class="quick-title"><span class="device-state quick-operation operation-symbol" data-tone=${operation.tone} role="img" data-motion=${motion} data-moving=${String(motion!=='none'&&!this._busy)} aria-label=${operationLabel}><span class="operation-glyph">${stateIcon(c.operation?operation.icon:c.icon||'devices',this.motion)}</span><span class="operation-copy" aria-hidden="true">${operationLabel}${operation.activityKey?html`<small class="operation-activity">${this.t(operation.activityKey)}</small>`:nothing}</span></span><div class="device-heading"><h2>${this.deviceName()}</h2>${!this.runtimeReady()?html`<span class="runtime-header" role="status" title=${this.runtimeWarning()}>${this.runtimeWarning()}</span>`:!ok?html`<span class="runtime-header" role="status">${locale(this.hass,c).startsWith('ru')?'Связь с прибором потеряна':'Device connection lost'}</span>`:nothing}</div></div>${this.deviceOwnerButton(ownership)}${c.settings_menu?html`<button type="button" class="scale-details" aria-label=${`${this.t('details')}: ${this.deviceName()}`} @click=${()=>this.openSettings()}>${icon('more_horiz')}</button>`:nothing}</div>${this._deviceError?html`<div class="scale-error" role="alert">${this.deviceErrorText()}</div>`:nothing}${p&&!c.device_ownership?html`<div class="power-policy" data-control-id="power"><div class="power-caption"><span>${this.t('power')}</span>${this.ownerLabel(powerItem)}</div><ha-m3-switch .selected=${power} .label=${`${this.deviceName()}: ${this.t('power')}`} .disabled=${!this.runtimeReady()||!ok||this._busy||!!this._ownerRequests.power} .loading=${this._pending==='power'} motion=${this.motion} @m3-change=${event=>this.changePower(p,event.detail.selected)}></ha-m3-switch>${this.permission(powerItem,this.t('power'),!ok)}</div>${this.ownerFeedback(powerItem)}`:nothing}<div class="quick-fields">${(c.quick_controls||[]).map(item=>this.field(item,operation))}</div>${!c.settings_menu?this.runtimeSettings():nothing}${this.feedback()}${c.actions?.length&&!c.settings_menu?html`<div class="footer-actions">${c.actions.map(a=>html`<ha-m3-button kind="text" .icon=${a.icon||'tune'} @click=${()=>this.run(a.action)}>${a.name}</ha-m3-button>`)}</div>`:nothing}${this.settingsMenu()}</section>`;
  }
}
customElements.define('ha-m3-quick-device-card',M3QuickDeviceCard);
