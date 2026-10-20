import {cards,hass,states,summary} from './quick-demo.js';
const theme=await(await fetch('/theme.json')).json();for(const[k,v]of Object.entries({...theme,...theme.modes.dark}))if(typeof v==='string')document.documentElement.style.setProperty('--'+k,v);
const state=(value,attributes={})=>({state:String(value),attributes});
const update=()=>{for(const card of cards)card.hass={...hass,themes:{darkMode:true}};};
for(const card of cards)card.setConfig({...card._config,appearance:{motion:'expressive',protect_colors:true}});
states['input_boolean.maximum']=state('off');states['input_text.return']=state('quiet');states['timer.maximum']=state('idle');
const base=hass.callService.bind(hass);hass.callService=async(domain,service,data,target)=>{
  if(domain==='script'&&service==='maximum'){
    if(states['input_boolean.maximum'].state!=='on'){states['input_boolean.maximum'].state='on';states['input_select.mode'].state='maximum';states['timer.maximum']=state('active',{finishes_at:new Date(Date.now()+900000).toISOString()});}
    states['input_text.return'].state=data.return_mode;document.getElementById('log').textContent='Maximum return: '+data.return_mode;update();return;
  }
  if(domain==='script'&&service==='finish'){states['input_boolean.maximum'].state='off';states['timer.maximum'].state='idle';states['input_select.mode'].state=states['input_text.return'].state;update();return;}
  return base(domain,service,data,target);
};
const presets=[['auto','Автоматически'],['full','Полностью автоматически'],['off','Отключено'],['quiet','Тихий'],['standard','Стандартный'],['maximum','Максимум']].map(([id,name])=>({id,name,return_value:id,active_when:[{entity:'input_select.mode',value:id}],action:{action:'perform-action',perform_action:'script.level',data:{value:id}}}));
const automation_groups=summary._config.automation_groups.map(group=>({...group,controls:group.controls.map(item=>({...item,lock_action:cards.flatMap(card=>[...(card._config.quick_controls||[]),card._config.power||{}]).find(x=>x.lock_entity===item.lock_entity)?.lock_action}))}));
summary.setConfig({...summary._config,layout:'calm',automation_groups,presets,maximum:{preset_id:'maximum',active_entity:'input_boolean.maximum',timer:'timer.maximum',return_entity:'input_text.return',duration_name:'15 минут',return_options:presets.filter(p=>p.id!=='maximum').map(p=>({name:p.name,value:p.id})),start_action:{action:'perform-action',perform_action:'script.maximum',value_field:'return_mode'},cancel_action:{action:'perform-action',perform_action:'script.finish'}}});
const journal=document.createElement('ha-m3-journal-card');journal.setConfig({entity:'sensor.journal',language:'ru',title:'Журнал автоматики',limit:6});states['sensor.journal']=state('fixture',{entries:[{id:'fixture1',timestamp:new Date().toISOString(),status:'decision',title:'Демонстрация: очиститель ограничен',reason:'Данные стенда, реальные устройства не подключены.',inputs:[{name:'PM2.5',value:38},{name:'Присутствие',value:'unknown'}],flow:[{name:'Запрос',value:7},{name:'Предел',value:3},{name:'Расчёт',value:3}]}]});cards.push(journal);document.getElementById('journal').append(journal);update();

// Generic intention/boost contract fixture. No actual devices or HA connection.
const air_goals=[['fresh','Приток воздуха','Освежить'],['clean','Очистка воздуха','Очистить']].map(([id,name,action_name])=>{
  states[`input_number.wish_${id}`]=state(id==='fresh'?45:30,{min:0,max:100,step:5});states[`input_boolean.auto_${id}`]=state('on');states[`input_boolean.boost_${id}`]=state('off');states[`input_datetime.deadline_${id}`]=state('fixture',{timestamp:Math.floor(Date.now()/1000)});states[`sensor.status_${id}`]=state('Пожелание учтено; соблюдаются ограничения шума');
  const gateway=(operation,value_field)=>({action:'perform-action',perform_action:`script.air_${operation}`,data:{channel:id},...(value_field?{value_field}:{})});
  return {id,name,entity:`input_number.wish_${id}`,automatic_entity:`input_boolean.auto_${id}`,set_action:gateway('wish','value'),automatic_action:gateway('automatic','automatic'),status_entity:`sensor.status_${id}`,boost:{action_name,active_entity:`input_boolean.boost_${id}`,deadline_entity:`input_datetime.deadline_${id}`,start_action:gateway('boost','duration'),cancel_action:gateway('finish'),durations:[10,15],default_duration:15}};
});
states['sensor.device_health']=state('healthy');states['sensor.device_health_message']=state('Ошибка устройства: команда выключения отправлена, автоматическое включение заблокировано.');
summary.setConfig({...summary._config,air_goals,health_alerts:[{id:'fixture-health',name:'Бризер',status_entity:'sensor.device_health',message_entity:'sensor.device_health_message'}]});
const beforeAir=hass.callService.bind(hass);hass.callService=async(domain,service,data,target)=>{
  if(domain!=='script'||!service.startsWith('air_'))return beforeAir(domain,service,data,target);
  document.getElementById('log').textContent='Fixture: '+JSON.stringify({domain,service,data});await new Promise(resolve=>setTimeout(resolve,150));if(document.getElementById('condition').value==='error')throw new Error('Fixture action failure');
  const id=data.channel;if(service==='air_wish'){states[`input_number.wish_${id}`].state=String(data.value);states[`input_boolean.auto_${id}`].state='off';states[`input_boolean.boost_${id}`].state='off';}
  if(service==='air_automatic')states[`input_boolean.auto_${id}`].state=data.automatic?'on':'off';
  if(service==='air_boost'&&states[`input_boolean.boost_${id}`].state==='off'){states[`input_datetime.deadline_${id}`].attributes.timestamp=Math.floor(Date.now()/1000)+data.duration*60;states[`input_boolean.boost_${id}`].state='on';}
  if(service==='air_finish')states[`input_boolean.boost_${id}`].state='off';update();
};
document.getElementById('condition').addEventListener('change',event=>{states['sensor.device_health'].state=event.target.value==='error'?'error':event.target.value==='unavailable'?'unavailable':'healthy';update();});
update();
