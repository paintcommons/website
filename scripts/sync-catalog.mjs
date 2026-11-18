import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=resolve(process.argv[2] || '../catalog');
const revision=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const publishedAt=execFileSync('git',['-C',root,'show','-s','--format=%cI','HEAD'],{encoding:'utf8'}).trim();
const paints=[];
for(const brand of (await readdir(join(root,'paints'))).sort()) {
 for(const file of (await readdir(join(root,'paints',brand))).filter(f=>f.endsWith('.json')).sort()) {
  const path=`paints/${brand}/${file}`;
  for(const paint of JSON.parse(await readFile(join(root,path),'utf8'))) paints.push({...paint,file:path});
 }
}
const sources=JSON.parse(await readFile(join(root,'sources.json'),'utf8'));
const equivalents=JSON.parse(await readFile(join(root,'equivalents.json'),'utf8'));
const ids=new Set();
for(const p of paints) {
 if(!p.id || ids.has(p.id)) throw new Error('Missing or duplicate paint ID');
 ids.add(p.id);
 if(p.colour && !sources.colour_sources.some(s=>s.id===p.colour.source && s.status==='published')) throw new Error('Unpublished colour source');
}
await mkdir('dist/data',{recursive:true});
await writeFile('dist/data/catalogue.json',JSON.stringify({revision,publishedAt,paints,sources,equivalents}));
await writeFile('dist/data/LICENSE',await readFile(join(root,'LICENSE')));
console.log(`Bundled ${paints.length} paints at ${revision.slice(0,7)}`);
