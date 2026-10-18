import {LitElement,html,css,nothing} from 'lit';
import {common,icon} from './components.js';
import {selectField,sliderField} from './fields.js';
import {applyTheme} from './theme.js';
import {available,finite,stateOf,stepTarget,targetDecimals,selectedPreset,timerText,formatState,actionAvailable,perform,validateConfig,matches,actuatorState,actuatorAction} from './ha.js';
import {translate,locale,formatNumber} from './localize.js';

const cardStyles=css`
  :host{container-type:inline-size;--md-ref-typeface-plain:var(--ha-m3-ui-font-family,'HA M3 Roboto',Roboto,Arial,sans-serif);--md-ref-typeface-brand:var(--md-ref-typeface-plain)}
  .surface{background:var(--md-sys-color-surface-container);border-radius:var(--ha-m3-ui-card-radius);padding:var(--ha-m3-ui-card-padding);min-width:0}header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}header .symbol{color:var(--md-sys-color-on-surface-variant)}
  .actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.status{padding-top:12px;min-height:32px;font-size:12px;line-height:16px;letter-spacing:.4px;display:flex;align-items:center;gap:8px;color:var(--md-sys-color-on-surface-variant)}.status .symbol{font-size:18px;color:var(--md-sys-color-primary)}
  .sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.error{margin-top:16px}.fields{display:grid;gap:16px;min-width:0}ha-m3-md-outlined-select{width:100%;--md-outlined-select-text-field-container-shape:4px}.slider-label{display:grid;grid-template-columns:1fr auto;align-items:center;gap:8px;font-size:14px;line-height:20px}ha-m3-slider{grid-column:1/-1;min-width:100%;--md-slider-handle-width:4px;--md-slider-handle-height:44px;--md-slider-handle-shape:2px;--md-slider-active-track-height:16px;--md-slider-inactive-track-height:16px;--md-slider-inactive-track-shape:8px;--md-slider-active-track-shape:8px}
  .field-note{font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}
  @container(max-width:350px){.surface{padding:var(--ha-m3-ui-compact-card-padding)}header{margin-bottom:20px}}
`;
export class M3BaseCard extends LitElement{
  static properties={hass:{attribute:false},_config:{state:true},_busy:{state:true},_error:{state:true},_pending:{state:true}};
  static styles=[common,cardStyles];
  constructor(){super();this._config={};this._busy=false;this._error=false;this._pending='';}
  setConfig(config){this._config=validateConfig(config,this.kind||'panel');}
  get hass(){return this._hass;}
  set hass(value){const old=this._hass;this._hass=value;this.requestUpdate('hass',old);}
  willUpdate(){applyTheme(this,this._config,this.hass);}
  t(key){return translate(this.hass,this._config,key);}
  n(value,options){return formatNumber(this.hass,this._config,value,options);}
  s(entity){return stateOf(this.hass,entity);}
  more(entity){return perform(this,this.hass,{action:'more-info',entity});}
  get motion(){return this._config.appearance?.motion||'expressive';}
  async run(action,key='action'){
    if(this._busy)return;const focus=this.renderRoot?.activeElement;this._busy=true;this._pending=key;this._error=false;this._lastAction=action;
    try{await perform(this,this.hass,action);}catch{this._error=true;}finally{this._busy=false;this._pending='';await this.updateComplete;requestAnimationFrame(()=>{let active=document.activeElement;while(active?.shadowRoot?.activeElement)active=active.shadowRoot.activeElement;if(focus?.isConnected&&(!active||active===document.body))focus.focus({preventScroll:true});});}
  }
  feedback(){return html`<span class="sr-only" role="status">${this._busy?this.t('pending'):''}</span>${this._error?html`<div class="error" role="alert">${this.t('error')}<ha-m3-button kind="text" @click=${()=>this.run(this._lastAction)}>${this.t('retry')}</ha-m3-button></div>`:nothing}`;}
  getCardSize(){return 4;}
  getGridOptions(){return{columns:6,rows:'auto',min_columns:3};}
}

