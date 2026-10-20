import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';
const source=await readFile(new URL('../components/ui/swapy-draggable-card.tsx',import.meta.url),'utf8');
const {code}=await transform(source,{loader:'tsx',jsx:'automatic',format:'cjs'});
function fixture(finePointer){
 const refs=[],effects=[],pending=[];let ri=0,ei=0,created=0,destroyed=0;
 const react={useRef(initial){return refs[ri++]??(refs[ri-1]={current:initial});},useEffect(fn,deps){const i=ei++;const old=effects[i];if(!old||deps.some((v,j)=>v!==old.deps[j]))pending.push(()=>{old?.cleanup?.();effects[i]={deps,cleanup:fn()};});}};
 const jsx=(_type,props)=>{if(props.ref)props.ref.current={};return props;};
 const createSwapy=()=>{created++;return {onSwap(){},enable(){},update(){},destroy(){destroyed++;}};};
 const mod={exports:{}};
 const require=name=>name==='react'?react:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='swapy'?{createSwapy}:name==='@/lib/utils'?{cn:()=>''}:null;
 new Function('require','module','exports','matchMedia','requestAnimationFrame','cancelAnimationFrame',code)(require,mod,mod.exports,()=>({matches:finePointer}),()=>1,()=>{});
 return {render(enable){ri=0;ei=0;mod.exports.SwapyLayout({id:'test',enable});while(pending.length)pending.shift()();},get created(){return created;},get destroyed(){return destroyed;},unmount(){for(const effect of effects)effect.cleanup?.();}};
}
test('reading mode never installs the Swapy global touch listeners',()=>{const h=fixture(true);h.render(false);assert.equal(h.created,0);h.unmount();});
test('touch-only devices never install drag listeners even when rearranging',()=>{const h=fixture(false);h.render(false);h.render(true);assert.equal(h.created,0);h.unmount();});
test('desktop edit mode creates drag instance and destroys it when editing ends',()=>{const h=fixture(true);h.render(false);h.render(true);assert.equal(h.created,1);h.render(false);assert.equal(h.destroyed,1);h.render(true);assert.equal(h.created,2);h.unmount();assert.equal(h.destroyed,2);});
