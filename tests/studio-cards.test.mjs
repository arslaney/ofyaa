import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const source=await readFile(new URL('../src/studio/model.ts',import.meta.url),'utf8');
const {code}=await transform(source,{loader:'ts',format:'cjs'});
const mod={exports:{}};new Function('module','exports',code)(mod,mod.exports);
const {CARD_IDS,validOrder,reorder,topVideo,requestStatus,workerTimes}=mod.exports;
test('saved layouts accept each known card once and reject corrupt or unknown entries',()=>{
 assert.equal(validOrder([...CARD_IDS].reverse()),true);
 for(const value of [null,{},[],[...CARD_IDS,'extra'],CARD_IDS.map(()=>CARD_IDS[0]),CARD_IDS.map((id,i)=>i?'unknown':id)])assert.equal(validOrder(value),false);
});
test('moving cards preserves identity and respects boundaries without mutating the source',()=>{
 const original=[...CARD_IDS],next=reorder(original,'welcome',1);
 assert.equal(next[1],'welcome');assert.equal(next[0],'scripts');assert.deepEqual(original,[...CARD_IDS]);
 assert.deepEqual(reorder(original,'welcome',-1),original);assert.deepEqual(reorder(original,'next',1),original);
});
test('rankings preserve real zero views but never invent values for missing metrics',()=>{
 const rows=[{id:'missing',views:null},{id:'zero',views:0},{id:'most',views:22},{id:'invalid',views:-1}];
 assert.equal(topVideo(rows).id,'most');assert.equal(rows[0].id,'missing');
 assert.equal(topVideo([{id:'zero',views:0}]).id,'zero');assert.equal(topVideo([{id:'missing',views:null}]),null);
});

test('card worker check estimates handle disabled, missing and overdue checks',()=>{
 assert.equal(workerTimes(undefined).last,'Henüz kontrol yok');
 assert.equal(workerTimes({enabled:false,lastCheckedAt:'2026-10-20T12:00:00Z'}).next,'Henüz belirlenmedi');
 assert.equal(workerTimes({enabled:true,lastCheckedAt:'invalid'}).next,'Henüz belirlenmedi');
 assert.equal(workerTimes({enabled:true,lastCheckedAt:'2026-10-20T12:00:00Z'},Date.parse('2026-10-20T12:16:00Z')).next,'Kontrol bekleniyor');
 assert.notEqual(workerTimes({enabled:true,lastCheckedAt:'2026-10-20T12:00:00Z'},Date.parse('2026-10-20T12:01:00Z')).next,'Kontrol bekleniyor');
 assert.equal(requestStatus('needs_approval'),'Onay bekliyor');assert.equal(requestStatus('completed'),'Tamamlandı');
});
