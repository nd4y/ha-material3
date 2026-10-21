import {html,css,nothing} from 'lit';
import {renderHistory} from './history.js';
import {available,actionAvailable} from './ha.js';
import {controlModel,controlValue,valueAction,automationSummary} from './quick-controls.js';

export const roomControlStyles=css`
  .room-target{margin:20px 0 16px}.room-target-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;line-height:20px}.room-target output{font-size:24px;line-height:32px;min-width:6ch;text-align:right;font-variant-numeric:tabular-nums}.room-target .endpoints{display:flex;justify-content:space-between;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}
  .context-metric{min-width:0;flex:1;min-width:100px}.context-sensors{width:100%;display:flex;gap:16px;flex-wrap:wrap;margin:12px 0;color:var(--md-sys-color-on-surface-variant);font-size:12px;line-height:16px}.automation-access{border-top:1px solid var(--md-sys-color-outline-variant);margin-top:20px;padding-top:16px}.automation-access h3{font-size:12px;line-height:16px;font-weight:500;color:var(--md-sys-color-on-surface-variant);margin:0 0 8px}.access-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:12px;align-items:baseline;min-height:32px;font-size:12px;line-height:16px}.access-row strong{font-weight:500}.access-row span{color:var(--md-sys-color-primary)}.access-row[unavailable] span{color:var(--md-sys-color-on-surface-variant)}.reset-automation{margin-top:12px;display:flex;justify-content:flex-start}.preset-list[data-five] ha-m3-button:first-child{grid-column:1/-1}
  .room-mode-status{height:48px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
`;
export function renderRoomTarget(card){
  const c=card._config;if(!c.target_slider)return nothing;
  const m=controlModel(card.hass,{entity:c.entities.target_temperature}),value=card._roomTargetDraft??m.value;
  return html`<div class="room-target"><div class="room-target-heading"><span>${c.target_name||card.t('desiredTemperature')}</span><output>${value===null?card.t('noData'):card.n(value)} °C</output></div><ha-m3-slider .label=${c.target_name||card.t('desiredTemperature')} .value=${Number(value)} .min=${m.min??0} .max=${m.max??1} .step=${m.step??1} .disabled=${!m.available||card._busy} motion=${card.motion} @m3-input=${event=>{card._roomTargetDraft=event.detail.value;}} @m3-change=${event=>commitRoomTarget(card,event.detail.value)}></ha-m3-slider><div class="endpoints"><span>${card.n(m.min??0)}°</span><span>${card.n(m.max??0)}°</span></div>${renderHistory(card,[{entity:c.entities.room_temperature,name:c.temperature_name||card.t("current"),unit:"°C"},{entity:c.entities.target_temperature,name:c.target_name||card.t("target"),unit:"°C",kind:"setting"}])}</div>`;
}
export async function commitRoomTarget(card,position){
  const c=card._config,m=controlModel(card.hass,{entity:c.entities.target_temperature}),action=c.target_action||{action:'perform-action',perform_action:'input_number.set_value',target:{entity_id:c.entities.target_temperature},value_field:'value'};
  try{const value=controlValue(m,position);card._roomTargetDraft=value;await card.run(valueAction(action,value),'room-target');if(card._error)card._roomTargetDraft=null;else{clearTimeout(card._roomTargetTimer);card._roomTargetTimer=setTimeout(()=>{card._roomTargetDraft=null;},8000);}}catch{card._error=true;card._roomTargetDraft=null;}
}
export function renderContext(card){
  return card._config.context_sensors?.length?html`<div class="context-sensors">${card._config.context_sensors.map(item=>{const state=card.s(item.entity);return html`<div class="context-metric"><span>${item.name}: ${available(state)?card.n(state.state):card.t('noData')} ${available(state)?state.attributes?.unit_of_measurement||'':''}</span>${renderHistory(card,[{entity:item.entity,name:item.name,unit:state?.attributes?.unit_of_measurement||item.unit||""}],item.details||[],item.details_title||item.name)}</div>`;})}</div>`:nothing;
}
export function renderAutomationAccess(card){
  const c=card._config;return c.automation_groups?.length?html`<div class="automation-access"><h3>${card.t('automationAccess')}</h3>${c.automation_groups.map(group=>{const model=automationSummary(card.hass,group);return html`<div class="access-row" ?unavailable=${!model.available}><strong>${group.name}</strong><span title=${model.manual.length?`${card.t('manualSetting')}: ${model.manual.join(', ')}`:card.t('allParameters')}>${!model.available?card.t('unavailable'):model.automatic.length===group.controls.length?card.t('allParameters'):model.automatic.join(', ')||card.t('noParameters')}</span></div>`;})}${c.automation_reset?html`<div class="reset-automation"><ha-m3-button kind="tonal" icon="auto_awesome" .disabled=${card._busy||!actionAvailable(card.hass,c.automation_reset.action)} @click=${()=>card.run(c.automation_reset.action,'automation-reset')}>${c.automation_reset.name}</ha-m3-button></div>`:nothing}</div>`:nothing;
}
