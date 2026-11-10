import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {scriptSchema} from './result.mjs';
export function sourceKey({transcript,metadata,voice,model}){return createHash('sha256').update(JSON.stringify({revision:'opening-source-v1',transcript,metadata,voice,model})).digest('hex')}
export async function cachedSource(directory,key,make){
 await mkdir(directory,{recursive:true});const file=path.join(directory,`${key}.json`);
 try{const parsed=scriptSchema.safeParse(JSON.parse(await readFile(file,'utf8')));if(parsed.success)return {result:parsed.data,hit:true}}catch{}
 const result=scriptSchema.parse(await make());await writeFile(file,JSON.stringify(result));return {result,hit:false};
}
