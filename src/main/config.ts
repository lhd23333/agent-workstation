import { readFileSync } from 'fs'
import { join } from 'path'

/** 单个项目的登记项（projects.json） */
export interface ProjectConfig {
  name: string
  path: string
  /** 可选：该项目自带的 web 面板地址 */
  panelUrl?: string
}

export interface Settings {
  /** notify-popup 的事件日志路径（活跃 agent 数据源） */
  notifyLogPath?: string
}

export interface WorkstationConfig {
  settings: Settings
  projects: ProjectConfig[]
}

const DEFAULT_SETTINGS: Settings = {
  // 事件日志路径由本地 projects.json 提供；缺省为空 = 无活动流（其余功能不受影响）
  notifyLogPath: ''
}

/** 读取仓库根目录下的 projects.json（缺失字段用默认值兜底） */
export function loadConfig(root: string): WorkstationConfig {
  try {
    const raw = JSON.parse(readFileSync(join(root, 'projects.json'), 'utf8'))
    return {
      settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
      projects: raw.projects ?? []
    }
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, projects: [] }
  }
}