export class M3ClimateCard extends M3BaseCard{
  static properties={...M3BaseCard.properties,_now:{state:true}};
  static styles=[common,cardStyles,css`
    .actuators{border-top:1px solid var(--md-sys-color-outline-variant);padding:16px 0;margin-bottom:16px}.actuators>.body-label{color:var(--md-sys-color-on-surface-variant)}.actuators .toggle-row{min-height:56px;margin:0}.actuators .toggle-label strong{font-size:14px;line-height:20px}
    .temperature{padding:var(--ha-m3-ui-card-padding);background:var(--ha-m3-ui-temperature-background);color:var(--md-sys-color-on-surface);border-radius:var(--ha-m3-ui-temperature-radius);display:flex;flex-direction:column;gap:24px;margin-bottom:24px}.body-label{font-size:14px;line-height:20px;letter-spacing:.25px}.reading{display:flex;align-items:baseline;gap:4px;font-variant-numeric:tabular-nums}.reading strong{color:var(--md-sys-color-primary);font-size:57px;line-height:64px;letter-spacing:-.25px;font-weight:500}.reading .unit{font-size:24px;line-height:32px}.reading.unknown strong{font-size:24px;line-height:32px}
    .goal{display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap}.stepper{display:flex;gap:0;align-items:center}.target-value{display:grid;font-size:32px;line-height:40px;letter-spacing:0;min-width:58px;text-align:center;font-variant-numeric:tabular-nums}.target-value>*{grid-area:1/1;font:inherit}.sizing{visibility:hidden;pointer-events:none;user-select:none}output{margin:0}
    .toggle-row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:72px;margin-bottom:16px}.toggle-label{display:flex;align-items:center;gap:16px}.toggle-label>.symbol{color:var(--md-sys-color-primary)}.toggle-label strong{display:block;font-size:16px;line-height:24px;letter-spacing:.5px;font-weight:400}.toggle-label small{font-size:12px;line-height:16px;color:var(--md-sys-color-on-surface-variant)}
    .preset-heading{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:16px;line-height:24px;letter-spacing:.5px}.preset-heading ha-m3-button{margin-right:-12px}.compact{display:none}.timer{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;border-radius:12px;margin-top:16px;padding:4px 12px;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container)}.countdown{font-variant-numeric:tabular-nums}
    .preset-list{display:grid;gap:8px}details{margin-top:24px;border-top:1px solid var(--md-sys-color-outline-variant)}summary{display:flex;align-items:center;gap:8px;min-height:48px;cursor:pointer;list-style:none;font-weight:500;color:var(--md-sys-color-on-surface-variant)}summary::-webkit-details-marker{display:none}summary .symbol{font-size:20px}details[open] summary .symbol{transform:rotate(90deg)}.detail{display:grid;gap:12px;padding-top:8px;color:var(--md-sys-color-on-surface-variant)}.detail-row{display:flex;justify-content:space-between;align-items:start;gap:16px}.detail-row span:last-child{text-align:right;color:var(--md-sys-color-on-surface)}
    @container(max-width:400px){.wide{display:none}.compact{display:block;width:100%}}@container(max-width:350px){.temperature{padding:16px}.toggle-label{gap:8px}.goal .target-value{font-size:24px;line-height:32px}.goal{gap:8px}.stepper{flex-shrink:0}}
  `];
  constructor(){super();this.kind='climate';this._now=Date.now();}
  renderActuators(){
    const c=this._config;if(!c.actuators?.length)return nothing;
    return html`<div class="actuators" role="group" aria-label=${c.actuators_name||this.t('actuators')}><span class="body-label">${c.actuators_name||this.t('actuators')}</span>${c.actuators.map(item=>{const state=actuatorState(this.hass,item);return html`<div class="toggle-row"><div class="toggle-label">${icon(item.icon||'thermostat')}<span><strong>${item.name}</strong><small>${item.description||(!state.available?this.t('unavailable'):state.selected?this.t('allowed'):this.t('excluded'))}</small></span></div><ha-m3-switch .selected=${state.selected} .disabled=${!state.available||this._busy} .loading=${this._pending==='actuator:'+item.id} .label=${item.name} motion=${this.motion} @m3-change=${event=>this.run(actuatorAction(this.hass,item,event.detail.selected),'actuator:'+item.id)}></ha-m3-switch></div>`;})}</div>`;
  }
  connectedCallback(){super.connectedCallback();clearInterval(this.clock);this.clock=setInterval(()=>{if(this.s(this._config.maximum?.timer)?.state==='active')this._now=Date.now();},1000);}
  disconnectedCallback(){super.disconnectedCallback();clearInterval(this.clock);}
  getCardSize(){return 10;}
  async showModes(){await this.updateComplete;this.renderRoot.querySelector('ha-m3-dialog').show();}
  async choose(id){this.renderRoot.querySelector('ha-m3-dialog')?.close();const p=this._config.presets?.find(p=>p.id===id);if(p)await this.run(p.action,id);}
  target(direction){const entity=this._config.entities.target_temperature,next=stepTarget(this.s(entity),direction);if(next!==null&&next!==Number(this.s(entity).state))this.run({action:'perform-action',perform_action:'input_number.set_value',target:{entity_id:entity},data:{value:next}},direction<0?'minus':'plus');}
  render(){
    const c=this._config,e=c.entities||{},room=this.s(e.room_temperature),target=this.s(e.target_temperature),enabled=this.s(e.enabled),roomNumber=available(room)?finite(room.state):null,targetNumber=available(target)?finite(target.state):null;
    const mode=selectedPreset(this.hass,c),presets=c.presets||[],selected=presets.find(p=>p.id===mode),timer=this.s(c.maximum?.timer),count=timerText(timer,this._now),max=mode===(c.maximum?.preset_id||'maximum')&&!!c.maximum;
    const minus=stepTarget(target,-1),plus=stepTarget(target,1),choices=presets.map(p=>({...p,disabled:!actionAvailable(this.hass,p.action)})),digits=targetDecimals(target),sizing={minimumFractionDigits:digits,maximumFractionDigits:digits};
    return html`<section class="surface" aria-label=${c.title||this.t('temperature')}><header><h2 class="title">${c.title||this.t('temperature')}</h2>${icon('thermostat')}</header><div class="temperature"><div><span class="body-label">${this.t('current')}</span><div class="reading ${roomNumber===null?'unknown':''}"><strong>${roomNumber===null?this.t('noData'):this.n(roomNumber)}</strong>${roomNumber===null?nothing:html`<span class="unit">${room.attributes.unit_of_measurement||this.t('unit')}</span>`}</div></div><div class="goal"><span class="body-label">${this.t('target')}</span><div class="stepper" role="group" aria-label=${this.t('target')}><ha-m3-button kind="icon" icon="remove" .label=${`${this.t('target')}: -`} .disabled=${this._busy||minus===null||minus===targetNumber} .loading=${this._pending==='minus'} motion=${this.motion} @click=${()=>this.target(-1)}></ha-m3-button><span class="target-value"><span class="sizing" aria-hidden="true">${this.n(finite(target?.attributes?.min)??targetNumber??0,sizing)}°</span><span class="sizing" aria-hidden="true">${this.n(finite(target?.attributes?.max)??targetNumber??0,sizing)}°</span><output aria-live="polite">${targetNumber===null?'...':this.n(targetNumber,{maximumFractionDigits:Math.max(2,digits)})+'°'}</output></span><ha-m3-button kind="icon" icon="add" .label=${`${this.t('target')}: +`} .disabled=${this._busy||plus===null||plus===targetNumber} .loading=${this._pending==='plus'} motion=${this.motion} @click=${()=>this.target(1)}></ha-m3-button></div></div></div>
    <div class="toggle-row"><div class="toggle-label">${icon('thermostat_auto')}<span><strong>${c.control_name||this.t('control')}</strong><small>${!available(enabled)?this.t('unavailable'):enabled.state==='on'?this.t('on'):this.t('off')}</small></span></div><ha-m3-switch .selected=${enabled?.state==='on'} .disabled=${!available(enabled)||this._busy} .loading=${this._pending==='control'} .label=${c.control_name||this.t('control')} motion=${this.motion} @m3-change=${event=>this.run({action:'perform-action',perform_action:`input_boolean.turn_${event.detail.selected?'on':'off'}`,target:{entity_id:e.enabled}},'control')}></ha-m3-switch></div>${this.renderActuators()}
    ${presets.length?html`<div class="preset-heading"><span>${c.presets_name||this.t('ventilation')}</span><ha-m3-button kind="text" icon="info" .label=${this.t('details')} @click=${this.showModes}></ha-m3-button></div><ha-m3-connected-group class="wide" .options=${choices} .value=${mode} .label=${this.t('ventilation')} .disabled=${this._busy} .loading=${this._pending} motion=${this.motion} @m3-select=${event=>this.choose(event.detail.value)}></ha-m3-connected-group><ha-m3-button full class="compact" .icon=${selected?.icon||'expand_more'} .disabled=${this._busy} .loading=${presets.some(p=>p.id===this._pending)} @click=${this.showModes}>${selected?.name||this.t('selectMode')}${icon('expand_more')}</ha-m3-button><div class="status" aria-live="polite">${icon(mode?'check_circle':'tune')}<span>${selected?selected.name:choices.every(p=>p.disabled)?this.t('unavailable'):this.t('custom')}</span></div>`:nothing}
    ${max?html`<div class="timer" role="timer" aria-live="off"><span>${this.t('remaining')} <strong class="countdown">${count||this.t('finishing')}</strong></span><ha-m3-button kind="text" .disabled=${this._busy||!actionAvailable(this.hass,c.maximum.cancel_action)} @click=${()=>this.run(c.maximum.cancel_action,'cancel')}>${this.t('finish')}</ha-m3-button></div>`:nothing}${this.feedback()}
    ${c.details?.length||c.description?html`<details><summary>${icon('chevron_right')}${c.details_title||this.t('details')}</summary><div class="detail">${(c.details||[]).map(d=>{const s=this.s(d.entity),value=d.attribute?s?.attributes?.[d.attribute]:formatState(this.hass,s);return html`<div class="detail-row"><span>${d.name}</span><span>${available(s)?String(value??this.t('noData')):this.t('noData')}</span></div>`;})}${c.description?html`<p>${c.description}</p>`:nothing}</div></details>`:nothing}
    <ha-m3-dialog .heading=${this.t('ventilation')} lang=${locale(this.hass,c)} motion=${this.motion}><div class="preset-list" role="group" aria-label=${this.t('ventilation')}>${choices.map(p=>html`<ha-m3-button full .kind=${mode===p.id?'filled':'tonal'} .toggle=${true} .selected=${mode===p.id} .icon=${mode===p.id?'check':p.icon||'air'} .disabled=${p.disabled||this._busy} @click=${()=>this.choose(p.id)}>${p.name}</ha-m3-button>`)}</div>${c.presets_description?html`<p style="margin-top:16px">${c.presets_description}</p>`:nothing}</ha-m3-dialog></section>`;
  }
}
customElements.define('ha-m3-climate-card',M3ClimateCard);

