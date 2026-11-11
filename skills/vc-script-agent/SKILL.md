---
name: vc-script-agent
description: 拆解本地短视频开头第一段完整剧情，做保留剧情的产品替换或独立新剧情迭代，生成含真实原片截图的四列脚本及离线HTML和TSV。用于视频脚本拆解、对标改编和AI视频制作脚本，不用于直播监测或日报。
---

# VC脚本Agent

三个模式：`breakdown` 忠实拆解；`rewrite` 仅替换产品相关内容；`iterate` 创作新剧情。未指定模式时用拆解。转换和迭代需要指定产品，不混用活动。

先运行本目录 `node runtime/cli.mjs doctor`。缺少依赖时在本目录执行 `npm ci`、`python -m venv .venv`（macOS/Linux用python3），再用 `.venv/Scripts/python.exe -m pip install -r runtime/requirements.txt`（macOS/Linux为 `.venv/bin/python`）。不要复制其他电脑的登录、API密钥、浏览器数据或群访问码。核心处理只需本地视频，不依赖蝉妈妈、Tabbit或原网站。输入视频应为用户有权使用的MP4、MOV或WebM，至多200MiB。

## 执行

用绝对路径替换示例中的路径。每次任务选一个全新的输出目录；保留旧任务和证据。`run` 使用本机Codex CLI和本机账号，可通过 `VC_MODEL` 指定账号可用的模型，否则采用CLI默认模型。图像和台词会发送给该模型服务。

```text
node runtime/cli.mjs run --video /absolute/video.mp4 --out /absolute/output/new-job --mode breakdown
node runtime/cli.mjs run --video /absolute/video.mp4 --out /absolute/output/new-conversion --mode rewrite --product VC素颜霜 --facts /absolute/products.json
node runtime/cli.mjs run --video /absolute/video.mp4 --out /absolute/output/new-iteration --mode iterate --product VC气垫 --facts /absolute/products.json
```

可加 `--end 35` 指定第一段结束秒数（3–180），`--transcript /absolute/dialogue.txt` 提供该范围准确台词。未指定时先定位第一段；180秒只是预览上限。若首段仍不完整、边界不清或开头没有剧情，应说明具体问题，不擅自拆后面的拼接剧情。首段包括其中的产品讲解和促销。

模型调用结束不明时 `status.json` 为uncertain：先检查该目录中已写出的模型结果和诊断，不自动重跑或换新目录绕过。如果已有完整 `result.json`，用export核验和导出；确需重新推理时告诉用户可能再次消耗额度并取得其明确指示。

## 在当前对话中直接分析

若本机没有可调用的Codex CLI，但当前Agent能读取图片，可用 `prepare` 提取证据（不调用模型），读取 `job.json`、`instructions.txt`、`frames/manifest.json`、联系表及必要原图。在当前对话完成同样的分析，并保存符合 `runtime/result.mjs` 的result.json，再执行export。不得只看文件名或台词就声称画面已核验。

`prepare` 未指定结束时会提取最多180秒预览。先据此识别首段；确定结束后用新目录加 `--end` 再提取首段，最终只描述首段证据。不能把预览全片当作分析范围。手工结果每行frames须引用manifest里真实index和seconds。

```text
node runtime/cli.mjs prepare --video /absolute/video.mp4 --out /absolute/output/evidence --end 35
node runtime/cli.mjs export --out /absolute/output/evidence --result /absolute/result.json
```

## 质量约束

读取 [表达规则](runtime/voice-guide.md)。拆解不得改台词或虚构动作；转换保留原意、镜头、时间、截图，只局部替换产品短片段；迭代明确标为新创作，原图是参考。四列固定为景别、画面描述、搭配文案、对标画面截图。景别下方显示镜头编号，画面描述下方显示时间，截图并排并在下方显示原帧时间。AI生成细节和转场备注保存在JSON。

每行引用1–3张真实原帧。联系表为采样，不保证逐帧覆盖，不能从静态帧猜瞬时动作。原声缺漏可由画面中清晰可读的对话字幕补齐；最终描述不包含字幕、水印、角标说明。证据不足集中列出具体问题，不编造台词或时点。

`runtime/product-facts.json` 仅是产品名模板。转换或迭代前收集当前产品资料，另存用户自己的JSON并通过 `--facts` 传入；不同安装者不能沿用原作者历史活动。用户明确许可保留原有效果口播时才设置draftPolicy.retainSourceEffects。产品资料、价格、活动和外观缺口合并主动询问，不把未证实内容加入产品事实。

交付 `script.html`（图像内嵌，可离线编辑并另存）、`script.tsv` 和 `result.json`，附范围和关键未决项。读回status确认成功，不把部分产物称为完成。HTML编辑不会自动改写JSON或TSV。
