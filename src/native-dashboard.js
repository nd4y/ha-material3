import {validateConfig} from './ha.js';
import {translate} from './localize.js';

const types={climate:'custom:ha-m3-climate-card',device:'custom:ha-m3-device-card',camera:'custom:ha-m3-camera-card'};
const icons={home:'home',meeting_room:'door',menu_book:'bookshelf',videocam:'video',devices:'devices',thermostat:'thermometer',air:'air-filter',mode_fan:'fan',ac_unit:'snowflake',water_drop:'water',kitchen:'fridge',vacuum:'robot-vacuum',settings:'cog',open_in_full:'arrow-expand'};
const nativeIcon=value=>value?.includes(':')?value:'mdi:'+(icons[value]||'devices');
const clone=value=>structuredClone(value);
const heading=(title,subtitle)=>({layout:'start',card:{type:'markdown',text_only:true,content:[title&&'# '+escapeMarkdown(title),subtitle&&escapeMarkdown(subtitle)].filter(Boolean).join('\n\n')}});
function escapeMarkdown(value){return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replace(/([\\`*_{}\[\]()#+!|])/g,'\\$1');}
function localPath(value){if(typeof value!=='string'||!/^\/[a-zA-Z0-9_-]+$/.test(value))throw new Error('dashboard_path must be one local HA dashboard path');return value;}
function segment(value){if(typeof value!=='string'||!/^[a-zA-Z0-9_-]+$/.test(value))throw new Error('View paths must contain only letters, digits, hyphen or underscore');return value;}

export function standaloneCard(card,parent={}){
  const result=clone(card),kind=card.kind||'device';
  if(!types[kind])throw new Error('Unknown M3 card kind');
  result.type=types[kind];delete result.kind;
  result.config_version=card.config_version??parent.config_version??1;
  if(card.language||parent.language)result.language=card.language||parent.language;
  result.appearance={...parent.appearance,...card.appearance};
  if(!Object.keys(result.appearance).length)delete result.appearance;
  result.grid_options={columns:'full',rows:'auto',...card.grid_options};
  validateConfig(result,kind);return result;
}

export function nativeActionCard(item){
  const result={type:'button',name:item.name,icon:nativeIcon(item.icon),show_state:false,icon_height:'24px',tap_action:clone(item.action)};
  if(['toggle','more-info'].includes(item.action.action))result.entity=item.action.entity;
  return result;
}

// Offline configuration conversion only. No HA connection, device calls or runtime routing.
export function createNativeDashboard(dashboard,options={}){
  const base=localPath(options.dashboard_path),input=clone(dashboard);
  const candidates=input.views?.flatMap((view,index)=>(view.cards||[]).filter(c=>c.type==='custom:ha-m3-dashboard').map(card=>({view,index,card})))||[];
  if(candidates.length!==1)throw new Error('Expected exactly one custom:ha-m3-dashboard');
  const{view,index,card:parent}=candidates[0];
  if(view.cards.length!==1||view.sections?.length||view.subview||view.strategy)throw new Error('Mixed/custom view configuration requires manual migration');
  const allowed=new Set(['type','config_version','title','language','appearance','home','rooms','cameras','links','header_actions','grid_options','view_layout','visibility']);
  for(const key of Object.keys(parent))if(!allowed.has(key))throw new Error('Unsupported dashboard option: '+key);
  // Visibility must remain attached to each generated card; do not silently widen access.
  if(parent.visibility)throw new Error('Dashboard-level card visibility requires manual migration');
  validateConfig(parent,'panel');
  for(const[keys,allowedKeys]of[[Object.keys(parent.home||{}),['title','subtitle','cards']],...(parent.rooms||[]).map(r=>[Object.keys(r),['id','name','icon','description','cards']])])for(const key of keys)if(!allowedKeys.includes(key))throw new Error('Unsupported composition option: '+key);
  const t=key=>options.labels?.[key]||translate(null,parent,key);
  const paths={home:segment(options.paths?.home||view.path||'home'),rooms:segment(options.paths?.rooms||'rooms'),cameras:segment(options.paths?.cameras||'cameras')};
  const layout={main_columns:4,primary_span:2,secondary_span:2,rooms_columns:3,room_columns:2,camera_columns:4,camera_span:2,...options.layout};
  for(const value of Object.values(layout))if(!Number.isInteger(value)||value<1||value>12)throw new Error('Invalid native layout dimension');
  if(layout.primary_span>layout.main_columns||layout.secondary_span>layout.main_columns||layout.camera_span>layout.camera_columns)throw new Error('Section span exceeds view columns');
  const section=(cards,span=1)=>({type:'grid',column_span:span,cards});
  const baseView=(title,path,max_columns,sections,extra={})=>({type:'sections',title,path,max_columns,sections,...extra});
  const cards=parent.home?.cards||[],primary=cards.filter(c=>c.kind==='climate'),secondary=cards.filter(c=>c.kind!=='climate');
  const sections=[];
  if(primary.length)sections.push(section(primary.map(c=>standaloneCard(c,parent)),layout.primary_span));
  if(secondary.length)sections.push(section(secondary.map(c=>standaloneCard(c,parent)),layout.secondary_span));
  const actions=[...(parent.header_actions||[]),...(parent.links||[])];
  if(actions.length)sections.push(section([{type:'grid',columns:Math.min(2,actions.length),square:false,cards:actions.map(nativeActionCard)}],layout.main_columns));
  const common=Object.fromEntries(Object.entries(view).filter(([key])=>!['type','cards','sections','path','title','icon','panel','max_columns','header','badges'].includes(key)));
  const home=baseView(options.labels?.home||view.title||t('home'),paths.home,layout.main_columns,sections,{...common,...(view.badges?{badges:clone(view.badges)}:{}),header:heading(parent.home?.title||parent.title,parent.home?.subtitle)});
  const roomViews=(parent.rooms||[]).map(room=>baseView(room.name,'room-'+segment(room.id),layout.room_columns,(room.cards||[]).map(c=>section([standaloneCard(c,parent)])),{subview:true,back_path:base+'/'+paths.rooms,header:heading(room.name,room.description)}));
  const roomButtons=(parent.rooms||[]).map((room,i)=>nativeActionCard({name:room.name,icon:room.icon,action:{action:'navigate',navigation_path:base+'/'+roomViews[i].path}}));
  const rooms=baseView(t('rooms'),paths.rooms,layout.rooms_columns,roomButtons.map(button=>section([button])));
  const cameraCards=parent.cameras||cards.filter(c=>c.kind==='camera');
  const cameras=baseView(t('cameras'),paths.cameras,layout.camera_columns,cameraCards.map(c=>section([standaloneCard({...c,kind:'camera'},parent)],layout.camera_span)));
  const generated=[home,rooms,cameras,...roomViews].map(v=>({...clone(common),...v})),used=new Set();
  for(const v of [...input.views.filter((_,i)=>i!==index),...generated]){if(used.has(v.path))throw new Error('Duplicate view path: '+v.path);used.add(v.path);}
  input.views.splice(index,1,...generated);
  return input;
}
