import test from 'node:test';import assert from 'node:assert/strict';
import {scaleDisplayRecord,restoreScaleDisplay} from '../src/scale-display.js';
test('retained display never supplies actuation, received state or confirmation',()=>{
 const old={choices:['off',1,2,'auto'],position:2,owner:'ha',effective:2,available:true,selectable:true};
 const record=scaleDisplayRecord(old,'device-a',1000),shown=restoreScaleDisplay(record,'device-a',{available:true,selectable:true,effective:7,room:{value:20},turboCooldown:400},2000);
 assert.equal(shown.position,2);assert.equal(shown.displayOnly,true);assert.equal(shown.available,false);assert.equal(shown.selectable,false);assert.equal(shown.effective,null);assert.equal(shown.room,null);assert.equal(shown.turboCooldown,0);
 assert.equal('effective'in record,false);
});
test('display cache rejects changed configuration, expiry, future time and malformed values',()=>{
 const valid={signature:'a',savedAt:1000,choices:['off',1,'auto'],position:1,owner:'manual'};
 for(const changes of [{signature:'b'},{savedAt:2001},{savedAt:2000-86400001},{position:9},{position:NaN},{owner:'other'},{choices:['off',{},'auto']},{choices:['on',1,'auto']}])assert.equal(restoreScaleDisplay({...valid,...changes},'a',{},2000),null);
 assert.ok(restoreScaleDisplay(valid,'a',{},2000));
});
