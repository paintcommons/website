// sRGB hex -> OKLCH (Björn Ottosson's OKLab), so distances and lightness follow how the eye sees colour.
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function hexToOklch(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = lin(((n >> 16) & 255) / 255), g = lin(((n >> 8) & 255) / 255), b = lin((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s;
  const C = Math.hypot(A, B);
  const H = (Math.atan2(B, A) * 180 / Math.PI + 360) % 360;
  return { L, C, H };
}

export function hexToOklab(hex) {
  const c = hexToOklch(hex);
  if (!c) return null;
  const h = c.H * Math.PI / 180;
  return { L: c.L, a: c.C * Math.cos(h), b: c.C * Math.sin(h) };
}
