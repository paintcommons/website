// Shared by the correction form (browser) and functions/api/corrections.js (server).
// The server repeats every check; the browser runs them only to show errors early.

export const PAINT_TYPES = ['acrylic', 'wash', 'metallic', 'effect', 'speedpaint', 'medium', 'ink', 'varnish', 'primer', 'other'];
export const STATUSES = ['current', 'discontinued'];

// key: catalog field, label: form text, kind: how the suggested value is entered.
export const FIELDS = [
  { key: 'name', label: 'Name', kind: 'text', max: 120 },
  { key: 'code', label: 'Product code', kind: 'text', max: 40 },
  { key: 'range', label: 'Range', kind: 'text', max: 120 },
  { key: 'type', label: 'Paint type', kind: 'choice', choices: PAINT_TYPES },
  { key: 'status', label: 'Availability', kind: 'choice', choices: STATUSES },
  { key: 'barcode', label: 'Barcode', kind: 'barcode' },
  { key: 'colour', label: 'Colour', kind: 'colour' },
  { key: 'finish', label: 'Finish', kind: 'text', max: 120 },
  { key: 'manufacturer_colour_family', label: 'Manufacturer colour family', kind: 'text', max: 200 },
  { key: 'other', label: 'Something else', kind: 'none' },
];
export const fieldByKey = new Map(FIELDS.map(f => [f.key, f]));

export const LIMITS = { note: 2000, url: 500 };
export const FILE_PATTERN = /^paints\/[a-z0-9-]+\/[a-z0-9-]+\.json$/;
export const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function currentValue(paint, key) {
  if (key === 'barcode') return paint.barcodes?.length ? paint.barcodes.map(b => b.ean).join(', ') : null;
  if (key === 'colour') return paint.colour?.hex ?? null;
  if (key === 'other') return null;
  return paint[key] ?? null;
}

export function validBarcode(ean) {
  if (!/^(\d{8}|\d{12,14})$/.test(ean)) return false;
  const digits = [...ean].map(Number), check = digits.pop();
  const sum = digits.reverse().reduce((s, d, i) => s + d * (i % 2 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === check;
}

export function validUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
}

const clean = value => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

// Returns { value, errors } with value normalised (uppercase hex, digits only, and so on).
export function checkSuggestion({ field, value, note, source_url }) {
  const errors = [], f = fieldByKey.get(field);
  if (!f) return { errors: ['Choose what needs correcting.'] };
  let v = clean(value);
  const n = clean(note), url = clean(source_url);
  if (f.kind === 'none') v = '';
  else if (!v) errors.push('Enter the correct value.');
  else if (f.kind === 'text' && v.length > f.max) errors.push(`Keep the value under ${f.max} characters.`);
  else if (f.kind === 'choice' && !f.choices.includes(v)) errors.push('Choose one of the listed values.');
  else if (f.kind === 'barcode') { v = v.replace(/[\s-]/g, ''); if (!validBarcode(v)) errors.push('That barcode’s digits don’t add up. Check it against the label.'); }
  else if (f.kind === 'colour') { v = v.toUpperCase(); if (!v.startsWith('#')) v = '#' + v; if (!/^#[0-9A-F]{6}$/.test(v)) errors.push('Enter the colour as a hex value, like #3A5F8C.'); }
  if (n.length > LIMITS.note) errors.push(`Keep the explanation under ${LIMITS.note} characters.`);
  if (url && (url.length > LIMITS.url || !validUrl(url))) errors.push('The source link must be a web address starting with https://.');
  if (!n && !url) errors.push('Tell us why, or add a link to a source.');
  if (f.kind === 'none' && !n) errors.push('Describe what’s wrong.');
  return { value: v, note: n, source_url: url, errors };
}
