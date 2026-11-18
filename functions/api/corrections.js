// POST /api/corrections files an anonymous correction as an issue on paintcommons/catalog,
// authored by the Paint Commons Corrections GitHub App. GET tells the page whether the form is on.
//
// Secrets (wrangler pages secret put …): TURNSTILE_SECRET_KEY, GITHUB_APP_PRIVATE_KEY.
// Variables: TURNSTILE_SITE_KEY, GITHUB_APP_ID, GITHUB_INSTALLATION_ID.
// Local testing: CORRECTIONS_DRY_RUN=1 returns the issue instead of creating it.
//
// Nothing about the sender is stored or published: no IP address, email or name.

import { FILE_PATTERN, ID_PATTERN, checkSuggestion, currentValue, fieldByKey } from '../../dist/catalogue/correction-rules.mjs';

const REPO = 'paintcommons/catalog';
const LABELS = ['correction', 'needs-review'];
const MAX_BODY = 8192;
const UA = 'paintcommons-corrections';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const fail = (status, error) => json({ ok: false, error }, status);

const configured = env => Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY &&
  (env.CORRECTIONS_DRY_RUN === '1' || (env.GITHUB_APP_ID && env.GITHUB_INSTALLATION_ID && env.GITHUB_APP_PRIVATE_KEY)));

export function onRequestGet({ env }) {
  return configured(env) ? json({ enabled: true, siteKey: env.TURNSTILE_SITE_KEY }) : json({ enabled: false });
}

export async function onRequestPost({ request, env }) {
  if (!configured(env)) return fail(503, 'Corrections can’t be sent from this site yet.');
  const origin = request.headers.get('origin');
  if (origin !== new URL(request.url).origin) return fail(403, 'Send corrections from the Paint Commons catalogue.');
  const text = await request.text();
  if (text.length > MAX_BODY) return fail(413, 'That suggestion is too long.');
  let input;
  try { input = JSON.parse(text); } catch { return fail(400, 'That request couldn’t be read.'); }
  if (!input || typeof input !== 'object') return fail(400, 'That request couldn’t be read.');

  if (!await turnstileOk(env, input.turnstile, request.headers.get('cf-connecting-ip'))) {
    return fail(403, 'The anti-spam check didn’t pass. Try again.');
  }

  const { paint_id: id, file } = input;
  if (typeof id !== 'string' || !ID_PATTERN.test(id) || typeof file !== 'string' || !FILE_PATTERN.test(file)) {
    return fail(400, 'That paint couldn’t be found.');
  }
  const checked = checkSuggestion(input);
  if (checked.errors.length) return fail(422, checked.errors.join(' '));

  // Read the paint from the live catalogue, so the issue shows its real current value.
  const paint = await livePaint(file, id);
  if (!paint) return fail(404, 'That paint couldn’t be found in the catalogue. It may have moved; reload the page and try again.');

  const field = fieldByKey.get(input.field);
  const current = currentValue(paint, field.key);
  if (field.kind !== 'none' && field.kind !== 'barcode' && current !== null && String(current) === checked.value) {
    return fail(422, 'That’s already the value in the catalogue.');
  }
  if (field.kind === 'barcode' && paint.barcodes?.some(b => b.ean === checked.value)) {
    return fail(422, 'That barcode is already recorded for this paint.');
  }

  const issue = buildIssue(paint, file, field, current, checked);
  if (env.CORRECTIONS_DRY_RUN === '1') return json({ ok: true, dryRun: true, issue });

  try {
    const token = await installationToken(env);
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: 'POST',
      headers: githubHeaders(token),
      body: JSON.stringify({ ...issue, labels: LABELS }),
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const created = await res.json();
    return json({ ok: true, number: created.number, url: created.html_url });
  } catch (err) {
    console.error('Creating the correction issue failed', err);
    return fail(502, 'GitHub didn’t accept the suggestion. Try again in a few minutes.');
  }
}

async function turnstileOk(env, token, ip) {
  if (typeof token !== 'string' || !token || token.length > 2048) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET_KEY);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
    return (await res.json()).success === true;
  } catch { return false; }
}

async function livePaint(file, id) {
  const res = await fetch(`https://raw.githubusercontent.com/${REPO}/main/${file}`, { cf: { cacheTtl: 60 } });
  if (!res.ok) return null;
  try { return (await res.json()).find(p => p.id === id) ?? null; } catch { return null; }
}

