'use strict';
const $ = selector => document.querySelector(selector);
let snapshot = null;
let loadingPromise = null;
let authGeneration = 0;
let refreshTimer = null;
let selectedDraft = null;
let activeView = 'desk';
let analyticsPlatform='youtube';
let analyticsMetric='views';
const noteMemory = new Map();
const pendingRequests = new Map();
function noteKey(id) { return 'ofyaa-studio-note:' + snapshot.snapshotId + ':' + id; }
function rememberNote(id,value) { const key=noteKey(id);noteMemory.set(key,value);try{sessionStorage.setItem(key,value);}catch{ /* Memory fallback for private browsing. */ } }
function recallNote(id) { const key=noteKey(id);try{return sessionStorage.getItem(key) ?? noteMemory.get(key) ?? '';}catch{return noteMemory.get(key)||'';} }
const views = {
 desk: ['Çalışma masası', 'İyi bir bölüm, iyi bir kararla başlar.'],
 schedule: ['Yayın takvimi', 'Aynı bölüm, iki platform. Durumları ayrı takip et.'],
 costs: ['Maliyet ve sorunlar', 'Neye harcandı, ne bekliyor, nerede durmalıyız?'],
 analytics: ['Analizler', 'İzlenme ve beğeni: hangi hikâye karşılık buldu?'],
 activity: ['İşlem kaydı', 'Kararların ve bekleyen taleplerin tek kaydı.']
};
function node(tag, content, className) {
 const n = document.createElement(tag);
 if (content != null) n.textContent = content;
 if (className) n.className = className;
 return n;
}
const verdicts = {numune: 'Final ikinci sahnede belli oluyor. Alparslan sonucu belirlemiyor; ikram konusu da daha önce işlendi.', terlik: 'Defne ile Alparslan aynı evde yaşıyor. Misafirlik kurulumu karakter ilişkisine aykırı; konu da tekrarlanıyor.', baskan: 'İşten kaçan başkan finali tahmin ediliyor. Toplantı konusu tekrar; koltuğa çıkma hareketi ise üretim açısından zor.'};
function verdict(draft) { return verdicts[draft.id] || draft.reason; }
function clean(target) { target.replaceChildren(); return target; }
function flash(text, error = false) {
 const box = $(error ? '#error' : '#notice');
 $(error ? '#notice' : '#error').hidden = true;
 box.textContent = text; box.hidden = false;
}
function date(value, options = {}) {
 if (!value || Number.isNaN(new Date(value).valueOf())) return 'Zaman bilgisi yok';
 return new Intl.DateTimeFormat('tr-TR', {timeZone:'Europe/Istanbul',day:'numeric',month:'long',...options}).format(new Date(value));
}
function setView(view) {
 if (!views[view]) view = 'desk';
 activeView = view;
 for (const button of document.querySelectorAll('[data-view]')) {
  const active = button.dataset.view === view;
  button.classList.toggle('active', active);
  if (active) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
 }
 for (const section of document.querySelectorAll('.view')) section.hidden = section.id !== 'view-' + view;
 $('#page-title').textContent = views[view][0];
 $('#page-description').textContent = views[view][1];
 // Preserve email-link callback until the auth SDK consumes it.
 if (!/access_token=|refresh_token=|error=/.test(location.hash)) history.replaceState(null, '', '#' + view);
}
function stopRefresh() { if(refreshTimer!==null) clearInterval(refreshTimer);refreshTimer=null; }
function startRefresh() {
 stopRefresh();
 if(!window.studioAuth.authorized||document.hidden)return;
 refreshTimer=setInterval(()=>{if(window.studioAuth.authorized&&!document.hidden)void load();},60000);
}
document.addEventListener('visibilitychange',()=>{stopRefresh();if(!document.hidden&&window.studioAuth.authorized){void load();startRefresh();}});
function load() {
 if (loadingPromise) return loadingPromise;
 loadingPromise = loadRecords().finally(() => { loadingPromise = null; });
 return loadingPromise;
}
async function loadRecords() {
 const generation = authGeneration;
 $('#refresh').disabled = true;
 try {
  const response = await window.studioAuth.fetch('/api/studio', {cache:'no-store', credentials:'same-origin'});
  if (!response.ok) throw new Error('Kayıt servisi yanıt vermedi (' + response.status + ').');
  const data = await response.json();
  if (!Array.isArray(data.drafts) || !Array.isArray(data.agents) || !data.snapshotId) throw new Error('Kayıt biçimi doğrulanamadı.');
  if (generation !== authGeneration || !window.studioAuth.authorized) return;
  snapshot = data;
  if (!data.drafts.some(d => d.id === selectedDraft)) selectedDraft = data.drafts[0]?.id;
  render();
  $('#loading').hidden = true; $('#content').hidden = false; $('#error').hidden = true;
  $('#updated').textContent = 'Son okuma · ' + date(data.capturedAt, {hour:'2-digit',minute:'2-digit'});
 } catch (error) {
  $('#loading').hidden = true;
  if (!snapshot) $('#content').hidden = true;
  if (generation === authGeneration && window.studioAuth.authorized) flash('Stüdyo kayıtlarına bağlanılamadı. Bağlantını kontrol edip Yenile’ye bas. ' + error.message, true);
 } finally { $('#refresh').disabled = false; }
}
function render() {
 renderWorker();
 $('#brief-detail').textContent = snapshot.drafts.length + ' taslak revizyona döndü. Yeni taslaklar seçilmeden video üretimi ve kredi harcaması başlamaz.';
 const agents = clean($('#agents'));
 for (const agent of snapshot.agents) {
  const item = node('div', null, 'agent');
  const top = node('div', null, 'agent-top');
  top.append(node('span', agent.name?.slice(0,1) || 'A', 'agent-avatar'), node('h3', agent.name), node('span', agent.status==='running'?'Çalışıyor':agent.status==='completed'?'Teslim edildi':'Durumu incele', 'agent-state'));
  item.append(top, node('p', agent.summary)); agents.append(item);
 }
 $('#draft-count').textContent = snapshot.drafts.length + ' taslak · editör geri bildirimi var';
 const list = clean($('#draft-list'));
 for (const draft of snapshot.drafts) {
  const button = node('button', null, 'draft-item' + (draft.id === selectedDraft ? ' selected' : ''));
  button.type = 'button'; button.setAttribute('aria-pressed', String(draft.id === selectedDraft));
  button.append(node('strong', draft.title), node('span', 'Revizyon gerekli', 'badge'), node('p', verdict(draft)));
  button.addEventListener('click', () => { selectedDraft = draft.id; render(); }); list.append(button);
 }
 renderDetail(); renderSchedule(); renderCosts(); renderRequests(); renderAnalytics();
 window.studioCards?.update(snapshot);
}
function renderDetail() {
 const target = clean($('#draft-detail'));
 const draft = snapshot.drafts.find(d => d.id === selectedDraft);
 if (!draft) { target.append(node('p','Henüz taslak yok. Yeni taslak isteyerek başlayabilirsin.','empty')); return; }
 const heading = node('div',null,'detail-title'); heading.append(node('h3', draft.title),node('span','Editörden döndü','badge'));
 target.append(heading,node('p',verdict(draft),'review-note'));
 const fullReview = node('details',null,'full-review');fullReview.append(node('summary','Editörün tam incelemesini oku'),node('div',draft.reason.replace(/\*\*/g,''),'script'));target.append(fullReview);
 let script = (draft.script || '').replace(/^#{1,6}\s*/gm,'').replace(/\*\*/g,'');
 target.append(node('div',script,'script'));
 const decision = node('div',null,'decision');
 const label = node('label','Revizyon notun'); label.htmlFor='revision-note';
 const note = node('textarea'); note.id='revision-note';note.maxLength=1000;note.placeholder='Neyi değiştirelim? Örneğin: finali daha beklenmedik yap.';
 note.value=recallNote(draft.id);note.addEventListener('input',()=>rememberNote(draft.id,note.value));
 const actions = node('div',null,'decision-actions');
 const revise = node('button','Revizyon iste','primary');revise.type='button';
 revise.addEventListener('click',()=>submit('request_revision',draft.id,note.value,revise));
 const approve = node('button','Üretime onay ver','secondary');approve.disabled=true;approve.title='Editör revizyonu tamamlanmadan üretim onayı verilemez.';
 actions.append(revise,approve);
 decision.append(label,note,actions,node('p','Bu metin editörden geçmedi. Revizyon talebin kaydedilir; koordinatörün işlemesi beklenir.','decision-explain'));
 target.append(decision);
}
function renderSchedule() {
 const target = clean($('#schedule-list'));
 if (!snapshot.publications.length) { target.append(node('p','Henüz planlı bölüm kaydı yok.','empty')); return; }
 for (const item of snapshot.publications) {
  const row=node('article',null,'schedule-row');const when=node('div',date(item.when),'schedule-time');
  when.append(node('strong',date(item.when,{hour:'2-digit',minute:'2-digit',day:undefined,month:undefined})));
  const detail=node('div');detail.append(node('h3',item.title));const platforms=node('div',null,'platforms');
  const yt=node('span','YouTube · ');yt.append(node('strong',item.youtubeStatus==='scheduled_verified'?'Platformda planlandı':'Durum: '+item.youtubeStatus));
  const ig=node('span','Instagram · ');ig.append(node('strong',item.instagramStatus==='timed_automation_created_not_native_scheduled'?'Zamanlı görev · platformda planlı değil':item.instagramStatus));
  platforms.append(yt,ig);detail.append(platforms);
  if (/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(item.youtubeUrl || '')) {
   const a=node('a','YouTube bağlantısını aç');a.href=item.youtubeUrl;a.target='_blank';a.rel='noopener noreferrer';detail.append(a);
  }
  row.append(when,detail);target.append(row);
 }
}
function renderCosts() {
 const target=clean($('#budget'));const table=node('table',null,'cost-table');table.append(node('caption','Video kredileri'));
 const body=node('tbody');
 const values=[['Bu stüdyo kurulumunda video üretimi',snapshot.budget.videoCreditsSpentInSetup+' kredi'],['Üç sahneli son bölümlerdeki geçmiş tüketim',snapshot.budget.historicalCreditsPer3SceneEpisode+' Flow kredisi / bölüm'],['Güncel sağlayıcı bakiyesi',snapshot.budget.currentBalance==null?'Henüz sorgulanmadı':String(snapshot.budget.currentBalance)],['Yeni üretim harcama yetkisi','Bu kurulum kapsamında yok']];
 for (const [label,value] of values) {const row=node('tr');const th=node('th',label);th.scope='row';row.append(th,node('td',value));body.append(row);}
 table.append(body);target.append(table,node('p','Geçmiş tüketim yeni üretim fiyatı değildir. Model, bakiye ve yetki üretimden önce doğrulanır. Codex ajan kullanımı bu video kredilerinden ayrıdır.','cost-footnote'));
 const issues=clean($('#issues'));
 for (const issue of snapshot.issues) {const el=node('article',null,'issue');el.append(node('h3',issue.title),node('p',issue.detail === 'all_three_original_drafts_require_revision_no_script_approved' ? 'Üç ilk taslak revizyona döndü. Henüz onaya hazır yeni senaryo yok.' : issue.detail));issues.append(el);}
}
const requestStatuses={received:'Sırada',running:'Çalışıyor',completed:'Tamamlandı',cancelled:'İptal edildi',blocked:'Engel var',needs_approval:'Onay bekliyor'};
function renderWorker() {
 const worker=snapshot?.worker;
 $('#connection-label').textContent=snapshot?.workerConnected?'Koordinatör bağlı':worker?.enabled?'Koordinatör kontrolü bekleniyor':'Koordinatör bağlantısı kapalı';
 const checked=worker?.lastCheckedAt?date(worker.lastCheckedAt,{hour:'2-digit',minute:'2-digit'}):'Henüz kontrol yok';
 const next=worker?.enabled&&worker?.lastCheckedAt?new Date(Date.parse(worker.lastCheckedAt)+15*60000):null;
 const nextLabel=next&&Number.isFinite(next.valueOf())?(next.valueOf()>Date.now()?date(next,{hour:'2-digit',minute:'2-digit'}):'Kontrol bekleniyor'):'Henüz belirlenmedi';
 $('#connection-detail').textContent='Codex · 15 dakikalık kontrol. Son kontrol: '+checked+'. Sonraki kontrol: '+nextLabel+'. '+(snapshot?.workerConnected?'Talepler onay ve yetki kurallarıyla işlenir.':'Bağlantı yeni bir kontrolle doğrulanır.');
 $('#agent-worker-detail').textContent=$('#connection-label').textContent+' · Son kontrol: '+checked;
}
function renderRequests() {
 const target=clean($('#requests'));
 if (!snapshot.requests.length) target.append(node('p','Henüz bu panelden talep kaydedilmedi.','empty'));
 for (const request of [...snapshot.requests].reverse()) {
  const el=node('article',null,'request');const titles={request_revision:'Revizyon talebi',request_new_drafts:'Yeni taslak talebi',approve_script:'Senaryo kararı',assign_task:'Yönetici görevi'};
  const draft=snapshot.drafts.find(d=>d.id===request.draftId);
  if(request.action==='assign_task') el.append(node('p',({writer:'Senarist',editor:'Editör',producer:'Prodüksiyon',coordinator:'Koordinatör'}[request.assignee]||'Ajan')+' · '+(request.requestedStart==='now'?'Şimdi yap talebi':'Sıraya alınması istendi')));
  el.append(node('h3',(titles[request.action]||'Talep')+(draft?' · '+draft.title:'')),node('time',date(request.createdAt||request.receivedAt,{hour:'2-digit',minute:'2-digit'})),node('p',request.note||'Koordinatörün işlemesi bekleniyor.'),node('span',requestStatuses[request.status]||'Sırada','badge'));
  if(request.message)el.append(node('p',request.message));
  if(request.startedAt)el.append(node('p','Başladı · '+date(request.startedAt,{hour:'2-digit',minute:'2-digit'})));
  if(request.completedAt)el.append(node('p','Tamamlandı · '+date(request.completedAt,{hour:'2-digit',minute:'2-digit'})));
  if(request.resultSummary)el.append(node('p',request.resultSummary,'script'));
  target.append(el);
 }
 $('#export').disabled=!snapshot.requests.length;
}
function renderAnalytics() {
 const platform=snapshot.analytics?.platforms?.[analyticsPlatform];
 const target=clean($('#analytics-ranking'));
 $('#analytics-scope').textContent='Kapsam: '+({observed_public_shorts_first_page:'YouTube Shorts listesinin ilk 30 satırında görülen herkese açık videolar. Tüm 55 kaydı veya uzun videoları kapsamaz.',observed_instagram_first_twelve_reels:'Instagram profilinde yüklenen ilk 12 Reels. Tüm 33 gönderiyi kapsamaz.',unavailable:'Henüz kapsam bilgisi yok.'}[platform?.scope] || platform?.scope || 'Bu platform için istatistik kaydı henüz yok.');
 $('#analytics-updated').textContent=platform?.updatedAt?'Son okuma: '+date(platform.updatedAt,{hour:'2-digit',minute:'2-digit'})+' · Platformda görünen toplam sayaçlar; günlük/haftalık değişim değil.':'Henüz ölçüm alınmadı.';
 const rows=(platform?.videos||[]).filter(v=>Number.isInteger(v[analyticsMetric])&&v[analyticsMetric]>=0).sort((a,b)=>b[analyticsMetric]-a[analyticsMetric]);
 if(!rows.length){target.append(node('p',analyticsMetric==='likes'?'Beğeni sayıları henüz okunamadı. En çok beğenilen sıralaması veri gelince oluşacak; eksik sayaçlar sıfır sayılmaz.':'Bu platform için görüntülenme verisi henüz alınmadı.','empty'));return;}
 const table=node('table',null,'analytics-table');const caption=node('caption',(analyticsMetric==='views'?'En çok izlenen':'En çok beğenilen')+' · yalnız bu kayıttaki videolar');table.append(caption);
 const head=node('thead');const header=node('tr');for(const label of ['Video','İzlenme','Beğeni']){const th=node('th',label);th.scope='col';header.append(th);}head.append(header);table.append(head);const body=node('tbody');
 for(const video of rows){const row=node('tr');const name=node('td');const a=node('a',video.title);a.href=video.url;a.target='_blank';a.rel='noopener noreferrer';name.append(a);row.append(name,node('td',video.views==null?'Okunamadı':new Intl.NumberFormat('tr-TR').format(video.views)),node('td',video.likes==null?'Okunamadı':new Intl.NumberFormat('tr-TR').format(video.likes)));body.append(row);}table.append(body);target.append(table);
}
async function submit(action,draftId,note,button,extra={}) {
 if (!snapshot) {flash('Önce kayıtları yenile.',true);return;}
 const generation=authGeneration;
 button.disabled=true;
 try {
  const input={action,draftId,note:note.trim() || 'Bu taslağı editörün gerekçelerine göre yeniden yaz; yeni sürümü bağımsız incelemeye gönder.',snapshotId:snapshot.snapshotId,...extra};
  const fingerprint=JSON.stringify(input);
  if(!pendingRequests.has(fingerprint)) pendingRequests.set(fingerprint,crypto.randomUUID());
  const response=await window.studioAuth.fetch('/api/studio/requests',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',...(snapshot.writeToken ? {'X-Studio-Token':snapshot.writeToken} : {})},body:JSON.stringify({...input,requestId:pendingRequests.get(fingerprint)})});
  const result=await response.json();
  if(generation!==authGeneration||!window.studioAuth.authorized)return;
  if (!response.ok) throw new Error(result.detail || ({stale_snapshot:'Kaynaklar değişti. Kayıtları yenileyip yeniden dene.', origin_and_token_required:'Oturum doğrulanamadı. Sayfayı yenile.',note_required_max_1000:'Lütfen 1–1000 karakterlik bir not yaz.'}[result.error]) || 'Talep kaydedilemedi. Kayıtları yenileyip yeniden dene.');
  pendingRequests.delete(fingerprint);
  if(action==='request_revision' && draftId) rememberNote(draftId,'');
  if(action==='assign_task') $('#task-note').value='';
  await load();
  if(generation!==authGeneration||!window.studioAuth.authorized)return;
  flash(result.request?.message || 'Talep kaydedildi. Koordinatörün sonraki kontrolünde değerlendirilecek.');
 } catch(error) {if(generation===authGeneration&&window.studioAuth.authorized)flash(error.message,true);} finally {button.disabled=false;}
}
for(const button of document.querySelectorAll('[data-view]')) button.addEventListener('click',()=>setView(button.dataset.view));
$('#analytics-platform').addEventListener('change',event=>{analyticsPlatform=event.target.value;if(snapshot) renderAnalytics();});
$('#analytics-metric').addEventListener('change',event=>{analyticsMetric=event.target.value;if(snapshot) renderAnalytics();});
$('#refresh').addEventListener('click',load);
$('#new-drafts').addEventListener('click',event=>submit('request_new_drafts',null,'Önceki konuları tekrarlamayan, net ters köşeli üç yeni Alparslan taslağı hazırla; bağımsız editör değerlendirmesinden sonra kullanıcıya sun.',event.currentTarget));
$('#open-task').addEventListener('click',()=>{setView('desk');$('#task-form').open=true;$('#task-note').focus();});
$('#assign-task').addEventListener('click',event=>{const note=$('#task-note').value.trim();if(!note){flash('Görev talimatını yaz.',true);$('#task-note').focus();return;}submit('assign_task',null,note,event.currentTarget,{assignee:$('#task-assignee').value,requestedStart:$('#task-start').value});});
$('#export').addEventListener('click',()=>{
 const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot.requests,null,2)],{type:'application/json'}));const a=node('a');a.href=url;a.download='ofyaa-studio-talepler.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
