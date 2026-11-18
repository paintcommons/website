import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {filterPaints,swatchBackground} from '../dist/catalogue/core.mjs';
const data=JSON.parse(await readFile(new URL('../dist/data/catalogue.json',import.meta.url)));
const defaults={q:'',brand:'',range:'',type:'',status:'',sort:'brand'};
test('combined search and filters work on published records',()=>{const result=filterPaints(data.paints,{...defaults,q:'abaddon black',brand:'Citadel',range:'Base',type:'acrylic'});assert.equal(result.length,1);assert.equal(result[0].name,'Abaddon Black');});
test('barcode and product code searches locate their records',()=>{for(const p of [data.paints.find(p=>p.barcodes.length),data.paints.find(p=>p.code)]){const q=p.code||p.barcodes[0].ean;assert.ok(filterPaints(data.paints,{...defaults,q}).some(r=>r.id===p.id));}const p=data.paints.find(p=>p.barcodes.length);assert.ok(filterPaints(data.paints,{...defaults,q:p.barcodes[0].ean}).some(r=>r.id===p.id));});
test('impossible filter combinations return no results',()=>{assert.equal(filterPaints(data.paints,{...defaults,brand:'Citadel',range:'Model Color'}).length,0);});
test('all bundled swatches have published evidence and all equivalent endpoints exist',()=>{const ids=new Set(data.paints.map(p=>p.id));assert.equal(ids.size,data.paints.length);for(const p of data.paints){if(p.colour)assert.ok(data.sources.colour_sources.some(s=>s.id===p.colour.source&&s.status==='published'));}for(const e of data.equivalents){assert.ok(ids.has(e.paint_a));assert.ok(ids.has(e.paint_b));}});
test('missing swatches stay missing and source gradients are retained as evidence',async()=>{const {sourceGradient}=await import('../dist/catalogue/swatch.mjs');assert.equal(swatchBackground({}),null);const p=data.paints.find(p=>p.colour?.gradient?.length>1);for(const stop of p.colour.gradient)assert.ok(sourceGradient(p).includes(stop));});

test('live refresh pins raw records to the commit rather than the tree SHA',async()=>{const {latestCatalog}=await import('../dist/catalogue/data.mjs');const commit='a'.repeat(40),tree='b'.repeat(40),calls=[];const sample={...data.paints[0]};const payloads=new Map([
 ['https://api.github.com/repos/paintcommons/catalog/commits/main',{sha:commit,commit:{tree:{sha:tree},committer:{date:'2026-11-18T00:00:00Z'}}}],
 [`https://api.github.com/repos/paintcommons/catalog/git/trees/${tree}?recursive=1`,{sha:tree,tree:[{type:'blob',path:'paints/sample/range.json'},{type:'blob',path:'sources.json'},{type:'blob',path:'equivalents.json'}]}],
 [`https://raw.githubusercontent.com/paintcommons/catalog/${commit}/paints/sample/range.json`,[sample]],
 [`https://raw.githubusercontent.com/paintcommons/catalog/${commit}/sources.json`,data.sources],
 [`https://raw.githubusercontent.com/paintcommons/catalog/${commit}/equivalents.json`,[]]
]);const fetcher=async url=>{calls.push(url);assert.ok(payloads.has(url),url);return {ok:true,json:async()=>payloads.get(url)};};const latest=await latestCatalog('',{fetcher});assert.equal(latest.revision,commit);assert.equal(latest.paints.length,1);assert.equal(latest.paints[0].file,'paints/sample/range.json');calls.length=0;assert.equal(await latestCatalog(commit,{fetcher}),null);assert.equal(calls.length,1);});

test('colour wall keeps every paint distinct and every ramp dark to light',async()=>{const {sectionsOf,packColumns,colourCompare,colourMeta}=await import('../dist/catalogue/wall.mjs');const sorted=[...data.paints].sort(colourCompare);const sections=sectionsOf(sorted,'type'),wall=[];for(const sec of sections){const packed=packColumns(sec.paints,20);for(const band of packed.bands)for(const col of band){wall.push(...col.paints);for(let i=1;i<col.paints.length;i++)assert.ok(colourMeta(col.paints[i]).lightness>=colourMeta(col.paints[i-1]).lightness);}}assert.equal(wall.length,data.paints.length);assert.equal(new Set(wall.map(p=>p.id)).size,data.paints.length);});
test('range grouping is by manufacturer and range, with colour order retained',async()=>{const {sectionsOf,colourCompare}=await import('../dist/catalogue/wall.mjs');const groups=sectionsOf([...data.paints].sort(colourCompare),'range');for(const group of groups){assert.ok(group.paints.every(p=>`${p.brand} · ${p.range||'Other'}`===group.label));for(let i=1;i<group.paints.length;i++)assert.ok(colourCompare(group.paints[i-1],group.paints[i])<=0);}});


