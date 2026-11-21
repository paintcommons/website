// The catalogue's swatches use the shared rules in color/swatch.mjs (also used by Stipplewise).
export {METAL_LIGHT_END,mix,hexOf,gradientStops,sourceGradient,isWashOrGlaze,swatchKind,swatchStops,swatchBackground,paintSwatch} from './color/swatch.mjs';
const valid=hex=>/^#[\dA-F]{6}$/i.test(hex??'');
const rgb=hex=>{const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255];};

// Choose count text by relative luminance; a matching translucent backing keeps
// it readable when the swatch includes bands or a metallic highlight.
export function countLabelAppearance(p){
 const hex=p.colour?.hex;if(!valid(hex))return {tone:'dark',color:'#FFFFFF',background:'#242820E6'};
 const [r,g,b]=rgb(hex).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
 const luminance=.2126*r+.7152*g+.0722*b;
 return 1.05/(luminance+.05)>=(luminance+.05)/.05
  ?{tone:'dark',color:'#FFFFFF',background:'#242820E6'}
  :{tone:'light',color:'#242820',background:'#FFFFFFE6'};
}
