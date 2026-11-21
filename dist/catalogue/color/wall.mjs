// The colour wall's order, sections, same-colour folding and column packing, shared by Paint Commons
// and Stipplewise. Accepts either paint shape (see swatch.mjs). Items can be paints or wrappers
// around them (Stipplewise's stash rows): pass paintOf to reach the paint.
import {RAMP_LABELS,RAMPS,rampOf,rampSortKey} from './ramps.mjs';
import {CATEGORIES,categoryOf,categoryLabel} from './categories.mjs';
import {hexToOklab} from './oklch.mjs';
import {splitRun} from './packing.mjs';
import {hexOf,swatchKind} from './swatch.mjs';
export {RAMP_LABELS,RAMPS};

const rampIndex=new Map(RAMP_LABELS.map(([key],i)=>[key,i])),cache=new Map();
const self=x=>x;

/** Colour family (ramp) and lightness sort key, cached by colour and name. */
export function colourMeta(p){
 const hex=hexOf(p),key=`${hex||''}\0${p.name}`;
 if(!cache.has(key))cache.set(key,{family:hex?rampOf(hex,p.name):'unknown',lightness:rampSortKey(hex)});
 return cache.get(key);
}

/** Wall order: colour family in rack order, then dark to light, then name, brand, range and id (fully stable). */
export function colourCompare(a,b){
 const aa=colourMeta(a),bb=colourMeta(b);
 return (rampIndex.get(aa.family)-rampIndex.get(bb.family))||aa.lightness-bb.lightness||a.name.localeCompare(b.name)
  ||String(a.brand).localeCompare(String(b.brand))||String(a.range).localeCompare(String(b.range))||String(a.id).localeCompare(String(b.id));
}

/** Paints only fold with paints drawn the same way: same type section, swatch finish and colour-shift. */
export const finishKey=p=>categoryOf(p)+':'+swatchKind(p)+(/turboshift|zenishift/i.test(p.range||'')?':shift':'');

/** Same colour: OKLab distance below this. */
export const SAME_COLOUR_DISTANCE=.025;

/**
 * Folds same-colour paints from different brands into one tile. Items must already be in wall
 * order. A paint joins one of the last six tiles when it has the same colour family and finish,
 * no paint of its brand is there yet, and it's within SAME_COLOUR_DISTANCE of the tile's first
 * paint (compared to that paint, not transitively). The face is the first item by `rank` (lower
 * first; ties keep wall order), so Stipplewise can put owned paints and the most-owned brand in front.
 * Returns [{item, items, family, finish}] where item is the face and items are all, face first.
 */
export function foldLikeColours(items,{enabled=true,paintOf=self,rank}={}){
 const clusters=[];
 for(const item of items){
  const p=paintOf(item),lab=hexToOklab(hexOf(p)),family=colourMeta(p).family,finish=finishKey(p);
  const c=enabled&&lab&&clusters.slice(-6).find(c=>c.family===family&&c.finish===finish&&c.lab&&c.items.every(i=>paintOf(i).brand!==p.brand)
   &&Math.hypot(c.lab.L-lab.L,c.lab.a-lab.a,c.lab.b-lab.b)<SAME_COLOUR_DISTANCE);
  if(c)c.items.push(item);else clusters.push({items:[item],family,finish,lab});
 }
 return clusters.map(({items,family,finish})=>{
  const ordered=rank?items.map((x,i)=>[x,i]).sort((a,b)=>rank(a[0])-rank(b[0])||a[1]-b[1]).map(([x])=>x):items;
  return {item:ordered[0],items:ordered,family,finish};
 });
}

/** Paint Commons' older name: clusters of paints, {paint, paints, family, finish}. */
export function combineLikeColours(paints,enabled=true){
 return foldLikeColours(paints,{enabled}).map(c=>({paint:c.item,paints:c.items,family:c.family,finish:c.finish}));
}

/** Groups paints for the catalogue's wall: by type (rack order), brand, brand and range, or all together. */
export function sectionsOf(paints,group='type'){
 const groups=new Map();for(const p of paints){const key=group==='type'?categoryOf(p):group==='brand'?p.brand:group==='range'?`${p.brand} · ${p.range||'Other'}`:'all';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 const typeOrder=new Map(CATEGORIES.map(([key],i)=>[key,i]));
 return [...groups].sort(([a],[b])=>group==='type'?typeOrder.get(a)-typeOrder.get(b):a.localeCompare(b)).map(([key,paints])=>({key,label:group==='type'?categoryLabel(key,'uk').replace(/ & /g,' and '):group==='none'?'All paints':key,paints}));
}

/**
 * Lays a wall section out like a rack while keeping the colour progression: runs of one colour
 * family go left to right in rack order, each as columns dark to light, and every band has the same
 * height (`fold` rows), chosen to waste the least space; a broad run splits into colour-coherent
 * parallel columns (splitRun). Items must be in wall order. Paints with no colour trail at the end
 * as their own block after a gap (`coloured: true` drops them). `fits(bands, fold)` can veto a
 * height. Returns {bands, fold}, bands being lists of columns, or null when nothing fits.
 */
export function packColumns(items,cols,{paintOf=self,coloured=false,fits}={}){
 const p=x=>paintOf(x),familyOf=x=>colourMeta(p(x)).family;
 const runs=[];
 for(const x of items){if(!hexOf(p(x)))continue;const f=familyOf(x),last=runs[runs.length-1];if(!last||last.family!==f)runs.push({family:f,items:[x]});else last.items.push(x);}
 const unknown=coloured?[]:items.filter(x=>!hexOf(p(x)));
 const chunk=(list,h)=>splitRun(list,h,{hexOf:x=>hexOf(p(x)),familyOf,compare:(a,b)=>colourCompare(p(a),p(b))});
 const build=h=>{
  const columns=runs.flatMap(r=>chunk(r.items,h));
  if(unknown.length){
   const pad=columns.length%cols?cols-(columns.length%cols):0,need=Math.ceil(unknown.length/h);
   if(pad&&pad-1<need)for(let i=0;i<pad;i++)columns.push([]); // won't fit: start the next band
   else if(pad)columns.push([]); // fits after a one-column gap
   columns.push(...chunk(unknown,h));
  }
  const bands=[];for(let i=0;i<columns.length;i+=cols)bands.push(columns.slice(i,i+cols));
  return bands;
 };
 const longest=Math.max(1,...runs.map(r=>r.items.length));
 let best=null,bestCost=Infinity;
 for(let h=1;h<=Math.min(longest,10);h++){
  const bands=build(h);
  if(fits&&!fits(bands,h))continue;
  const folds=runs.reduce((n,r)=>n+Math.ceil(r.items.length/h)-1,0);
  // height in rows (a band gap counts as half a row), plus a small cost for each folded run
  const cost=bands.length*h+(bands.length-1)*.5+folds*.35;
  if(cost<=bestCost){best={bands,fold:h};bestCost=cost;}
 }
 return best;
}
