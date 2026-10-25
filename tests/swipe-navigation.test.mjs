import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSwipeNavigation,swipeDestination} from '../src/swipe-navigation.js';
const paths=['/demo/home','/demo/climate','/demo/plan'];
const gesture={dx:-100,dy:5,duration:250,width:390};
test('swipe advances adjacent view without wrapping or inventing routes',()=>{
  assert.equal(swipeDestination(paths,paths[0],gesture),paths[1]);
  assert.equal(swipeDestination(paths,paths[1],{...gesture,dx:100}),paths[0]);
  assert.equal(swipeDestination(paths,paths[2],gesture),null);
  assert.equal(swipeDestination(paths,paths[0],{...gesture,dx:100}),null);
  assert.equal(swipeDestination(paths,'/demo/other',gesture),null);
});
test('scroll, short drag, hold, invalid measurements do not navigate',()=>{
  for(const patch of [{dx:20},{dy:100},{duration:1001},{width:NaN},{dx:Infinity}])assert.equal(swipeDestination(paths,paths[0],{...gesture,...patch}),null);
});
test('configuration bounds navigation to one local dashboard',()=>{
  validateSwipeNavigation({paths});validateSwipeNavigation(false);validateSwipeNavigation();
  for(const value of [{paths:[]},{paths:[paths[0],paths[0]]},{paths:['https://bad/x','/demo/home']},{paths:['/demo/home','/other/home']},{paths:['/demo/home','/demo/../x']}])assert.throws(()=>validateSwipeNavigation(value));
});