export class M3DeviceCard extends M3BaseCard{
  static styles=[common,cardStyles,css`
    .surface{padding:0;overflow:hidden}.body{padding:var(--ha-m3-ui-card-padding)}.row-content{display:block;flex:1;min-width:0}.row-content strong{display:block;font-weight:400;font-size:16px;line-height:24px;letter-spacing:.5px}.row-content small{display:block;font-size:14px;line-height:20px;letter-spacing:.25px;color:var(--md-sys-color-on-surface-variant)}.tail{margin-left:auto;color:var(--md-sys-color-on-surface-variant)}ha-m3-button[full]{width:100%}.fields{padding-bottom:8px}.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}.device-value{font-size:24px;line-height:32px;letter-spacing:0}.slider-label ha-m3-slider{width:100%}.details-action{margin-top:16px}
  `];
  constructor(){super();this.kind='device';}
  getCardSize(){return this._config.expanded?5:2;}
  entityState(){return this.s(this._config.entity);}
  deviceName(){return this._config.name||this.entityState()?.attributes?.friendly_name||this._config.entity||this.t('entity');}
  deviceValue(){const s=this.entityState();if(!available(s))return this.t('unavailable');const secondary=this._config.secondary;if(s.state==='off'||!secondary?.length)return formatState(this.hass,s);return secondary.filter(f=>!f.when||matches(this.hass,f.when)).map(f=>{const other=this.s(f.entity||this._config.entity),value=f.attribute?other?.attributes?.[f.attribute]:formatState(this.hass,other);return available(other)&&value!==undefined?`${f.prefix||''}${value}${f.suffix||''}`:this.t('noData');}).join(' · ')||formatState(this.hass,s);}
  async show(){await this.updateComplete;this.renderRoot.querySelector('ha-m3-dialog').show();}
  async more(entity){const dialog=this.renderRoot.querySelector('ha-m3-dialog');if(dialog?.open)await new Promise(resolve=>{dialog.addEventListener('m3-closed',resolve,{once:true});dialog.close();});return super.more(entity);}
  service(service,data={}){return this.run({action:'perform-action',perform_action:service,target:{entity_id:this._config.entity},data});}
  controls(){
    const state=this.entityState(),attrs=state?.attributes||{},domain=this._config.entity?.split('.')[0],disabled=!available(state)||this._busy;
    const power=['switch','light','fan','humidifier','input_boolean'].includes(domain),temperature=['climate','water_heater'].includes(domain)&&finite(attrs.temperature)!==null;
    const option=(label,value,values,service,key)=>values?.length?selectField(label,value,values,value=>this.service(service,{[key]:value}),disabled,this.motion==='reduced'||matchMedia('(prefers-reduced-motion: reduce)').matches):nothing;
    return html`<div class="fields">${power?html`<div class="top"><span>${this.t('power')}</span><ha-m3-switch .label=${this.t('power')} .selected=${state?.state==='on'} .disabled=${disabled} .loading=${this._busy} motion=${this.motion} @m3-change=${event=>this.service(`${domain}.turn_${event.detail.selected?'on':'off'}`)}></ha-m3-switch></div>`:nothing}
    ${domain==='climate'?option(this.t('mode'),state?.state,attrs.hvac_modes,'climate.set_hvac_mode','hvac_mode'):nothing}
    ${temperature?sliderField(this.t('target'),attrs.temperature,attrs.min_temp??7,attrs.max_temp??35,attrs.target_temp_step??1,value=>this.service(`${domain}.set_temperature`,{temperature:value}),disabled,this.motion):nothing}
    ${['number','input_number'].includes(domain)&&finite(state?.state)!==null?sliderField(this.t('target'),Number(state.state),attrs.min,attrs.max,attrs.step||1,value=>this.service(`${domain}.set_value`,{value}),disabled,this.motion):nothing}
    ${domain==='fan'&&finite(attrs.percentage)!==null?sliderField(this.t('speed'),attrs.percentage,0,100,attrs.percentage_step||1,percentage=>this.service('fan.set_percentage',{percentage}),disabled,this.motion):nothing}
    ${domain==='light'&&finite(attrs.brightness)!==null?sliderField(this.t('brightness'),attrs.brightness,0,255,1,brightness=>this.service('light.turn_on',{brightness}),disabled,this.motion):nothing}
    ${domain==='humidifier'&&finite(attrs.humidity)!==null?sliderField(this.t('humidity'),attrs.humidity,attrs.min_humidity??30,attrs.max_humidity??80,1,humidity=>this.service('humidifier.set_humidity',{humidity}),disabled,this.motion):nothing}
    ${domain==='climate'?option(this.t('fan'),attrs.fan_mode,attrs.fan_modes,'climate.set_fan_mode','fan_mode'):nothing}
    ${domain==='climate'?option(this.t('swing'),attrs.swing_mode,attrs.swing_modes,'climate.set_swing_mode','swing_mode'):nothing}
    ${['climate','fan'].includes(domain)?option(this.t('preset'),attrs.preset_mode,attrs.preset_modes,`${domain}.set_preset_mode`,'preset_mode'):nothing}
    ${domain==='water_heater'?option(this.t('mode'),attrs.operation_mode,attrs.operation_list,'water_heater.set_operation_mode','operation_mode'):nothing}
    ${domain==='humidifier'?option(this.t('mode'),attrs.mode,attrs.available_modes,'humidifier.set_mode','mode'):nothing}
    ${['select','input_select'].includes(domain)?option(this.t('mode'),state?.state,attrs.options,`${domain}.select_option`,'option'):nothing}
    ${(this._config.actions||[]).length?html`<div class="actions">${this._config.actions.map(a=>html`<ha-m3-button .disabled=${disabled||!actionAvailable(this.hass,a.action)} .icon=${a.icon||''} @click=${()=>this.run(a.action)}>${a.name}</ha-m3-button>`)}</div>`:nothing}
    </div>${this.feedback()}<ha-m3-button class="details-action" kind="text" icon="more_horiz" @click=${()=>this.more(this._config.entity)}>${this.t('more')}</ha-m3-button>`;
  }
  render(){const c=this._config,s=this.entityState();return html`<section class="surface" aria-label=${this.deviceName()}>${c.expanded?html`<div class="body"><header><h2 class="title">${this.deviceName()}</h2>${icon(c.icon||'devices')}</header><p class="device-value">${this.deviceValue()}</p><div style="margin-top:24px">${this.controls()}</div></div>`:html`<ha-m3-button full kind="row" .icon=${c.icon||'devices'} @click=${this.show}><span class="row-content"><strong>${this.deviceName()}</strong><small>${this.deviceValue()}</small></span><span class="tail">${icon('chevron_right')}</span></ha-m3-button>`}<ha-m3-dialog .heading=${this.deviceName()} lang=${locale(this.hass,c)} motion=${this.motion}>${this.controls()}</ha-m3-dialog></section>`;}
}
customElements.define('ha-m3-device-card',M3DeviceCard);

