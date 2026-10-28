import test from 'node:test';
import assert from 'node:assert/strict';
import {journalEntries,journalCause} from '../src/journal-model.js';
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

test('explicit command IDs fold request and result without inventing success',async()=>{
  const {journalActivity}=await import('../src/journal-model.js');
  const base={timestamp:'2026-10-20T10:00:00Z',title:'Fan'};
  const rows=journalActivity({attributes:{entries:[
    {...base,id:'result',command_id:'c1',status:'not_confirmed',reported:'speed=2'},
    {...base,id:'request',command_id:'c1',status:'requested',cause:'Air quality',action:{device:'Fan',changes:[{parameter:'Speed',from:2,to:3}]}},
    {...base,id:'other',command_id:'c2',status:'confirmed'},
  ]}});
  assert.equal(rows.length,2);assert.equal(rows[0].status,'not_confirmed');assert.equal(rows[0].action.changes[0].from,'2');assert.equal(rows[0].cause,'Air quality');assert.equal(rows[0].phases.length,2);
  assert.equal(rows[1].command_id,'c2');assert.equal(rows[1].status,'confirmed');
});
test('similar titles, source and timestamps never correlate legacy commands',async()=>{
  const {journalActivity}=await import('../src/journal-model.js');
  const base={timestamp:'2026-10-20T10:00:00Z',title:'Same',source:'writer'};
  const rows=journalActivity({attributes:{entries:[{...base,id:'a',status:'confirmed'},{...base,id:'b',status:'requested'},{...base,id:'p',status:'decision'}]}});
  assert.deepEqual(rows.map(x=>x.status),['confirmed','requested','decision']);
});
test('newest server status remains authoritative; structured data stays bounded',async()=>{
  const {journalActivity,journalValue}=await import('../src/journal-model.js');
  const base={timestamp:'2026-10-20T10:00:00Z',title:'x',command_id:'one'};
  const input={attributes:{entries:[{...base,id:'new',status:'requested',action:{device:'<script>',changes:Array(20).fill({parameter:'speed',from:0,to:2,unit:'a'.repeat(100)})},inputs:[{name:'context',value:{present:'unknown'}}]},{...base,id:'old',status:'confirmed'}]}};
  const [row]=journalActivity(input);
  assert.equal(row.status,'requested');assert.equal(row.action.changes.length,8);assert.equal(row.action.changes[0].from,'0');assert.equal(row.action.changes[0].unit.length,30);assert.equal(row.action.device,'<script>');assert.equal(row.inputs[0].value,'{"present":"unknown"}');assert.equal(journalValue(false),'false');assert.equal(journalValue(null),'');
  assert.equal(input.attributes.entries[0].action.changes.length,20);
});

test('controller blockers have public labels without changing raw evidence',()=>{
 const raw="(('ac', 'health_not_qualified'), ('heater', 'unavailable'))";
 assert.equal(journalCause(raw),'Кондиционер: состояние не подтверждено, автоматика недоступна. Обогреватель: нет связи');
 assert.match(journalCause(raw,'en'),/Air conditioner: health is not confirmed/);
 assert.equal(journalCause('Настройка пользователя'),'Настройка пользователя');
 assert.equal(journalCause("(('ac', 'future_reason'),)"),'Кондиционер: требуется проверка состояния');
 const code="__import__('os')";assert.equal(journalCause(code),code);
 const e=journalEntries({attributes:{entries:[{id:'1',timestamp:'2026-10-28T00:00:00Z',reason:raw}]}})[0];assert.equal(e.reason,raw);
});
