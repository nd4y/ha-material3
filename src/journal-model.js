const text=(value,max=300)=>String(value??'').slice(0,max);
export function journalEntries(state,attribute='entries',limit=6){
  const entries=state?.attributes?.[attribute];if(!Array.isArray(entries))return [];
  return entries.filter(e=>e&&typeof e==='object'&&e.id&&Number.isFinite(Date.parse(e.timestamp))).slice(0,Math.min(50,Math.max(1,limit))).map(e=>({id:text(e.id,100),timestamp:e.timestamp,title:text(e.title,160),reason:text(e.reason,600),status:['confirmed','requested','not_confirmed','blocked','decision','observed','no_change'].includes(e.status)?e.status:'decision',source:text(e.source,160),inputs:Array.isArray(e.inputs)?e.inputs.slice(0,16).map(x=>({name:text(x?.name,80),value:text(x?.value,160)})):[],flow:Array.isArray(e.flow)?e.flow.slice(0,8).map(x=>({name:text(x?.name,80),value:text(x?.value,120)})):[],reported:text(e.reported,600)}));
}
