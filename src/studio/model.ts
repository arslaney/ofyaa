export type Video={id:string;title:string;url:string;views:number|null;likes:number|null};
export type Snapshot={snapshotId:string;capturedAt:string;agents:{id:string;name:string;status:string;summary:string}[];drafts:{id:string;title:string;status:string}[];publications:{title:string;when:string;youtubeStatus:string;instagramStatus:string}[];requests:{requestId?:string;note?:string;status:string}[];budget:{currentBalance:number|null;historicalCreditsPer3SceneEpisode:number};analytics?:{platforms?:Record<string,{scope?:string;updatedAt?:string;videos?:Video[]}>}};
export const CARD_IDS=['welcome','scripts','team','youtube','instagram','budget','schedule','requests','next'] as const;
export type CardId=typeof CARD_IDS[number];
export const ORDER_KEY='ofyaa-studio-card-order-v1';
export function validOrder(value:unknown):value is CardId[]{return Array.isArray(value)&&value.length===CARD_IDS.length&&new Set(value).size===CARD_IDS.length&&value.every(id=>CARD_IDS.includes(id));}
export function reorder(order:readonly CardId[],id:CardId,direction:number):CardId[]{const result=[...order];const index=result.indexOf(id),target=index+direction;if(index>=0&&target>=0&&target<result.length)[result[index],result[target]]=[result[target],result[index]];return result;}
export function topVideo(videos:Video[]=[]){return videos.filter(v=>Number.isSafeInteger(v.views)&&v.views!>=0).sort((a,b)=>b.views!-a.views!)[0]??null;}
export const count=(value:number)=>new Intl.NumberFormat('tr-TR').format(value);
