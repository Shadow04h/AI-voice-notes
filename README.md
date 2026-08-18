# Memo AI — Vibe Coding 移动端 Demo

一个面向学生与职场场景的 AI 语音笔记 App：录下语音后，将内容整理为转写文本、摘要和可执行待办。

## 功能演示

- 真机麦克风录音（Expo Audio）
- 录音结束后展示 AI 转写、摘要与待办提取结果
- 本地保存笔记，支持笔记内容搜索
- 移动端优先的笔记列表与详情页 UI

当前版本的 AI 输出使用演示数据，便于面试时离线、稳定展示。接入真实模型时，只需将 `App.js` 的 `DEMO_TRANSCRIPT` 替换为 Whisper/通义/豆包等转写 API 的响应，再将摘要与待办字段替换为 LLM 返回值。

## 本地运行（VS Code）

你当前 Node 的实际目录是 `D:\nodejs\node-v24.19.0-win-x64`。在 VS Code 的 PowerShell 终端执行：

```powershell
$env:Path = 'D:\nodejs\node-v24.19.0-win-x64;' + $env:Path
npm.cmd install
npx.cmd expo install --fix
npm.cmd run android
```

手机端可先安装 Expo Go；或者在 Android Studio 模拟器启动后运行上述命令。首次运行请允许麦克风权限。

## 90 秒录屏脚本

1. 打开首页，展示「把语音，变成行动」和已有笔记。
2. 点击“开始一条语音笔记”，说一段会议或课程内容，录制约 8 秒。
3. 点击停止，展示“AI 正在整理”。
4. 自动跳到详情页，依次展示 AI 摘要、行动事项与原始转写。
5. 返回首页，在搜索框输入“原型”，展示笔记检索。

## Vibe Coding 记录

本项目由 VS Code + AI 编程助手协作开发。开发时将需求拆为：移动端信息架构、录音状态机、笔记本地持久化、AI 结果数据结构和录屏演示路径；每一部分独立生成后，在真机上进行交互验证与视觉微调。
