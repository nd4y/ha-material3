import test from 'node:test';import assert from 'node:assert/strict';
import {createNativeDashboard,standaloneCard} from '../src/native-dashboard.js';

function fixture(){return{title:'Example',views:[{title:'Home',path:'overview',type:'panel',theme:'My shared theme',visible:[{user:'example-user'}],cards:[{type:'custom:ha-m3-dashboard',config_version:1,language:'en',appearance:{motion:'reduced'},home:{title:'A room',cards:[{kind:'climate',entities:{room_temperature:'sensor.test',target_temperature:'input_number.test',enabled:'input_boolean.test'},presets:[{id:'normal',name:'Normal',action:{action:'perform-action',perform_action:'script.turn_on',target:{entity_id:'script.test'}},active_when:[{entity:'fan.test',value:'on'}]}],maximum:{timer:'timer.test',active_entity:'input_boolean.max',cancel_action:{action:'perform-action',perform_action:'script.turn_on',target:{entity_id:'script.cancel'}}}},{kind:'camera',entity:'camera.test'},{kind:'device',entity:'fan.test',actions:[{name:'Details',action:{action:'more-info',entity:'fan.test'}}]}]},rooms:[{id:'study',name:'Study',description:'Room details',cards:[{kind:'device',entity:'fan.test',expanded:true,appearance:{motion:'expressive'}}]}],links:[{name:'All',action:{action:'navigate',navigation_path:'/somewhere/devices'}}]}]},{title:'Unrelated',path:'other',cards:[{type:'entities',entities:['sensor.other']}]}]};}

test('native migration preserves controls, cards and unrelated views without mutating input',()=>{
  const input=fixture(),before=structuredClone(input),result=createNativeDashboard(input,{dashboard_path:'/example'}),parent=input.views[0].cards[0];
  assert.deepEqual(input,before);assert.deepEqual(result.views.at(-1),input.views[1]);
  assert.deepEqual(result.views.slice(0,3).map(v=>[v.path,v.type,v.subview]),[['overview','sections',undefined],['rooms','sections',undefined],['cameras','sections',undefined]]);
  const climate=result.views[0].sections[0].cards[0];
  for(const key of ['entities','presets','maximum'])assert.deepEqual(climate[key],parent.home.cards[0][key]);
  assert.equal(climate.type,'custom:ha-m3-climate-card');assert.equal(climate.kind,undefined);
  for(const v of result.views.slice(0,-1)){assert.deepEqual(v.visible,input.views[0].visible);assert.equal(v.theme,'My shared theme');}
  assert.deepEqual(result.views[0].sections[2].cards[0].cards[0].tap_action,parent.links[0].action);
  assert.equal(JSON.stringify(result).includes('custom:ha-m3-dashboard'),false);
});

test('navigation uses supplied paths, all rooms have HA back navigation and card overrides survive',()=>{
  const result=createNativeDashboard(fixture(),{dashboard_path:'/another-home',paths:{home:'start',rooms:'areas',cameras:'video'},labels:{rooms:'Areas'}}),room=result.views.find(v=>v.subview);
  assert.equal(room.back_path,'/another-home/areas');assert.equal(result.views[1].title,'Areas');
  assert.equal(result.views[1].sections[0].cards[0].tap_action.navigation_path,'/another-home/'+room.path);
  assert.equal(room.sections[0].cards[0].expanded,true);assert.equal(room.sections[0].cards[0].appearance.motion,'expressive');
  assert.equal(standaloneCard({kind:'device',entity:'fan.test'},{language:'en',appearance:{motion:'reduced'}}).language,'en');
});

test('ambiguous migration, hidden parent, unsafe paths and conflicting routes are rejected',()=>{
  const changes=[d=>d.views[0].cards.push({type:'entities'}),d=>d.views[0].cards[0].visibility=[{condition:'user',users:['example-user']}],d=>d.views[0].cards[0].rooms.push({...d.views[0].cards[0].rooms[0]}),d=>d.views[0].cards[0].unknown_feature=true];
  for(const change of changes){const d=fixture();change(d);assert.throws(()=>createNativeDashboard(d,{dashboard_path:'/example'}));}
  for(const path of ['https://host','//host','/a/b',''])assert.throws(()=>createNativeDashboard(fixture(),{dashboard_path:path}));
  assert.throws(()=>createNativeDashboard(fixture(),{dashboard_path:'/example',paths:{rooms:'other'}}));
});
