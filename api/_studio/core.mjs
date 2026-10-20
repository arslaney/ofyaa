// Owner-only REST adapter. No privileged key, worker execution or platform writes.
const REQUEST_COLUMNS='id,action,draft_id,note,snapshot_id,status,received_at,assignee,requested_start';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isObject=value=>value!==null && typeof value==='object' && !Array.isArray(value);
const text=(value,max=20000)=>typeof value==='string'?value.slice(0,max):'';
const pick=(value,keys)=>Object.fromEntries(keys.filter(key=>value?.[key]!==undefined).map(key=>[key,value[key]]));
class Failure extends Error { constructor(status,error,detail){super(error);this.status=status;this.error=error;this.detail=detail;} }
const fail=(status,error,detail)=>{throw new Failure(status,error,detail);};
function json(status,body){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
function safeUrl(value){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&['youtube.com','www.youtube.com','youtu.be','instagram.com','www.instagram.com'].includes(url.hostname)?url.origin+url.pathname:'';}catch{return '';}}
function sanitizeState(state){
  const out={};
  for(const [key,fields] of Object.entries({agents:['id','name','role','status','summary'],drafts:['id','title','status','reason','script'],publications:['title','when','youtubeStatus','instagramStatus','youtubeUrl'],issues:['title','detail','severity']})){
    out[key]=Array.isArray(state[key])?state[key].slice(0,1000).filter(isObject).map(row=>Object.fromEntries(fields.filter(field=>row[field]!==undefined).map(field=>[field,field==='youtubeUrl'?safeUrl(row[field]):text(row[field])]))):[];
  }
  out.budget=isObject(state.budget)?pick(state.budget,['videoCreditsSpentInSetup','historicalCreditsPer3SceneEpisode','currentBalance']):{};
  const source=isObject(state.analytics)?state.analytics:{};
  out.analytics={status:source.status==='manual_snapshot'?'manual_snapshot':'not_connected',updatedAt:typeof source.updatedAt==='string'?text(source.updatedAt,80):null,platforms:{}};
  for(const name of ['youtube','instagram']){
    const platform=isObject(source.platforms?.[name])?source.platforms[name]:{};
    out.analytics.platforms[name]={status:platform.status==='manual_snapshot'?'manual_snapshot':'not_connected',scope:text(platform.scope,80)||'unavailable',updatedAt:typeof platform.updatedAt==='string'?text(platform.updatedAt,80):null,videos:Array.isArray(platform.videos)?platform.videos.slice(0,1000).filter(isObject).map(video=>({id:text(video.id,300),title:text(video.title,300),url:safeUrl(video.url),views:Number.isSafeInteger(video.views)&&video.views>=0?video.views:null,likes:Number.isSafeInteger(video.likes)&&video.likes>=0?video.likes:null})):[]};
  }
  return out;
}
function requestRow(row){return {requestId:row.id,action:row.action,draftId:row.draft_id??null,note:row.note,snapshotId:row.snapshot_id,status:row.status,receivedAt:row.received_at,assignee:row.assignee??null,requestedStart:row.requested_start??null,agentStarted:false,message:'Talep kaydedildi; ajan başlatılmadı.'};}

