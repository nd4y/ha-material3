// Synthetic fixture mounts shipped components. No credentials, media feeds or HA connection.
import './public-preview.js';
import {cards,hass,states,summary} from './quick-demo.js';

const state=(value,attributes={})=>({state:String(value),attributes,last_changed:new Date().toISOString(),last_updated:new Date().toISOString()});
const writes=[],events=[],pending=[],acknowledged=[];
let theme='dark',motion='expressive',failure=false,defer=false,deferObservation=false,historyMode='data';
const quick=cards.filter(c=>c.tagName==='HA-M3-QUICK-DEVICE-CARD');
const configs=quick.map(card=>({...card._config,type:'custom:ha-m3-quick-device-card',history:true,operation:{kind:card._config.entity==='climate.ac'?'climate':card._config.entity==='climate.breather'?'breather':'purifier',...(card._config.entity==='climate.breather'?{indicator:{entity:'binary_sensor.heater',active_value:'on',inactive_value:'off'}}:{})},quick_controls:card._config.quick_controls.map(item=>({...item,...(item.id==='speed'&&card._config.entity==='climate.breather'?{operation:'airflow'}:{})}))}));
states['binary_sensor.heater']=state('on');
states['climate.ac'].state='cool';states['climate.ac'].attributes.hvac_action='idle';
states['sensor.battery']=state('87',{unit_of_measurement:'%'});
states['sensor.humidity']=state('43',{unit_of_measurement:'%'});
states['sensor.offline']=state('unavailable');states['binary_sensor.leak']=state('off',{device_class:'moisture'});
states['camera.demo']=state('idle',{friendly_name:'Камера входа'});
const group=document.createElement('ha-m3-device-group-card');
group.setConfig({config_version:1,title:'Устройства',language:'ru',cards:configs});
document.getElementById('devices').replaceChildren(group);cards.push(group);

