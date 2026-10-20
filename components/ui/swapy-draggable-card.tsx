"use client";
// Adapted from the user's Swapy component; React owns slot placement.
import {useEffect, useRef, type ReactNode, type KeyboardEvent} from 'react';
import {createSwapy, type Config, type SwapEvent} from 'swapy';
import {cn} from '@/lib/utils';

type Props = {id:string; enable?:boolean; onSwap?:(event:SwapEvent)=>void; config?:Partial<Config>; revision?:number; className?:string; children:ReactNode};
export function SwapyLayout({id,enable=true,onSwap,config,revision=0,className,children}:Props){
 const container=useRef<HTMLDivElement>(null);
 const instance=useRef<ReturnType<typeof createSwapy>|null>(null);
 const callback=useRef(onSwap);callback.current=onSwap;
 const initialConfig=useRef(config);
 useEffect(()=>{
  // Swapy installs a body touchmove preventDefault listener even when disabled.
  // Mount it only for intentional desktop editing; touch users use move buttons.
  if(!enable||!container.current||!matchMedia('(hover: hover) and (pointer: fine)').matches)return;
  const swapy=createSwapy(container.current,{...initialConfig.current,manualSwap:true,enabled:enable});
  swapy.onSwap(event=>callback.current?.(event));instance.current=swapy;
  return()=>{swapy.destroy();instance.current=null;};
 },[enable]);
 useEffect(()=>{if(revision){const frame=requestAnimationFrame(()=>instance.current?.update());return()=>cancelAnimationFrame(frame);}},[revision]);
 return <div id={id} ref={container} className={className}>{children}</div>;
}
export function DragHandle({label,onKeyDown,className}:{label:string;onKeyDown?:(event:KeyboardEvent<HTMLButtonElement>)=>void;className?:string}){
 return <button type="button" data-swapy-handle className={cn('drag-handle',className)} aria-label={label} title="Sürükle; klavyede sağ ve sol oklarla taşı" onKeyDown={onKeyDown}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">{[5,12,19].flatMap(y=>[9,15].map(x=><circle key={x+'-'+y} cx={x} cy={y} r="1"/>))}</svg></button>;
}
export function SwapySlot({id,className,children}:{id:string;className?:string;children:ReactNode}){
 return <div data-swapy-slot={id} className={className}>{children}</div>;
}
export function SwapyItem({id,className,children,dragItemOpacity=100}:{id:string;className?:string;children:ReactNode;dragItemOpacity?:number}){
 return <div data-swapy-item={id} className={cn('swapy-card-item',className)} style={{'--drag-opacity':Math.max(10,Math.min(100,dragItemOpacity))/100} as React.CSSProperties}>{children}</div>;
}
