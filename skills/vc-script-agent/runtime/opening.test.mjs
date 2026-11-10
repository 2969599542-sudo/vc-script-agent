import test from 'node:test';
import assert from 'node:assert/strict';
import {previewFrames,openingScope} from './opening.mjs';
const metadata=Array.from({length:31},(_,i)=>({index:i+1,seconds:i,file:`frame-${i}.jpg`}));
test('first story includes its product offer but excludes the next spliced story',()=>{
 const transcript='阿姨找什么？粉底液。这是VC素颜霜，拍二发九。老公再给我买点。';
 const scope=openingScope({status:'found',endSeconds:20,lastDialogue:'拍二发九。',reason:'20秒后开始另一段夫妻剧情'},metadata,transcript);
 assert.equal(scope.metadata.at(-1).seconds,19);
 assert.equal(scope.transcript,'阿姨找什么？粉底液。这是VC素颜霜，拍二发九。');
 assert.ok(!scope.transcript.includes('老公'));
});
test('ambiguous or unsupported boundaries never fall back to processing three minutes',()=>{
 for(const b of [{status:'uncertain',endSeconds:20,lastDialogue:'结束。'},{status:'found',endSeconds:181,lastDialogue:'结束。'},{status:'found',endSeconds:20,lastDialogue:'不存在'}])assert.throws(()=>openingScope(b,metadata,'结束。'),/opening_boundary_uncertain/);
 assert.throws(()=>openingScope({status:'found',endSeconds:20,lastDialogue:'结束。'},metadata,'结束。结束。'),/opening_boundary_uncertain/);
 assert.throws(()=>openingScope({status:'no_story'},metadata,'口播'),/opening_no_story/);
});
test('preview retains original frame identities and the last observation',()=>{
 const p=previewFrames(metadata);assert.deepEqual(p.map(x=>x.index),[1,5,9,13,17,21,25,29,31]);
});
