// Adapted from Stipplewise shared/ramps.mjs. MIT; see ./LICENSE.
// Brand-neutral colour ramps for organising a rack: each ramp is a path through colour space
// from dark to light (a hue at one level of vividness, allowing for the hue drift real paint
// runs have). A paint joins the ramp whose path passes closest to it at the paint's own lightness.
//
// The 27 paths are calibrated from Army Painter's published Warpaints Fanatic colour chart
// (shared/ramp-anchors.json, generic names), so Fanatic's runs fit exactly and other brands
// land beside the Fanatic shades they resemble.
const anchors = [{"key":"neutral","label":"Neutral greys","anchors":["#D8D8DA","#C5C6C9","#8F9294","#727880","#535663","#000000"]},{"key":"warmgrey","label":"Warm greys","anchors":["#FFFFFF","#E4E2D8","#CBC8B8","#C4BDAF","#B1AC9C","#9B9A8F"]},{"key":"bone","label":"Bone","anchors":["#F2ECD7","#E9D9C1","#D4CAA9","#C6BA98","#AB9C7E","#91856E"]},{"key":"khaki","label":"Khaki & leather","anchors":["#DEBCAB","#B99889","#9E7B6C","#694433","#4C332C","#2C241F"]},{"key":"sand","label":"Sand & ochre","anchors":["#DEBC6C","#C19C50","#A98C4E","#897440","#6F683E","#52533B"]},{"key":"yellow","label":"Yellows","anchors":["#FFEFAE","#FFE481","#FFD434","#FECB00","#E49D0E","#D37933"]},{"key":"orange","label":"Oranges & flame","anchors":["#FDCA53","#F59829","#F28629","#F07500","#ED5717","#EA4326"]},{"key":"scarlet","label":"Scarlets","anchors":["#F28E7F","#EF735A","#EC563E","#EA3A30","#D2212C","#992426"]},{"key":"crimson","label":"Crimsons","anchors":["#E55D5A","#D63E43","#B90119","#BE2131","#9C2E3D","#712836"]},{"key":"rosyskin","label":"Rosy skins","anchors":["#FDE6DC","#FBD5C7","#F8BCA8","#F49A7D","#D88779","#C87B71"]},{"key":"warmskin","label":"Warm skins","anchors":["#E9B9B3","#E39D8B","#BE7772","#B5564D","#944E4E","#644245"]},{"key":"deepskin","label":"Earthy skins","anchors":["#F1D4B5","#EECA9F","#C7A482","#896B5A","#6C4F48","#4B4344"]},{"key":"brown","label":"Browns","anchors":["#B77867","#9B5B4D","#7D4742","#643B2E","#513930","#3C2C29"]},{"key":"wine","label":"Wine & berry","anchors":["#EEC8DA","#E6B3C8","#D18DA8","#AB5578","#81344E","#663746"]},{"key":"pink","label":"Pinks","anchors":["#FBDCEA","#F7BCD5","#E395BE","#D96AA5","#D94C95","#CD0079"]},{"key":"magenta","label":"Magentas","anchors":["#D8A2C8","#B867A4","#B04492","#843F90","#6F328A","#56286A"]},{"key":"violet","label":"Violets","anchors":["#DCCFE6","#B19CC8","#9482BA","#6C5AA1","#5F4796","#363246"]},{"key":"greyblue","label":"Grey-blues","anchors":["#A5C2DE","#7B97B3","#577CA4","#32628E","#355577","#394858"]},{"key":"blue","label":"Blues","anchors":["#B6C3E3","#8497CA","#697BB9","#264587","#2A3971","#1B2B52"]},{"key":"brightblue","label":"Bright blues","anchors":["#94CFF0","#0190CE","#006CB4","#0057A5","#004A84","#003560"]},{"key":"oceanblue","label":"Ocean blues","anchors":["#41AFD1","#009FC7","#0086AD","#006A93","#004F6B","#223242"]},{"key":"turquoise","label":"Turquoise","anchors":["#9ED5D3","#80CBD1","#5CC1C7","#28ADB4","#008F94","#006A78"]},{"key":"teal","label":"Teals","anchors":["#6BC1AF","#2EB39B","#00A485","#00765C","#005E4F","#1F3C42"]},{"key":"sage","label":"Sage & moss","anchors":["#B7DCBE","#A7C9AB","#78AC95","#64937D","#447B6B","#3D665E"]},{"key":"green","label":"Greens","anchors":["#75BC69","#3BAB41","#179239","#066D2C","#216143","#1F3E2B"]},{"key":"lime","label":"Limes","anchors":["#E7EA89","#D2DB39","#BDD000","#8BBD0D","#72B61C","#55AF30"]},{"key":"olive","label":"Olives","anchors":["#B8C89F","#A1AC82","#728552","#627247","#4E6038","#3F4C34"]}];
import { hexToOklab } from "./oklch.mjs";

