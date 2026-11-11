# VC脚本Agent

从「VC中情局」独立提取的视频脚本Agent，可在其他电脑的Codex中安装和使用。核心输入为本地视频，无需原日报网站、群访问码或原电脑在线。

## 安装入口

从 [最新 Release](https://github.com/2969599542-sudo/vc-script-agent/releases/latest) 下载 `vc-script-agent-windows-x64.zip`，完整解压。包内的 `先看这里.txt` 有完整安装与使用步骤。Windows 安装入口为 `install.cmd`，已具备的依赖可以跳过。

如果由 Codex 协助安装，可以在对话中输入：

> 请从这个仓库的最新 Release 下载 VC 脚本拆解 Windows x64 安装包，解压后阅读“先看这里.txt”，检查这台电脑的 Node.js、npm 和 Python，再安装缺少的组件及 vc-script-agent。安装后运行环境检查并告诉我如何开始拆解。

## 包含功能

| 功能 | 行为 |
|---|---|
| 原片拆解 | 只拆开头第一段完整剧情，包含该段产品讲解、演示和促销 |
| 产品替换 | 保留原剧情、镜头、时间和截图，只替换产品相关短片段 |
| 剧情迭代 | 参考第一段原片创作新剧情，明确区分创作与原片证据 |
| 视频证据 | 常规每秒采样并补充明显切镜，最多180秒、240帧；生成联系表 |
| 台词 | 本地语音识别，可用用户台词文件替代，画面可读对话字幕补缺 |
| 导出 | 四列表格、真实原片截图、离线HTML、可编辑另存、TSV、JSON |
| 可靠性 | 产品转换复用原片分析缓存；已有任务目录不覆盖；未知模型结果不重跑 |

产品名默认包含VC素颜霜和VC气垫，也可用自定义JSON增加产品。历史促销与原电脑上的产品文档没有打包。安装者需确认自己的当前产品资料，避免把历史活动当成现行活动。

这是本地Agent和命令行工具包，不包含原日报/直播监测、钉钉机器人、原网页队列或蝉妈妈账号。网页素材链接需先在自己获授权的来源下载为本地视频。不会自动给其他电脑配置账号。

## 使用

安装后，在Codex的新一轮对话中：

> 用 $vc-script-agent 拆解 D:\视频\对标.mp4 的第一段完整剧情，输出带原片截图的四列脚本。

> 用 $vc-script-agent 将该视频转换为VC素颜霜，只替换产品相关内容，保留原剧情。产品资料在 D:\资料\products.json。

> 用 $vc-script-agent 参考这段视频，为VC气垫迭代一个新剧情。

命令行示例见INSTALL.md。导出的 `script.html` 内嵌图片，断网也可以查看；点击文字可编辑，点击保存按钮下载新副本。网页编辑不回写JSON和TSV。TSV的截图列记录原帧时间，图片内嵌在HTML中。截图始终是原片，不是替换后的产品图。

## 数据与模型

语音识别在本机CPU运行，首次使用会下载Whisper small模型。图像联系表与台词会通过本机Codex发给其模型服务，使用该电脑自己的账号额度；不是免费离线大模型。`VC_MODEL` 可选，默认使用安装电脑的CLI默认模型，不把原作者专用模型写死。

结果保存在用户指定目录。请不要把视频、生成脚本、产品私有资料、模型缓存、登录信息和真实 `.env` 提交到GitHub。包内只有源码、规则、空配置模板和依赖清单。

## 开发与验证

```text
cd skills/vc-script-agent
npm ci
npm test
node runtime/cli.mjs doctor
```

工程结构：`skills/vc-script-agent/runtime/` 为独立处理器，`SKILL.md` 为Agent工作流，`plugin.json` 为便于支持Agent Plugins格式的客户端识别的元数据。实际跨电脑安装以INSTALL.md中已验证的本地Skill安装流程为准。

基于 [OpenAI 官方 Skill 格式](https://learn.chatgpt.com/docs/build-skills)。
