// Synthetic copy of the installed control topology; never connects to Home Assistant.
const seed=await(await fetch('/control-audit-fixture.json')).json();
await customElements.whenDefined('ha-m3-climate-card');
const theme=await(await fetch('/theme.json')).json();
for(const[k,v]of Object.entries({...theme,...theme.modes.dark}))if(typeof v==='string')document.documentElement.style.setProperty('--'+k,v);
const f={config:seed.config,states:{},writes:[],events:[],cards:[],fail:false,defer:false,pending:[]};
f.update=()=>{f.hass.states=f.states;for(const card of f.cards)card.hass={...f.hass};};
f.set=(id,value,attributes)=>{const stamp=new Date(Date.now()-1000).toISOString();f.states[id]={...f.states[id],state:String(value),attributes:{...f.states[id]?.attributes,...attributes},last_changed:stamp,last_updated:stamp};f.update();};
f.hass={language:'ru',locale:{language:'ru',number_format:'comma_decimal'},themes:{darkMode:true},vibrate:true,states:f.states,
 callService:async(domain,service,data,target)=>{f.writes.push(structuredClone({domain,service,data,target}));if(f.fail)throw Error('Synthetic service failure');if(f.defer)await new Promise(resolve=>f.pending.push(resolve));},
 callApi:async(_method,url)=>{if(url.startsWith('history/period/'))return [];throw Error('Unsupported synthetic API');},
 callWS:async message=>{if(message.type==='recorder/statistics_during_period')return {};throw Error('Unsupported synthetic WS');}};
f.reset=async()=>{
 for(const key of Object.keys(sessionStorage))if(key.startsWith('ha-m3.scale-display.v1.'))sessionStorage.removeItem(key);
 for(const resolve of f.pending.splice(0))resolve();for(const card of f.cards)card.remove();f.cards=[];f.writes=[];f.events=[];f.fail=false;f.defer=false;
 f.states=structuredClone(seed.states);const now=Date.now(),stamp=new Date(now-1000).toISOString();
 for(const s of Object.values(f.states)){s.last_changed=stamp;s.last_updated=stamp;if('timestamp'in s.attributes)s.attributes.timestamp=now/1000-100;if(s.attributes.planning?.room_measurement)s.attributes.planning.room_measurement.received_at=stamp;}
 for(const c of f.config.cards){
  f.states[c.runtime_ready_entity].state='on';
  f.states[c.entity]={...f.states[c.entity],state:c.name==='Очиститель воздуха'?'on':'heat',attributes:{...f.states[c.entity].attributes,temperature:23,current_temperature:20,min_temp:c.name==='Бризер'?5:16,max_temp:32,target_temp_step:1,health:'healthy',source_qualified:true,preset_mode:'manual'}};
  for(const item of [c.power,...c.quick_controls]){f.states[item.lock_entity].state='off';}
  for(const item of c.quick_controls){const q=item.mode_scale.room_freshness?.qualifier_entity;if(q)f.states[q].attributes.planning.room_measurement.value=20;}
  for(const g of c.settings_menu.groups)for(const item of g.items){if(item.type==='switch')f.states[item.entity].state='off';if(item.type==='select'){const s=f.states[item.entity];s.state=s.attributes.options?.[0]||'off';}if(item.type==='filter-reset')f.states[item.entity].state='unknown';}
 }
 for(const g of f.config.main.air_goals)if(g.boost)f.states[g.boost.active_entity].state='off';
 const mount=(tag,config,parent)=>{const e=document.createElement(tag);e.setConfig({...config,appearance:{...config.appearance,scheme:'auto',motion:'expressive'}});parent.append(e);f.cards.push(e);return e;};
 f.summary=mount('ha-m3-climate-card',f.config.main,document.getElementById('summary'));
 f.devices=f.config.cards.map(c=>mount('ha-m3-quick-device-card',c,document.getElementById('devices')));
 f.update();await Promise.all(f.cards.map(c=>c.updateComplete));
};
document.addEventListener('hass-more-info',e=>f.events.push({type:'more-info',entity:e.detail.entityId}));
await f.reset();window.controlAudit=f;
