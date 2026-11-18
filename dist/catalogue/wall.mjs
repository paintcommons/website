import {splitRun} from './color/packing.mjs';
import {hexToOklab} from './color/oklch.mjs';
import {swatchKind} from './swatch.mjs';
// Catalogue adapter for Stipplewise's brand-neutral colour ramps and rack layout.
// Every paint stays separate: visual similarity is not a declared equivalence.
import {RAMP_LABELS,rampOf,rampSortKey,RAMPS} from './color/ramps.mjs';
import {CATEGORIES,categoryOf,categoryLabel} from './color/categories.mjs';
export {RAMP_LABELS,RAMPS};
const rampIndex=new Map(RAMP_LABELS.map(([key],i)=>[key,i])),cache=new Map();
export function colourMeta(p){const key=`${p.colour?.hex||''}\0${p.name}`;if(!cache.has(key))cache.set(key,{family:p.colour?rampOf(p.colour.hex,p.name):'unknown',lightness:rampSortKey(p.colour?.hex)});return cache.get(key);}
export function colourCompare(a,b){const aa=colourMeta(a),bb=colourMeta(b);return (rampIndex.get(aa.family)-rampIndex.get(bb.family))||aa.lightness-bb.lightness||a.name.localeCompare(b.name)||a.brand.localeCompare(b.brand)||String(a.range).localeCompare(String(b.range))||a.id.localeCompare(b.id);}
export function sectionsOf(paints,group='type'){
 const groups=new Map();for(const p of paints){const key=group==='type'?categoryOf(p):group==='brand'?p.brand:group==='range'?`${p.brand} · ${p.range||'Other'}`:'all';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 const typeOrder=new Map(CATEGORIES.map(([key],i)=>[key,i]));
 return [...groups].sort(([a],[b])=>group==='type'?typeOrder.get(a)-typeOrder.get(b):a.localeCompare(b)).map(([key,paints])=>({key,label:group==='type'?categoryLabel(key,'uk').replace(/ & /g,' and '):group==='none'?'All paints':key,paints}));
}
// A broad family can contain parallel warm/cool and muted/vivid runs. Partition
// those variations before sorting each column dark to light; slicing one global
// lightness list makes every column alternate between unrelated shades.
export function packColumns(paints,cols){
 const runs=[];for(const p of paints){const family=colourMeta(p.paint||p).family;const last=runs.at(-1);if(!last||last.family!==family)runs.push({family,paints:[p]});else last.paints.push(p);}
 let fold=1,cost=Infinity;const longest=Math.max(1,...runs.map(r=>r.paints.length));
 for(let h=1;h<=Math.min(longest,10);h++){
  const columns=runs.reduce((n,r)=>n+Math.ceil(r.paints.length/h),0),bands=Math.ceil(columns/cols),folds=columns-runs.length;
  const score=bands*h+(bands-1)*.5+folds*.35;
  if(score<=cost){cost=score;fold=h;}
 }
 const columns=runs.flatMap(r=>splitRun(r.paints,fold,{hexOf:t=>(t.paint||t).colour?.hex,familyOf:t=>colourMeta(t.paint||t).family,compare:(a,b)=>colourCompare(a.paint||a,b.paint||b)}).map(paints=>({family:r.family,paints}))),bands=[];
 for(let i=0;i<columns.length;i+=cols)bands.push(columns.slice(i,i+cols));
 return {bands,fold};
}

// Stipplewise's same-colour rule: OKLab distance < .025, same family, across
// brands. Compare to each cluster's lead (not transitively to its last member).
// A catalogue also keeps distinct finishes and colour-shift ranges apart.
export const SAME_COLOUR_DISTANCE=.025;
export function combineLikeColours(paints,enabled=true){
 const clusters=[];
 for(const paint of paints){const lab=hexToOklab(paint.colour?.hex),family=colourMeta(paint).family;
  const finish=categoryOf(paint)+':'+swatchKind(paint)+(/turboshift|zenishift/i.test(paint.range||'')?':shift':'');
  const cluster=enabled&&lab&&clusters.slice(-6).find(c=>c.family===family&&c.finish===finish&&c.lab&&c.paints.every(p=>p.brand!==paint.brand)&&Math.hypot(c.lab.L-lab.L,c.lab.a-lab.a,c.lab.b-lab.b)<SAME_COLOUR_DISTANCE);
  if(cluster)cluster.paints.push(paint);else clusters.push({paint,paints:[paint],family,finish,lab});
 }
 return clusters;
}
