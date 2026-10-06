@echo off
rem 启动 agent 工作站（源码 dev 模式，改代码自动热更新；关闭此窗口即停止）
cd /d "%~dp0"
start "" cmd /k "npm run dev"
