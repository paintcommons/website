import { appendFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function needsRefresh(revision, { fetcher = fetch } = {}) {
  if (!/^[0-9a-f]{40}$/.test(revision)) throw Error('Invalid catalogue revision');
  try {
    const response = await fetcher('https://paintcommons.org/data/catalogue-version.json', {
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return true;
    return (await response.json()).revision !== revision;
  } catch {
    return true;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const changed = await needsRefresh(process.argv[2]);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  console.log(changed ? 'Catalogue refresh required.' : 'Published catalogue is current; no deployment needed.');
}
