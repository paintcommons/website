export async function latestCatalog(currentRevision,{fetcher=fetch,signal}={}){
 const request=async url=>{const r=await fetcher(url,{signal});if(!r.ok)throw Error('Catalog update unavailable');return r.json();};
 const commit=await request('https://api.github.com/repos/paintcommons/catalog/commits/main');
 if(!/^[0-9a-f]{40}$/.test(commit.sha))throw Error('Invalid revision');
 if(commit.sha===currentRevision)return null;
 const tree=await request(`https://api.github.com/repos/paintcommons/catalog/git/trees/${commit.commit.tree.sha}?recursive=1`);
 if(!tree.sha||tree.truncated)throw Error('Incomplete catalog tree');
 const files=tree.tree.filter(f=>f.type==='blob'&&(/^paints\/[^/]+\/[^/]+\.json$/.test(f.path)||['sources.json','equivalents.json','aliases.json'].includes(f.path)));
 const content=new Map();let cursor=0;
 await Promise.all(Array.from({length:6},async()=>{while(cursor<files.length){const file=files[cursor++];content.set(file.path,await request(`https://raw.githubusercontent.com/paintcommons/catalog/${commit.sha}/${file.path}`));}}));
 const sources=content.get('sources.json'),equivalents=content.get('equivalents.json'),paints=[];
 if(!sources?.colour_sources||!Array.isArray(equivalents))throw Error('Missing catalog metadata');
 for(const [file,records]of content){if(!file.startsWith('paints/'))continue;if(!Array.isArray(records))throw Error('Invalid range');for(const p of records){if(!p.id||!p.name||!p.brand||!Array.isArray(p.barcodes))throw Error('Invalid record');if(p.colour&&!sources.colour_sources.some(s=>s.id===p.colour.source&&s.status==='published'))throw Error('Unpublished swatch');paints.push({...p,file});}}
 if(!paints.length||new Set(paints.map(p=>p.id)).size!==paints.length)throw Error('Invalid catalogue');
 const ids=new Set(paints.map(p=>p.id));if(equivalents.some(e=>!ids.has(e.paint_a)||!ids.has(e.paint_b)))throw Error('Invalid equivalent');
 const aliases=content.get('aliases.json')??[],seenAliases=new Set();
 for(const a of aliases){if(!a.alias_id||ids.has(a.alias_id)||!ids.has(a.canonical_id)||seenAliases.has(a.alias_id))throw Error('Invalid paint alias');seenAliases.add(a.alias_id);}
 return {revision:commit.sha,publishedAt:commit.commit.committer.date,paints,sources,equivalents,aliases};
}
