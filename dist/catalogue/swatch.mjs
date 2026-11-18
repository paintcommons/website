// Stipplewise's finish treatments, adapted to the public catalog shape. Keep in step with
// Stipplewise's src/lib/swatch.ts and docs/PAINT-COMMONS.md (Gradients):
// - metallics shine dark to light and always end very light: stored stops (colour.gradient, sampled
//   from the source) give the darkest and lightest points, and a near-white end is added when the
//   source's lightest point isn't light enough; without stops the shine is generated from hex
// - speedpaints show three bands: pooled | true colour | thinned. colour.gradient holds up to three
//   stops in that order (null where the source doesn't show one); missing stops are generated
// - washes and glazes use the same three stops, blended smoothly with no shine
// Generated shading is presentation only; source colour values stay unchanged.
import {isMetallicPaint,isSpeedpaintPaint} from './color/categories.mjs';
import {hexToOklab} from './color/oklch.mjs';
const valid=hex=>/^#[\dA-F]{6}$/i.test(hex??'');
const rgb=hex=>{const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];};
const lightness=hex=>hexToOklab(hex)?.L??0;
export const METAL_LIGHT_END=.9;
const NEAR_WHITE='#F4F4F2';
export function mix(a,b,t){const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(Math.max(0,Math.min(255,v+(y[i]-v)*t))).toString(16).padStart(2,'0')).join('').toUpperCase();}
/** Stored stops by position; null where the source shows none (or the value isn't a colour). */
export function gradientStops(p){const g=p.colour?.gradient;return Array.isArray(g)?g.map(h=>valid(h)?h.toUpperCase():null):[];}
/** The published stops as a plain strip (evidence in the record view), skipping empty positions. */
export function sourceGradient(p){const stops=gradientStops(p).filter(Boolean);return stops.length>1?`linear-gradient(120deg, ${stops.join(', ')})`:null;}
/** Washes and glazes: drawn as a smooth pooled → thinned blend. */
export const isWashOrGlaze=p=>p.type==='wash'||/\bwash(es)?\b|\bglaze/i.test(`${p.range??''} ${p.name??''}`);
function shades(base,stored,dark,light){const [pooled,trueColour,thinned]=stored;const middle=trueColour??base;return [pooled??mix(middle,'#000000',dark),middle,thinned??mix(middle,'#FFFFFF',light)];}
export function swatchKind(p){if(!valid(p.colour?.hex))return 'none';if(isMetallicPaint(p))return 'metal';if(isSpeedpaintPaint(p))return 'speed';if(isWashOrGlaze(p))return 'smooth';return 'flat';}
/** The stops a swatch is drawn with: metal [dark, base, mid, very light], speed and smooth [pooled, true, thinned]. */
export function swatchStops(p){
 const kind=swatchKind(p),base=p.colour?.hex?.toUpperCase(),stored=gradientStops(p);
 if(kind==='metal'){const sampled=stored.filter(Boolean);if(!sampled.length)return [mix(base,'#000000',.15),base,mix(base,'#FFFFFF',.55),'#FFFFFF'];
  const byLight=[...sampled,base].sort((a,b)=>lightness(a)-lightness(b)),dark=byLight[0],light=byLight[byLight.length-1],bright=lightness(light)>=METAL_LIGHT_END;
  return [dark,base,bright?mix(base,light,.5):light,bright?light:NEAR_WHITE];}
 if(kind==='speed')return shades(base,stored,.4,.45);
 if(kind==='smooth')return shades(base,stored,.35,.5);
 return kind==='flat'?[base]:[];
}
export function swatchBackground(p){const kind=swatchKind(p),s=swatchStops(p);if(kind==='none')return null;
 if(kind==='metal')return `linear-gradient(45deg, ${s[0]} 0%, ${s[1]} 35%, ${s[2]} 72%, ${s[3]} 100%)`;
 if(kind==='speed')return `linear-gradient(90deg, ${s[0]} 0 33.4%, ${s[1]} 33.4% 66.7%, ${s[2]} 66.7% 100%)`;
 if(kind==='smooth')return `linear-gradient(90deg, ${s[0]} 0%, ${s[1]} 50%, ${s[2]} 100%)`;
 return s[0];}

// Choose count text by relative luminance; a matching translucent backing keeps
// it readable when the swatch includes bands or a metallic highlight.
export function countLabelAppearance(p){
 const hex=p.colour?.hex;if(!valid(hex))return {tone:'dark',color:'#FFFFFF',background:'#242820E6'};
 const [r,g,b]=rgb(hex).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
 const luminance=.2126*r+.7152*g+.0722*b;
 return 1.05/(luminance+.05)>=(luminance+.05)/.05
  ?{tone:'dark',color:'#FFFFFF',background:'#242820E6'}
  :{tone:'light',color:'#20251B',background:'#FFFFFFE6'};
}