function setMode() {
 const cloud = window.studioAuth.mode === 'cloud';
 $('#mode-label').textContent = cloud ? 'Özel stüdyo' : 'Yerel önizleme';
 $('#connection-label').textContent = cloud ? 'Güvenli giriş' : 'Yerel önizleme';
 $('#connection-detail').textContent = cloud ? 'Koordinatörün son kontrolü kayıtlar yüklenince gösterilir.' : 'Yerel dosya kayıtları. Koordinatör durumu kayıtlar yüklenince gösterilir.';
 $('#auth-signout').hidden = !cloud;
}
window.addEventListener('studio-signed-out', () => {
 authGeneration++;
 stopRefresh();
 window.studioCards?.clear();
 snapshot = null; selectedDraft = null; noteMemory.clear(); pendingRequests.clear();
 try { for (const key of Object.keys(sessionStorage)) if(key.startsWith('ofyaa-studio-note:')) sessionStorage.removeItem(key); } catch {}
 for(const id of ['agents','draft-list','draft-detail','schedule-list','budget','issues','requests','analytics-ranking']) clean($('#'+id));
 for(const id of ['brief-detail','draft-count','analytics-scope','analytics-updated','error','notice'])$('#'+id).textContent='';
 $('#task-note').value = ''; $('#task-form').open = false;
 $('#content').hidden = true; $('#error').hidden = true; $('#notice').hidden = true;
 $('#updated').textContent = 'Giriş bekleniyor';
 $('#connection-label').textContent='Giriş bekleniyor';$('#connection-detail').textContent='Koordinatör durumu girişten sonra gösterilir.';$('#agent-worker-detail').textContent='';
});
window.addEventListener('studio-authenticated', () => { setMode(); void load(); startRefresh(); });
setView(location.hash.slice(1));
window.studioAuth.ready.then(() => { setMode(); if(window.studioAuth.authorized){void load();startRefresh();} });