test('every metallic gets a sheen, including airbrush metallics without source gradients',async()=>{const {swatchKind}=await import('../dist/catalogue/swatch.mjs');for(const p of data.paints.filter(p=>p.type==='metallic')){assert.equal(swatchKind(p),'metal',p.name);assert.match(swatchBackground(p),/^linear-gradient\(45deg/);const {swatchStops,METAL_LIGHT_END}=await import('../dist/catalogue/swatch.mjs');const {hexToOklab}=await import('../dist/catalogue/color/oklch.mjs');assert.ok(hexToOklab(swatchStops(p)[3]).L>=METAL_LIGHT_END,p.name+' ends very light');}});
test('all speedpaint and contrast-style swatches use three hard bands',async()=>{const {categoryOf}=await import('../dist/catalogue/color/categories.mjs');for(const p of data.paints.filter(p=>categoryOf(p)==='speedpaint'&&p.type!=='metallic')){const bg=swatchBackground(p);assert.match(bg,/0 33\.4%/);assert.match(bg,/33\.4% 66\.7%/);assert.match(bg,/66\.7% 100%/);assert.ok(bg.includes(p.colour.hex));}});
test('similar colours combine across brands but keep finish, family and missing colours distinct',async()=>{const {combineLikeColours}=await import('../dist/catalogue/wall.mjs');const p=(id,brand,hex,type='acrylic')=>({id,brand,name:id,range:'Test',type,colour:hex?{hex}:undefined});const paints=[p('a','A','#808080'),p('b','B','#808080'),p('c','A','#808080'),p('d','C','#808080','metallic'),p('e','D','#0000FF'),p('f','E',null),p('g','F',null)];const combined=combineLikeColours(paints);assert.equal(combined.length,6);assert.deepEqual(combined[0].paints.map(p=>p.id),['a','b']);assert.equal(combined.flatMap(c=>c.paints).length,paints.length);assert.equal(combineLikeColours(paints,false).length,paints.length);});
test('colour grouping compares with the lead and does not form a transitive chain',async()=>{const {combineLikeColours}=await import('../dist/catalogue/wall.mjs');const paints=['#808080','#878787','#8E8E8E'].map((hex,i)=>({id:String(i),name:'Grey',brand:String(i),range:'Test',type:'acrylic',colour:{hex}}));const grouped=combineLikeColours(paints);assert.deepEqual(grouped.map(c=>c.paints.length),[2,1]);});


test('shared grouping separates metallic airbrush ranges from airbrush colours',async()=>{const {categoryOf,categoryLabel,GROUPING_VERSION}=await import('../dist/catalogue/color/categories.mjs');assert.equal(GROUPING_VERSION,'1.0.0');for(const range of ['Air','Model Air','Game Air','True Metallic Metal Airbrush'])assert.equal(categoryOf({type:'metallic',range}),'airbrush-metallic',range);assert.equal(categoryOf({type:'acrylic',range:'Model Air'}),'airbrush');assert.equal(categoryOf({type:'metallic',range:'Metal Color'}),'metallic');assert.equal(categoryOf({type:'acrylic',range:'True Metallic Metal Base'}),'metallic');assert.equal(categoryOf({type:'acrylic',range:'Contrast'}),'speedpaint');assert.equal(categoryOf({type:'wash',range:'Game Wash'}),'wash');assert.equal(categoryLabel('airbrush'),'Airbrush colors');assert.equal(categoryLabel('airbrush','uk'),'Airbrush colours');});
test('airbrush metallic wall groups contain no ordinary airbrush paints',async()=>{const {categoryOf,isAirbrushPaint,isMetallicPaint}=await import('../dist/catalogue/color/categories.mjs');const metals=data.paints.filter(p=>isAirbrushPaint(p)&&isMetallicPaint(p)&&!(/fluo/i.test(p.range||'')||/fluorescent/i.test(p.name)));assert.ok(metals.length>=22);for(const p of metals)assert.equal(categoryOf(p),'airbrush-metallic',p.name);for(const p of data.paints.filter(p=>categoryOf(p)==='airbrush'))assert.equal(isMetallicPaint(p),false,p.name);});


test('broader runs preserve all 27 original Fanatic groups',async()=>{
 const {rampOf}=await import('../dist/catalogue/color/ramps.mjs');
 const anchors=JSON.parse(await readFile(new URL('./fixtures/fanatic-runs.json',import.meta.url)));
 assert.equal(anchors.length,27);
 for(const run of anchors)for(const hex of run.anchors)assert.equal(rampOf(hex),run.key,`${run.label}: ${hex}`);
});
test('broader catalogue separates drabs, ochres, earths, golden skins and olive variants',async()=>{
 const {rampOf}=await import('../dist/catalogue/color/ramps.mjs');
 for(const [hex,name,run]of [
  ['#343424','Dark Green','olivedrab'],['#AE7929','Khemri Sands 3','goldenochre'],
  ['#756858','Baneblade Brown','earth'],['#FECA85','Warm Flesh','goldenskin'],
  ['#98A890','Faded Green','greyolive'],['#BFBD80','Krieg Khaki','yellowolive'],
 ]){assert.ok(data.paints.some(p=>p.colour?.hex===hex),`published anchor ${hex}`);assert.equal(rampOf(hex,name),run,name);}
 assert.notEqual(rampOf('#7A8A3C','Orc Skin'),'goldenskin');
 assert.notEqual(rampOf('#B3A660','Dead Flesh'),'goldenskin');
});
test('expanded wall retains every cluster and dark-to-light columns at multiple widths',async()=>{
 const {colourCompare,colourMeta,combineLikeColours,packColumns,sectionsOf}=await import('../dist/catalogue/wall.mjs');
 for(const sec of sectionsOf([...data.paints].sort(colourCompare))){
  const tiles=combineLikeColours(sec.paints);
  for(const width of [3,12,25]){
   const {bands}=packColumns(tiles,width),seen=[];
   for(const band of bands){assert.ok(band.length<=width);for(const col of band){
    seen.push(...col.paints);
    for(let i=1;i<col.paints.length;i++)assert.ok(colourMeta(col.paints[i].paint).lightness>=colourMeta(col.paints[i-1].paint).lightness);
   }}
   assert.equal(seen.length,tiles.length);assert.equal(new Set(seen).size,tiles.length);
  }
 }
});

test('parallel columns reduce hue and chroma jumps in the reviewed colour families',async()=>{
 const {colourCompare,colourMeta,combineLikeColours,packColumns,sectionsOf}=await import('../dist/catalogue/wall.mjs');
 const {rampOffset}=await import('../dist/catalogue/color/ramps.mjs');
 const tiles=combineLikeColours(sectionsOf([...data.paints].sort(colourCompare))[0].paints);
 const {bands,fold}=packColumns(tiles,25),columns=bands.flat();
 const jumps=columns=>columns.reduce((sum,column)=>sum+column.slice(1).reduce((n,t,i)=>{
  const p=column[i].paint,q=t.paint,a=rampOffset(p.colour.hex,colourMeta(p).family),b=rampOffset(q.colour.hex,colourMeta(q).family);
  return n+(a.a-b.a)**2+(a.b-b.b)**2;
 },0),0);
 for(const family of ['goldenochre','khaki','rosyskin','deepskin','goldenskin','brown']){
  const run=tiles.filter(t=>colourMeta(t.paint).family===family),count=Math.ceil(run.length/fold),baseline=[];
  for(let k=0,i=0;k<count;k++){const size=Math.ceil((run.length-i)/(count-k));baseline.push(run.slice(i,i+size));i+=size;}
  assert.ok(jumps(columns.filter(c=>c.family===family).map(c=>c.paints))<jumps(baseline)*.9,`${family} has fewer abrupt colour jumps`);
 }
});
test('dark purple keeps its wine hue and Light Brown stays with browns rather than yellows',async()=>{
 const {rampOf}=await import('../dist/catalogue/color/ramps.mjs');
 assert.equal(rampOf('#442633','Dark Purple'),'wine');
 assert.ok(['brown','khaki','earth'].includes(rampOf('#A05A31','Light Brown')));
});


test('uniform and camouflage names exclude skin runs without forcing one military hue',async()=>{
 const {rampOf}=await import('../dist/catalogue/color/ramps.mjs');
 const skins=new Set(['rosyskin','warmskin','deepskin','goldenskin']);
 for(const [hex,name]of [
  ['#684F3B','Steel Legion Drab'],['#92795B','Khaki Brown'],
  ['#AF8F6F','Camouﬂ age Brown'],['#8B7260','USAF Brown'],
  ['#967650','Sand Yellow RLM79'],['#C0966A','USAF Tan'],
  ['#816644','US Field Drab'],['#7C6238','Khaki Grey'],
  ['#A87944','Khaki Drill'],['#92795B','Field Grey'],
  ['#92795B','Fieldgray'],['#92795B','NATO Brown'],
 ])assert.ok(!skins.has(rampOf(hex,name)),name);
 assert.equal(rampOf('#3F4C34','Uniform Green'),'olive');
 assert.equal(rampOf('#92795B','Khaki Brown'),rampOf('#92795B','KHAKI BROWN'));
 assert.ok(skins.has(rampOf('#C6B49D','Olive Flesh')));
 assert.ok(skins.has(rampOf('#92795B','Khaki Skin')));
 assert.equal(rampOf(null,'Khaki Brown'),'unknown');
});


test('fantasy creature hides follow their swatch rather than the leather rule',async()=>{
 const {rampOf,isWoodOrLeather}=await import('../dist/catalogue/color/ramps.mjs');
 for(const [hex,name,expected]of [
  ['#AE8E41','Hobgrot Hide','sand'],
  ['#7E3331','Verminlord Hide','crimson'],
  ['#585067','Daemonette Hide','violet'],
 ]){assert.equal(isWoodOrLeather(hex,name),false,name);assert.equal(rampOf(hex,name),expected,name);}
 assert.equal(isWoodOrLeather('#362C2A','Rhinox Hide'),true);
 assert.equal(rampOf('#362C2A','Rhinox Hide'),'brown');
 assert.equal(isWoodOrLeather('#6E4A33','Leather Brown'),true);
});

test('stored stops drive the finish: metallic sweeps, speedpaint and wash positions, nulls generated',async()=>{
 const {swatchKind,swatchStops,sourceGradient,isWashOrGlaze}=await import('../dist/catalogue/swatch.mjs');
 const paint=(type,range,name,hex,gradient=null)=>({type,range,name,colour:{hex,gradient,source:'x'}});
 const sweep=paint('metallic','Metal Color','Aluminium','#8B8B91',['#8B8B91','#A0A0A5','#C3C3C6','#CCCCCF','#B1B1B5','#9F9FA4','#939399']);
 assert.deepEqual(swatchStops(sweep).slice(0,3),['#8B8B91','#8B8B91','#CCCCCF']);
 assert.equal(swatchStops(sweep)[3],'#F4F4F2','a near-white end when the source has none');
 assert.deepEqual(swatchStops(paint('speedpaint','Pro Acryl 1-Step','Blue','#086CB1',['#0E447E','#086CB1','#0393D7'])),['#0E447E','#086CB1','#0393D7']);
 assert.deepEqual(swatchStops(paint('speedpaint','Contrast','Creed Camo','#B7CE9A',['#145D2E','#B7CE9A'])).slice(0,2),['#145D2E','#B7CE9A']);
 const wash=paint('wash','Pro Acryl','Black Wash','#080605',[null,'#080605','#838282']);
 assert.equal(swatchKind(wash),'smooth');
 assert.deepEqual(swatchStops(wash).slice(1),['#080605','#838282']);
 assert.equal(sourceGradient(wash),'linear-gradient(120deg, #080605, #838282)','the evidence strip skips empty positions');
 assert.ok(isWashOrGlaze({type:'acrylic',range:'Glaze',name:'Lamenters Yellow'}));
 assert.ok(!isWashOrGlaze({type:'acrylic',range:'Model Color',name:'Washed Out Blue'}));
 for(const p of data.paints.filter(p=>p.type==='wash'&&p.colour))assert.notEqual(swatchKind(p),'flat',p.name+' (metallic washes such as Gemstone keep their shine)');
});
