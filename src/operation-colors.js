import {available,stateOf} from './ha.js';

const modes={
  heat:{tone:'warm',labelKey:'operationHeat',icon:'thermostat'},
  cool:{tone:'cool',labelKey:'operationCool',icon:'ac_unit'},
  fan:{tone:'fan',labelKey:'operationFan',icon:'air'},
  fresh:{tone:'cool',labelKey:'operationFresh',icon:'air'},
  clean:{tone:'clean',labelKey:'operationClean',icon:'eco'},
  boost:{tone:'clean',labelKey:'operationBoost',icon:'mode_fan'},
  idle:{tone:'off',labelKey:'operationIdle',icon:'pause'},
  off:{tone:'off',labelKey:'operationOff',icon:'power_settings_new'},
  unknown:{tone:'unknown',labelKey:'operationUnknown',icon:'info'}
};
const climateModes={heat:'heat',cool:'cool',fan_only:'fan',heating:'heat',cooling:'cool',fan:'fan',idle:'idle',off:'off'};
const purifierModes={on:'clean',cleaning:'clean',off:'off',idle:'idle'};
const activityKeys={heating:'operationHeating',cooling:'operationCooling',fan:'operationFan',idle:'operationIdle',off:'operationOff'};
const read=(state,attribute)=>attribute?state?.attributes?.[attribute]:state?.state;
const scalar=value=>['string','number','boolean'].includes(typeof value)&&String(value)!=='';
const validEntity=value=>typeof value==='string'&&/^[a-z_][a-z0-9_]*\.[a-z0-9_]+$/.test(value);
const model=(mode,extra={})=>({mode,...modes[mode],available:mode!=='unknown',kind:null,activity:null,activityKey:null,deviceAvailable:false,deviceOn:false,...extra});

export function validateOperation(config){
  const op=config.operation;
  if(op!==undefined){
    if(!op||typeof op!=='object'||Array.isArray(op)||!['climate','breather','purifier'].includes(op.kind))throw new Error('Operation needs a supported kind');
    if(op.entity!==undefined&&!validEntity(op.entity))throw new Error('Invalid operation entity');
    if(op.attribute!==undefined&&(typeof op.attribute!=='string'||!op.attribute))throw new Error('Invalid operation attribute');
    if(op.states!==undefined){
      if(!op.states||typeof op.states!=='object'||Array.isArray(op.states)||!Object.keys(op.states).length)throw new Error('Operation needs a finite state map');
      for(const [value,mode] of Object.entries(op.states))if(!value||['unknown','unavailable'].includes(value)||!Object.hasOwn(modes,mode))throw new Error('Invalid operation state mapping');
    }
    if(op.heating_setpoint!==undefined){
      const s=op.heating_setpoint;
      if(op.kind!=='breather'||!s||!validEntity(s.entity)||typeof s.attribute!=='string'||!s.attribute||s.off_value!==5)throw new Error('Breather heating setpoint needs a qualified source and off value 5');
    }
    if(op.indicator!==undefined){
      const i=op.indicator;
      if(op.kind!=='breather'||!i||!validEntity(i.entity)||!scalar(i.active_value)||!scalar(i.inactive_value)||String(i.active_value)===String(i.inactive_value)||['unknown','unavailable'].includes(String(i.active_value))||['unknown','unavailable'].includes(String(i.inactive_value)))throw new Error('Heater indicator needs distinct explicit states');
      if(i.attribute!==undefined&&(typeof i.attribute!=='string'||!i.attribute))throw new Error('Invalid heater indicator attribute');
    }
  }
  if(config.grouped!==undefined&&typeof config.grouped!=='boolean')throw new Error('Grouped must be boolean');
  for(const item of config.quick_controls||[])if(item.operation!==undefined&&item.operation!=='airflow')throw new Error('Unsupported parameter operation');
}

// Process evidence is independent from desired values and ownership. In
// particular a breather's fan_only mode says nothing about its heater.
export function operationModel(hass,config){
  const op=config.operation,main=stateOf(hass,config.entity);
  const deviceAvailable=available(main),deviceOn=deviceAvailable&&['on','heat','cool','heat_cool','auto','fan_only','dry','cleaning'].includes(main.state);
  const result=(mode,extra={})=>model(mode,{kind:op?.kind??null,deviceAvailable,deviceOn,...extra});
  const unknown=()=>result('unknown',op?.kind==='breather'?{labelKey:'operationHeaterUnknown'}:{});
  if(!op||!available(main))return unknown();
  if(main.state==='off')return result('off');
  if(op.kind==='breather'&&op.indicator){
    const i=op.indicator,state=stateOf(hass,i.entity),value=read(state,i.attribute);
    if(!available(state)||!scalar(value))return unknown();
    if(String(value)===String(i.active_value))return result('heat',{labelKey:'operationHeating',activity:'heating'});
    if(String(value)===String(i.inactive_value))return result('fresh',{activity:'fan'});
    return unknown();
  }
  if(op.kind==='breather'&&op.heating_setpoint&&!op.indicator){
    const s=op.heating_setpoint,source=stateOf(hass,s.entity),value=read(source,s.attribute);
    const max=source?.attributes?.max_temp;
    if(!available(source)||source.attributes?.source_qualified!==true||typeof value!=='number'||!Number.isFinite(value)||!Number.isFinite(max)||value<s.off_value||value>max)return unknown();
    return value===s.off_value?result('fresh',{activity:'fan'}):result('heat',{labelKey:'operationHeatEnabled',activity:'heat_enabled'});
  }
  // A configured state map is authoritative: missing/unrecognized values do
  // not fall back to a mode, setpoint or an inferred heater temperature.
  if(op.kind==='breather'&&!op.states)return unknown();
  const source=stateOf(hass,op.entity||config.entity),value=read(source,op.attribute);
  if(!available(source)||!scalar(value))return unknown();
  const map=op.states||(op.kind==='climate'?climateModes:purifierModes);
  const mode=Object.hasOwn(map,String(value))?map[String(value)]:'unknown';
  if(!Object.hasOwn(modes,mode)||mode==='unknown')return unknown();
  const activity=op.kind==='climate'?main.attributes?.hvac_action:op.kind==='purifier'&&['clean','boost'].includes(mode)?'cleaning':op.kind==='breather'?{heat:'heating',fresh:'fan',fan:'fan'}[mode]??null:null;
  return result(mode,{activity,activityKey:op.kind==='climate'&&Object.hasOwn(activityKeys,activity)?activityKeys[activity]:null});
}

export function parameterOperation(operation,item){
  return item.operation==='airflow'&&operation.deviceOn&&operation.kind!=='purifier'?model('fan',{kind:operation.kind,deviceAvailable:operation.deviceAvailable,deviceOn:true}):operation;
}

// HVAC motion depicts reported activity. A breather may explicitly depict
// enabled heating from its received setpoint, labelled as permission to heat.
export function operationMotion(operation){
  if(!operation.deviceAvailable||!operation.deviceOn||!operation.available)return 'none';
  if(operation.kind==='purifier')return ['clean','boost'].includes(operation.mode)&&operation.activity==='cleaning'?'spin':'none';
  if(operation.mode==='heat'&&['heating','heat_enabled'].includes(operation.activity))return 'heat';
  if(operation.mode==='cool'&&operation.activity==='cooling')return 'cool';
  return ['fan','fresh'].includes(operation.mode)&&operation.activity==='fan'?'flow':'none';
}
