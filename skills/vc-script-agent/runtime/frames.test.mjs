import test from 'node:test';
import assert from 'node:assert/strict';
import {applyProductPatches,attachFrames} from './frames.mjs';
const source={title:'原片',summary:'',checks:[],rows:[{number:1,time:'0-2s',scene:'女子穿白衣，手持A素颜霜，门口中景。',dialogue:'你来了？A素颜霜今天买一送二。',shooting:{text:'固定机位，白衣保持一致。',kind:'normal'},editing:{text:'硬切',kind:'normal'},frames:[{index:1,seconds:0}]}]};
test('authorized original effects never turn into confirmation placeholders',()=>{
 const input={...source,rows:[{...source.rows[0],dialogue:'粉底加遮瑕加定妆加高光，四效合一。【原片介绍引述】'}]};
 const r=applyProductPatches(input,[{row:1,field:'dialogue',before:'四效合一',after:'【待确认：四效合一】',reason:'product_effect'}],'VC素颜霜',{retainSourceEffects:true});
 assert.equal(r.rows[0].dialogue,'粉底加遮瑕加定妆加高光，四效合一。');assert.deepEqual(r.rows[0].frames,input.rows[0].frames);
});
test('conversion only replaces specified product spans and preserves the scene, shots and other dialogue',()=>{
 const changed=applyProductPatches(source,[{row:1,field:'dialogue',before:'A素颜霜今天买一送二',after:'VC气垫【待确认：活动】',reason:'offer'}],'VC气垫');
 assert.equal(changed.rows[0].dialogue,'你来了？VC气垫【待确认：活动】。');
 for(const field of ['scene','shooting','editing','time','number','frames'])assert.deepEqual(changed.rows[0][field],source.rows[0][field]);
 assert.match(source.rows[0].dialogue,/A素颜霜/);
});
test('conversion rejects non-product reasons, absent text and edits to shot order or timing',()=>{
 const p={row:1,field:'dialogue',before:'你来了？',after:'你走吧',reason:'new_plot'};
 assert.throws(()=>applyProductPatches(source,[p],'VC气垫'));
 assert.throws(()=>applyProductPatches(source,[{...p,reason:'offer',before:'不存在'}],'VC气垫'));
 assert.throws(()=>applyProductPatches(source,[{...p,reason:'offer',field:'time'}],'VC气垫'));
});
test('frame references come from the extraction manifest, never invented model timestamps',()=>{
 const r=attachFrames({rows:[{frameIndices:[1,2]}]},[{seconds:0},{seconds:1.033}]);assert.deepEqual(r.rows[0].frames,[{index:1,seconds:0},{index:2,seconds:1.033}]);
 assert.throws(()=>attachFrames({rows:[{frameIndices:[3]}]},[{seconds:0}]));
});
test('converted results discard obsolete source-only status but keep unresolved evidence',()=>{
 const input={...source,checks:['包装颜色需确认。','包装颜色需确认。','原声末句不完整；本次仅拆解，未进行VC产品或活动转换。']};
 const result=applyProductPatches(input,[],'VC素颜霜');
 assert.equal(result.checks.filter(s=>s==='包装颜色需确认。').length,1);
 assert.ok(result.checks.some(s=>s.includes('原声末句不完整')));
 assert.ok(!result.checks.some(s=>s.includes('未进行VC')));
 assert.ok(input.checks[2].includes('未进行VC'));
});
