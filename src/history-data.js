// Shared per-connection cache and batched read-only Recorder requests.
const sessions=new WeakMap();
export function loadHistory(hass,entities,hours=24,now=Date.now()){
  const owner=hass.connection||hass;let cache=sessions.get(owner);if(!cache){cache=new Map();sessions.set(owner,cache);}
  const end=Math.floor(now/60000)*60000,start=end-hours*3600000,key=String(hours);let batch=cache.get(key);
  if(!batch||now-batch.created>120000){batch={created:now,start,end,data:new Map(),queue:[],timer:null};cache.set(key,batch);}
  return Promise.all(entities.map(entity=>{
    if(batch.data.has(entity))return batch.data.get(entity);
    const pending=new Promise((resolve,reject)=>batch.queue.push({entity,resolve,reject}));batch.data.set(entity,pending);
    if(!batch.timer)batch.timer=setTimeout(async()=>{batch.timer=null;const queued=batch.queue.splice(0),ids=[...new Set(queued.map(x=>x.entity))];try{
      const params=new URLSearchParams({filter_entity_id:ids.join(','),end_time:new Date(end).toISOString(),significant_changes_only:'false'});
      const response=await hass.callApi('GET',`history/period/${new Date(start).toISOString()}?${params}`),groups=new Map((response||[]).filter(a=>a.length).map(a=>[a[0].entity_id,a]));
      for(const q of queued)q.resolve({records:groups.get(q.entity)||[],start,end});
    }catch(error){for(const q of queued){batch.data.delete(q.entity);q.reject(error);}}},0);
    return pending;
  }));
}
