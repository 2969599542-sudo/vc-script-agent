import test from 'node:test';import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('./cli.mjs',import.meta.url));
test('bad scope and product requests fail before video/model work',()=>{
 for(const args of [['--end','181'],['--mode','rewrite'],['--mode','unknown']]){
  const r=spawnSync(process.execPath,[cli,'run','--video','missing.mp4','--out','unused',...args],{encoding:'utf8'});
  assert.equal(r.status,1);assert.ok(!r.stderr.includes('ENOENT'));
 }
});
test('export failure preserves the original result and does not invoke a model',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'vc-cli-'));
 try{
  await mkdir(path.join(dir,'frames'));
  await writeFile(path.join(dir,'result.json'),'{}');
  const r=spawnSync(process.execPath,[cli,'export','--out',dir],{encoding:'utf8',env:{...process.env,CODEX_EXECUTABLE:'not-a-real-model-executable'}});
  assert.equal(r.status,1);assert.equal(await readFile(path.join(dir,'result.json'),'utf8'),'{}');
 }finally{await rm(dir,{recursive:true,force:true})}
});
