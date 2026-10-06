import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join, basename } from 'path'
import { existsSync, writeFileSync } from 'fs'
import { spawn } from 'child_process'
import { loadConfig } from './config'
import { collectPlan } from './collectors/plan'
import { collectGit } from './collectors/git'
import { collectEvents } from './collectors/events'
import type { AppState, ProjectInfo, FocusResult } from '../shared/types'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    title: 'agent 工作站',
    backgroundColor: '#141210',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 诊断：加载失败 / 渲染器 console 转发到主进程终端（排查黑屏必备）
  win.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[renderer] 加载失败: ${code} ${desc} url=${url}`)
  })
  win.webContents.on('render-process-gone', (_e, details) => {
    console.error(`[renderer] 进程异常退出: ${details.reason}`)
  })
  win.webContents.on('console-message', (event) => {
    console.log(`[renderer:${event.level}] ${event.message} (${event.sourceId}:${event.lineNumber})`)
  })

  // 开发辅助：AW_CAPTURE=1 启动约 6 秒后，分别以亮色 / 暗色各截一张页面自渲染图。
  // 用 capturePage 而非屏幕截图，绕开 DPI 缩放、窗口遮挡、z 序的一切干扰——拿到的就是页面真实渲染内容。
  if (process.env.AW_CAPTURE === '1') {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        const docs = join(app.getAppPath(), 'docs')
        const snap = async (name: string): Promise<void> => {
          const img = await win.webContents.capturePage()
          writeFileSync(join(docs, name), img.toPNG())
          console.log(`[main] 页面自截图已存: ${name}`)
        }
        try {
          // 通过真实点击切换主题（React state 与 DOM class 同步，截图与用户所见完全一致）
          const clickToggle = `(()=>{const b=document.querySelector("button[title='切换暗色 / 亮色皮肤']");if(b)b.click();return null})()`
          const isDark = (await win.webContents.executeJavaScript(
            "document.documentElement.classList.contains('dark')"
          )) as boolean
          if (isDark) await win.webContents.executeJavaScript(clickToggle)
          await new Promise((r) => setTimeout(r, 600))
          await snap('self-capture-light.png')
          await win.webContents.executeJavaScript(clickToggle)
          await new Promise((r) => setTimeout(r, 600))
          await snap('self-capture-dark.png')
          if (!isDark) await win.webContents.executeJavaScript(clickToggle)
        } catch (e) {
          console.error(`[main] 自截图失败: ${e}`)
        }
      }, 6000)
    })
  }

  // electron-vite dev 模式注入 ELECTRON_RENDERER_URL（支持热更新）
  const rendererUrl = process.env.ELECTRON_RENDERER_URL
  console.log(`[main] 渲染器入口: ${rendererUrl ?? '(无 ELECTRON_RENDERER_URL，回退本地文件)'}`)
  if (rendererUrl) {
    win.loadURL(rendererUrl)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** 聚合一次全量状态（渲染进程每 5 秒拉一次） */
async function buildState(): Promise<AppState> {
  const root = app.getAppPath()
  const cfg = loadConfig(root)
  const allEvents = cfg.settings.notifyLogPath ? collectEvents(cfg.settings.notifyLogPath) : []

  const projects: ProjectInfo[] = []
  for (const p of cfg.projects) {
    const exists = existsSync(p.path)
    const dirName = basename(p.path).toLowerCase()
    // 事件里的 cwd 是目录名（非完整路径）→ 按 basename 归属项目
    const mine = allEvents.filter((e) => e.cwdName.toLowerCase() === dirName)
    projects.push({
      name: p.name,
      path: p.path,
      exists,
      plan: exists ? collectPlan(p.path) : null,
      git: exists ? await collectGit(p.path) : null,
      panelUrl: p.panelUrl ?? null,
      recentEvents: mine.slice(0, 10),
      lastActivityAt: mine[0]?.time ?? null
    })
  }

  return {
    projects,
    events: allEvents.slice(0, 50),
    generatedAt: new Date().toISOString()
  }
}

/** 按项目路径聚焦其终端/编辑器窗口（调 scripts/focus-window.ps1） */
function focusProject(projectPath: string): Promise<FocusResult> {
  const dirName = basename(projectPath)
  const script = join(app.getAppPath(), 'scripts', 'focus-window.ps1')
  return new Promise((resolve) => {
    const ps = spawn(
      'pwsh',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Match', dirName],
      { windowsHide: true }
    )
    let out = ''
    let err = ''
    ps.stdout.on('data', (d) => (out += d.toString()))
    ps.stderr.on('data', (d) => (err += d.toString()))
    ps.on('close', () => {
      const lastLine = out.trim().split('\n').pop() ?? ''
      try {
        resolve(JSON.parse(lastLine) as FocusResult)
      } catch {
        resolve({ ok: false, error: err.trim() || '聚焦脚本无有效输出' })
      }
    })
    ps.on('error', () => resolve({ ok: false, error: '无法启动 pwsh' }))
  })
}

function registerIpc(): void {
  ipcMain.handle('get-state', () => buildState())
  ipcMain.handle('focus-project', (_e, path: string) => focusProject(path))
  ipcMain.handle('open-panel', (_e, url: string) => shell.openExternal(url))
  ipcMain.handle('open-path', (_e, p: string) => shell.openPath(p))
}

// 单实例锁：再双击启动器时不开第二个窗口，而是把已有窗口带到前台
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    registerIpc()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
