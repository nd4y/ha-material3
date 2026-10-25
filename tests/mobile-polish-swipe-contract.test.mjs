import test from 'node:test';
import assert from 'node:assert/strict';
import {swipeDestination,validateSwipeNavigation} from '../src/swipe-navigation.js';

const paths=['/demo/home','/demo/office','/demo/cameras'];
const gesture={dx:-100,dy:3,duration:250,width:390};
test('mobile swipe navigation follows configured routes and never wraps at the ends',()=>{
  validateSwipeNavigation({paths});
  assert.equal(swipeDestination(paths,paths[0],gesture),paths[1]);
  assert.equal(swipeDestination(paths,paths[1],{...gesture,dx:100}),paths[0]);
  assert.equal(swipeDestination(paths,paths[0],{...gesture,dx:100}),null);
  assert.equal(swipeDestination(paths,paths[2],gesture),null);
  assert.equal(swipeDestination(paths,'/demo/unknown',gesture),null);
});
test('mobile swipe keeps vertical scrolling, short drags and long holds out of navigation',()=>{
  for(const invalid of [{dx:-20},{dy:100},{duration:1001},{duration:-1},{width:0},{dx:NaN},{dy:Infinity}])assert.equal(swipeDestination(paths,paths[0],{...gesture,...invalid}),null);
});
test('mobile swipe routes cannot escape the configured local dashboard',()=>{
  for(const bad of [['/demo/home','https://example.test'],['/demo/home','/other/office'],['/demo/home','/demo/home'],['/demo/home','//demo/office'],['/demo/home','/demo/office?edit=1']])assert.throws(()=>validateSwipeNavigation({paths:bad}));
});
