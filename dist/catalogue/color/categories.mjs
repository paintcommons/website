// Shared Paint Commons presentation rules. MIT; see ./LICENSE.
// These derived groups do not change a paint's factual type or manufacturer range.
export const GROUPING_VERSION = '1.0.0';
export const CATEGORIES = [
  ['acrylic', 'Acrylic'],
  ['speedpaint', 'Speedpaint'],
  ['airbrush', 'Airbrush colors'],
  ['airbrush-metallic', 'Airbrush metallics'],
  ['metallic', 'Metallics'],
  ['wash', 'Wash & ink'],
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
export function categoryOf(p) {
  const range = (p.range ?? '').toLowerCase();
  if (/fluo/.test(range) || /fluorescent/i.test(p.name ?? '')) return 'effect';
  // Finish must be checked within the application group before the generic airbrush rule.
  if (isAirbrushPaint(p)) return isMetallicPaint(p) ? 'airbrush-metallic' : 'airbrush';
  if (isSpeedpaintPaint(p)) return 'speedpaint';
  if (isMetallicPaint(p)) return 'metallic';
  if (p.type === 'wash' || p.type === 'ink' || /wash|\bink\b/.test(range)) return 'wash';
  if (p.type !== 'acrylic' || /effect|varnish|technical/.test(range)) return 'effect';
  return 'acrylic';
}
export function categoryLabel(category, spelling = 'us') {
  const label = CATEGORIES.find(([key]) => key === category)?.[1] ?? category;
  return spelling === 'uk' ? label.replace(/\bcolors\b/g, 'colours') : label;
}
