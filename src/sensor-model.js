const entityPattern=/^[a-z_]+\.[a-z0-9_]+$/;
export function validateSensorGroups(config){
  if(!Array.isArray(config.groups)||!config.groups.length)throw new Error('Sensor groups required');
  for(const group of config.groups){
    if(typeof group.name!=='string'||!group.name.trim()||!Array.isArray(group.tiles)||!group.tiles.length)throw new Error('Each sensor group needs a name and tiles');
    for(const tile of group.tiles){
      if(!entityPattern.test(tile.entity||''))throw new Error('Sensor tile needs an entity');
      if(tile.battery!==undefined&&!entityPattern.test(tile.battery))throw new Error('Invalid battery entity');
      if(tile.low_battery!==undefined&&(!Number.isFinite(tile.low_battery)||tile.low_battery<0||tile.low_battery>100))throw new Error('Invalid battery threshold');
      if(tile.kind!==undefined&&!['measurement','moisture'].includes(tile.kind))throw new Error('Invalid sensor tile kind');
      if(tile.metrics!==undefined&&(!Array.isArray(tile.metrics)||!tile.metrics.length))throw new Error('Metrics must be a nonempty array');
      for(const metric of tile.metrics||[]){
        if(!entityPattern.test(metric.entity||''))throw new Error('Metric needs an entity');
        if(metric.decimals!==undefined&&(!Number.isInteger(metric.decimals)||metric.decimals<0||metric.decimals>4))throw new Error('Metric precision must be 0-4');
      }
    }
  }
  return config;
}
export function sensorValue(state){
  if(!state||state.state==='unavailable')return 'unavailable';
  if(state.state==='unknown'||state.state===undefined||state.state===null||state.state==='')return 'unknown';
  return 'available';
}
export function sensorTileModel(tile,states={}){
  const primary=states[tile.entity],status=sensorValue(primary),moisture=tile.kind==='moisture'||primary?.attributes?.device_class==='moisture';
  const metrics=(tile.metrics||[{entity:tile.entity}]).map(metric=>({...metric,state:states[metric.entity],status:sensorValue(states[metric.entity])}));
  const alarm=moisture&&primary?.state==='on';
  const binaryUnknown=moisture&&status==='available'&&!['on','off'].includes(primary.state);
  const battery=tile.battery?states[tile.battery]:undefined;
  const batteryValue=sensorValue(battery)==='available'&&Number.isFinite(Number(battery.state))?Number(battery.state):null;
  const validBattery=batteryValue!==null&&batteryValue>=0&&batteryValue<=100?batteryValue:null;
  const lowBattery=validBattery!==null&&validBattery<=(tile.low_battery??20);
  const partial=metrics.some(metric=>metric.status!=='available');
  const result=alarm?'alarm':status==='unavailable'?'unavailable':status==='unknown'||binaryUnknown?'unknown':partial?'partial':lowBattery?'lowBattery':'ready';
  return{status:result,primary,metrics,moisture,alarm,dry:moisture&&primary?.state==='off',battery, batteryValue:validBattery,lowBattery};
}