export class M3CameraCard extends M3BaseCard{
  static properties={...M3BaseCard.properties,_native:{state:true},_refresh:{state:true}};
  static styles=[common,cardStyles,css`.surface{padding:0;overflow:hidden;background:var(--md-sys-color-surface-container-highest)}header{padding:var(--ha-m3-ui-compact-card-padding);margin:0}header h2{font-size:16px;line-height:24px;letter-spacing:.15px;font-weight:500}.mount{min-height:0}.mount>*{display:block;--ha-card-border-width:0;--ha-card-border-radius:0;--ha-card-box-shadow:none}.preview{display:grid;place-items:center;aspect-ratio:16/9;background:var(--md-sys-color-surface-container-low);position:relative;width:100%;padding:0;border:0;color:var(--md-sys-color-on-surface-variant)}.preview img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0}.placeholder{display:grid;place-items:center;gap:8px}.placeholder .symbol{font-size:40px}footer{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:4px 12px;min-height:56px}footer .support{font-size:12px;line-height:16px;letter-spacing:.4px}.preview:focus-visible{outline:3px solid var(--md-sys-color-secondary);outline-offset:-3px}`];
  constructor(){super();this.kind='camera';this._native=false;this._refresh=0;this._camera=null;}
  connectedCallback(){super.connectedCallback();clearInterval(this.clock);this.clock=setInterval(()=>{if(!this._native&&!document.hidden)this._refresh++;},30000);}
  disconnectedCallback(){super.disconnectedCallback();clearInterval(this.clock);}
  updated(){if(this._camera)this._camera.hass=this.hass;if(this._loadedEntity!==this._config.entity&&this.hass)this.loadCamera();}
  async loadCamera(){
    const entity=this._config.entity;this._loadedEntity=entity;
    if(!window.loadCardHelpers){this._loadedEntity=null;return;}
    try{const helpers=await window.loadCardHelpers();if(!this.isConnected||entity!==this._config.entity)return;const card=helpers.createCardElement({type:'picture-entity',entity,camera_view:'live',show_name:false,show_state:false,aspect_ratio:'16:9',tap_action:{action:'more-info'}});card.hass=this.hass;this.renderRoot.querySelector('.mount').replaceChildren(card);this._camera=card;this._native=true;}catch{this._native=false;}
  }
  render(){const c=this._config,s=this.s(c.entity),ok=available(s),picture=s?.attributes?.entity_picture;const src=ok&&picture?this.hass?.hassUrl?.(picture)||picture:null;return html`<section class="surface" aria-label=${c.name||this.t('camera')}><header><h2>${c.name||s?.attributes?.friendly_name||this.t('camera')}</h2><ha-m3-button kind="text" icon="open_in_full" .label=${this.t('expand')} .disabled=${!ok} @click=${()=>this.more(c.entity)}></ha-m3-button></header><div class="mount" ?hidden=${!this._native}></div><button type="button" class="preview" ?hidden=${this._native} ?disabled=${!ok} aria-label=${(c.name||this.t('camera'))+' '+(ok?this.t('preview'):this.t('unavailable'))} @click=${()=>this.more(c.entity)}>${src?html`<img src=${src+(src.includes('?')?'&':'?')+'m3_refresh='+this._refresh} alt=${c.name||this.t('camera')} loading="lazy" @error=${event=>event.target.hidden=true}>`:html`<span class="placeholder">${icon('videocam')}<span>${ok?this.t('preview'):this.t('unavailable')}</span></span>`}</button><footer><span class="support">${!ok?this.t('unavailable'):this._native?this.t('live'):this.t('preview')}</span><ha-m3-button kind="text" icon="open_in_full" .disabled=${!ok} @click=${()=>this.more(c.entity)}>${this.t('expand')}</ha-m3-button></footer></section>`;}
}
customElements.define('ha-m3-camera-card',M3CameraCard);
