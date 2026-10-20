import {useState,useCallback,useMemo,useRef,useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {type SwapEvent} from 'swapy';
import {SwapyLayout,SwapySlot,SwapyItem,DragHandle} from '@/components/ui/swapy-draggable-card';
import {CARD_IDS,ORDER_KEY,validOrder,reorder,topVideo,count,type CardId,type Snapshot} from './model';

type Target='desk'|'schedule'|'analytics'|'costs'|'activity'|'task'|'scripts';
function navigate(target:Target,platform?:string){window.dispatchEvent(new CustomEvent('studio-card-action',{detail:{target,platform}}));}
const names:Record<CardId,string>={welcome:'Yapım masası',scripts:'Senaryolar',team:'Ajan masası',youtube:'YouTube',instagram:'Instagram',budget:'Bakiye',schedule:'Yayın takvimi',requests:'Talep kutusu',next:'Yeni bölüm'};
const widths=['slot-four','slot-three','slot-five','slot-five','slot-four','slot-three','slot-four','slot-four','slot-four'];
function Arrow({up=false}:{up?:boolean}){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={up?'M7 17 17 7M7 7h10v10':'M5 12h14m-6-6 6 6-6 6'}/></svg>;}
function Action({children,target,platform}:{children:React.ReactNode;target:Target;platform?:string}){return <button type="button" className="card-action" onClick={()=>navigate(target,platform)}>{children}<Arrow/></button>;}
function Metric({children}:{children:React.ReactNode}){return <strong className="card-number">{children}</strong>;}
function Board({snapshot}:{snapshot:Snapshot}){
 const [order,setOrder]=useState<CardId[]>(()=>{try{const value=JSON.parse(localStorage.getItem(ORDER_KEY)||'null');if(validOrder(value))return value;}catch{}return [...CARD_IDS];});
 const [editing,setEditing]=useState(false),[revision,setRevision]=useState(0),[announcement,setAnnouncement]=useState('');
 const focusId=useRef<string|null>(null);
 const config=useMemo(()=>({swapMode:'hover' as const,animation:matchMedia('(prefers-reduced-motion: reduce)').matches?'none' as const:'dynamic' as const,autoScrollOnDrag:true}),[]);
 const persist=useCallback((next:CardId[])=>{setOrder(next);try{localStorage.setItem(ORDER_KEY,JSON.stringify(next));}catch{setAnnouncement('Düzen bu oturumda değişti; tarayıcı kalıcı kayda izin vermedi.');}},[]);
 const onSwap=useCallback((event:SwapEvent)=>{const next=event.newSlotItemMap.asArray.map(row=>row.item);if(validOrder(next)){persist(next);setAnnouncement(names[event.draggingItem as CardId]+' kartı taşındı.');}},[persist]);
 const move=useCallback((id:CardId,direction:number)=>{const next=reorder(order,id,direction);if(next.join()===order.join())return;focusId.current=id;persist(next);setRevision(v=>v+1);setAnnouncement(names[id]+' kartı '+(next.indexOf(id)+1)+'. sıraya taşındı.');},[order,persist]);
 useLayoutEffect(()=>{if(focusId.current){document.querySelector<HTMLButtonElement>('[data-card="'+focusId.current+'"] [data-swapy-handle]')?.focus();focusId.current=null;}},[order]);
 const ready=snapshot.drafts.filter(d=>['awaiting_user_approval','editor_approved'].includes(d.status)).length;
 const revisions=snapshot.drafts.filter(d=>d.status==='revision_required').length;
 const upcoming=[...snapshot.publications].sort((a,b)=>Date.parse(a.when)-Date.parse(b.when))[0];
 function content(id:CardId){
  if(id==='welcome')return <><h2 className="welcome-title">Küçük patron.<br/>Büyük planlar.</h2><p>Minik Patron Alparslan<br/>Senaryodan son kareye, tek masa.</p><Action target="task">Yeni bir iş ver</Action></>;
  if(id==='scripts')return <><Metric>{count(ready)}</Metric><h2>Onaya hazır<br/>senaryo</h2><p>{revisions} taslak revizyon bekliyor.</p><Action target="scripts">Senaryoları gör</Action></>;
  if(id==='team')return <><h2>Aynı hikâye.<br/>Dört ayrı göz.</h2><div className="team-list">{snapshot.agents.map(agent=><div key={agent.id}><span className="role-initial">{agent.name.slice(0,1)}</span><span>{agent.name}</span><small>{agent.status==='completed'?'Teslim edildi':'Durumu incele'}</small></div>)}</div><p className="card-note">Son görev teslimleri · canlı çalışma değil</p></>;
  if(id==='youtube'||id==='instagram'){
   const platform=snapshot.analytics?.platforms?.[id],top=topVideo(platform?.videos);
   return <><div className="platform-title"><h2>{names[id]}</h2><Arrow up/></div>{top?<><Metric>{count(top.views!)}</Metric><p className="video-title">{top.title}</p><p className="card-note">Ölçülen {platform?.videos?.length??0} video içinde en çok izlenen · toplam izlenme</p></>:<><Metric>—</Metric><p>Henüz ölçüm alınmadı.</p></>}<Action target="analytics" platform={id}>Analizleri aç</Action></>;
  }
  if(id==='budget')return <><h2>Önce hesap,<br/>sonra motor.</h2><Metric>{snapshot.budget.currentBalance==null?'—':count(snapshot.budget.currentBalance)}</Metric><p>{snapshot.budget.currentBalance==null?'Güncel kredi bakiyesi henüz sorgulanmadı.':'Güncel sağlayıcı kredi bakiyesi.'}</p><Action target="costs">Maliyetleri aç</Action></>;
  if(id==='schedule')return <><Metric>{snapshot.publications.length}</Metric><h2>Yayın kaydı</h2>{upcoming&&<p>İlk kayıt · {new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'long',timeZone:'Europe/Istanbul'}).format(new Date(upcoming.when))}<br/><span className="card-note">Plan, yayın kanıtı değildir.</span></p>}<Action target="schedule">Takvime bak</Action></>;
  if(id==='requests')return <><h2>Fikirler uçmasın.<br/>Buraya insin.</h2><div className="request-total"><Metric>{snapshot.requests.length}</Metric><span>kayıtlı<br/>talep</span></div><p className="card-note">Talepler saklanır; ajanı henüz koordinatör başlatır.</p><Action target="activity">Talep kutusunu aç</Action></>;
  return <><svg className="next-symbol" aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 5v22M5 16h22"/></svg><h2>Sıradaki bölümün<br/>ilk cümlesi sende.</h2><p>Bir fikir yaz. Birlikte sahneye taşıyalım.</p><Action target="task">Görev ver</Action></>;
 }
 return <div className="cards-workspace"><div className="cards-toolbar"><p>Kendi masanı kur. Kartların yerini sen belirle.</p><div><button type="button" className="cards-edit" aria-pressed={editing} onClick={()=>setEditing(v=>!v)}>{editing?'Düzenlemeyi bitir':'Kartları düzenle'}</button>{editing&&<button type="button" className="cards-reset" onClick={()=>{persist([...CARD_IDS]);setRevision(v=>v+1);setAnnouncement('Başlangıç düzeni yüklendi.');}}>Başlangıç düzeni</button>}</div></div>{editing&&<p className="cards-help">Tutamacından sürükle. Klavyede tutamaca gelip sağ / sol okları kullan veya kartın taşıma düğmelerine bas.</p>}
  <SwapyLayout id="studio-swapy" enable={editing} config={config} onSwap={onSwap} revision={revision} className="tw:grid tw:grid-cols-12 tw:gap-4 cards-grid">{order.map((id,index)=><SwapySlot key={'slot-'+index} id={'slot-'+index} className={'tw:col-span-12 card-slot '+widths[index]}><SwapyItem id={id} dragItemOpacity={90} className={'studio-color-card card-'+id} key={id}><article data-card={id} aria-label={names[id]} className={editing?'card-content is-editing':'card-content'}>{editing&&<DragHandle label={names[id]+' kartını taşı'} onKeyDown={event=>{if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown'].includes(event.key)){event.preventDefault();move(id,['ArrowLeft','ArrowUp'].includes(event.key)?-1:1);}}}/>}<div className="card-body">{content(id)}</div>{editing&&<div className="card-move-controls"><button type="button" disabled={index===0} onClick={()=>move(id,-1)} aria-label={names[id]+' kartını önceye al'}>Önceye al</button><button type="button" disabled={index===order.length-1} onClick={()=>move(id,1)} aria-label={names[id]+' kartını sonraya al'}>Sonraya al</button></div>}</article></SwapyItem></SwapySlot>)}</SwapyLayout><p className="cards-footnote">Analizler son okunan kayıtları gösterir. Eksik veriler sıfır sayılmaz. Kart düzeni yalnız bu tarayıcıda saklanır.</p><p role="status" aria-live="polite" className="cards-sr-only">{announcement}</p></div>;
}
declare global{interface Window{studioCards?:{update:(data:Snapshot)=>void;clear:()=>void}}}
const mount=document.getElementById('studio-cards-root');
if(mount){const root=createRoot(mount);window.studioCards={update(snapshot){root.render(<Board snapshot={snapshot}/>);document.body.classList.add('cards-mounted');},clear(){flushSync(()=>root.render(null));document.body.classList.remove('cards-mounted');}};window.dispatchEvent(new Event('studio-cards-ready'));}
