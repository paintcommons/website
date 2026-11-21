import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const code = await readFile(new URL('../dist/analytics.js', import.meta.url), 'utf8');
function page(url) {
  const scripts = [];
  const context = {
    location: new URL(url), URL, URLSearchParams, window: {},
    document: {
      referrer: 'https://example.com/private?email=private@example.com',
      getElementById: (id) => scripts.find((script) => script.id === id),
      createElement: () => ({}), head: { appendChild: (script) => scripts.push(script) },
    },
  };
  return { context, scripts };
}

test('production tag loads once, excluding private catalogue query and fragment values', () => {
  const { context, scripts } = page('https://paintcommons.org/catalogue/?q=private&paint=private&utm_source=instagram#private');
  runInNewContext(code, context);
  runInNewContext(code, context);
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://www.googletagmanager.com/gtm.js?id=GTM-MNJQ6CND');
  const commands = context.window.dataLayer.map((args) => Array.from(args));
  assert.equal(commands[0][1].page_location, 'https://paintcommons.org/catalogue/');
  assert.equal(commands[0][1].page_referrer, 'https://example.com/');
  assert.equal(commands[1][1].campaign_source, 'instagram');
  assert.doesNotMatch(JSON.stringify(commands), /private/);
});

test('localhost, preview and Pages domains do not load the production tag', () => {
  for (const url of ['http://localhost:8765/', 'https://paintcommons.pages.dev/', 'https://preview.paintcommons.pages.dev/']) {
    const { context, scripts } = page(url);
    runInNewContext(code, context);
    assert.equal(scripts.length, 0);
    assert.equal(context.window.dataLayer, undefined);
  }
});

test('every public HTML page includes the loader and privacy navigation', async () => {
  for (const file of ['index.html', 'catalogue/index.html', 'privacy/index.html']) {
    const html = await readFile(new URL(`../dist/${file}`, import.meta.url), 'utf8');
    assert.match(html, /<script defer src="\/analytics\.js"><\/script>/);
    if (!file.startsWith('privacy/')) assert.match(html, /href="\/privacy\/"/);
  }
});
