import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

test('authentication works when edge runtime omits AbortSignal.timeout',async()=>{
 const previous=AbortSignal.timeout;
 try{
  AbortSignal.timeout=undefined;
  const {handlers}=await setup();
  assert.equal((await handlers.get(request('/api/studio',{token:'invalid-test-token'}))).status,401);
 }finally{AbortSignal.timeout=previous;}
});

test('public config never exposes privileged or malformed JWT keys',async()=>{
 for(const key of ['sb_secret_fake','header.'+btoa(JSON.stringify({role:'service_role'}))+'.sig','bad.bad.bad']){
  const {handlers,calls}=await setup({env:{...env,STUDIO_SUPABASE_ANON_KEY:key}});
  const response=await handlers.config(request('/api/studio/config'));
  assert.equal(response.status,503);assert.equal(calls.length,0);assert.ok(!(await response.text()).includes(key));
 }
});

const uid = 'a120b435-0389-4706-8b14-47bf13aad08c';
const rid = 'c8a28230-f6ef-4f78-95c0-5e929617c261';
const env = {STUDIO_SUPABASE_URL:'https://example.supabase.co', STUDIO_SUPABASE_ANON_KEY:'public-test-anon', STUDIO_OWNER_EMAIL:'owner@example.test'};
async function setup(options = {}) {
  const path = new URL('../api/_studio/core.mjs', import.meta.url);
  assert.ok(existsSync(path), 'cloud studio core must exist');
  const {createHandlers} = await import(path);
  const calls = [];
  const logs = [];
  const stored = options.rows || [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({url:String(url), init});
    const u = new URL(url);
    const data = (body, status=200) => new Response(JSON.stringify(body), {status,headers:{'Content-Type':'application/json'}});
    if (options.networkFailure) { const error = new TypeError('private backend secret token=SHOULD_NOT_LOG', {cause:{code:options.causeCode || 'ECONNRESET',message:'private upstream URL'}});error.code=options.errorCode || 'SECRET_CODE';throw error; }
    if (u.pathname === '/auth/v1/user') {
      if (options.invalidAuthJson) return new Response('{broken private secret', {status:200});
      if (init.headers.Authorization !== 'Bearer trusted') return data({error:'fake'},401);
      return data({id:uid,email:options.email || env.STUDIO_OWNER_EMAIL,email_confirmed_at:options.unconfirmed ? null : '2026-10-20T00:00:00Z',user_metadata:{email:env.STUDIO_OWNER_EMAIL}});
    }
    if (u.pathname === '/rest/v1/studio_members') return data(options.noMembership ? [] : [{user_id:uid}]);
    if (u.pathname === '/rest/v1/studio_snapshots') return data([{id:'primary',version:'v1',updated_at:'2026-10-20T00:00:00Z',state:{worker:options.worker,drafts:options.drafts||[{id:'numune',status:options.approvable ? 'awaiting_user_approval' : 'revision_required',title:'Numune',script:'text',reason:'reason'}],agents:[],publications:[],budget:{currentBalance:null},issues:[],writeToken:'mustnotleak',requests:[{note:'mustnotleak'}]}}]);
    if (u.pathname === '/rest/v1/studio_requests') {
      if (init.method === 'POST') {
        const body = JSON.parse(init.body);
        if (stored.some(x => x.id === body.id)) return data({code:'23505'},409);
        const row = {...body,received_at:'2026-10-20T00:00:01Z',status:'received'};
        stored.push(row);
        return data([row],201);
      }
      const id = u.searchParams.get('id');
      return data(id ? stored.filter(x => x.id === id.slice(3)) : stored.slice(Number(u.searchParams.get('offset')||0),Number(u.searchParams.get('offset')||0)+Number(u.searchParams.get('limit')||stored.length)));
    }
    assert.fail('Unexpected network route '+url);
  };
  return {handlers:createHandlers({env:options.env || env,fetchImpl,logger:{error:event=>logs.push(event)},now:()=>Date.parse('2026-10-20T12:00:00Z')}),calls,stored,logs};
}
function request(path='/api/studio', {method='GET',body,token='trusted',origin='https://studio.example.test',headers={}}={}) {
  return new Request('https://studio.example.test'+path,{method,headers:{...(token ? {Authorization:'Bearer '+token}:{}),...(method==='POST'?{'Content-Type':'application/json',...(origin ? {Origin:origin}:{})}:{}),...headers},...(body !== undefined ? {body:JSON.stringify(body)}:{})});
}
const payload = (changes={}) => ({requestId:rid,action:'request_revision',draftId:'numune',note:'Yeni final',snapshotId:'v1',...changes});

