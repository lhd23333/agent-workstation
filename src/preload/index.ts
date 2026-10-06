import { contextBridge, ipcRenderer } from 'electron'
import type { AppState, FocusResult } from '../shared/types'

const api = {
  /** 拉取一次全量状态（项目 + 事件流） */
  getState: (): Promise<AppState> => ipcRenderer.invoke('get-state'),
  /** 聚焦某项目的终端/编辑器窗口 */
  focusProject: (path: string): Promise<FocusResult> => ipcRenderer.invoke('focus-project', path),
  /** 在系统浏览器打开项目自带的 web 面板 */
  openPanel: (url: string): Promise<void> => ipcRenderer.invoke('open-panel', url),
  /** 在资源管理器中打开项目目录 */
  openPath: (p: string): Promise<void> => ipcRenderer.invoke('open-path', p)
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