function mount(tag,config,id){const card=document.createElement(tag);card.setConfig({language:'ru',...config});document.getElementById(id).append(card);cards.push(card);return card;}
const sensor=mount('ha-m3-sensor-card',{title:'Датчики',groups:[{name:'Кабинет',tiles:[{entity:'sensor.room',name:'Температура и влажность',battery:'sensor.battery',metrics:[{entity:'sensor.room',decimals:1},{entity:'sensor.humidity',decimals:0}]},{entity:'sensor.offline',name:'Датчик без связи'},{entity:'binary_sensor.leak',name:'Защита от протечки',kind:'moisture'}]}]},'sensors');
const camera=mount('ha-m3-camera-card',{entity:'camera.demo',name:'Камера входа'},'camera');
const device=mount('ha-m3-device-card',{entity:'climate.ac',name:'Все настройки',icon:'tune',actions:[{name:'Настроить',action:{action:'more-info',entity:'climate.ac'}}]},'standard-device');
const primitives=document.getElementById('primitives');
primitives.className='primitive-section';
primitives.innerHTML='<h2>Общие элементы</h2><div class="primitive-grid"><ha-m3-button id="dialog-open" kind="tonal" icon="settings">Параметры</ha-m3-button><ha-m3-switch id="sample-switch"></ha-m3-switch><span class="sample-label">Освещение</span><ha-m3-connected-group id="sample-group"></ha-m3-connected-group></div><ha-m3-dialog id="sample-dialog"><p>Параметры устройства</p></ha-m3-dialog>';
const sampleSwitch=document.getElementById('sample-switch');sampleSwitch.label='Освещение';sampleSwitch.addEventListener('m3-change',event=>sampleSwitch.selected=event.detail.selected);
const sampleGroup=document.getElementById('sample-group');sampleGroup.label='Сценарий света';sampleGroup.options=[{id:'quiet',name:'Тихо'},{id:'usual',name:'Обычно'},{id:'bright',name:'Ярко'}];sampleGroup.value='usual';sampleGroup.addEventListener('m3-select',event=>sampleGroup.value=event.detail.value);
const dialog=document.getElementById('sample-dialog');dialog.heading='Параметры';dialog.lang='ru';document.getElementById('dialog-open').addEventListener('click',()=>dialog.show());
const bar=document.createElement('ha-m3-action-bar');bar.setConfig({language:'ru',actions:[{name:'Главная',icon:'home',action:{action:'perform-action',perform_action:'script.navigation',data:{page:'home'}}},{name:'Климат',icon:'thermostat',action:{action:'perform-action',perform_action:'script.navigation',data:{page:'climate'}}},{name:'Камеры',icon:'videocam',action:{action:'perform-action',perform_action:'script.navigation',data:{page:'cameras'}}},{name:'Дверь',icon:'meeting_room',activation:'hold',hold_duration:800,confirmation:'Открыть входную дверь?',action:{action:'perform-action',perform_action:'script.demo_open'}}]});cards.push(bar);document.body.append(bar);
document.addEventListener('hass-more-info',event=>events.push(event.detail.entityId));
const original=hass.callService.bind(hass);
hass.callService=async(domain,service,data,target)=>{
  writes.push({domain,service,data,target});
  if(failure)throw Error('Synthetic unavailable');
  if(defer)await new Promise(resolve=>pending.push(resolve));
  // Quick-demo routes permission writes through its configured script adapter,
  // while unconfigured controls use native input_boolean actions. Both return
  // an acknowledgement here without applying the corresponding observed state.
  const permissionWrite=domain==='input_boolean'&&String(target?.entity_id||'').startsWith('input_boolean.lock_')||domain==='script'&&service==='manual'&&data?.operation==='lock';
  if(deferObservation&&permissionWrite){acknowledged.push([domain,service,data,target]);return;}
  if(domain==='script'&&['demo_open','navigation'].includes(service))return;
  return original(domain,service,data,target);
};
hass.callApi=async(_method,url)=>{
  if(!url.startsWith('history/period/'))throw Error('Only synthetic history is supported');
  if(historyMode==='error')throw Error('Synthetic history gap');
  const ids=new URL(url,'http://fixture').searchParams.get('filter_entity_id').split(',');
  return ids.map(entity_id=>historyMode==='empty'?[]:[
    {entity_id,state:'21',attributes:{temperature:21},last_changed:new Date(Date.now()-7200000).toISOString()},
    {entity_id,state:'unavailable',attributes:{},last_changed:new Date(Date.now()-3600000).toISOString()},
    {entity_id,state:'23',attributes:{temperature:23},last_changed:new Date(Date.now()-1800000).toISOString()}
  ]);
};
const update=()=>{for(const card of cards)card.hass={...hass,themes:{darkMode:theme==='dark'}};};
async function appearance(scheme='dark',newMotion='expressive'){
  theme=scheme;motion=newMotion;document.documentElement.dataset.scheme=scheme;
  const response=await fetch('/theme.json'),data=await response.json();
  for(const [key,value]of Object.entries({...data,...data.modes[scheme]}))if(typeof value==='string')document.documentElement.style.setProperty('--'+key,value);
  // Match normal HA theme inheritance. The chosen scheme is carried by the
  // exported document roles and hass.themes, rather than a local seed override.
  const config={scheme:'auto',motion,protect_colors:true};
  for(const card of cards)card.setConfig({...card._config,appearance:config,...(card===group?{cards:configs.map(c=>({...c,appearance:config}))}:{})});
  for(const element of [sampleSwitch,sampleGroup,dialog,document.getElementById('dialog-open')])element.motion=motion;
  update();await Promise.all(cards.map(c=>c.updateComplete));await document.fonts.ready;
}
window.unifiedFixture={states,hass,summary,group,sensor,camera,device,bar,writes,events,update,appearance,
  setFailure:value=>failure=value,setPending:value=>defer=value,resolvePending:()=>{defer=false;pending.splice(0).forEach(resolve=>resolve());},
  acknowledged,setDeferredObservation:value=>{if(value)acknowledged.splice(0);deferObservation=value;},applyAcknowledged:async()=>{deferObservation=false;for(const args of acknowledged.splice(0))await original(...args);},
  setHistory:async mode=>{historyMode=mode;const visit=element=>{element.shadowRoot?.querySelectorAll('ha-m3-history').forEach(history=>{history.hass={...history.hass,connection:{}};history.load();});for(const child of element.shadowRoot?.children||[])visit(child);for(const child of element.children||[])visit(child);};visit(document.body);},
  setState:(entity,value,attributes)=>{states[entity]=state(value,attributes??states[entity]?.attributes);update();},
  resetOwners:()=>{acknowledged.splice(0);for(const [entity,value]of Object.entries(states))if(entity.startsWith('input_boolean.lock_'))value.state='off';states['climate.ac'].attributes.fan_mode='low';update();},
  inventory:['ha-m3-device-group-card','ha-m3-quick-device-card','ha-m3-climate-card','ha-m3-sensor-card','ha-m3-camera-card','ha-m3-device-card','ha-m3-journal-card','ha-m3-history','ha-m3-action-bar','ha-m3-hold-button','ha-m3-slider','ha-m3-button','ha-m3-switch','ha-m3-connected-group','ha-m3-dialog']
};
await appearance();
window.unifiedFixture.ready=true;