export function createHandlers({env,fetchImpl=globalThis.fetch}){
  function settings(){
    const url=text(env?.STUDIO_SUPABASE_URL).replace(/\/$/,'');
    const key=text(env?.STUDIO_SUPABASE_ANON_KEY);
    const owner=text(env?.STUDIO_OWNER_EMAIL).trim().toLowerCase();
    let valid=false;
    try{const parsed=new URL(url);valid=parsed.protocol==='https:'&&!parsed.username&&!parsed.password&&parsed.pathname==='/'&&!parsed.search&&!parsed.hash;}catch{}
    let privileged=false;
    if(key.split('.').length===3){try{privileged=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role!=='anon';}catch{privileged=true;}}
    if(privileged||!valid||!key.trim()||key.startsWith('sb_secret_')||!owner||!owner.includes('@')) fail(503,'not_configured','Stüdyo sunucu yapılandırması hazır değil.');
    return {url,key,owner};
  }
  async function remote(config,token,path,options={}){
    const response=await fetchImpl(config.url+path,{...options,headers:{apikey:config.key,Authorization:token,...options.headers},signal:AbortSignal.timeout(10000),redirect:'error'});
    return response;
  }
  async function auth(req,config){
    const token=req.headers.get('Authorization');
    if(!token||!/^Bearer [^\s]+$/i.test(token))fail(401,'authentication_required','Lütfen stüdyo hesabınızla giriş yapın.');
    const response=await remote(config,token,'/auth/v1/user');
    if(response.status===401||response.status===403)fail(401,'invalid_session','Oturum doğrulanamadı; yeniden giriş yapın.');
    if(!response.ok)fail(503,'auth_unavailable','Oturum doğrulama hizmetine ulaşılamıyor.');
    const user=await response.json();
    if(!isObject(user)||!UUID.test(user.id||''))fail(401,'invalid_session','Oturum doğrulanamadı; yeniden giriş yapın.');
    if(typeof user.email!=='string'||user.email.toLowerCase()!==config.owner||!user.email_confirmed_at)fail(403,'owner_required','Bu stüdyo yalnız yetkili sahibine açıktır.');
    const membership=await remote(config,token,'/rest/v1/studio_members?select=user_id&user_id=eq.'+encodeURIComponent(user.id));
    if(!membership.ok)fail(membership.status===403?403:503,'membership_unavailable','Stüdyo üyeliği doğrulanamadı.');
    const rows=await membership.json();
    if(!Array.isArray(rows)||!rows.some(row=>row.user_id===user.id))fail(403,'membership_required','Bu stüdyo için yetkili üyelik bulunamadı.');
    return {token,userId:user.id};
  }
  async function current(config,token){
    const response=await remote(config,token,'/rest/v1/studio_snapshots?id=eq.primary&select=id,version,state,updated_at');
    if(!response.ok)fail(503,'snapshot_unavailable','Stüdyo kaydı şu anda okunamıyor.');
    const rows=await response.json();
    const row=Array.isArray(rows)?rows.find(item=>item.id==='primary'):null;
    if(!row||!isObject(row.state)||typeof row.version!=='string'||!row.version)fail(503,'snapshot_unavailable','Stüdyo kaydı henüz hazır değil.');
    return row;
  }
  function validate(body,state){
    if(!isObject(body))fail(400,'invalid_request','Geçerli bir JSON talebi gönderin.');
    const allowed=new Set(['action','draftId','note','snapshotId','requestId']);
    if(body.action==='assign_task'){allowed.add('assignee');allowed.add('requestedStart');}
    if(Object.keys(body).some(key=>!allowed.has(key)))fail(400,'unexpected_field','Talepte desteklenmeyen alan var.');
    if(!['assign_task','request_revision','request_new_drafts','approve_script'].includes(body.action))fail(400,'invalid_action','Talep türü desteklenmiyor.');
    if(typeof body.requestId!=='string'||!UUID.test(body.requestId))fail(400,'invalid_request_id','Talep kimliği geçerli bir UUID olmalıdır.');
    if(typeof body.note!=='string'||!body.note.trim()||body.note.length>1000)fail(400,'invalid_note','Not 1–1000 karakter olmalıdır.');
    if(typeof body.snapshotId!=='string'||!body.snapshotId||body.snapshotId.length>200)fail(400,'invalid_snapshot_id','Geçerli kayıt sürümü gerekli.');
    if(body.action==='assign_task'){
      if(!['coordinator','writer','editor','producer'].includes(body.assignee)||!['now','queued'].includes(body.requestedStart)||body.draftId!=null)fail(400,'invalid_assignment','Görev için geçerli ajan ve başlangıç tercihi seçin.');
    }else{
      const draft=Array.isArray(state.drafts)?state.drafts.find(item=>item.id===body.draftId):null;
      if((body.action!=='request_new_drafts'||body.draftId!=null)&&!draft)fail(400,'invalid_draft','Taslak bulunamadı.');
    }
    return {id:body.requestId.toLowerCase(),action:body.action,draft_id:body.draftId??null,note:body.note,snapshot_id:body.snapshotId,assignee:body.assignee??null,requested_start:body.requestedStart??null};
  }
  const guarded=handler=>async req=>{
    try{return await handler(req);}catch(error){return error instanceof Failure?json(error.status,{error:error.error,detail:error.detail}):json(503,{error:'service_unavailable',detail:'Stüdyo hizmetine şu anda ulaşılamıyor. Lütfen yeniden deneyin.'});}
  };
  return {
    config:guarded(async req=>{
      if(req.method!=='GET')return json(405,{error:'method_not_allowed',detail:'Yalnız GET desteklenir.'});
      const config=settings();
      return json(200,{supabaseUrl:config.url,anonKey:config.key,mode:'cloud',workerConnected:false});
    }),
    get:guarded(async req=>{
      if(req.method!=='GET')return json(405,{error:'method_not_allowed',detail:'Yalnız GET desteklenir.'});
      const config=settings();
      const {token}=await auth(req,config);
      const row=await current(config,token);
      const response=await remote(config,token,'/rest/v1/studio_requests?select='+REQUEST_COLUMNS+'&order=received_at.asc&limit=200');
      if(!response.ok)fail(503,'requests_unavailable','Talep geçmişi şu anda okunamıyor.');
      const rows=await response.json();
      if(!Array.isArray(rows))fail(503,'requests_unavailable','Talep geçmişi şu anda okunamıyor.');
      return json(200,{...sanitizeState(row.state),snapshotId:row.version,mode:'cloud',capturedAt:row.updated_at,workerConnected:false,requests:rows.map(requestRow)});
    }),
    post:guarded(async req=>{
      if(req.method!=='POST')return json(405,{error:'method_not_allowed',detail:'Yalnız POST desteklenir.'});
      const config=settings();
      if(req.headers.get('Origin')!==new URL(req.url).origin)fail(403,'origin_required','Talep yalnız stüdyonun kendi sayfasından gönderilebilir.');
      const {token,userId}=await auth(req,config);
      if(req.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')fail(400,'json_required','JSON içerik türü gerekli.');
      const length=req.headers.get('Content-Length');
      if(length && (!/^\d+$/.test(length)||Number(length)>8192))fail(413,'body_too_large','Talep en fazla 8192 bayt olabilir.');
      const reader=req.body?.getReader();
      let size=0,chunks=[];
      if(reader){while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8192){await reader.cancel();fail(413,'body_too_large','Talep en fazla 8192 bayt olabilir.');}chunks.push(value);}}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      let body;try{body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail(400,'invalid_json','JSON talebi okunamadı.');}
      const snapshot=await current(config,token);
      const input=validate(body,snapshot.state);
      if(body.snapshotId!==snapshot.version)fail(409,'stale_snapshot','Kayıt değişti; sayfayı yenileyip tekrar deneyin.');
      if(body.action==='approve_script'){
        const draft=snapshot.state.drafts.find(item=>item.id===body.draftId);
        if(!['awaiting_user_approval','editor_approved'].includes(draft.status))fail(409,'script_revision_required','Taslak henüz kullanıcı onayına hazır değil.');
      }
      const response=await remote(config,token,'/rest/v1/studio_requests',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({...input,user_id:userId,status:'received'})});
      if(response.status===409){
        const existing=await remote(config,token,'/rest/v1/studio_requests?select='+REQUEST_COLUMNS+'&id=eq.'+encodeURIComponent(input.id));
        if(!existing.ok)fail(503,'requests_unavailable','Önceki talep doğrulanamadı.');
        const rows=await existing.json();
        const previous=Array.isArray(rows)?rows.find(row=>row.id===input.id):null;
        if(!previous||Object.keys(input).some(key=>(previous[key]??null)!==input[key]))fail(409,'idempotency_conflict','Aynı talep kimliği farklı içerikle kullanıldı.');
        return json(202,{request:requestRow(previous)});
      }
      if(!response.ok)fail(response.status===403?403:503,'request_not_saved','Talep kaydedilemedi; yetki ve bağlantıyı kontrol edin.');
      const rows=await response.json();
      if(!Array.isArray(rows)||rows.length!==1||rows[0].id!==input.id)fail(503,'request_not_confirmed','Talep kaydı henüz doğrulanamadı. Aynı talep kimliğiyle tekrar deneyin.');
      return json(202,{request:requestRow(rows[0])});
    })
  };
}
