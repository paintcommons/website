// Plain-language paint groups, derived from the catalog's range and type. Shared by the app and
// the server-side tools so a paint lands in the same group everywhere.

/** @typedef {"acrylic"|"speedpaint"|"airbrush"|"metallic"|"wash"|"effect"} Category */

/** @type {[Category, string][]} */
export const CATEGORIES = [
  ["acrylic", "Acrylic"],
  ["speedpaint", "Speedpaint"],
  ["airbrush", "Airbrush"],
  ["metallic", "Metallic"],
  ["wash", "Wash & ink"],
  ["effect", "Fluorescent & effect"],
];

/** @param {{ type?: string|null, range?: string|null, name?: string }} p @returns {Category} */
export function categoryOf(p) {
  const r = (p.range ?? "").toLowerCase();
  if (/fluo/.test(r) || /fluorescent/i.test(p.name ?? "")) return "effect";
  if (/true metal/.test(r)) return "metallic"; // Vallejo True Metallic Metal: brush and airbrush, but racked with metals
  if (/\bair\b|model air/.test(r)) return "airbrush";
  if (p.type === "speedpaint" || /speedpaint|contrast|xpress/.test(r)) return "speedpaint";
  if (p.type === "metallic" || /metallic/.test(r)) return "metallic";
  if (p.type === "wash" || p.type === "ink" || /wash|\bink\b/.test(r)) return "wash";
  if (p.type !== "acrylic" || /effect|varnish|technical/.test(r)) return "effect";
  return "acrylic";
}
