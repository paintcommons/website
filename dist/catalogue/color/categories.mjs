// Shared Paint Commons presentation rules. MIT; see ./LICENSE.
// These derived groups do not change a paint's factual type or manufacturer range.
export const GROUPING_VERSION = '1.0.1';
export const CATEGORIES = [
  ['acrylic', 'Acrylic'],
  ['speedpaint', 'Speedpaint'],
  ['airbrush', 'Airbrush colors'],
  ['airbrush-metallic', 'Airbrush metallics'],
  ['metallic', 'Metallics'],
  ['wash', 'Wash, ink & glaze'],
  ['effect', 'Fluorescent & effect'],
];

export function isAirbrushPaint(p) {
  return /\bair\b|\bairbrush\b/.test((p.range ?? '').toLowerCase());
}
export function isMetallicPaint(p) {
  return p.type === 'metallic' || /metallic|true metal/.test((p.range ?? '').toLowerCase());
}
export function isSpeedpaintPaint(p) {
  return p.type === 'speedpaint' || /speedpaint|contrast|xpress/.test((p.range ?? '').toLowerCase());
}
// Medium is an auxiliary product, even when an imported range calls everything acrylic.
const isWashOrGlazeMedium = p => p.type === 'medium' || /\b(?:wash|glaze|glazing)\s+medium\b/i.test(p.name ?? '');
export function isWashOrGlaze(p) {
  if (isWashOrGlazeMedium(p)) return false;
  return p.type === 'wash' || /\bwash(?:es)?\b|\bglaze(?:s)?\b|\bglazing\b/i.test(`${p.range ?? ''} ${p.name ?? ''}`);
}
export function categoryOf(p) {
  const range = (p.range ?? '').toLowerCase();
  if (/fluo/.test(range) || /fluorescent/i.test(p.name ?? '')) return 'effect';
  if (isWashOrGlazeMedium(p)) return 'effect';
  // Finish must be checked within the application group before the generic airbrush rule.
  if (isAirbrushPaint(p)) return isMetallicPaint(p) ? 'airbrush-metallic' : 'airbrush';
  if (isSpeedpaintPaint(p)) return 'speedpaint';
  if (isMetallicPaint(p)) return 'metallic';
  if (isWashOrGlaze(p) || p.type === 'ink' || /\bink\b/.test(range)) return 'wash';
  if (p.type !== 'acrylic' || /effect|varnish|technical/.test(range)) return 'effect';
  return 'acrylic';
}
export function categoryLabel(category, spelling = 'us') {
  const label = CATEGORIES.find(([key]) => key === category)?.[1] ?? category;
  return spelling === 'uk' ? label.replace(/\bcolors\b/g, 'colours') : label;
}
