import test from 'node:test';
import assert from 'node:assert/strict';
import {runRoomChange,syncRoomRequests,roomChangePending,pauseRoomRequests,resumeRoomRequests} from '../src/room-requests.js';
const fixture=()=>({states:{enabled:'off',lock:'on'},s(id){return {state:this.states[id]};},calls:0,async run(){this.calls++;}});
test('room service ACK does not confirm state; every expected helper must match',async()=>{
 const c=fixture();await runRoomChange(c,'trust',{},[['enabled','on'],['lock','off']]);
 assert.equal(roomChangePending(c),true);await runRoomChange(c,'second',{},[['enabled','off']]);assert.equal(c.calls,1);
 c.states.enabled='on';syncRoomRequests(c);assert.equal(roomChangePending(c),true);
 c.states.lock='unavailable';syncRoomRequests(c);assert.equal(roomChangePending(c),true);
 c.states.lock='off';syncRoomRequests(c);assert.equal(roomChangePending(c),false);assert.equal(c._roomErrors.trust,false);
});
test('failed room command releases UI without automatic retry',async()=>{
 const c=fixture();c.run=async()=>{c.calls++;c._error=true;};await runRoomChange(c,'control',{},[['enabled','on']]);
 assert.equal(roomChangePending(c),false);assert.equal(c._roomErrors.control,true);assert.equal(c.calls,1);
});
test('room confirmation before service ACK is retained',async()=>{
 const c=fixture();c.run=async()=>{c.states.enabled='on';syncRoomRequests(c);};await runRoomChange(c,'control',{},[['enabled','on']]);
 assert.equal(roomChangePending(c),false);assert.equal(c._roomErrors.control,false);
});
test('reconnect preserves original deadline and reports unconfirmed target',async t=>{
 t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});const c=fixture();c._roomTargetDraft=24;
 await runRoomChange(c,'room-target',{},[['target',24]]);pauseRoomRequests(c);t.mock.timers.tick(9000);resumeRoomRequests(c);t.mock.timers.tick(1001);
 assert.equal(roomChangePending(c),false);assert.equal(c._roomErrors['room-target'],true);assert.equal(c._roomTargetDraft,null);assert.equal(c.calls,1);
});
