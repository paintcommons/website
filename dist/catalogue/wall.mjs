// The catalogue's wall uses the shared order, folding and packing in color/wall.mjs (also used by
// Stipplewise). Wall tiles are clusters ({paint, paints}) or paints.
import {packColumns as pack,colourMeta} from './color/wall.mjs';
export {RAMP_LABELS,RAMPS,colourMeta,colourCompare,finishKey,SAME_COLOUR_DISTANCE,foldLikeColours,combineLikeColours,sectionsOf} from './color/wall.mjs';
const paintOf=t=>t.paint||t;
/** Bands of columns ({family, paints}), dark to light. An empty column is the gap before paints with no colour. */
export function packColumns(tiles,cols){
 const r=pack(tiles,cols,{paintOf});
 return {fold:r?.fold??1,bands:(r?.bands??[]).map(band=>band.map(col=>({family:col.length?colourMeta(paintOf(col[0])).family:'gap',paints:col})))};
}