test('configuration fails closed and public config exposes only public fields',async()=>{
  let {handlers,calls}=await setup({env:{}});
  assert.equal((await handlers.config(request('/api/studio/config'))).status,503);
  assert.equal((await handlers.get(request())).status,503);
  assert.equal(calls.length,0);
  ({handlers}=await setup());
  const response=await handlers.config(request('/api/studio/config'));
  assert.deepEqual(Object.keys(await response.json()).sort(),['anonKey','mode','supabaseUrl','workerConnected']);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
});

test('missing bearer and fake token are denied without trusting JWT metadata',async()=>{
  const {handlers,calls}=await setup();
  assert.equal((await handlers.get(request('/api/studio',{token:null}))).status,401);
  assert.equal(calls.length,0);
  assert.equal((await handlers.get(request('/api/studio',{token:'fake'}))).status,401);
});

test('wrong email, unconfirmed email and absent membership are forbidden',async()=>{
  for(const options of [{email:'different@example.test'},{unconfirmed:true},{noMembership:true}]){
    const {handlers}=await setup(options);
    assert.equal((await handlers.get(request())).status,403);
  }
});

test('verified snapshot overrides server-only fields and returns sanitized requests',async()=>{
  const {handlers,calls}=await setup();
  const response=await handlers.get(request());
  assert.equal(response.status,200);
  const snapshot=await response.json();
  assert.equal(snapshot.mode,'cloud');
  assert.equal(snapshot.snapshotId,'v1');
  assert.equal(snapshot.workerConnected,false);
  assert.deepEqual(snapshot.requests,[]);
  assert.equal('writeToken' in snapshot,false);
  assert.equal(JSON.stringify(snapshot).includes('mustnotleak'),false);
  assert.ok(calls.every(x=>x.init.headers.apikey===env.STUDIO_SUPABASE_ANON_KEY));
  assert.ok(calls.every(x=>x.init.headers.Authorization==='Bearer trusted'));
});

test('writes require exact origin and reject stale snapshot or rejected approval',async()=>{
  const {handlers}=await setup();
  for(const origin of [null,'https://evil.test']) assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:payload(),origin}))).status,403);
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:payload({snapshotId:'old'})}))).status,409);
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:payload({action:'approve_script'})}))).status,409);
});

test('assignments validate fields and remain intake only',async()=>{
  const {handlers,stored}=await setup();
  const valid=payload({action:'assign_task',draftId:null,assignee:'writer',requestedStart:'now'});
  for(const changes of [{assignee:'admin'},{requestedStart:'tomorrow'},{assignee:null}]) assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:{...valid,...changes}}))).status,400);
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:payload({assignee:'writer'})}))).status,400);
  const response=await handlers.post(request('/api/studio/requests',{method:'POST',body:valid}));
  assert.equal(response.status,202);
  const {request:row}=await response.json();
  assert.equal(row.agentStarted,false);
  assert.equal(row.assignee,'writer');
  assert.equal(row.requestedStart,'now');
  assert.equal(stored[0].user_id,uid);
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:{...valid,assignee:'editor'}}))).status,409);
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:{...valid,requestedStart:'queued'}}))).status,409);
});

test('duplicate id is idempotent only for identical inputs',async()=>{
  const {handlers,stored}=await setup();
  const send=body=>handlers.post(request('/api/studio/requests',{method:'POST',body}));
  const first=await send(payload());
  assert.equal(first.status,202);
  const second=await send(payload());
  assert.equal(second.status,202);
  assert.deepEqual(await second.json(),await first.json());
  assert.equal((await send(payload({note:'Changed'}))).status,409);
  assert.equal(stored.length,1);
});

