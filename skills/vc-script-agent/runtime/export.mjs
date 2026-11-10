import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {scriptSchema,exportTsv} from './result.mjs';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function exportResult(input,directory){
 const result=scriptSchema.parse(input);
 const metadata=JSON.parse(await readFile(path.join(directory,'frames','manifest.json'),'utf8'));
 const images=new Map();
 for(const row of result.rows)for(const frame of row.frames){
  const original=metadata.find(item=>item.index===frame.index);
  if(!original||Math.abs(original.seconds-frame.seconds)>0.001||!/^frame-\d{3}\.jpg$/.test(original.file))throw Error('frame_evidence_mismatch');
  if(!images.has(frame.index))images.set(frame.index,(await readFile(path.join(directory,'frames',original.file))).toString('base64'));
 }
 const rows=result.rows.map(row=>`<tr><td>${row.number}</td><td><p>${escape(row.time)}</p><p contenteditable="true">${escape(row.scene)}</p>${row.frames.map(f=>`<figure><img src="data:image/jpeg;base64,${images.get(f.index)}" alt="原片参考帧 ${f.index}"><figcaption>原片 #${f.index} · ${f.seconds.toFixed(2)}秒</figcaption></figure>`).join('')}</td><td contenteditable="true">${escape(row.dialogue)}</td><td contenteditable="true">${escape(row.shooting.text)}</td><td contenteditable="true">${escape(row.editing.text)}</td></tr>`).join('');
 const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(result.title)}</title><style>body{font:18px/1.65 system-ui,sans-serif;margin:32px;color:#172026}h1{font-size:30px}table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #ccd3d7;padding:12px;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#ecf1f3}th:first-child{width:40px}th:nth-child(2){width:35%}figure{margin:12px 0}img{max-width:100%;height:auto}figcaption,aside{font-size:14px;color:#475569}[contenteditable]:focus{outline:2px solid #197d82}button{font:inherit;padding:8px 16px}@media print{button,aside{display:none}body{margin:0}tr{break-inside:avoid}}</style><h1>${escape(result.title)}</h1><p>${escape(result.summary)}</p><aside>截图是原片采样，迭代或转换不会改变原图。可点击文字编辑，然后保存副本；原JSON和TSV不会随网页编辑改变。</aside><button id="save">保存编辑后的图文副本</button><table><thead><tr><th>序号</th><th>场景对标即可</th><th>台词</th><th>备注 · AI生成细节</th><th>备注 · 连续性／转场</th></tr></thead><tbody>${rows}</tbody></table><ul>${result.checks.map(c=>`<li>${escape(c)}</li>`).join('')}</ul><script>document.getElementById('save').onclick=()=>{const blob=new Blob(['<!doctype html>'+document.documentElement.outerHTML],{type:'text/html;charset=utf-8'});const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download='script-edited.html';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};</script></html>`;
 await writeFile(path.join(directory,'result.json'),JSON.stringify(result,null,2));
 await writeFile(path.join(directory,'script.tsv'),'\uFEFF'+exportTsv(result),'utf8');
 await writeFile(path.join(directory,'script.html'),html,'utf8');
 return {rows:result.rows.length,frames:images.size,html:path.join(directory,'script.html'),tsv:path.join(directory,'script.tsv')};
}
