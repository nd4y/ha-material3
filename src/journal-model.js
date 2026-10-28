const text=(value,max=300)=>String(value??'').slice(0,max);
// Keep raw diagnostics in expandable details; summarize only the controller's
// bounded tuple format here. This is parsing, never evaluation of server text.
export function journalCause(value,language='ru'){
  const raw=text(value,600),ru=language.startsWith('ru');
  if(!/^\((?:\('[a-z_]+', '[a-z_]+'\),?\s*)+\)$/.test(raw))return raw;
  const names=ru?{ac:'Кондиционер',breather:'Бризер',heater:'Обогреватель',purifier:'Очиститель воздуха'}:{ac:'Air conditioner',breather:'Ventilator',heater:'Heater',purifier:'Air purifier'};
  const reasons=ru?{health_not_qualified:'состояние не подтверждено, автоматика недоступна',unavailable:'нет связи',pending_or_unapplied_manual_intent:'ожидается применение ручной настройки'}:{health_not_qualified:'health is not confirmed; automatic control is unavailable',unavailable:'unavailable',pending_or_unapplied_manual_intent:'manual setting is pending'};
  return [...raw.matchAll(/\('([a-z_]+)', '([a-z_]+)'\)/g)].map(([,device,reason])=>`${Object.hasOwn(names,device)?names[device]:(ru?'Устройство':'Device')}: ${Object.hasOwn(reasons,reason)?reasons[reason]:(ru?'требуется проверка состояния':'status needs review')}`).join('. ');
}
export function journalValue(value,max=240){
  if(value===null||value===undefined)return '';
  if(typeof value==='object')return text(JSON.stringify(value),max);
  return text(value,max);
}
const actionOf=value=>value&&typeof value==='object'?{
  device:text(value.device,160),service:text(value.service,100),
  changes:Array.isArray(value.changes)?value.changes.slice(0,8).filter(x=>x&&typeof x==='object').map(x=>({parameter:text(x.parameter,100),from:journalValue(x.from),to:journalValue(x.to),unit:text(x.unit,30)})):[]
}:null;
export function journalEntries(state,attribute='entries',limit=6){
  const entries=state?.attributes?.[attribute];if(!Array.isArray(entries))return [];
  return entries.filter(e=>e&&typeof e==='object'&&e.id&&Number.isFinite(Date.parse(e.timestamp))).slice(0,Math.min(50,Math.max(1,limit))).map(e=>({id:text(e.id,100),timestamp:e.timestamp,title:text(e.title,160),reason:text(e.reason,600),cause:text(e.cause,600),trigger:text(e.trigger,160),command_id:typeof e.command_id==='string'?text(e.command_id,160):'',action:actionOf(e.action),status:['confirmed','requested','not_confirmed','blocked','decision','observed','no_change'].includes(e.status)?e.status:'decision',source:text(e.source,160),inputs:Array.isArray(e.inputs)?e.inputs.slice(0,16).map(x=>({name:text(x?.name,80),value:journalValue(x?.value)})):[],flow:Array.isArray(e.flow)?e.flow.slice(0,8).map(x=>({name:text(x?.name,80),value:journalValue(x?.value,120)})):[],reported:text(e.reported,600)}));
}

// Correlate only explicit server IDs. Similar titles or close timestamps are not proof.
export function journalActivity(state,attribute='entries',limit=6){
  const rows=[],commands=new Map();
  for(const entry of journalEntries(state,attribute,50)){
    const previous=entry.command_id&&commands.get(entry.command_id);
    if(previous){
      previous.phases.push({status:entry.status,timestamp:entry.timestamp});
      for(const key of ['action','cause','trigger'])if(!previous[key]&&entry[key])previous[key]=entry[key];
    }else{
      const row={...entry,phases:[{status:entry.status,timestamp:entry.timestamp}]};rows.push(row);
      if(entry.command_id)commands.set(entry.command_id,row);
    }
  }
  return rows.slice(0,Math.min(50,Math.max(1,limit)));
}
