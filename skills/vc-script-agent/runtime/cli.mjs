#!/usr/bin/env node
import {parseArgs} from 'node:util';
import {mkdir,readFile,writeFile,open,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {extractFrames,transcribeFile,infer,promptFor} from './model.mjs';
import {contactSheets} from './frames.mjs';
import {exportResult} from './export.mjs';
import {ffmpegPath,localPython,skillRoot,findExecutable} from './tools.mjs';
const {values:v,positionals}=parseArgs({allowPositionals:true,options:{video:{type:'string'},out:{type:'string'},mode:{type:'string',default:'breakdown'},product:{type:'string'},end:{type:'string'},transcript:{type:'string'},facts:{type:'string'},result:{type:'string'},help:{type:'boolean'}}});
const command=positionals[0]??'help';
const json=async file=>JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));
try{
 if(command==='help'||v.help){console.log('VC脚本Agent\n doctor\n prepare --video 文件 --out 新目录 [--end 结束秒数] [--transcript 台词.txt]\n run --video 文件 --out 新目录 [--mode breakdown|rewrite|iterate] [--product 产品名] [--facts 产品.json] [--end 秒数]\n export --out 已有目录 [--result 结果.json]\nprepare只提取证据，run还会调用本机Codex模型；export不调用模型。');}
 else if(command==='doctor'){
  const checks={node:process.version,python:localPython(),codex:findExecutable(process.env.CODEX_EXECUTABLE??'codex')};
  try{checks.ffmpeg=ffmpegPath()}catch(e){checks.ffmpeg=e.message}
  checks.pythonReady=spawnSync(localPython(),['-c','import faster_whisper, imageio_ffmpeg, numpy'],{windowsHide:true,timeout:30000}).status===0;
  checks.codexFound=checks.codex!=='codex';console.log(JSON.stringify(checks,null,2));if(!checks.pythonReady||!checks.codexFound||!path.isAbsolute(checks.ffmpeg))process.exitCode=1;
 }
 else if(command==='export'){
  if(!v.out)throw Error('需要 --out');const directory=path.resolve(v.out);console.log(JSON.stringify(await exportResult(await json(v.result??path.join(directory,'result.json')),directory)));
 }
 else if(['prepare','run'].includes(command)){
  if(!v.video||!v.out)throw Error('需要 --video 和 --out');
  if(!['breakdown','rewrite','iterate'].includes(v.mode))throw Error('无效mode');
  if(v.mode!=='breakdown'&&!v.product)throw Error('转换和迭代需要 --product');
  const end=v.end===undefined?undefined:Number(v.end);if(end!==undefined&&(!Number.isFinite(end)||end<3||end>180))throw Error('结束秒数须为3至180');
  const file=path.resolve(v.video),directory=path.resolve(v.out);
  if(!/\.(mp4|mov|webm)$/i.test(file)||(await stat(file)).size>200*1024*1024)throw Error('视频须为不超过200MiB的MP4/MOV/WebM');
  const factsFile=path.resolve(v.facts??process.env.VC_PRODUCT_FACTS??path.join(skillRoot,'runtime/product-facts.json'));
  const facts=await json(factsFile);if(v.mode!=='breakdown'&&!facts[v.product])throw Error('产品资料中找不到所选产品');
  const ffmpeg=ffmpegPath();
  await mkdir(path.dirname(directory),{recursive:true});
  await mkdir(directory); // Existing jobs are never silently overwritten or replayed.
  const lock=await open(path.join(directory,'job.lock'),'wx');await lock.close();
  const update=state=>writeFile(path.join(directory,'status.json'),JSON.stringify({...state,updatedAt:new Date().toISOString()},null,2));
  try{
   await update({status:'preparing'});
   const frames=await extractFrames(null,path.join(directory,'frames'),ffmpeg,{file,maxSeconds:end??180});if(!frames.length)throw Error('media_unavailable');
   let transcript=v.transcript?(await readFile(path.resolve(v.transcript),'utf8')).replace(/^\uFEFF/,''):'';
   let basis=v.transcript?'provided':'asr';
   if(!transcript.trim())try{transcript=await transcribeFile(file,directory,ffmpeg,end??180)}catch{transcript='[原声识别不可用，只能从真实画面中清晰可读的对话字幕核对；不可读部分不得编造。]';basis='visual_only';}
   const job={id:path.basename(directory),title:path.basename(file),mode:v.mode,product:v.product??null,input:{transcript,transcriptBasis:basis,endSeconds:end,author:''}};
   await writeFile(path.join(directory,'job.json'),JSON.stringify(job,null,2));
   if(command==='prepare'){
    const {sheets}=await contactSheets(frames,path.join(directory,'frames'));
    const voice=await readFile(path.join(skillRoot,'runtime/voice-guide.md'),'utf8');
    await writeFile(path.join(directory,'instructions.txt'),promptFor(job,facts[v.product]??{},voice,frames.length));
    await update({status:'prepared',frames:frames.length,transcriptBasis:basis});console.log(JSON.stringify({directory,sheets,frames:frames.length,transcriptBasis:basis}));
   }else{
    await update({status:'running'});
    const result=await infer(job,{codex:process.env.CODEX_EXECUTABLE??'codex',model:process.env.VC_MODEL||undefined,frames,directory,factsFile,onProgress:stage=>update({status:'running',stage})});
    const exported=await exportResult(result,directory);await update({status:'succeeded',...exported});console.log(JSON.stringify(exported));
   }
  }catch(e){await update({status:e.message==='model_uncertain'?'uncertain':'failed',error:e.message});throw e;}
  finally{const {unlink}=await import('node:fs/promises');await unlink(path.join(directory,'job.lock'));}
 }else throw Error('未知命令');
}catch(error){console.error(error.message);process.exitCode=1;}
