// "Suggest a correction" form in the paint dialog. Posts to /api/corrections, which files a
// GitHub issue without the sender needing an account. Falls back to GitHub's editor when the
// form isn't configured (or the site is served without functions).
import { FIELDS, fieldByKey, currentValue, checkSuggestion } from './correction-rules.mjs';

const ENDPOINT = '/api/corrections';
let config;
function loadConfig() {
  config ??= fetch(ENDPOINT, { headers: { accept: 'application/json' } })
    .then(r => r.ok ? r.json() : { enabled: false })
    .catch(() => ({ enabled: false }));
  return config;
}

let turnstileReady;
function loadTurnstile() {
  turnstileReady ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => { turnstileReady = null; reject(new Error('Turnstile failed to load')); };
    document.head.append(s);
  });
  return turnstileReady;
}

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text !== undefined) n.textContent = text;
  return n;
}
const label = v => v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Not recorded';

// Returns the "Suggest a correction" control for the dialog's action row. `editUrl` is the
// GitHub editor link used as the fallback; `mount` is where the form opens.
export function correctionAction(paint, editUrl, mount) {
  const fallback = el('a', '', 'Suggest a correction ↗');
  fallback.href = editUrl;
  const button = el('button', 'share', 'Suggest a correction');
  button.type = 'button';
  button.hidden = true;
  loadConfig().then(c => {
    if (!c.enabled || !fallback.isConnected) return;
    fallback.replaceWith(button);
    button.hidden = false;
  });
  button.addEventListener('click', () => {
    if (mount.firstChild) { mount.firstChild.querySelector('select')?.focus(); return; }
    mount.append(correctionForm(paint, editUrl));
    mount.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    mount.querySelector('select').focus();
  });
  return fallback;
}

