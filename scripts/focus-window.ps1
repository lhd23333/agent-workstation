# focus-window.ps1 — 按关键词查找终端/编辑器窗口并切到前台
#
# 用法: pwsh -NoProfile -File focus-window.ps1 -Match "科研"
# 输出: 单行 JSON —— {"ok":true,"window":"标题","pid":123} 或 {"ok":false,"error":"…"}
#
# 说明: 窗口定位逻辑参考了本机 notify-popup 工具（未开源、不在此仓库）的实战经验——
#       按窗口标题关键词匹配 + 终端进程白名单 + AttachThreadInput 解锁前台。
#       v2 计划升级：ConPTY 反查 / 进程链锚点精确定位。
param(
    [Parameter(Mandatory = $true)][string]$Match
)

$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class W32Focus {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowTextW(IntPtr hWnd, StringBuilder sb, int max);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr unused);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
    [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();

    private static readonly string[] TerminalProcs = {
        "windowsterminal", "code", "code - insiders", "conhost", "openconsole",
        "powershell", "pwsh", "cmd", "mintty", "tabby", "warp", "alacritty", "wezterm-gui"
    };

    private static bool IsTerminal(string pname) {
        foreach (var t in TerminalProcs) if (pname == t) return true;
        return false;
    }

    private static string Esc(string s) {
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }

    public static string FindAndFocus(string match) {
        IntPtr found = IntPtr.Zero;
        string foundTitle = "";
        int foundPid = 0;

        EnumWindows((hwnd, lp) => {
            if (!IsWindowVisible(hwnd)) return true;
            var sb = new StringBuilder(512);
            GetWindowTextW(hwnd, sb, 512);
            string title = sb.ToString();
            if (string.IsNullOrEmpty(title)) return true;
            uint pid;
            GetWindowThreadProcessId(hwnd, out pid);
            string pname;
            try { pname = System.Diagnostics.Process.GetProcessById((int)pid).ProcessName.ToLowerInvariant(); }
            catch { return true; }
            if (!IsTerminal(pname)) return true;
            if (title.IndexOf(match, StringComparison.OrdinalIgnoreCase) >= 0) {
                found = hwnd; foundTitle = title; foundPid = (int)pid;
                return false; // 找到即停
            }
            return true;
        }, IntPtr.Zero);

        if (found == IntPtr.Zero)
            return "{\"ok\":false,\"error\":\"未找到标题包含「" + Esc(match) + "」的终端/编辑器窗口\"}";

        if (IsIconic(found)) ShowWindow(found, 9); // SW_RESTORE

        // 解锁前台限制：把当前线程挂到前台线程上再设前台
        uint fgThread = GetWindowThreadProcessId(GetForegroundWindow(), IntPtr.Zero);
        uint curThread = GetCurrentThreadId();
        AttachThreadInput(curThread, fgThread, true);
        bool ok = SetForegroundWindow(found);
        if (!ok) ok = BringWindowToTop(found);
        AttachThreadInput(curThread, fgThread, false);

        return "{\"ok\":" + (ok ? "true" : "false") +
               ",\"window\":\"" + Esc(foundTitle) + "\",\"pid\":" + foundPid + "}";
    }
}
'@

$result = [W32Focus]::FindAndFocus($Match)
Write-Output $result
