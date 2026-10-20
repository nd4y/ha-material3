import {html,css,nothing} from 'lit';
import {actionAvailable,selectedPreset} from './ha.js';

export const presetControlStyles=css`
  .calm-preset-compact{display:flex;align-items:center;flex-wrap:wrap;gap:4px 16px;min-width:0}
  .calm-preset-icons{display:flex;align-items:center;flex-wrap:wrap;gap:4px;min-width:0}
  .calm-preset-icons .preset-icon{flex:0 0 48px;width:48px;height:48px}
  .calm-preset-current{min-width:0;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant);overflow-wrap:anywhere}
  .calm-preset-current strong{font-weight:500;color:var(--md-sys-color-on-surface)}
`;

export function presetControlsModel(card){
  const config=card._config,mode=selectedPreset(card.hass,config);
  const choices=(config.presets||[]).map(preset=>{
    const menu=preset.id===config.maximum?.preset_id&&!!config.maximum?.start_action;
    const action=menu?config.maximum.start_action:preset.action;
    return {...preset,selected:mode===preset.id,disabled:!!card._busy||!!preset.disabled||!actionAvailable(card.hass,action),loading:card._pending===(menu?'maximum':preset.id)};
  });
  return {icons:config.preset_style==='icons',label:config.presets_name||card.t('ventilation'),choices,current:choices.find(preset=>preset.selected)?.name||card.t('custom')};
}

export function renderPresetControls(card,choose){
  const model=presetControlsModel(card);
  const select=(preset,event)=>{if(!preset.disabled)return choose(card,preset,event);};
  if(!model.choices.length)return nothing;
  if(!model.icons)return html`<div class="calm-presets" role="group" aria-label=${model.label}>${model.choices.map(preset=>html`<ha-m3-button full .toggle=${true} .selected=${preset.selected} .disabled=${preset.disabled} .loading=${preset.loading} motion=${card.motion} @click=${event=>select(preset,event)}><span>${preset.name}</span></ha-m3-button>`)}</div>`;
  return html`<div class="calm-preset-compact"><div class="calm-preset-icons" role="group" aria-label=${model.label}>${model.choices.map(preset=>html`<ha-m3-button class="preset-icon" kind="icon" data-preset-id=${preset.id} .icon=${preset.icon||'air'} .label=${preset.name} title=${preset.name} .toggle=${true} .selected=${preset.selected} .disabled=${preset.disabled} .loading=${preset.loading} motion=${card.motion} @click=${event=>select(preset,event)}></ha-m3-button>`)}</div><p class="calm-preset-current" aria-live="polite">${card.t('mode')}: <strong>${model.current}</strong></p></div>`;
}
