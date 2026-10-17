import '/ha-material3.js';
const panel=document.getElementById('panel'),scenario=document.getElementById('scenario'),theme=document.getElementById('theme'),motion=document.getElementById('motion');
let states={},calls=[],config;
const make=(entity_id,state,attributes={})=>({entity_id,state,attributes});
const action=(id)=>({action:'perform-action',perform_action:'script.turn_on',target:{entity_id:`script.demo_${id}`}});
function setup(){
  states=Object.fromEntries([
    make('sensor.demo_room','24.6',{unit_of_measurement:'°C'}),make('input_number.demo_target','24',{min:16,max:25,step:.5}),make('input_boolean.demo_control','on'),make('input_boolean.demo_max','off'),make('timer.demo_max','idle'),
    make('climate.demo_breather','fan_only',{friendly_name:'Бризер',fan_mode:'3',fan_modes:['1','2','3','4','5','6','7'],preset_mode:'manual',preset_modes:['manual','auto','turbo'],temperature:5,min_temp:5,max_temp:30,hvac_modes:['off','fan_only','heat']}),
    make('fan.demo_purifier','on',{friendly_name:'Очиститель',percentage:50,percentage_step:10,preset_mode:'Авто',preset_modes:['Авто','Ночной','Ручной']}),make('climate.demo_ac','off',{friendly_name:'Кондиционер',temperature:24,min_temp:16,max_temp:30,hvac_modes:['off','cool','heat','fan_only'],fan_mode:'low',fan_modes:['low','medium','high','auto']}),
    make('camera.demo_entrance','idle',{friendly_name:'Камера на площадке'}),make('script.demo_daily','off'),make('script.demo_intensive','off'),make('script.demo_maximum','off'),
    make('fan.demo_library','on',{friendly_name:'Очиститель библиотеки',percentage:30,preset_mode:'Авто',preset_modes:['Авто','Ночной','Ручной']}),make('water_heater.demo','electric',{friendly_name:'Водонагреватель',temperature:55,min_temp:30,max_temp:75,operation_mode:'electric',operation_list:['off','electric']}),
  ].map(s=>[s.entity_id,s]));
  const climate={kind:'climate',title:'Температура',entities:{room_temperature:'sensor.demo_room',target_temperature:'input_number.demo_target',enabled:'input_boolean.demo_control'},presets:[
    {id:'daily',name:'Повседневный',icon:'eco',action:action('daily'),active_when:[{entity:'climate.demo_breather',attribute:'fan_mode',value:'3'},{entity:'fan.demo_purifier',attribute:'preset_mode',value:'Авто'}]},
    {id:'intensive',name:'Интенсивное',icon:'mode_fan',action:action('intensive'),active_when:[{entity:'climate.demo_breather',attribute:'fan_mode',value:'5'}]},
    {id:'maximum',name:'Максимум',icon:'air',action:action('maximum')},
  ],maximum:{active_entity:'input_boolean.demo_max',timer:'timer.demo_max',preset_id:'maximum',cancel_action:action('daily')},description:'Желаемая температура сохраняется при смене проветривания. Автоматика выполняется Home Assistant.',details_title:'Как работает климат-контроль',details:[{name:'Температура притока',entity:'climate.demo_breather',attribute:'temperature'}]};
  const camera={kind:'camera',entity:'camera.demo_entrance',name:'Камера на площадке'};
  const devices=[{kind:'device',entity:'climate.demo_breather',name:'Бризер',icon:'air',secondary:[{attribute:'fan_mode',prefix:'Скорость '}]},{kind:'device',entity:'fan.demo_purifier',name:'Очиститель',icon:'mode_fan',secondary:[{attribute:'preset_mode'}]},{kind:'device',entity:'climate.demo_ac',name:'Кондиционер',icon:'ac_unit'}];
  config={type:'custom:ha-m3-dashboard',config_version:1,title:'Дом',language:'ru',appearance:{scheme:theme.value,seed_color:'#6750A4',motion:motion.value},home:{title:'Кабинет',subtitle:'Воздух и температура под контролем',cards:[climate,camera,...devices]},rooms:[{id:'office',name:'Кабинет',icon:'meeting_room',description:'Бризер, очиститель, кондиционер',cards:devices.map(c=>({...c,expanded:true}))},{id:'library',name:'Библиотека',icon:'menu_book',description:'Очиститель воздуха',cards:[{kind:'device',entity:'fan.demo_library',expanded:true}]},{id:'bathroom',name:'Ванная',icon:'water_drop',description:'Водонагреватель',cards:[{kind:'device',entity:'water_heater.demo',expanded:true}]}],cameras:[camera]};
  if(scenario.value==='maximum'){states['input_boolean.demo_max'].state='on';states['timer.demo_max']={...states['timer.demo_max'],state:'active',attributes:{finishes_at:new Date(Date.now()+900000).toISOString()}};}
  if(scenario.value==='unavailable')for(const s of Object.values(states))s.state='unavailable';
  if(scenario.value==='long'){config.home.title='Кабинет с длинным названием комнаты';climate.control_name='Автоматическое поддержание температуры кабинета';devices[0].name='Бризер с дополнительным длинным названием';}
  calls=[];document.getElementById('calls').textContent='Команд: 0';panel.setConfig(config);update();
}
function update(){
  panel.hass={states:{...states},locale:{language:'ru'},themes:{darkMode:theme.value==='dark'},formatEntityState:s=>({off:'Выключен',on:'Включён',fan_only:'Вентиляция',cool:'Охлаждение',heat:'Обогрев',unavailable:'Недоступно'}[s.state]||s.state),hassUrl:s=>s,
    async callService(domain,service,data={},target={}){
      calls.push({domain,service,data,target});document.getElementById('calls').textContent=`Команд: ${calls.length}. Последняя: ${domain}.${service}`;
      await new Promise(r=>setTimeout(r,scenario.value==='loading'?2500:150));
      if(scenario.value==='error')throw new Error('Simulated failure');
      const entity=target.entity_id||data.entity_id,s=states[entity];if(!s)return;
      if(domain==='script'){
        const mode=entity.replace('script.demo_','');states['input_boolean.demo_max'].state=mode==='maximum'?'on':'off';states['climate.demo_breather'].attributes.fan_mode=mode==='daily'?'3':mode==='intensive'?'5':'7';states['fan.demo_purifier'].attributes.preset_mode=mode==='daily'?'Авто':'Ручной';states['timer.demo_max'].state=mode==='maximum'?'active':'idle';states['timer.demo_max'].attributes.finishes_at=new Date(Date.now()+900000).toISOString();
      }else if(service==='set_value')s.state=String(data.value);else if(service==='turn_on')s.state='on';else if(service==='turn_off')s.state='off';else if(service==='set_hvac_mode')s.state=data.hvac_mode;else if(service==='set_temperature')s.attributes.temperature=data.temperature;else if(service==='set_fan_mode')s.attributes.fan_mode=data.fan_mode;else if(service==='set_percentage')s.attributes.percentage=data.percentage;else if(service==='set_preset_mode')s.attributes.preset_mode=data.preset_mode;else if(service==='set_operation_mode')s.attributes.operation_mode=data.operation_mode;
      update();
    }};
}
for(const control of [scenario,theme,motion])control.addEventListener('change',setup);
document.getElementById('audit-button').addEventListener('click',async()=>{const output=document.getElementById('audit');output.hidden=false;output.textContent='Проверка...';const result=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});output.textContent=JSON.stringify({violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:result.passes.length,incomplete:result.incomplete.map(v=>v.id)},null,2);});
setup();
document.getElementById('duplicate-button').addEventListener('click',async()=>{const output=document.getElementById('duplicate-result');try{const count=window.customCards.length;await import('/ha-material3.js?duplicate=1');output.textContent=window.customCards.length===count?'Повторное подключение: OK':'Ошибка: карточки продублированы';}catch(error){output.textContent='Ошибка повторного подключения: '+error.message;}});
