import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Contact sheets carry stable IDs and source timestamps. Full, uncropped originals
// are retained separately for the result table and offline export.
export async function contactSheets(frames,directory,{width=480,height=640}={}){
 const metadata=JSON.parse(await readFile(path.join(directory,'manifest.json'),'utf8'));
 if(metadata.length!==frames.length)throw Error('invalid_frames');
 const sheets=[];
 for(let offset=0;offset<frames.length;offset+=6){
  const batch=frames.slice(offset,offset+6),layers=[];
  for(let n=0;n<batch.length;n++){
   const x=(n%3)*width,y=Math.floor(n/3)*(height+42);
   const pic=await sharp(batch[n]).resize(width,height,{fit:'contain',background:'#101010'}).toBuffer();
   layers.push({input:pic,left:x,top:y+42});
   const label=Buffer.from(`<svg width="${width}" height="42"><rect width="${width}" height="42" fill="#101010"/><text x="12" y="30" fill="white" font-size="25" font-family="Arial">#${metadata[offset+n].index} | ${metadata[offset+n].seconds.toFixed(2)} s</text></svg>`);
   layers.push({input:label,left:x,top:y});
  }
  const target=path.join(directory,`sheet-${String(sheets.length+1).padStart(2,'0')}.jpg`);
  await sharp({create:{width:width*3,height:(height+42)*2,channels:3,background:'#101010'}}).composite(layers).jpeg({quality:88}).toFile(target);sheets.push(target);
 }
 return {sheets,metadata};
}

export function attachFrames(result,metadata){
 for(const row of result.rows){
  if(!Array.isArray(row.frameIndices)||row.frameIndices.length<1||row.frameIndices.length>3)throw Error('invalid_result');
  row.frames=[...new Set(row.frameIndices)].map(index=>{const f=metadata[index-1];if(!Number.isInteger(index)||!f)throw Error('invalid_result');return {index,seconds:f.seconds}});
  delete row.frameIndices;
 }
 return result;
}

export function applyProductPatches(source,patches,product,{retainSourceEffects=false}={}){
 const result=structuredClone(source);
 if(!Array.isArray(patches)||patches.length>100)throw Error('invalid_result');
 for(const patch of patches){
  const row=result.rows.find(r=>r.number===patch.row),allowed=['product_name','offer','product_effect','product_appearance'];
  if(!row||!['dialogue','scene','shooting'].includes(patch.field)||!allowed.includes(patch.reason)||typeof patch.before!=='string'||!patch.before.trim()||typeof patch.after!=='string'||patch.after.length>2000)throw Error('invalid_result');
  const text=patch.field==='shooting'?row.shooting.text:row[patch.field];
  if(text.split(patch.before).length!==2)throw Error('invalid_result');
  const keepOriginal=retainSourceEffects&&patch.field==='dialogue'&&patch.reason==='product_effect'&&/待确认|待核对/.test(patch.after);
  const next=keepOriginal?text:text.replace(patch.before,patch.after);
  if(patch.field==='shooting')row.shooting={...row.shooting,text:next};else row[patch.field]=next;
 }
 result.title=`${product} · 原剧情产品替换`;
 if(retainSourceEffects)for(const row of result.rows)row.dialogue=row.dialogue.replace(/【原片(?:介绍|促销)引述】/g,'');
 result.summary='保留对标剧情与镜头；仅替换产品名称、活动、使用效果及产品展示。截图均为对标原片。';
 // Source-only status is no longer true after product patches have been applied.
 // Keep evidence gaps; remove only the obsolete statement about conversion state.
 result.checks=[...new Set(source.checks.map(check=>check.replace(/本次仅拆解[，,]未进行VC产品或活动转换[。；;]?/g,'').trim()).filter(Boolean)),`${product}：原片截图仅作画面参考，未替换图片中的实物产品。`];
 return result;
}
