import {writeFile} from 'node:fs/promises';
import path from 'node:path';
export function trustedVideo(value){try{const u=new URL(value);return u.protocol==='https:'&&['.chanmama.com','.douyinvod.com','.douyin.com','.byteoversea.com'].some(d=>u.hostname.endsWith(d))}catch{return false}}
// Signed CDN requests can fail transiently. Retry only fetching bytes, never inference.
export async function downloadVideo(url,directory,{fetcher=fetch,limit=200*1024*1024}={}){
 if(!trustedVideo(url))throw Error('untrusted_video');
 const failures=[];
 for(let attempt=1;attempt<=2;attempt++){
  let response;
  try{
   let target=url;
   for(let redirect=0;redirect<4;redirect++){
    response=await fetcher(target,{redirect:'manual',signal:AbortSignal.timeout(120000)});
    if(response.status>=300&&response.status<400){const next=new URL(response.headers.get('location'),target).href;await response.body?.cancel();if(!trustedVideo(next))throw Error('untrusted_redirect');target=next;continue}break;
   }
   if(!response?.ok)throw Error(`http_${response?.status??0}`);
   if(!/video|octet-stream/i.test(response.headers.get('content-type')??''))throw Error('not_video');
   if(Number(response.headers.get('content-length'))>limit)throw Error('video_too_large');
   const reader=response.body.getReader(),chunks=[];let size=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('video_too_large');chunks.push(value)}}finally{await reader.cancel().catch(()=>{});reader.releaseLock()}
   if(!size)throw Error('empty_video');
   const file=path.join(directory,'source.mp4');await writeFile(file,Buffer.concat(chunks));
   await writeFile(path.join(directory,'download-status.json'),JSON.stringify({ok:true,attempt,bytes:size,failures,at:new Date().toISOString()}));return file;
  }catch(error){
   await response?.body?.cancel().catch(()=>{});
   const reason=/^(http_\d+|not_video|video_too_large|untrusted_redirect|empty_video)$/.test(error.message)?error.message:error.name==='TimeoutError'?'timeout':'network_or_stream_error';
   failures.push({attempt,reason});
   if(['video_too_large','untrusted_redirect','http_429'].includes(reason))break;
  }
 }
 await writeFile(path.join(directory,'download-status.json'),JSON.stringify({ok:false,failures,at:new Date().toISOString()}));throw Error('video_download_failed');
}
