import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {scriptSchema,exportTsv,scriptColumns,shotPresentation,frameTimes} from './result.mjs';
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
 const rows=result.rows.map(row=>{
  const {size,description}=shotPresentation(row.scene);
  const frames=row.frames.map(frame=>`<img src="data:image/jpeg;base64,${images.get(frame.index)}" alt="原片参考帧 ${frame.index}，${frame.seconds.toFixed(2)} 秒">`).join('');
  return `<tr>
<td class="shot"><span contenteditable="true">${escape(size)}</span><span>${row.number}</span></td>
<td><div contenteditable="true">${escape(description)}</div><small class="time">${escape(row.time)}</small></td>
<td contenteditable="true">${escape(row.dialogue)}</td>
<td class="reference"><figure><div class="frames">${frames}</div><figcaption>${frameTimes(row.frames)}</figcaption></figure></td>
</tr>`;
 }).join('');
 const html=`<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(result.title)}</title>
<style>
body{font:15px/1.65 system-ui,sans-serif;margin:20px;color:#161616}
h1{font-size:24px;margin:0 0 8px}
aside{color:#475569;font-size:13px;margin:8px 0}
button{font:inherit;margin-bottom:12px;padding:5px 10px}
.table-wrap{overflow:auto}
table{border-collapse:collapse;width:100%;min-width:620px;table-layout:fixed}
col.shot-column{width:8%}col.scene-column{width:20%}col.dialogue-column{width:30%}col.reference-column{width:42%}
th,td{border:1px solid #d4d4d4;padding:6px 8px;white-space:pre-wrap;overflow-wrap:anywhere}
th{text-align:left;background:#dfe6f8;font-weight:700}
td{vertical-align:middle}
td.shot{text-align:center}
.shot span{display:block}
.time,figcaption{display:block;font-size:11px;color:#475569}
.time{margin-top:8px}
.reference{text-align:center}
figure{margin:0}
.frames{display:flex;justify-content:center;align-items:center;gap:2px}
.frames img{display:block;max-width:32%;max-height:220px;width:auto;height:auto;object-fit:contain}
figcaption{margin-top:5px}
[contenteditable]:focus{outline:2px solid #526faf}
@media print{button,aside{display:none}body{margin:0}.table-wrap{overflow:visible}table{min-width:0}tr{break-inside:avoid}th{print-color-adjust:exact}}
</style>
<h1>${escape(result.title)}</h1><p>${escape(result.summary)}</p>
<aside>可编辑景别、画面描述和搭配文案，再保存图文副本。截图取自原片。</aside>
<button id="save">保存编辑后的图文副本</button>
<div class="table-wrap"><table>
<colgroup><col class="shot-column"><col class="scene-column"><col class="dialogue-column"><col class="reference-column"></colgroup>
<thead><tr>${scriptColumns.map(column=>`<th scope="col">${column}</th>`).join('')}</tr></thead><tbody>${rows}</tbody>
</table></div>
<ul>${result.checks.map(c=>`<li>${escape(c)}</li>`).join('')}</ul>
<script>document.getElementById('save').onclick=()=>{const blob=new Blob(['<!doctype html>'+document.documentElement.outerHTML],{type:'text/html;charset=utf-8'});const a=document.createElement('a');const u=URL.createObjectURL(blob);a.href=u;a.download='script-edited.html';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)};</script>
</html>`;
 await writeFile(path.join(directory,'result.json'),JSON.stringify(result,null,2));
 await writeFile(path.join(directory,'script.tsv'),'\uFEFF'+exportTsv(result),'utf8');
 await writeFile(path.join(directory,'script.html'),html,'utf8');
 return {rows:result.rows.length,frames:images.size,html:path.join(directory,'script.html'),tsv:path.join(directory,'script.tsv')};
}
