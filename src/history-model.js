// Recorder data only. Null values are explicit gaps, never fabricated zeroes.
export function historyNumber(state,source={}){
  if(!state||['unknown','unavailable'].includes(state.state))return null;
  let value=source.attribute?state.attributes?.[source.attribute]:state.state;
  if(source.value_map){if(!Object.hasOwn(source.value_map,String(value)))return null;value=source.value_map[String(value)];}
  if(typeof value!=='number'&&(typeof value!=='string'||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(value.trim())))return null;
  value=Number(value);return Number.isFinite(value)?source.invert?100-value:value:null;
}
export function historyPoints(records,source,start,end){
  const points=[];
  for(const record of records||[]){const t=Date.parse(record.last_updated||record.last_changed);if(!Number.isFinite(t)||t>end)continue;const point={t:Math.max(start,t),v:historyNumber(record,source)};if(points.at(-1)?.t===point.t)points[points.length-1]=point;else points.push(point);}
  points.sort((a,b)=>a.t-b.t);
  if(points.length&&points.at(-1).t<end)points.push({t:end,v:points.at(-1).v});
  return points;
}
export function segments(points){const result=[];let part=[];for(const point of points){if(point.v===null){if(part.length)result.push(part);part=[];}else part.push(point);}if(part.length)result.push(part);return result;}
// Bound SVG work for long Recorder windows while retaining gaps and bucket extrema.
export function displayPoints(points,budget=720){
  const parts=segments(points),total=parts.reduce((sum,p)=>sum+p.length,0),result=[];
  for(const part of parts){if(result.length)result.push({t:part[0].t-1,v:null});const limit=Math.max(4,Math.floor(budget*part.length/Math.max(1,total)));if(part.length<=limit){result.push(...part);continue;}
    result.push(part[0]);const size=Math.max(1,Math.ceil((part.length-2)/Math.max(1,Math.floor((limit-2)/2))));
    for(let i=1;i<part.length-1;i+=size){const bucket=part.slice(i,Math.min(part.length-1,i+size)),min=bucket.reduce((a,b)=>a.v<=b.v?a:b),max=bucket.reduce((a,b)=>a.v>=b.v?a:b);if(min.t===max.t)result.push(min);else result.push(...[min,max].sort((a,b)=>a.t-b.t));}
    result.push(part.at(-1));
  }return result;
}
export function slopes(points){const d=points.slice(1).map((p,i)=>(p.v-points[i].v)/(p.t-points[i].t));return points.map((_,i)=>i===0?d[0]||0:i===points.length-1?d.at(-1)||0:d[i-1]*d[i]<=0?0:Math.min(Math.abs(d[i-1]),Math.abs(d[i]))*Math.sign(d[i]));}
export function smoothValue(part,t){if(part.length===1)return part[0].v;let i=part.findIndex(p=>p.t>=t)-1;i=Math.max(0,i<0?part.length-2:i);if(t===part[0].t)i=0;const a=part[i],b=part[i+1],u=Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t))),m=slopes(part),dx=b.t-a.t;return (2*u**3-3*u*u+1)*a.v+(u**3-2*u*u+u)*dx*m[i]+(-2*u**3+3*u*u)*b.v+(u**3-u*u)*dx*m[i+1];}
export function sampleAt(points,t){const part=segments(points).find(p=>t>=p[0].t&&t<=p.at(-1).t);if(!part)return null;const recorded=part.findLast(p=>p.t<=t)?.v;return {smooth:smoothValue(part,t),recorded};}
export function smoothPath(points,x,y){return segments(points).map(part=>{let path=`M${x(part[0].t)},${y(part[0].v)}`;const m=slopes(part);for(let i=1;i<part.length;i++){const a=part[i-1],b=part[i],dx=b.t-a.t;path+=`C${x(a.t+dx/3)},${y(a.v+m[i-1]*dx/3)} ${x(b.t-dx/3)},${y(b.v-m[i]*dx/3)} ${x(b.t)},${y(b.v)}`;}return path;}).join(' ');}
export function validateHistory(config){
  if(config===undefined||config===false||config===true)return;
  if(!config||typeof config!=='object'||Array.isArray(config))throw Error('history must be boolean or an object');
  if(config.hours!==undefined&&(!Number.isFinite(config.hours)||config.hours<1||config.hours>168))throw Error('history.hours must be between 1 and 168');
}
export function validateHistorySources(sources){if(!Array.isArray(sources)||!sources.length||sources.length>6)throw Error('History requires 1..6 sources');for(const s of sources){if(!s||!/^\w+\.[a-z0-9_]+$/.test(s.entity||'')||typeof s.name!=='string'||!s.name.trim()||s.attribute!==undefined&&typeof s.attribute!=='string'||s.invert!==undefined&&typeof s.invert!=='boolean')throw Error('Invalid history source');if(s.value_map&&Object.values(s.value_map).some(v=>!Number.isFinite(v)))throw Error('Invalid history value map');}}
