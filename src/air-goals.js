import {html,css,nothing} from 'lit';
import {available,finite,stateOf,actionAvailable} from './ha.js';
import {valueAction} from './quick-controls.js';
import {openPopover} from './popover.js';

// These are room intentions, not motor percentages. All device policy stays in HA.
export const airGoalStyles=css`
  .air-goal.preference .air-goal-value{flex-wrap:wrap;gap:0 8px}.air-goal.preference .air-goal-value output{font-size:16px;line-height:20px;min-width:0;overflow-wrap:anywhere}.air-goal.preference .air-goal-note:empty{display:none}
  .air-goal{min-width:0}.air-goal-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:32px;font-size:14px;line-height:20px}.air-goal-auto{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--md-sys-color-primary)}.air-goal-auto ha-m3-switch{flex-shrink:0}.air-goal-value{display:flex;justify-content:space-between;align-items:baseline;min-height:40px;margin-top:8px;gap:8px;color:var(--md-sys-color-on-surface-variant);font-size:12px}.air-goal-value output{font-size:24px;line-height:32px;font-variant-numeric:tabular-nums;color:var(--md-sys-color-primary);min-width:4ch;text-align:right}.air-goal .air-scale{display:flex;justify-content:space-between;font-size:11px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}.air-boost{display:flex;align-items:center;gap:0;margin-top:8px;min-height:40px}.air-boost>ha-m3-button:first-child{flex:1;min-width:0}.air-boost>ha-m3-button:first-child::part(button){border-start-end-radius:4px;border-end-end-radius:4px}.air-boost>ha-m3-button:last-child{flex-shrink:0}.air-goal-note{min-height:32px;font-size:11px;line-height:16px;margin:4px 0 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--md-sys-color-on-surface-variant)}.air-goal-note[role=alert]{color:var(--md-sys-color-error)}.air-boost-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.air-boost-clock{font-variant-numeric:tabular-nums}.health-alerts{display:grid;gap:8px;margin:8px 0}.health-alert{display:flex;align-items:center;justify-content:space-between;gap:8px;border:1px solid var(--md-sys-color-outline-variant);border-radius:12px;padding:8px 12px;font-size:12px;line-height:16px}.health-alert[data-state=error]{background:var(--md-sys-color-error-container);color:var(--md-sys-color-on-error-container)}.health-alert strong{font-weight:500}.health-alert p{margin:2px 0 0}.health-alert[data-state=unavailable]{color:var(--md-sys-color-on-surface-variant)}
`;
const booleanState=state=>available(state)&&['on','off'].includes(state.state);
// HA numeric states use decimal strings. Never turn whitespace, booleans or
// alternate radix strings into a manufactured zero/number via Number coercion.
function intentionNumber(value){
  if(typeof value!=='number'&&(typeof value!=='string'||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(value.trim())))return null;
  const number=Number(value);return Number.isFinite(number)?number===0?0:number:null;
}
export function airGoalModel(hass,item){
  const state=stateOf(hass,item.entity),automatic=stateOf(hass,item.automatic_entity),value=intentionNumber(state?.state),attrs=state?.attributes||{},min=finite(attrs.min),max=finite(attrs.max),step=finite(attrs.step),availability=stateOf(hass,item.availability_entity);
  const numericReady=available(state)&&value!==null&&value>=0&&value<=100&&min===0&&max===100&&step!==null&&step>0&&step<=100;
  if(item.semantics==='preference')return {available:numericReady,value,preference:true,automatic:false,automatic_value:null,display_value:value,display_available:numericReady,min:0,max:100,step:step??1};
  const ready=numericReady&&booleanState(automatic)&&(!item.availability_entity||availability?.state==='on');
  const suggestion=stateOf(hass,item.automatic_value_entity||item.entity),suggested=intentionNumber(suggestion?.state),automaticValue=available(suggestion)&&suggested!==null&&suggested>=0&&suggested<=100?suggested:null,isAutomatic=automatic?.state==='on';
  return {available:ready,value,automatic:isAutomatic,automatic_value:automaticValue,display_value:isAutomatic?automaticValue:value,display_available:ready&&(!isAutomatic||automaticValue!==null),min:0,max:100,step:step??1};
}
export function airGoalPresentation(model,draft){const automatic=model.preference?false:draft?.automatic??model.automatic,value=draft?.value??(automatic?model.automatic_value:model.value);return {automatic,value,available:model.available&&value!==null,slider_value:value??model.value};}
export function airPreferenceLabel(item,value){
  if(value===null||value===undefined||!Number.isFinite(value))return null;
  const neutral=item.neutral_value??50;
  return (item.value_labels||[]).reduce((best,mark)=>!best||Math.abs(mark.value-value)<Math.abs(best.value-value)||Math.abs(mark.value-value)===Math.abs(best.value-value)&&Math.abs(mark.value-neutral)<Math.abs(best.value-neutral)?mark:best,null)?.label??null;
}
export function airGoalValue(model,position){
  const value=intentionNumber(position);if(!model.available||value===null||value<0||value>100||Math.abs(value/model.step-Math.round(value/model.step))>1e-5)throw new Error('Unavailable or invalid air intention');return value;
}
export function airBoostModel(hass,item,now=Date.now()){
  const boost=item.boost;if(!boost)return {available:false,active:false,remaining:null,expired:false};
  const active=stateOf(hass,boost.active_entity),deadline=stateOf(hass,boost.deadline_entity),timestamp=finite(deadline?.attributes?.timestamp),known=booleanState(active)&&available(deadline)&&timestamp!==null&&timestamp>0,enabled=active?.state==='on';
  const remaining=known&&enabled?Math.max(0,Math.ceil((timestamp*1000-now)/1000)):null;
  return {available:known&&airGoalModel(hass,item).available&&(!item.availability_entity||stateOf(hass,item.availability_entity)?.state==='on')&&(!boost.availability_entity||stateOf(hass,boost.availability_entity)?.state==='on'),active:enabled,can_cancel:booleanState(active)&&enabled&&actionAvailable(hass,boost.cancel_action),remaining,expired:enabled&&remaining===0};
}
export function airCountdown(seconds){return seconds===null?null:`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;}
export function airBoostAction(hass,item,duration,now=Date.now()){
  const model=airBoostModel(hass,item,now);if(!model.available||model.active||!item.boost.durations.includes(duration))throw new Error('Unavailable or already active air boost');return valueAction(item.boost.start_action,duration);
}
function replaceDraft(card,id,draft){card._airDrafts={...card._airDrafts,[id]:draft};}
function clearDraft(card,id){const drafts={...card._airDrafts};delete drafts[id];card._airDrafts=drafts;clearTimeout(card._airGoalTimers?.[id]);}
export function syncAirGoalDrafts(card){
  for(const [id,draft]of Object.entries(card._airDrafts||{})){
    const item=card._config.air_goals?.find(item=>item.id===id),model=item&&airGoalModel(card.hass,item);
    if(!model?.available){clearDraft(card,id);continue;}
    if(draft.editing)continue;
    if((model.preference||model.automatic===draft.automatic)&&(draft.value===undefined||model.value===draft.value))clearDraft(card,id);
  }
}
export function clearAirGoalTimers(card){for(const timer of Object.values(card._airGoalTimers||{}))clearTimeout(timer);card._airDrafts={};}
export async function commitAirGoal(card,item,position){
  if(card._busy){clearDraft(card,item.id);return;}
  try{const model=airGoalModel(card.hass,item),value=airGoalValue(model,position);replaceDraft(card,item.id,model.preference?{value}:{value,automatic:false});await submitAirGoal(card,item,valueAction(item.set_action,value));}catch{clearDraft(card,item.id);card._error=true;}
}
export async function commitAirAutomatic(card,item,automatic){
  if(card._busy)return;
  try{if(item.semantics==='preference'||!airGoalModel(card.hass,item).available||typeof automatic!=='boolean')throw new Error('Unavailable air intention');replaceDraft(card,item.id,{automatic});await submitAirGoal(card,item,valueAction(item.automatic_action,automatic));}catch{clearDraft(card,item.id);card._error=true;}
}
async function submitAirGoal(card,item,action){
  card._airGoalErrors={...card._airGoalErrors,[item.id]:false};await card.run(action,'air-goal:'+item.id);
  if(card._error){clearDraft(card,item.id);return;}
  syncAirGoalDrafts(card);if(!card._airDrafts?.[item.id])return;
  card._airGoalTimers||={};clearTimeout(card._airGoalTimers[item.id]);card._airGoalTimers[item.id]=setTimeout(()=>{clearDraft(card,item.id);card._airGoalErrors={...card._airGoalErrors,[item.id]:true};},8000);
}
export function airHealthAlerts(hass,items=[]){return items.map(item=>({item,status:stateOf(hass,item.status_entity)?.state,message:stateOf(hass,item.message_entity)})).filter(row=>row.status!=='healthy').map(row=>({...row,severity:['error','recovery_required'].includes(row.status)?'error':'unavailable'}));}
export function airHealthAcknowledgementAvailable(hass,item){return !!item.acknowledge_action&&actionAvailable(hass,item.acknowledge_action)&&(!item.acknowledgement_entity||stateOf(hass,item.acknowledgement_entity)?.state==='on');}
export function renderHealthAlerts(card){
  const alerts=airHealthAlerts(card.hass,card._config.health_alerts);return alerts.length?html`<div class="health-alerts">${alerts.map(({item,status,severity,message})=>html`<div class="health-alert" data-state=${severity} role=${severity==='error'?'alert':'status'}><span><strong>${item.name}: ${card.t(status==='recovery_required'?'recoveryRequired':status==='health_unknown'?'healthUnknown':severity==='error'?'deviceFault':'unavailable')}</strong><p>${available(message)?message.state:card.t(severity==='error'?'deviceFaultStopped':'deviceOfflineSkipped')}</p></span>${item.acknowledge_action?html`<ha-m3-button kind="text" .disabled=${card._busy||!airHealthAcknowledgementAvailable(card.hass,item)} @click=${()=>airHealthAcknowledgementAvailable(card.hass,item)&&card.run(item.acknowledge_action,'fault:'+item.id)}>${card.t('acknowledgeFault')}</ha-m3-button>`:nothing}</div>`)}</div>`:nothing;
}
export function renderAirGoals(card){return (card._config.air_goals||[]).map(item=>{
  const model=airGoalModel(card.hass,item),draft=card._airDrafts?.[item.id],shown=airGoalPresentation(model,draft),{value,automatic}=shown,boost=airBoostModel(card.hass,item,card._now),busy=card._busy,disabled=!model.available||busy,boostDisabled=busy||!(boost.active?boost.can_cancel:boost.available),menuId='air-boost-'+item.id,status=card.s(item.status_entity),failure=card._airGoalErrors?.[item.id];
  const preference=model.preference,qualitative=preference?airPreferenceLabel(item,value):null,lowLabel=item.low_label||item.value_labels?.[0]?.label||card.t('less'),highLabel=item.high_label||item.value_labels?.at(-1)?.label||card.t('moreIntense');
  const open=event=>openPopover(card,menuId,event),start=async duration=>{try{await card.run(airBoostAction(card.hass,item,duration,Date.now()),'air-boost:'+item.id);if(!card._error)card.renderRoot.getElementById(menuId)?.hidePopover();}catch{card._error=true;}};
  return html`<div class="air-goal ${preference?'preference':''}" data-air-goal=${item.id} data-semantics=${preference?'preference':'legacy'} ?data-display-unknown=${!shown.available}>
    <div class="air-goal-heading"><span>${item.name}</span>${preference?nothing:html`<label class="air-goal-auto"><span>${card.t('haAuto')}</span><ha-m3-switch .label=${`${item.name}: ${card.t('haAuto')}`} .selected=${automatic} .disabled=${disabled} motion=${card.motion} @m3-change=${event=>commitAirAutomatic(card,item,event.detail.selected)}></ha-m3-switch></label>`}</div>
    <div class="air-goal-value"><span>${preference?item.preference_note||card.t('yourWish'):automatic?card.t('goalAutomatic'):card.t('yourWish')}</span><output>${shown.available?preference?qualitative:card.n(value):card.t('noData')}</output></div>
    <ha-m3-slider .label=${`${item.name}: ${card.t('yourWish')}`} .valueText=${preference?qualitative:undefined} .value=${Number(shown.slider_value??0)} .min=${0} .max=${100} .step=${model.step} .disabled=${disabled} motion=${card.motion} @m3-input=${event=>{if(!disabled)replaceDraft(card,item.id,preference?{value:event.detail.value,editing:true}:{value:event.detail.value,automatic:false,editing:true});}} @m3-change=${event=>commitAirGoal(card,item,event.detail.value)}></ha-m3-slider>
    <div class="air-scale"><span>${preference?lowLabel:card.t('less')}</span><span>${preference?highLabel:card.t('moreIntense')}</span></div>
    ${item.boost?html`<div class="air-boost"><ha-m3-button kind=${boost.active?'tonal':'text'} .disabled=${boostDisabled} @click=${event=>boost.active?open(event):start(item.boost.default_duration)}>${boost.active?html`<span class="air-boost-clock">${card.t('airBoostActive')} · ${boost.expired?card.t('finishing'):airCountdown(boost.remaining)||card.t('noData')}</span>`:html`${item.boost.action_name||card.t('airBoost')} · ${item.boost.default_duration} ${card.t('minutes')}`}</ha-m3-button><ha-m3-button kind="text" icon="expand_more" .label=${`${item.name}: ${card.t('airBoostSettings')}`} .disabled=${boostDisabled} @click=${open}></ha-m3-button></div>`:nothing}
    <p class="air-goal-note" role=${failure?'alert':'status'}>${failure?card.t('goalNotConfirmed'):!model.available?card.t('unavailable'):!shown.available?card.t('noData'):available(status)?status.state:preference?nothing:card.t('wishScale')}</p>
    ${item.boost?html`<div id=${menuId} popover role="dialog" aria-label=${`${item.name}: ${card.t('airBoostSettings')}`}><h3>${item.name}</h3><p>${boost.active?card.t('airBoostRunning'):card.t('airBoostHint')}</p>${boost.active?html`<p class="air-boost-clock">${card.t('remaining')}: ${boost.expired?card.t('finishing'):airCountdown(boost.remaining)||card.t('noData')}</p><div class="popover-actions"><ha-m3-button kind="text" @click=${()=>card.renderRoot.getElementById(menuId).hidePopover()}>${card.t('close')}</ha-m3-button><ha-m3-button kind="filled" .disabled=${!boost.can_cancel||busy} @click=${async()=>{await card.run(item.boost.cancel_action,'air-boost-cancel:'+item.id);if(!card._error)card.renderRoot.getElementById(menuId).hidePopover();}}>${card.t('finish')}</ha-m3-button></div>`:html`<div class="air-boost-choices">${item.boost.durations.map(duration=>html`<ha-m3-button kind="tonal" .disabled=${!boost.available||busy} @click=${()=>start(duration)}>${duration} ${card.t('minutes')}</ha-m3-button>`)}</div>`}</div>`:nothing}
  </div>`;
});}
