import { readFile, readdir, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

export async function bundleCatalog(root, output = 'dist/data', { waitForIds = false } = {}) {
  root = resolve(root);
  const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
  const revision = git('rev-parse', 'HEAD');
  const publishedAt = git('show', '-s', '--format=%cI', 'HEAD');
  const paints = [];
  for (const brand of (await readdir(join(root, 'paints'))).sort()) {
    for (const file of (await readdir(join(root, 'paints', brand))).filter(f => f.endsWith('.json')).sort()) {
      const path = `paints/${brand}/${file}`;
      for (const paint of JSON.parse(await readFile(join(root, path), 'utf8'))) paints.push({ ...paint, file: path });
    }
  }
  const sources = JSON.parse(await readFile(join(root, 'sources.json'), 'utf8'));
  const equivalents = JSON.parse(await readFile(join(root, 'equivalents.json'), 'utf8'));
  const aliasPath = join(root, 'aliases.json');
  let aliases = [];
  try { aliases = JSON.parse(await readFile(aliasPath, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const ids = new Set();
  let pending = 0;
  for (const p of paints) {
    if (!p.id) pending++;
    else {
      if (ids.has(p.id)) throw Error('Duplicate paint ID');
      ids.add(p.id);
    }
    for (const source of [p.source, p.colour?.source].filter(Boolean)) {
      if (!sources.colour_sources.some(s => s.id === source && s.status === 'published')) throw Error('Unpublished paint or colour source');
    }
  }
  if (pending && waitForIds) return { ready: false, pending, revision };
  if (pending || !paints.length) throw Error('Missing paint IDs or empty catalogue');
  if (equivalents.some(e => !ids.has(e.paint_a) || !ids.has(e.paint_b))) throw Error('Invalid equivalent');
  const seenAliases = new Set();
  for (const a of aliases) {
    if (!a.alias_id || ids.has(a.alias_id) || !ids.has(a.canonical_id) || seenAliases.has(a.alias_id)) throw Error('Invalid paint alias');
    seenAliases.add(a.alias_id);
  }
  const licence = await readFile(join(root, 'LICENSE'));
  const notices = await readFile(join(root, 'THIRD_PARTY_NOTICES.md'));
  await mkdir(output, { recursive: true });
  await writeFile(join(output, 'catalogue.json'), JSON.stringify({ revision, publishedAt, paints, sources, equivalents, aliases }));
  await writeFile(join(output, 'LICENSE'), licence);
  await writeFile(join(output, 'THIRD_PARTY_NOTICES.md'), notices);
  await writeFile(join(output, 'catalogue-version.json'), JSON.stringify({ revision, publishedAt, paints: paints.length }) + '\n');
  return { ready: true, revision, paints: paints.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await bundleCatalog(process.argv[2] || '../catalog', 'dist/data', { waitForIds: process.argv.includes('--wait-for-ids') });
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `ready=${result.ready}\n`);
  console.log(result.ready ? `Bundled ${result.paints} paints at ${result.revision.slice(0, 7)}` : `Waiting for catalogue sync to assign ${result.pending} permanent paint IDs; keeping the published snapshot.`);
  if (!result.ready && process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `Waiting for ${result.pending} permanent paint IDs. The next daily run retries after catalogue sync. No deployment was made.\n`);
}
