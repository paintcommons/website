// Shared parallel-column packing for Paint Commons and Stipplewise. MIT.
import {rampOffset} from './ramps.mjs';
export function splitRun(run,h,{hexOf,familyOf,compare}){
 const count=Math.ceil(run.length/h);
 if(count<=1)return [run];
 const family=familyOf(run[0]);
 if(['neutral','warmgrey','bone'].includes(family)){
  const columns=[];
  for(let k=0,i=0;k<count;k++){const size=Math.ceil((run.length-i)/(count-k));columns.push(run.slice(i,i+size));i+=size;}
  return columns;
 }
 const points=run.map(item=>{return {item,...rampOffset(hexOf(item),familyOf(item))};});
 function partition(points,n){
  if(n===1)return [points.map(p=>p.item).sort((a,b)=>compare(a,b))];
  const mean=points.reduce((m,p)=>({a:m.a+p.a/points.length,b:m.b+p.b/points.length}),{a:0,b:0});
  let aa=0,ab=0,bb=0;
  for(const p of points){const a=p.a-mean.a,b=p.b-mean.b;aa+=a*a;ab+=a*b;bb+=b*b;}
  const angle=.5*Math.atan2(2*ab,aa-bb),x=Math.cos(angle),y=Math.sin(angle);
  points.sort((p,q)=>(p.a-q.a)*x+(p.b-q.b)*y||compare(p.item,q.item));
  const left=Math.floor(n/2),cut=Math.round(points.length*left/n);
  return [...partition(points.slice(0,cut),left),...partition(points.slice(cut),n-left)];
 }
 return partition(points,count);
}
