// How a paint's swatch is drawn, shared by Paint Commons and Stipplewise (screen and canvas).
// Accepts either paint shape: a Paint Commons record ({colour: {hex, gradient}}) or a Stipplewise
// catalog row ({hex, hex_gradient: "#AAA,,#CCC"}).
// - metallics shine dark to light and always end very light: stored stops (sampled from the source)
//   give the darkest and lightest points, and a near-white end is added when the source's lightest
//   point isn't light enough; without stops the shine is generated from hex
// - speedpaints show three bands: pooled | true colour | thinned. Stored stops hold up to three in
//   that order (empty where the source doesn't show one); missing stops are generated
// - washes and glazes use the same three stops, blended smoothly with no shine
// - everything else is flat
// Generated shading is presentation only; source colour values stay unchanged.
import {isMetallicPaint,isSpeedpaintPaint} from './categories.mjs';
import {hexToOklab} from './oklch.mjs';

const valid=hex=>typeof hex==='string'&&/^#[\dA-F]{6}$/i.test(hex);
const rgb=hex=>{const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];};
const lightness=hex=>hexToOklab(hex)?.L??0;
/** A metallic's light end must be at least this light (OKLab L); otherwise a near-white end is added. */
export const METAL_LIGHT_END=.9;
const NEAR_WHITE='#F4F4F2';

/** Mix a colour toward another by t (0 = a, 1 = b). */
export function mix(a,b,t){const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(Math.max(0,Math.min(255,v+(y[i]-v)*t))).toString(16).padStart(2,'0')).join('').toUpperCase();}

/** The paint's main colour, uppercase, or null. */
export function hexOf(p){const h=p?.colour?p.colour.hex:p?.hex;return valid(h)?h.toUpperCase():null;}

/** Stored stops by position; null where the source shows none (or the value isn't a colour). */
export function gradientStops(p){
 const g=Array.isArray(p?.colour?.gradient)?p.colour.gradient:typeof p?.hex_gradient==='string'&&p.hex_gradient?p.hex_gradient.split(','):[];
 return g.map(h=>{const v=typeof h==='string'?h.trim():h;return valid(v)?v.toUpperCase():null;});
}

/** The published stops as a plain strip (evidence), skipping empty positions; null for fewer than two. */
export function sourceGradient(p){const stops=gradientStops(p).filter(Boolean);return stops.length>1?`linear-gradient(120deg, ${stops.join(', ')})`:null;}

/** Washes and glazes: drawn as a smooth pooled → thinned blend. */
export const isWashOrGlaze=p=>p?.type==='wash'||/\bwash(es)?\b|\bglaze/i.test(`${p?.range??''} ${p?.name??''}`);

/** none | flat | metal | speed | smooth */
export function swatchKind(p){if(!hexOf(p))return 'none';if(isMetallicPaint(p))return 'metal';if(isSpeedpaintPaint(p))return 'speed';if(isWashOrGlaze(p))return 'smooth';return 'flat';}

function shades(base,stored,dark,light){const [pooled,trueColour,thinned]=stored;const middle=trueColour??base;return [pooled??mix(middle,'#000000',dark),middle,thinned??mix(middle,'#FFFFFF',light)];}

/** The colours a swatch is drawn with: flat [base]; metal [dark, base, mid, very light]; speed and smooth [pooled, true, thinned]. */
export function swatchStops(p){
 const kind=swatchKind(p),base=hexOf(p),stored=gradientStops(p);
 if(kind==='metal'){
  const sampled=stored.filter(Boolean);
  if(!sampled.length)return [mix(base,'#000000',.15),base,mix(base,'#FFFFFF',.55),'#FFFFFF'];
  // Sampled sweeps can run dark → highlight → dark; draw them as darkest → base → lightest.
  const byLight=[...sampled,base].sort((a,b)=>lightness(a)-lightness(b)),dark=byLight[0],light=byLight[byLight.length-1],bright=lightness(light)>=METAL_LIGHT_END;
  return [dark,base,bright?mix(base,light,.5):light,bright?light:NEAR_WHITE];
 }
 if(kind==='speed')return shades(base,stored,.4,.45);
 if(kind==='smooth')return shades(base,stored,.35,.5);
 return kind==='flat'?[base]:[];
}

/** CSS background for the swatch, or null when the paint has no colour. */
export function swatchBackground(p){
 const kind=swatchKind(p),s=swatchStops(p);
 if(kind==='metal')return `linear-gradient(45deg, ${s[0]} 0%, ${s[1]} 35%, ${s[2]} 72%, ${s[3]} 100%)`;
 if(kind==='speed')return `linear-gradient(90deg, ${s[0]} 0 33.4%, ${s[1]} 33.4% 66.7%, ${s[2]} 66.7% 100%)`;
 if(kind==='smooth')return `linear-gradient(90deg, ${s[0]} 0%, ${s[1]} 50%, ${s[2]} 100%)`;
 return kind==='flat'?s[0]:null;
}

/** Fills a rectangle on a 2D canvas with the same look as swatchBackground (hatched when there's no colour). */
export function paintSwatch(ctx,p,x,y,w,h){
 const kind=swatchKind(p),s=swatchStops(p);
 if(kind==='none'){
  ctx.fillStyle='#3a3640';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#55505d';ctx.lineWidth=1;
  for(let i=-h;i<w;i+=6){ctx.beginPath();ctx.moveTo(x+i,y+h);ctx.lineTo(x+i+h,y);ctx.stroke();}
 }else if(kind==='flat'){ctx.fillStyle=s[0];ctx.fillRect(x,y,w,h);}
 else if(kind==='metal'){const g=ctx.createLinearGradient(x,y+h,x+w,y);g.addColorStop(0,s[0]);g.addColorStop(.35,s[1]);g.addColorStop(.72,s[2]);g.addColorStop(1,s[3]);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);}
 else if(kind==='smooth'){const g=ctx.createLinearGradient(x,y,x+w,y);g.addColorStop(0,s[0]);g.addColorStop(.5,s[1]);g.addColorStop(1,s[2]);ctx.fillStyle=g;ctx.fillRect(x,y,w,h);}
 else{const third=w/3;ctx.fillStyle=s[0];ctx.fillRect(x,y,third+.5,h);ctx.fillStyle=s[1];ctx.fillRect(x+third,y,third+.5,h);ctx.fillStyle=s[2];ctx.fillRect(x+2*third,y,w-2*third,h);}
}
