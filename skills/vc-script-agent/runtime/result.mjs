import {z} from 'zod';
const note=z.object({text:z.string().max(1500),kind:z.enum(['normal','important','verify'])}).strict();
export const scriptSchema=z.object({
 title:z.string().min(1).max(160),basis:z.enum(['video_frames_and_transcript','transcript_only']),summary:z.string().max(1200),
 rows:z.array(z.object({number:z.number().int().positive(),time:z.string().max(80),scene:z.string().max(4000),dialogue:z.string().max(4000),shooting:note,editing:note,
 frames:z.array(z.object({index:z.number().int().min(1).max(240),seconds:z.number().min(0).max(180)}).strict()).min(1).max(3)}).strict()).min(1).max(80),
 checks:z.array(z.string().max(600)).max(20)
}).strict().superRefine((value,ctx)=>{if(new Set(value.rows.map(r=>r.number)).size!==value.rows.length)ctx.addIssue({code:'custom',message:'Duplicate row numbers'});});
export function cleanScript(result){
 const clean=text=>text.match(/[^。；;\n]+[。；;\n]?/g)?.filter(part=>!/(字幕|水印|屏幕文字|画面文字|边缘.{0,8}(细字|小字)|细小白字)/.test(part)).join('').trim()??'';
 return {...result,summary:clean(result.summary),rows:result.rows.map(r=>({...r,scene:clean(r.scene),shooting:{...r.shooting,text:clean(r.shooting.text)},editing:{...r.editing,text:clean(r.editing.text)}})),checks:result.checks.map(clean).filter(Boolean)};
}
const shotSizes='大远景|大特写|大全景|中近景|中远景|远景|全景|中景|近景|特写';
const shotPrefix=new RegExp(`^景别[：:]\\s*(${shotSizes}|待核对)[。；;，,\\s]*`);
const shotInOpening=new RegExp(`(${shotSizes})(?=[镜，,。；;、：:\\s]|$)`);
export const scriptColumns=['景别','画面描述','搭配文案','对标画面截图'];
export function shotPresentation(scene){
 const prefix=scene.match(shotPrefix);
 const opening=scene.split(/[。；;，,\n]/,1)[0];
 return {size:prefix?.[1]??opening.match(shotInOpening)?.[1]??'待核对',description:prefix?scene.slice(prefix[0].length):scene};
}
export function frameTimes(frames){
 return frames.map(frame=>`${frame.seconds.toFixed(2)} 秒`).join(' / ');
}
export function exportTsv(result){
 const cell=value=>{const text=String(value).replace(/[\t\r\n]+/g,' ');return typeof value==='string'&&/^\s*[=+@-]/.test(text)?"'"+text:text};
 return [scriptColumns.join('\t'),...result.rows.map(row=>{
  const {size,description}=shotPresentation(row.scene);
  return [`${size} ${row.number}`,[description,row.time].filter(Boolean).join(' '),row.dialogue,frameTimes(row.frames)].map(cell).join('\t');
 })].join('\n');
}
