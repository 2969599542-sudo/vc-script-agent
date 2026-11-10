import {spawn,spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const skillRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export function localPython(){
 if(process.env.VC_PYTHON)return process.env.VC_PYTHON;
 const local=path.join(skillRoot,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
 return existsSync(local)?local:(process.platform==='win32'?'python':'python3');
}
export function findExecutable(name){
 if(path.isAbsolute(name))return name;
 const extensions=process.platform==='win32'?['','.exe','.cmd','.bat']:[''];
 for(const dir of (process.env.PATH??'').split(path.delimiter))for(const ext of extensions){const candidate=path.join(dir,name+ext);if(existsSync(candidate))return candidate;}
 return name;
}
export function runTool(executable,args,options={}){
 const resolved=findExecutable(executable);
 if(process.platform==='win32'&&/\.cmd$/i.test(resolved)&&/codex\.cmd$/i.test(resolved)){
  const entry=path.join(path.dirname(resolved),'node_modules','@openai','codex','bin','codex.js');
  if(!existsSync(entry))throw Error('请配置 CODEX_EXECUTABLE 为实际 codex.exe 路径');
  return spawn(process.execPath,[entry,...args],options);
 }
 return spawn(resolved,args,options);
}
export function ffmpegPath(){
 if(process.env.VC_FFMPEG)return process.env.VC_FFMPEG;
 const found=findExecutable('ffmpeg');if(found!=='ffmpeg')return found;
 const probe=spawnSync(localPython(),['-c','import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'],{encoding:'utf8',windowsHide:true,timeout:15000});
 if(probe.status!==0)throw Error('FFmpeg未安装：先运行安装脚本，或设置VC_FFMPEG');
 return probe.stdout.trim();
}