test('valid editor-approved script may be recorded, unknown draft and overlimit body denied',async()=>{
  const {handlers}=await setup({approvable:true});
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:payload({action:'approve_script'})}))).status,202);
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:payload({draftId:'unknown'})}))).status,400);
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:payload({note:'x'.repeat(9000)})}))).status,413);
});

test('upstream failures are generic and never expose exception details',async()=>{
  const {handlers}=await setup({networkFailure:true});
  const response=await handlers.get(request());
  assert.equal(response.status,503);
  assert.equal((await response.text()).includes('private backend secret'),false);
});

test('malformed JSON and missing required fields produce safe validation errors',async()=>{
  const {handlers}=await setup();
  const badJson=new Request('https://studio.example.test/api/studio/requests',{method:'POST',headers:{Authorization:'Bearer trusted',Origin:'https://studio.example.test','Content-Type':'application/json'},body:'{broken'});
  assert.equal((await handlers.post(badJson)).status,400);
  for(const key of ['requestId','note','snapshotId','action']){
    const body=payload();delete body[key];
    assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body}))).status,400);
  }
  assert.equal((await handlers.post(request('/api/studio/requests',{method:'POST',body:payload(),token:null}))).status,401);
});

test('request UUID casing is canonicalized for database identity',async()=>{
  const {handlers}=await setup();
  const response=await handlers.post(request('/api/studio/requests',{method:'POST',body:payload({requestId:rid.toUpperCase()})}));
  assert.equal(response.status,202);
  assert.equal((await response.json()).request.requestId,rid);
});

test('fetch diagnostics expose only bounded stage, path and safe error identifiers',async()=>{
  const {handlers,logs}=await setup({networkFailure:true});
  const response=await handlers.get(request());
  assert.equal(response.status,503);
  assert.equal(logs.length,2);
  assert.deepEqual(logs[0],{event:'studio_remote_error',stage:'remote_fetch',path:'auth_user',name:'TypeError',code:null,causeCode:'ECONNRESET',category:'unknown'});
  const output=JSON.stringify(logs);
  for(const secret of ['private','SHOULD_NOT_LOG','SECRET_CODE',env.STUDIO_SUPABASE_URL,env.STUDIO_SUPABASE_ANON_KEY,'trusted']) assert.equal(output.includes(secret),false);
  const hidden=await setup({networkFailure:true,errorCode:'ENOTFOUND',causeCode:'SECRET_CAUSE'});
  await hidden.handlers.get(request());
  assert.equal(hidden.logs[0].code,'ENOTFOUND');
  assert.equal(hidden.logs[0].causeCode,null);
});

test('handler JSON failures log safe stage and category without response content',async()=>{
  const {handlers,logs}=await setup({invalidAuthJson:true});
  const response=await handlers.get(request());
  assert.equal(response.status,503);
  assert.ok(logs.some(event=>event.stage==='handler'&&event.name==='SyntaxError'&&event.category==='json_error'));
  assert.equal(JSON.stringify(logs).includes('private secret'),false);
});

test('remote diagnostic category is fixed and raw messages never logged',async()=>{
  const {createHandlers}=await import('../api/_studio/core.mjs');
  for(const [message,category] of [['redirect forbidden SECRET','redirect_error'],['fetch failed SECRET','fetch_error'],['JSON unexpected token SECRET','json_error'],['signal aborted SECRET','signal_error'],['Illegal invocation SECRET','illegal_invocation'],['sensitive address SECRET','unknown']]){
    const logs=[];
    const handlers=createHandlers({env,fetchImpl:async()=>{throw new TypeError(message);},logger:{error:event=>logs.push(event)},now:()=>Date.parse('2026-10-20T12:00:00Z')});
    assert.equal((await handlers.get(request())).status,503);
    assert.equal(logs.find(event=>event.stage==='remote_fetch')?.category,category);
    assert.equal(logs.find(event=>event.stage==='handler')?.category,category);
    assert.equal(JSON.stringify(logs).includes('SECRET'),false);
  }
});

test('portable manual redirect mode accepts direct auth errors without following redirects',async()=>{
  const {createHandlers}=await import('../api/_studio/core.mjs');
  const calls=[];
  const handlers=createHandlers({env,logger:{error(){}},fetchImpl:async(url,init)=>{
    calls.push({url,init});
    if(init.redirect!=='manual')throw new TypeError('redirect error mode unsupported');
    return new Response('{"code":"bad_jwt"}',{status:403});
  }});
  assert.equal((await handlers.get(request())).status,401);
  assert.equal(calls.length,1);
  assert.equal(calls[0].init.redirect,'manual');
});

