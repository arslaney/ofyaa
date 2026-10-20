import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../studio/app.js',import.meta.url),'utf8');
function boot(){
 const elements=new Map(),events=new Map(),docEvents=new Map(),timers=new Map();let next=0,calls=0,resolveFetch;
 const element=()=>({textContent:'',hidden:false,value:'',dataset:{},children:[],classList:{add(){},remove(){},toggle(){}},append(...nodes){this.children.push(...nodes);},replaceChildren(){this.children=[];this.textContent='';},addEventListener(){},setAttribute(){},removeAttribute(){}});
 const find=selector=>{if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);};
 const document={hidden:false,querySelector:find,querySelectorAll:()=>[],createElement:element,addEventListener:(name,fn)=>docEvents.set(name,fn),body:element()};
 const window={studioAuth:{authorized:true,mode:'cloud',ready:new Promise(()=>{}),fetch:()=>{calls++;return new Promise(resolve=>{resolveFetch=resolve;});}},addEventListener:(name,fn)=>events.set(name,fn),studioCards:{clear(){this.cleared=true;}}};
 const context=vm.createContext({window,document,location:{hash:'#desk',search:''},history:{replaceState(){}},URLSearchParams,Intl,Date,Map,console,setInterval:(fn,ms)=>{assert.equal(ms,60000);timers.set(++next,fn);return next;},clearInterval:id=>timers.delete(id),sessionStorage:{},setTimeout,crypto:{randomUUID:()=> 'test'}});
 vm.runInContext(source,context);
 return {context,window,document,events,docEvents,timers,elements,find,get calls(){return calls;},resolve:body=>resolveFetch({ok:true,json:async()=>body})};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const privateSnapshot={snapshotId:'v1',agents:[],drafts:[],publications:[],budget:{},issues:[],requests:[],worker:{enabled:true,lastCheckedAt:'2026-10-20T12:00:00Z'},workerConnected:true};
test('visible authenticated panel refreshes every minute, hiding or signout stops polling',async()=>{
 const h=boot();h.events.get('studio-authenticated')();assert.equal(h.calls,1);assert.equal(h.timers.size,1);
 h.resolve(privateSnapshot);await flush();await flush();
 [...h.timers.values()][0]();assert.equal(h.calls,2);h.resolve(privateSnapshot);await flush();await flush();
 h.document.hidden=true;h.docEvents.get('visibilitychange')();assert.equal(h.timers.size,0);
 h.document.hidden=false;h.docEvents.get('visibilitychange')();assert.equal(h.calls,3);assert.equal(h.timers.size,1);
 h.window.studioAuth.authorized=false;h.events.get('studio-signed-out')();assert.equal(h.timers.size,0);
 h.resolve(privateSnapshot);await flush();await flush();
 assert.equal(h.find('#content').hidden,true);assert.equal(vm.runInContext('snapshot',h.context),null);
 assert.equal(h.find('#connection-label').textContent,'Giriş bekleniyor');assert.equal(h.window.studioCards.cleared,true);
 h.docEvents.get('visibilitychange')();assert.equal(h.calls,3);assert.equal(h.timers.size,0);
});
test('request result is literal text and signout clears it from private DOM',()=>{
 const h=boot();vm.runInContext('snapshot='+JSON.stringify({...privateSnapshot,requests:[{status:'completed',note:'Task',resultSummary:'<img src=x onerror=alert(1)>',completedAt:'2026-10-20T12:00:00Z'}]})+';renderRequests()',h.context);
 const row=h.find('#requests').children[0];assert.ok(row.children.some(node=>node.textContent==='<img src=x onerror=alert(1)>'));
 assert.ok(row.children.some(node=>node.textContent==='Tamamlandı'));assert.ok(row.children.every(node=>!('innerHTML' in node)));
 h.events.get('studio-signed-out')();assert.equal(h.find('#requests').children.length,0);
});
