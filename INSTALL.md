# 在另一台电脑安装

## 1. 准备账号和软件

- 安装 [Node.js Windows LTS](https://nodejs.org/)（至少22.13，保留 npm 组件）和 [Python 3.12](https://www.python.org/downloads/windows/)（安装时勾选 Add Python to PATH）。
- 安装并登录Codex；模型调用使用每台电脑自己的登录，不复制原电脑凭据。
- 无需安装Tabbit、蝉妈妈或连接VC日报网站。

## 2. 下载与安装

从 [Release 下载页](https://github.com/2969599542-sudo/vc-script-agent/releases/latest) 下载 `vc-script-agent-windows-x64.zip`，完整解压到一个单独的文件夹。包内 `先看这里.txt` 有逐步说明，`依赖安装程序` 目录包含 Windows x64 安装程序。

Windows：双击解压目录中的 `install.cmd`。也可以打开该目录的PowerShell，执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

此命令只为当前进程允许执行安装脚本，不修改全局执行策略。默认复制Agent到 `%USERPROFILE%\.codex\skills\vc-script-agent`（设置了CODEX_HOME时使用该目录），安装Node依赖及独立Python虚拟环境。FFmpeg随imageio-ffmpeg依赖安装，不覆盖系统FFmpeg。

macOS/Linux可执行 `node scripts/install.mjs`，需要系统中已有Node/npm和python3。当前版本的实际验收平台为Windows，其他平台提供兼容路径但尚未实机验收。

已存在同名Agent时安装器会停止，避免覆盖产品配置。更新请先备份自定义产品资料和旧Agent目录，使用新的空目录测试后再替换。模型及原视频不放入Agent目录。

安装中断时文件会保留；在目标Agent目录手动完成：

```powershell
npm ci
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r runtime\requirements.txt
```

## 3. 检查与调用

在已安装的Agent目录运行：

```powershell
node runtime\cli.mjs doctor
codex login status
```

如需要安装CLI，可使用 `npm install -g @openai/codex`，再执行 `codex login`。若桌面已提供可用CLI，不必重复安装。

在Codex新一轮对话使用 `$vc-script-agent` 并提供本地视频路径。亦可直接运行：

```powershell
node runtime\cli.mjs run --video "D:\视频\对标.mp4" --out "D:\脚本输出\任务001" --mode breakdown
node runtime\cli.mjs run --video "D:\视频\对标.mp4" --out "D:\脚本输出\任务002" --mode rewrite --product "VC素颜霜" --facts "D:\资料\products.json" --end 35
```

每次用新的输出目录；不能覆盖失败或结果未知的目录。`--end` 可选，表示第一段完整剧情的结束秒数，3–180秒；未提供会自动定位，边界不明时停止并提示补充。视频最长只预览180秒，最多240帧，文件至多200MiB。

`--transcript` 可指定UTF-8台词文件，内容应只属于分析范围。ASR不可用时会明确标明并尝试读取画面中真实可读对话；无法辨认时应保留具体证据缺口，不编造台词。

## 4. 补充产品资料

复制 `runtime/product-facts.json` 到自己的资料目录，填写对应产品的confirmed（已确认事实）、currentOffers（当前活动）、appearanceReference（产品外观）、visualDirection（AI视觉目标）。通过 `--facts` 指定该副本。不要把价格或活动示例当作确认事实。

## 可选环境变量

| 名称 | 用途 |
|---|---|
| CODEX_EXECUTABLE | Codex可执行文件路径；通常自动从PATH找到 |
| VC_MODEL | 本机账号可用模型；留空使用CLI默认 |
| VC_PYTHON | Python路径；默认使用Agent内独立虚拟环境 |
| VC_FFMPEG | FFmpeg路径；默认自动查找或使用Python依赖提供的版本 |
| VC_PRODUCT_FACTS | 自己的产品资料JSON；命令行--facts优先 |
| CODEX_HOME | 自定义Codex目录，同时影响默认安装位置和模型登录位置 |
| VC_NPM_CLI | 特殊便携Node环境的npm-cli.js路径，普通安装无需设置 |

本包不需要原系统的Webhook、签名密钥、网站写入密钥或群访问码。不自动加载 `.env`；如使用环境变量，请在当前终端设置。

## 故障处理

- 下载链接失效：打开最新 Release 页面，使用其 Assets 下的 Windows x64 ZIP。
- 环境检查失败：按提示补装Node/Python/Codex；不要从其他电脑复制登录文件。
- 模型未知结果：检查输出目录的status.json和已保存结果，不自动重复调用。已有完整result.json时可执行 `node runtime/cli.mjs export --out "输出目录"` 重新生成导出文件。
- 首段边界不明：用户核对视频后提供--end，不能无条件拆整片。
- 下载依赖或ASR模型失败：恢复网络后重试对应安装/模型下载步骤；保留原素材及诊断。

卸载：备份结果与自定义资料后，仅移除安装的vc-script-agent目录，不需要改动其他Codex功能。