test('all upstream redirects fail closed without a second credential-bearing request',async()=>{
  const {createHandlers}=await import('../api/_studio/core.mjs');
  for(const status of [300,301,302,303,304,305,307,308,399]){
    const calls=[];
    const handlers=createHandlers({env,logger:{error(){}},fetchImpl:async(url,init)=>{
      calls.push({url,init});
      return new Response(null,{status,headers:{Location:'https://untrusted.example.test/secret'}});
    }});
    const response=await handlers.get(request());
    assert.equal(response.status,503);
    assert.equal(calls.length,1);
    assert.equal(calls[0].init.redirect,'manual');
    assert.equal((await response.text()).includes('untrusted'),false);
  }
});


test('worker health requires an enabled Codex heartbeat with a recent real check',async()=>{
 const base={enabled:true,mode:'codex_heartbeat',pollIntervalMinutes:1,lastCheckedAt:'2026-10-20T11:45:00Z',automationId:'worker-id',secret:'mustnotleak'};
 for(const [change,connected,status] of [[{},true,'active'],[{lastCheckedAt:'2026-10-20T11:15:00Z'},true,'active'],[{lastCheckedAt:'2026-10-20T11:14:59Z'},false,'stale'],[{lastCheckedAt:'2026-10-20T12:00:01Z'},false,'stale'],[{lastCheckedAt:'invalid'},false,'not_checked'],[{enabled:false},false,'disabled'],[{enabled:'true'},false,'disabled'],[{mode:'other'},false,'disabled']]){
  const {handlers}=await setup({worker:{...base,...change}});
  const response=await handlers.get(request()),body=await response.json();
  assert.equal(body.workerConnected,connected);assert.equal(body.workerStatus,status);
  assert.equal(body.worker.pollIntervalMinutes,15);assert.equal(body.worker.mode,'codex_heartbeat');
  assert.equal('secret' in body.worker,false);assert.equal(response.headers.get('Cache-Control'),'no-store');
 }
 const {handlers}=await setup({worker:base});
 assert.equal((await (await handlers.config(request())).json()).workerConnected,false);
 assert.equal((await handlers.get(request('/api/studio',{token:null}))).status,401);
});

test('requests expose bounded results, lifecycle times and evidence of agent work',async()=>{
 const statuses=['received','running','completed','cancelled','blocked','needs_approval','unknown'];
 const rows=statuses.map((status,index)=>({id:String(index),status,note:'note',result_summary:index===2?'<script>alert(1)</script>':null,started_at:index===4?'2026-10-20T11:00:00Z':'invalid',completed_at:index===2?'2026-10-20T11:30:00Z':null,secret:'mustnotleak'}));
 const {handlers,calls}=await setup({rows});
 const body=await (await handlers.get(request())).json();
 assert.deepEqual(body.requests.map(row=>row.status),[...statuses.slice(0,-1),'received']);
 assert.deepEqual(body.requests.map(row=>row.agentStarted),[false,true,true,false,true,false,false]);
 assert.equal(body.requests[2].resultSummary,'<script>alert(1)</script>');
 assert.equal(body.requests[2].completedAt,'2026-10-20T11:30:00.000Z');
 assert.equal(body.requests[0].startedAt,null);assert.equal(JSON.stringify(body).includes('mustnotleak'),false);
 assert.match(calls.at(-1).url,/result_summary,started_at,completed_at/);
});

test('idempotent retry returns updated task result without resetting task or duplicating it',async()=>{
 const {handlers,stored}=await setup();
 const send=()=>handlers.post(request('/api/studio/requests',{method:'POST',body:payload()}));
 await send();Object.assign(stored[0],{status:'completed',result_summary:'Teslim edildi',started_at:'2026-10-20T11:00:00Z',completed_at:'2026-10-20T11:30:00Z'});
 const body=await (await send()).json();
 assert.equal(body.request.status,'completed');assert.equal(body.request.agentStarted,true);assert.equal(body.request.resultSummary,'Teslim edildi');assert.equal(stored.length,1);
});

