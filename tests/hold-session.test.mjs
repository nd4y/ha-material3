import test from 'node:test';
import assert from 'node:assert/strict';
import {HoldSession,holdDuration} from '../src/hold-session.js';
test('duration is configurable and rejects accidental instant confirmation',()=>{
  assert.equal(holdDuration(),1200);
  for(const value of [0,799,5001,NaN,Infinity,'1200',null])assert.throws(()=>holdDuration(value));
  assert.equal(holdDuration(800),800);assert.equal(holdDuration(5000),5000);
});
test('short tap and double tap never confirm',()=>{
  const s=new HoldSession();
  for(const start of [0,150]){s.start(1,start);assert.equal(s.release(1,start+50),false);}
});
test('reaching duration alone does nothing; release confirms exactly once',()=>{
  const s=new HoldSession();s.start(7,100);assert.equal(s.id,7);
  assert.equal(s.release(7,1300),true);assert.equal(s.release(7,1400),false);
});
test('threshold boundaries and a fresh session after early release',()=>{
  const s=new HoldSession();s.start(1,0);assert.equal(s.release(1,1199.99),false);
  s.start(2,2000);assert.equal(s.release(2,3200),true);
});
test('cancellation and mismatched pointer cannot confirm',()=>{
  const s=new HoldSession();s.start(1,0);s.cancel();assert.equal(s.release(1,5000),false);
  s.start(2,0);assert.equal(s.release(3,5000),false);assert.equal(s.release(2,5000),false);
});
test('a second pointer cancels the first gesture',()=>{
  const s=new HoldSession();assert.equal(s.start(1,0),true);assert.equal(s.start(2,10),false);assert.equal(s.release(1,2000),false);
});
test('keyboard tokens have the same duration and cancellation rules',()=>{
  const s=new HoldSession(800);s.start('key: ',100);assert.equal(s.release('key: ',900),true);
  s.start('key:Enter',1000);s.cancel();assert.equal(s.release('key:Enter',5000),false);
});
