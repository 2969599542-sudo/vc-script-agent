import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';import sharp from 'sharp';
import {exportResult} from './export.mjs';
import {exportTsv,scriptSchema} from './result.mjs';
const sample=()=>({title:'离线脚本',basis:'video_frames_and_transcript',summary:'第一段测试',rows:[{number:1,time:'0–1秒',scene:'<img onerror="bad()">',dialogue:'=1+1',shooting:{text:'保持角色一致',kind:'important'},editing:{text:'直切',kind:'normal'},frames:[{index:1,seconds:0}]}],checks:[]});
test('exports offline image evidence and escapes user text, TSV blocks formula execution',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'vc-export-'));
 try{
  await mkdir(path.join(dir,'frames'));
  await sharp({create:{width:32,height:32,channels:3,background:'red'}}).jpeg().toFile(path.join(dir,'frames/frame-001.jpg'));
  await writeFile(path.join(dir,'frames/manifest.json'),JSON.stringify([{index:1,seconds:0,file:'frame-001.jpg'}]));
  const result=await exportResult(sample(),dir);assert.equal(result.frames,1);
  const html=await readFile(result.html,'utf8');assert.match(html,/data:image\/jpeg;base64,/);assert.ok(!html.includes('<img onerror='));assert.ok(!html.includes('src="http'));
  const tsv=await readFile(result.tsv,'utf8');assert.match(tsv,/'=1\+1/);assert.equal(tsv.split('\n')[1].split('\t').length,4);
  assert.deepEqual(Array.from(html.matchAll(/<th scope="col">([^<]+)<\/th>/g),match=>match[1]),['景别','画面描述','搭配文案','对标画面截图']);
  assert.match(html,/<figcaption>0\.00 秒<\/figcaption>/);
  const forged=sample();forged.rows[0].frames[0].seconds=1;await assert.rejects(exportResult(forged,dir),/frame_evidence_mismatch/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('rejects duplicate shot identities and absent reference images',()=>{
 const duplicate=sample();duplicate.rows.push(structuredClone(duplicate.rows[0]));assert.equal(scriptSchema.safeParse(duplicate).success,false);
 const missing=sample();missing.rows[0].frames=[];assert.equal(scriptSchema.safeParse(missing).success,false);
 const explicit=sample();explicit.rows[0].scene='景别：中近景。人物回头。';
 assert.match(exportTsv(explicit),/中近景 1\t人物回头。 0–1秒/);
 const legacy=sample();legacy.rows[0].scene='后厨双人中景，人物回头。';
 assert.match(exportTsv(legacy),/中景 1\t后厨双人中景，人物回头。/);
});
