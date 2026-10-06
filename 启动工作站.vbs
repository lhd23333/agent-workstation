' agent-workstation launcher -- double-click to open the app window.
' Runs "npm run dev" in a hidden console: source mode, always the latest code.
' Closing the app window stops everything.
' Startup log: %TEMP%\agent-workstation-dev.log
Option Explicit

Dim shell, fso, here, logPath, cmd
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

here = fso.GetParentFolderName(WScript.ScriptFullName)
logPath = shell.ExpandEnvironmentStrings("%TEMP%") & "\agent-workstation-dev.log"

cmd = "cmd /c cd /d """ & here & """ && npm run dev > """ & logPath & """ 2>&1"
shell.Run cmd, 0, False
