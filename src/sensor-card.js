import {html,css,nothing} from 'lit';
import {M3BaseCard} from './cards.js';
import {common,icon} from './components.js';
import {formatState} from './ha.js';
import {locale} from './localize.js';
import {sensorTileModel,validateSensorGroups} from './sensor-model.js';

export class M3SensorCard extends M3BaseCard{
  static styles=[common,css`
    :host{container-type:inline-size}.surface{padding:var(--ha-m3-ui-card-padding);border-radius:var(--ha-m3-ui-card-radius);background:var(--md-sys-color-surface-container);min-width:0}
    h2{font-size:20px;line-height:28px;margin-bottom:12px}.groups{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:16px}.group{min-width:0}h3{font-size:14px;line-height:20px;font-weight:500;margin-bottom:8px;color:var(--md-sys-color-on-surface-variant)}
    .tiles{display:grid;gap:2px;border-radius:20px;overflow:hidden}.tile{min-width:0;border-radius:4px;background:var(--md-sys-color-surface-container-high);overflow:hidden}.main{display:grid;grid-template-columns:28px minmax(0,1fr);align-items:center;gap:8px;width:100%;min-height:64px;padding:8px 12px;border:0;text-align:start;background:transparent;cursor:pointer;position:relative;isolation:isolate}
    .main::before{content:'';position:absolute;inset:0;background:currentColor;opacity:0;pointer-events:none;z-index:-1;transition:opacity var(--fx-fast)}.main:hover::before{opacity:.08}.main:active::before{opacity:.10}button:focus-visible,summary:focus-visible{outline:2px solid var(--md-sys-color-primary);outline-offset:-3px}.symbol{color:var(--md-sys-color-primary);font-size:23px}.name{font-size:14px;line-height:20px;color:var(--md-sys-color-on-surface-variant);display:block}.value{font-size:17px;line-height:24px;font-variant-numeric:tabular-nums;display:block;overflow-wrap:anywhere}.metric{white-space:nowrap}.metric+.metric::before{content:' · ';white-space:pre}.metric-label{font-size:12px}
    .foot{display:flex;gap:6px;align-items:center;justify-content:space-between;padding:0 12px;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant);flex-wrap:wrap}.foot button{font:inherit;border:0;background:transparent;padding:2px 0;min-height:44px;min-width:44px;cursor:pointer}.status{display:flex;gap:4px;align-items:center}.status .symbol{font-size:14px;color:inherit}.tile[data-state=alarm]{background:var(--md-sys-color-error-container);color:var(--md-sys-color-on-error-container)}.tile[data-state=alarm] .name,.tile[data-state=alarm] .foot,.tile[data-state=alarm] .symbol{color:inherit}.tile[data-state=unavailable] .symbol,.tile[data-state=unknown] .symbol{color:var(--md-sys-color-on-surface-variant)}.tile[data-state=lowBattery] .status{color:var(--md-sys-color-error)}
    details{padding:0 12px 4px;font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}summary{cursor:pointer;min-height:44px;display:flex;align-items:center;gap:4px}summary::marker{content:''}.reports{display:grid;gap:6px;margin-top:4px}.report{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.report button{border:0;border-radius:8px;padding:4px;text-align:start;background:transparent;cursor:pointer;color:var(--md-sys-color-primary);min-height:44px}.report time{font-variant-numeric:tabular-nums;text-align:end;font-size:12px}.note{font-size:12px;line-height:16px;margin-top:8px}
    @container(max-width:400px){.surface{padding:var(--ha-m3-ui-compact-card-padding)}.groups{gap:16px}}
  `];
  setConfig(config){validateSensorGroups(config);super.setConfig(config);}
  getGridOptions(){return{columns:'full',rows:'auto',min_columns:6};}
  getCardSize(){return(this._config.groups||[]).reduce((n,g)=>n+g.tiles.length,1);}
  metricText(metric){
    if(metric.status!=='available')return this.t(metric.status==='unavailable'?'unavailable':'sensorUnknown');
    if(metric.decimals!==undefined&&Number.isFinite(Number(metric.state.state)))return `${this.n(Number(metric.state.state),{minimumFractionDigits:metric.decimals,maximumFractionDigits:metric.decimals})}${metric.state.attributes?.unit_of_measurement?' '+metric.state.attributes.unit_of_measurement:''}`;
    return formatState(this.hass,metric.state);
  }
  reportTime(state){const date=new Date(state?.last_reported||state?.last_updated||'');return Number.isFinite(date.getTime())?date.toLocaleString(locale(this.hass,this._config)):this.t('noData');}
  tile(tile){
    const m=sensorTileModel(tile,this.hass?.states),name=tile.name||m.primary?.attributes?.friendly_name||tile.entity;
    const statusKey={alarm:'sensorWet',ready:'sensorHasData',unavailable:'unavailable',unknown:'sensorUnknown',partial:'sensorPartial',lowBattery:'sensorLowBattery'}[m.status];
    const statusText=m.dry&&m.status==='ready'?this.t('sensorDry'):this.t(statusKey);
    const glyph=m.alarm?'error':m.status==='unavailable'||m.status==='unknown'?'info':tile.icon||(m.moisture?'water_drop':'thermostat');
    return html`<article class="tile" data-state=${m.status}>
      <button class="main" aria-label=${`${name}: ${statusText}`} @click=${()=>this.more(tile.entity)}>${icon(glyph)}<span><span class="name">${name}</span><span class="value">${m.moisture?this.t(m.alarm?'sensorWet':m.dry?'sensorDry':m.status==='unavailable'?'unavailable':'sensorUnknown'):m.metrics.map(metric=>html`<span class="metric">${metric.name?html`<span class="metric-label">${metric.name} </span>`:nothing}${this.metricText(metric)}</span>`)}</span></span></button>
      <div class="foot"><span class="status">${m.status!=='ready'?icon(m.alarm?'error':'info'):nothing}${statusText}</span>${tile.battery?html`<button aria-label=${this.t('sensorBattery')} @click=${()=>this.more(tile.battery)}>${this.t('sensorBattery')} ${m.batteryValue===null?'—':this.n(m.batteryValue)+'%'}</button>`:nothing}</div>
      <details><summary>${this.t('sensorDetails')}${icon('expand_more')}</summary><div class="reports">${m.metrics.map(metric=>html`<div class="report"><button @click=${()=>this.more(metric.entity)}>${metric.name||metric.state?.attributes?.friendly_name||metric.entity}</button><time title=${this.t('sensorReport')}>${this.reportTime(metric.state)}</time></div>`)}</div><p class="note">${this.t('sensorReportNote')}</p></details>
    </article>`;
  }
  render(){return html`<section class="surface" aria-label=${this._config.title||this.t('sensorGroups')}>${this._config.title?html`<h2>${this._config.title}</h2>`:nothing}<div class="groups">${(this._config.groups||[]).map(group=>html`<section class="group" aria-label=${group.name}><h3>${group.name}</h3><div class="tiles">${group.tiles.map(tile=>this.tile(tile))}</div></section>`)}</div></section>`;}
}
customElements.define('ha-m3-sensor-card',M3SensorCard);