test('feedback notes are durable owner requests and liking never approves production',async()=>{
 const {handlers,stored}=await setup();
 const send=body=>handlers.post(request('/api/studio/requests',{method:'POST',body}));
 for(const action of ['dislike_script','archive_script'])assert.equal((await send(payload({action,note:'  '}))).status,400);
 assert.equal((await send(payload({action:'like_script',note:''}))).status,202);
 assert.equal(stored[0].action,'like_script');assert.equal(stored[0].status,'received');
 assert.equal((await send(payload({requestId:'ca282230-f6ef-4f78-95c0-5e929617c262',action:'approve_script'}))).status,409);
 assert.equal((await send(payload({requestId:'ca282230-f6ef-4f78-95c0-5e929617c263',action:'dislike_script',draftId:'missing'}))).status,400);
 assert.equal((await send(payload({requestId:'ca282230-f6ef-4f78-95c0-5e929617c264',action:'dislike_script',snapshotId:'old'}))).status,409);
});

test('feedback preserves editor source and archived ideas/reasons in history beyond the first page',async()=>{
 const rows=Array.from({length:200},(_,i)=>({id:'task'+i,action:'assign_task',status:'completed'}));
 rows.push({id:rid,action:'dislike_script',draft_id:'numune',note:'Final tahmin ediliyor',snapshot_id:'v1',status:'received'}, {id:'archive',action:'archive_script',draft_id:'numune',note:'Aynı konuyu yeniden yazma',snapshot_id:'v1',status:'received'});
 const {handlers,calls}=await setup({rows});
 const body=await (await handlers.get(request())).json();
 assert.equal(body.drafts.length,0);assert.equal(body.requests.length,202);
 assert.equal(body.feedbackHistory.length,2);assert.equal(body.feedbackHistory[0].title,'Numune');assert.equal(body.feedbackHistory[0].sourceScript,'text');assert.equal(body.feedbackHistory[0].note,'Final tahmin ediliyor');
 assert.equal(body.feedbackHistory[1].requestId,'archive');assert.equal(body.feedbackHistory[1].editorReason,'reason');
 assert.ok(calls.some(call=>call.url.includes('offset=200')));
});

test('like and dislike annotate drafts without changing editor status or reason',async()=>{
 const {handlers}=await setup({rows:[{id:rid,action:'dislike_script',draft_id:'numune',note:'Gerekçe',status:'received'}]});
 const body=await (await handlers.get(request())).json();
 assert.equal(body.drafts[0].status,'revision_required');assert.equal(body.drafts[0].reason,'reason');assert.equal(body.drafts[0].feedback,'disliked');
});

test('feedback captures immutable source context, rejects client context and preserves it on retry',async()=>{
 const drafts=[{id:'numune',title:'İlk başlık',script:'İlk senaryo',reason:'İlk inceleme',status:'revision_required'}];
 const {handlers,stored}=await setup({drafts});
 const send=body=>handlers.post(request('/api/studio/requests',{method:'POST',body}));
 assert.equal((await send(payload({action:'dislike_script',draft_context:{script:'Sahte'}}))).status,400);
 const feedback=payload({action:'dislike_script',note:'Final tahmin ediliyor'});
 assert.equal((await send(feedback)).status,202);
 assert.deepEqual(stored[0].draft_context,{id:'numune',title:'İlk başlık',script:'İlk senaryo',reason:'İlk inceleme',snapshotId:'v1'});
 Object.assign(drafts[0],{script:'Yeni metin',reason:'Yeni inceleme'});
 assert.equal((await send(feedback)).status,202);assert.equal(stored[0].draft_context.script,'İlk senaryo');
 drafts.splice(0);
 const body=await (await handlers.get(request())).json();
 assert.equal(body.drafts.length,0);assert.equal(body.feedbackHistory[0].sourceScript,'İlk senaryo');assert.equal(body.feedbackHistory[0].editorReason,'İlk inceleme');assert.equal(body.feedbackHistory[0].title,'İlk başlık');assert.equal(body.feedbackHistory[0].sourceSnapshotId,'v1');
});