// User text never reaches GitHub as live markup: no mentions, issue links, HTML or headings.
function safe(text) {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/@/g, '@\u200b')
    .replace(/#(?=\d)/g, '#\u200b')
    .replace(/([\\`*_[\]|~])/g, '\\$1')
    .replace(/^(\s*)([-+=]|\d+\.)(\s)/gm, '$1\\$2$3');
}
const code = value => value === null || value === '' ? '_Not recorded_' : '`' + String(value).replace(/`/g, 'ˋ') + '`';

function buildIssue(paint, file, field, current, { value, note, source_url }) {
  const where = `https://github.com/${REPO}/blob/main/${file}`;
  const lines = [
    `**Paint:** ${safe(paint.name)} · ${safe(paint.brand)} · ${safe(paint.range ?? 'No range')}${paint.code ? ' · ' + code(paint.code) : ''}`,
    `**Record:** [${file}](${where}) · id \`${paint.id}\``,
    `**What needs correcting:** ${field.label}`,
  ];
  if (field.kind !== 'none') {
    lines.push(`**In the catalogue now:** ${code(current)}`, `**Suggested:** ${code(value)}`);
  }
  lines.push('', '**Why**', '', note ? note.split('\n').map(l => '> ' + safe(l)).join('\n') : '_No explanation given._');
  if (source_url) lines.push('', `**Source:** <${new URL(source_url).href.replace(/[<>]/g, encodeURIComponent)}>`);
  lines.push('', '---',
    '_Sent anonymously from the [Paint Commons catalogue](https://paintcommons.org/catalogue/?paint=' + paint.id + '). ' +
    'A maintainer checks it before anything changes. To apply it, edit the record or open a pull request that closes this issue._');
  // Machine-readable copy for future automation. `<` and `--` are escaped so it can't close the comment.
  const data = JSON.stringify({ v: 1, paint_id: paint.id, file, field: field.key, current, suggested: value || null, source_url: source_url || null })
    .replace(/</g, '\\u003c').replace(/--/g, '-\\u002d');
  lines.push('', `<!-- paintcommons-correction ${data} -->`);
  const title = `${field.label}: ${paint.brand} ${paint.name}`.slice(0, 120);
  return { title, body: lines.join('\n') };
}

// GitHub App auth: an RS256 JWT from the App's private key, exchanged for an installation token.
let cached = null;
async function installationToken(env) {
  if (cached && cached.expires - Date.now() > 5 * 60 * 1000) return cached.token;
  const jwt = await appJwt(env.GITHUB_APP_ID, env.GITHUB_APP_PRIVATE_KEY);
  const res = await fetch(`https://api.github.com/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`, {
    method: 'POST',
    headers: githubHeaders(jwt),
    body: JSON.stringify({ repositories: ['catalog'], permissions: { issues: 'write' } }),
  });
  if (!res.ok) throw new Error(`Installation token ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const { token, expires_at } = await res.json();
  cached = { token, expires: Date.parse(expires_at) };
  return token;
}

function githubHeaders(token) {
  return {
    authorization: `Bearer ${token}`,
    accept: 'application/vnd.github+json',
    'x-github-api-version': '2022-11-28',
    'user-agent': UA,
    'content-type': 'application/json',
  };
}

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const b64urlText = text => b64url(new TextEncoder().encode(text));

async function appJwt(appId, pem) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned = b64urlText(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' +
    b64urlText(JSON.stringify({ iat: now - 60, exp: now + 540, iss: String(appId) }));
  const key = await crypto.subtle.importKey('pkcs8', pkcs8(pem), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  return unsigned + '.' + b64url(sig);
}

// GitHub hands out PKCS#1 keys ("BEGIN RSA PRIVATE KEY"); Web Crypto only imports PKCS#8, so wrap it.
export function pkcs8(pem) {
  const text = pem.replace(/\\n/g, '\n');
  const der = Uint8Array.from(atob(text.replace(/-----[^-]+-----|\s/g, '')), c => c.charCodeAt(0));
  if (text.includes('BEGIN PRIVATE KEY')) return der;
  const len = n => n < 128 ? [n] : n < 256 ? [0x81, n] : n < 65536 ? [0x82, n >> 8, n & 255] : [0x83, n >> 16, (n >> 8) & 255, n & 255];
  const octet = [0x04, ...len(der.length)];
  const algorithm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
  const inner = [0x02, 0x01, 0x00, ...algorithm, ...octet];
  const head = [0x30, ...len(inner.length + der.length)];
  const out = new Uint8Array(head.length + inner.length + der.length);
  out.set(head, 0); out.set(inner, head.length); out.set(der, head.length + inner.length);
  return out;
}
