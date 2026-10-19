import test from 'node:test';
import assert from 'node:assert/strict';
import {journalEntries} from '../src/journal-model.js';
test('journal displays server records in server order and never invents a confirmation',()=>{
  const record={id:'backend-1',timestamp:'2026-10-20T10:00:00Z',title:'Command',status:'requested',flow:[{name:'Demand',value:4}]};
  const state={attributes:{events:[record,{...record,id:'backend-2',status:'confirmed'}]}};
  const rows=journalEntries(state,'events',1);assert.equal(rows.length,1);assert.equal(rows[0].status,'requested');assert.equal(rows[0].id,'backend-1');
  assert.equal(journalEntries({attributes:{entries:[{...record,status:'success'}]}})[0].status,'decision');
});
test('missing, malformed and oversized journal data are bounded without HTML evaluation',()=>{
  assert.deepEqual(journalEntries(null),[]);assert.deepEqual(journalEntries({attributes:{entries:[null,3,{}, {id:'x',timestamp:'broken'}]}}),[]);
  const row={id:'id',timestamp:'2026-10-20T00:00:00Z',title:'<script>test</script>',reason:'a'.repeat(1000),inputs:Array(50).fill({name:'n',value:'v'})};
  const rows=journalEntries({attributes:{entries:Array(100).fill(row)}},'entries',100);assert.equal(rows.length,50);assert.equal(rows[0].title,row.title);assert.equal(rows[0].reason.length,600);assert.equal(rows[0].inputs.length,16);
});
