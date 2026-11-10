import {cp,mkdir,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args=process.argv.slice(2);
const dest=path.resolve(args.includes('--dest')?args[args.indexOf('--dest')+1]:path.join(process.env.CODEX_HOME??path.join(os.homedir(),'.codex'),'skills','vc-script-agent'));
const [major,minor]=process.versions.node.split('.').map(Number);
if(major<22||(major===22&&minor<13))throw Error('需要Node.js 22.13或更高版本');
try{await access(dest);throw Error('目标已存在，未覆盖。更新时请先备份产品资料并选新的目录：'+dest)}catch(e){if(e.code!=='ENOENT')throw e}
await mkdir(path.dirname(dest),{recursive:true});
await cp(path.join(root,'skills/vc-script-agent'),dest,{recursive:true,filter:file=>!file.split(path.sep).some(p=>['node_modules','.venv','work','__pycache__'].includes(p))});
function run(executable,params){const r=spawnSync(executable,params,{stdio:'inherit',windowsHide:true,cwd:dest});if(r.status!==0)throw Error('安装步骤失败；文件已保留，可按README继续：'+executable)}
// Execute npm's JS entry without shell interpolation of paths containing spaces.
const npmCli=process.env.VC_NPM_CLI??path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
try{await access(npmCli);run(process.execPath,[npmCli,'ci','--no-audit','--no-fund'])}catch(error){
 if(error.code!=='ENOENT')throw error;
 if(process.platform==='win32')throw Error('未找到npm，请在已复制的Agent目录手动运行npm ci');
 run('npm',['ci','--no-audit','--no-fund']);
}
const python=process.env.VC_PYTHON??(process.platform==='win32'?'python':'python3');
run(python,['-m','venv',path.join(dest,'.venv')]);
const envPython=path.join(dest,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
run(envPython,['-m','pip','install','-r',path.join(dest,'runtime/requirements.txt')]);
console.log('安装完成：'+dest+'\n在Codex新一轮对话使用 $vc-script-agent。模型登录沿用此电脑自己的Codex账号。');