// Optional React island; the stable panel and authenticated API remain the source of truth.
window.addEventListener('studio-cards-ready',()=>{if(snapshot&&window.studioAuth.authorized)window.studioCards?.update(snapshot);});
window.addEventListener('studio-card-action',event=>{
 if(!snapshot||!window.studioAuth.authorized)return;
 const {target,platform}=event.detail||{};
 if(target==='task'){$('#open-task').click();return;}
 if(target==='scripts'){setView('desk');$('.review-section').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});return;}
 if(['schedule','analytics','costs','activity','desk'].includes(target)){
  if(target==='analytics'&&['youtube','instagram'].includes(platform)){analyticsPlatform=platform;$('#analytics-platform').value=platform;renderAnalytics();}
  setView(target);
 }
});
if(new URLSearchParams(location.search).get('layout')==='cards'){
 document.body.classList.add('cards-preview');
 $('#cards-variant-link').href='#desk';$('#cards-variant-link').addEventListener('click',event=>{event.preventDefault();const url=new URL(location.href);url.searchParams.delete('layout');url.hash='desk';location.assign(url.href);});
 $('#cards-variant-link').textContent='Klasik görünüme dön';
 const css=document.createElement('link');css.rel='stylesheet';css.href='/studio/cards.css';
 css.onload=()=>{const script=document.createElement('script');script.src='/studio/cards.js';script.defer=true;script.onerror=()=>flash('Kart görünümü yüklenemedi. Klasik görünümü kullanabilir veya sayfayı yenileyebilirsin.',true);document.head.append(script);};
 css.onerror=()=>flash('Kart görünümü yüklenemedi. Klasik görünüm kullanılabilir.',true);document.head.append(css);
}
