// Stipplewise's illustrative finish treatments, adapted to the public catalog shape.
// Generated shading is presentation only; source colour values stay unchanged.
import {categoryOf} from './color/categories.mjs';
const valid=hex=>/^#[\dA-F]{6}$/i.test(hex??'');
const rgb=hex=>{const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];};
export function mix(a,b,t){const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('').toUpperCase();}
export function sourceGradient(p){const stops=p.colour?.gradient?.filter(valid);return stops?.length>1?`linear-gradient(120deg, ${stops.join(', ')})`:null;}
export function swatchKind(p){if(!valid(p.colour?.hex))return 'none';const category=categoryOf(p);if(p.type==='metallic'||category==='metallic')return 'metal';if(p.type==='speedpaint'||category==='speedpaint')return 'speed';return sourceGradient(p)?'source-gradient':'flat';}
export function swatchBackground(p){const kind=swatchKind(p),base=p.colour?.hex?.toUpperCase();if(kind==='none')return null;if(kind==='metal')return `linear-gradient(45deg, ${mix(base,'#000000',.15)} 0%, ${base} 35%, ${mix(base,'#FFFFFF',.55)} 72%, #FFFFFF 100%)`;if(kind==='speed')return `linear-gradient(90deg, ${mix(base,'#000000',.4)} 0 33.4%, ${base} 33.4% 66.7%, ${mix(base,'#FFFFFF',.45)} 66.7% 100%)`;return sourceGradient(p)||base;}