export const RAMPS = anchors.map(({ key, label, anchors: hexes }) => ({
  key, label, path: hexes.map(hexToOklab).sort((p, q) => p.L - q.L),
}));
export const RAMP_LABELS = [...RAMPS.map((r) => [r.key, r.label]), ["unknown", "No colour yet"]];

// Where the ramp's path sits at lightness L (linear between its paints; clamped at the ends).
function pathAt(path, L) {
  if (L <= path[0].L) return { ...path[0], over: path[0].L - L };
  const last = path[path.length - 1];
  if (L >= last.L) return { ...last, over: L - last.L };
  const i = path.findIndex((p) => p.L >= L);
  const p = path[i - 1], q = path[i], t = (L - p.L) / (q.L - p.L);
  return { a: p.a + t * (q.a - p.a), b: p.b + t * (q.b - p.b), over: 0 };
}

const SKIN_RAMPS = new Set(["rosyskin", "warmskin", "deepskin"]);
const BROWN_RAMPS = new Set(["brown", "khaki"]);
const WOOD_LEATHER = /\b(wood|oak|bark|timber|leather|hide|saddle)\b/i;
const SKIN_NAME = /\b(flesh|fleshtone|skin)\b/i;
const NOT_HUMAN = /\b(orc|zombie|necrotic|dead|rotten|ghoul|goblin|green)/i;

// Painters keep skin tones together: a paint named for (human) skin goes to the nearest skin ramp,
// even when its colour alone would put it with the oranges or reds (Vallejo Flat Flesh, Rosy Flesh).
// Undead and monster skins (Orc Skin, Dead Flesh) and anything outside warm skin hues keep their colour ramp.
export function isSkinTone(hex, name) {
  if (!name || !SKIN_NAME.test(name) || NOT_HUMAN.test(name)) return false;
  const c = hexToOklab(hex);
  if (!c) return false;
  const H = (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
  return H >= 5 && H <= 85;
}

// Wood and leather paints stay with the browns, even when their colour leans toward a skin tone.
export function isWoodOrLeather(hex, name) {
  if (!name || !WOOD_LEATHER.test(name)) return false;
  const c = hexToOklab(hex);
  if (!c) return false;
  const H = (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
  return H >= 10 && H <= 100;
}

export function rampOf(hex, name) {
  const c = hexToOklab(hex);
  // No colour yet, but the name says human skin: file it with the skins rather than leave it unsorted.
  if (!c) return name && SKIN_NAME.test(name) && !NOT_HUMAN.test(name) ? "warmskin" : "unknown";
  const only = isSkinTone(hex, name) ? SKIN_RAMPS : isWoodOrLeather(hex, name) ? BROWN_RAMPS : null;
  let best = "unknown", bestD = Infinity;
  for (const r of RAMPS) {
    if (only && !only.has(r.key)) continue;
    const p = pathAt(r.path, c.L);
    // Hue counts more than amount of colour: a blue-tinted grey belongs with grey-blues, not plain greys.
    const C1 = Math.hypot(c.a, c.b), C2 = Math.hypot(p.a, p.b);
    const dH = Math.sqrt(Math.max(0, (c.a - p.a) ** 2 + (c.b - p.b) ** 2 - (C1 - C2) ** 2));
    // Greys have no meaningful hue (Fanatic's lean slightly blue; Vallejo Charcoal slightly warm),
    // so the neutral ramp measures only how far a paint is from colourless.
    let d = r.key === "neutral" ? C1 * 0.5 : Math.hypot((C1 - C2) * 0.5, dH) + p.over * 0.15; // other ramps: lighter or darker than the whole ramp costs a little
    // Neutral greys only keep paints that look colourless. Colour is judged relative to lightness:
    // a very dark paint with a little chroma (Night Blue, Imperial Blue) reads clearly blue.
    // Below chroma 0.02 a paint reads as black/grey (Vallejo Charcoal's faint warm tint), unless it's
    // a dark paint with a cool tint, which shows even when faint: Masterclass The Darkness (blue) and
    // Blighted Green (teal).
    const tint = C1 / Math.max(c.L, 0.25);
    const hue = (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
    const coolTint = tint > 0.055 && hue >= 180 && hue <= 320;
    if (r.key === "neutral" && (C1 > 0.02 || coolTint)) d += Math.max(0, tint - 0.03);
    if (d < bestD) { bestD = d; best = r.key; }
  }
  return best;
}

// Dark to light within a ramp.
export function rampSortKey(hex) {
  return hexToOklab(hex)?.L ?? 2;
}
