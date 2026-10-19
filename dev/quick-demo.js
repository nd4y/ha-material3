import '/ha-material3.js';
const state=(v,a={})=>({state:String(v),attributes:a}),states={
  'sensor.room':state(24.1,{unit_of_measurement:'°C'}),'input_number.goal':state(24,{min:16,max:30,step:.5,unit_of_measurement:'°C'}),'input_boolean.master':state('off'),
  'climate.ac':state('off',{temperature:21,min_temp:16,max_temp:32,target_temp_step:1,fan_mode:'low',fan_modes:['auto','low','medium','high']}),
  'climate.breather':state('fan_only',{temperature:5,min_temp:5,max_temp:25,target_temp_step:1,fan_mode:'7',fan_modes:['1','2','3','4','5','6','7'],preset_mode:'manual'}),
  'fan.purifier':state('on',{preset_mode:'Ручной'}),'select.level':state('5',{options:Array.from({length:12},(_,i)=>String(i))}),
};
const cards=[],calls=[],condition=document.getElementById('condition');
const update=()=>{for(const c of cards)c.hass={...hass};};
const manual=(d,p,operation)=>({action:'perform-action',perform_action:'script.manual',data:{device:d,parameter:p,...(operation?{operation}:{})},value_field:'value'});
const fixedAuto=(d)=>({...manual(d,'speed'),value_field:undefined,data:{device:d,parameter:'speed',value:'auto'}});
const lock=(d,p)=>`input_boolean.lock_${d}_${p}`,saved=(d,p)=>p==='temperature'&&d==='ac'?'input_number.goal':`${p==='temperature'?'input_number':p==='power'?'input_boolean':'input_text'}.saved_${d}_${p}`;
const entities={ac:'climate.ac',breather:'climate.breather',purifier:'fan.purifier'};
const hass={language:'ru',locale:{language:'ru'},states,formatEntityState:s=>s.state,callService:async(domain,service,data,target)=>{
  calls.push({domain,service,data,target});document.getElementById('log').textContent=`Команд: ${calls.length}\n${JSON.stringify(calls.at(-1))}`;
  await new Promise(r=>setTimeout(r,180));if(condition.value==='error')throw new Error('Demo failure');
  if(domain==='input_boolean'){states[target.entity_id].state=service==='turn_on'?'on':'off';update();return;}
  const {device:d,parameter:p,value,operation}=data,e=entities[d],v=states[e],lk=states[lock(d,p)];
  if(operation==='lock')lk.state=value?'on':'off';else{
    lk.state='on';states[saved(d,p)].state=String(typeof value==='boolean'?(value?'on':'off'):value);
    if(p==='temperature'){if(d==='ac')states['input_number.goal'].state=String(value);else v.attributes.temperature=value;}
    if(p==='power')v.state=value?(d==='purifier'?'on':'fan_only'):'off';
    if(p==='speed'){if(d==='purifier'){v.attributes.preset_mode=value==='auto'?'Авто':'Ручной';if(value!=='auto')states['select.level'].state=String(value);}else{v.attributes.fan_mode=String(value);if(d==='breather')v.attributes.preset_mode=value==='auto'?'auto':'manual';}}
  }update();
}};
for(const [d,name,icon]of [['ac','Кондиционер','ac_unit'],['breather','Бризер','air'],['purifier','Очиститель воздуха','mode_fan']]){
  const e=entities[d],fields=[];
  for(const p of d==='purifier'?['speed','power']:['temperature','speed','power']){states[lock(d,p)]=state('off');if(!states[saved(d,p)])states[saved(d,p)]=state(p==='power'?'on':p==='temperature'?5:d==='ac'?'low':d==='breather'?'7':'5');}
  if(d!=='purifier')fields.push({id:'temperature',name:d==='ac'?'Цель в комнате':'Температура притока',entity:d==='ac'?'input_number.goal':e,...(d==='ac'?{}:{attribute:'temperature',bounds:{min:'min_temp',max:'max_temp',step:'target_temp_step'}}),unit:'°C',lock_entity:lock(d,'temperature'),value_entity:saved(d,'temperature'),set_action:manual(d,'temperature'),lock_action:manual(d,'temperature','lock')});
  fields.push({id:'speed',name:d==='purifier'?'Мощность':'Скорость',entity:d==='purifier'?'select.level':e,...(d==='purifier'?{}:{attribute:'fan_mode'}),options_attribute:d==='purifier'?'options':'fan_modes',option_labels:d==='ac'?{low:'Тихая',medium:'Средняя',high:'Высокая'}:{},lock_entity:lock(d,'speed'),value_entity:saved(d,'speed'),set_action:manual(d,'speed'),lock_action:manual(d,'speed','lock'),auto:{value:'auto',active_when:[{entity:e,attribute:d==='ac'?'fan_mode':'preset_mode',value:d==='purifier'?'Авто':'auto'}],action:fixedAuto(d)}});
  const card=document.createElement('ha-m3-quick-device-card');card.setConfig({entity:e,name,icon,language:'ru',appearance:{scheme:'dark'},quick_controls:fields,power:{action:manual(d,'power'),lock_entity:lock(d,'power'),lock_action:manual(d,'power','lock')}});card.hass=hass;cards.push(card);document.getElementById('devices').append(card);
}
const summary=document.createElement('ha-m3-climate-card');summary.setConfig({compact:true,title:'Климат комнаты',language:'ru',appearance:{scheme:'dark'},entities:{room_temperature:'sensor.room',target_temperature:'input_number.goal',enabled:'input_boolean.master'},presets:[]});summary.hass=hass;cards.push(summary);document.getElementById('summary').append(summary);
condition.addEventListener('change',()=>{states['climate.breather'].state=condition.value==='unavailable'?'unavailable':'fan_only';update();});