function correctionForm(paint, editUrl) {
  const form = el('form', 'correction');
  form.noValidate = true;
  form.append(el('h3', '', 'Suggest a correction'));
  const intro = el('p', 'correction-note', 'A maintainer reviews every suggestion before the catalogue changes. Suggestions are posted publicly as issues on GitHub. Don’t include personal details.');
  form.append(intro);

  const fieldId = `fix-field-${paint.id}`;
  form.append(el('label', '', 'What needs correcting'));
  form.lastChild.htmlFor = fieldId;
  const select = el('select');
  select.id = fieldId;
  for (const f of FIELDS) { const o = el('option', '', f.label); o.value = f.key; select.append(o); }
  form.append(select);

  const now = el('p', 'correction-current');
  form.append(now);

  const valueWrap = el('div', 'correction-value');
  form.append(valueWrap);

  const noteId = `fix-note-${paint.id}`;
  form.append(el('label', '', 'Tell us why'));
  form.lastChild.htmlFor = noteId;
  const note = el('textarea');
  note.id = noteId;
  note.rows = 3;
  note.maxLength = 2000;
  note.placeholder = 'For example, the code printed on the bottle, or what the manufacturer’s page says';
  form.append(note);

  const urlId = `fix-url-${paint.id}`;
  form.append(el('label', '', 'Source link (optional)'));
  form.lastChild.htmlFor = urlId;
  const url = el('input');
  url.id = urlId;
  url.type = 'url';
  url.inputMode = 'url';
  url.placeholder = 'https://';
  form.append(url);

  const widget = el('div', 'correction-turnstile');
  form.append(widget);
  const message = el('p', 'correction-message');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  form.append(message);

  const row = el('div', 'correction-buttons');
  const send = el('button', 'correction-send', 'Send suggestion');
  send.type = 'submit';
  const cancel = el('button', 'share', 'Cancel');
  cancel.type = 'button';
  cancel.addEventListener('click', () => form.remove());
  const github = el('a', '', 'Edit on GitHub instead ↗');
  github.href = editUrl;
  row.append(send, cancel, github);
  form.append(row);

  let valueInput;
  function showField() {
    const f = fieldByKey.get(select.value);
    const current = currentValue(paint, f.key);
    now.textContent = f.kind === 'none' ? 'Describe the problem below.' :
      `In the catalogue now: ${current === null ? 'Not recorded' : f.kind === 'choice' ? label(current) : current}`;
    valueWrap.replaceChildren();
    valueInput = null;
    if (f.kind === 'none') return;
    const id = `fix-value-${paint.id}`;
    const l = el('label', '', f.kind === 'barcode' ? 'Barcode to add or correct' : 'Correct value');
    l.htmlFor = id;
    valueWrap.append(l);
    if (f.kind === 'choice') {
      valueInput = el('select');
      for (const c of f.choices) { const o = el('option', '', label(c)); o.value = c; valueInput.append(o); }
      if (f.choices.includes(current)) valueInput.value = f.choices.find(c => c !== current);
      valueWrap.append(valueInput);
    } else if (f.kind === 'colour') {
      const pair = el('div', 'correction-colour');
      valueInput = el('input');
      valueInput.placeholder = '#3A5F8C';
      valueInput.maxLength = 7;
      valueInput.autocapitalize = 'characters';
      const picker = el('input');
      picker.type = 'color';
      picker.setAttribute('aria-label', 'Pick the colour');
      picker.value = (current || '#808080').toLowerCase();
      picker.addEventListener('input', () => { valueInput.value = picker.value.toUpperCase(); });
      valueInput.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(valueInput.value)) picker.value = valueInput.value.toLowerCase(); });
      pair.append(valueInput, picker);
      valueWrap.append(pair);
    } else {
      valueInput = el('input');
      if (f.kind === 'barcode') { valueInput.inputMode = 'numeric'; valueInput.placeholder = '13 digits under the barcode'; }
      else { valueInput.maxLength = f.max; if (current !== null) valueInput.value = current; }
      valueWrap.append(valueInput);
    }
    valueInput.id = id;
    valueInput.autocomplete = 'off';
  }
  select.addEventListener('change', showField);
  showField();

  let widgetId = null, token = '';
  loadConfig().then(c => loadTurnstile().then(t => {
    if (!form.isConnected) return;
    widgetId = t.render(widget, {
      sitekey: c.siteKey,
      appearance: 'interaction-only',
      callback: v => { token = v; },
      'expired-callback': () => { token = ''; },
      'error-callback': () => { token = ''; },
    });
  })).catch(() => { message.textContent = 'The anti-spam check couldn’t load. Use “Edit on GitHub instead”, or try again later.'; });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = { field: select.value, value: valueInput?.value ?? '', note: note.value, source_url: url.value };
    const { errors } = checkSuggestion(input);
    if (errors.length) { message.textContent = errors.join(' '); message.className = 'correction-message error'; return; }
    if (!token) { message.textContent = 'Waiting for the anti-spam check. Try again in a moment.'; message.className = 'correction-message'; return; }
    send.disabled = true;
    message.className = 'correction-message';
    message.textContent = 'Sending…';
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ ...input, paint_id: paint.id, file: paint.file, turnstile: token }),
      });
      const out = await res.json().catch(() => ({ ok: false, error: 'The server didn’t answer. Try again.' }));
      if (!out.ok) throw new Error(out.error);
      const done = el('div', 'correction-done');
      done.append(el('h3', '', 'Thanks'));
      const p = el('p', '', out.dryRun ? 'Test mode: no issue was created. ' : 'Your suggestion is ');
      if (out.url) { const a = el('a', '', `issue ${out.number} ↗`); a.href = out.url; p.append(a, document.createTextNode(' on GitHub. Follow it there to see the review.')); }
      done.append(p);
      form.replaceWith(done);
    } catch (err) {
      message.className = 'correction-message error';
      message.textContent = err.message || 'Sending failed. Try again, or use “Edit on GitHub instead”.';
      send.disabled = false;
      token = '';
      if (widgetId !== null) window.turnstile?.reset(widgetId);
    }
  });
  return form;
}
