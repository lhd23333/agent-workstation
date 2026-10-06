// 主进程与渲染进程共享的数据类型（主进程采集 → IPC → 前端渲染）

/** 任务卡摘要（来自项目 backlog/tasks/*.md 的 frontmatter） */
export interface TaskBrief {
  id: string
  title: string
  status: string
  milestone: string | null
}

/** 项目的计划摘要（Backlog.md 数据） */
export interface PlanSummary {
  counts: {
    todo: number
    inProgress: number
    review: number
    done: number
  }
  /** 进行中 + 待审查的卡（主视图展示用） */
  current: TaskBrief[]
}

/** 项目的 git 摘要 */
export interface GitSummary {
  branch: string
  dirty: number
  ahead: number
  behind: number
  /** git log --graph --oneline --decorate 的原始行（前端等宽渲染） */
  graphLines: string[]
}

/** 一条 agent 事件（来自 notify-popup 日志） */
export interface AgentEvent {
  /** 原始时间戳 "YYYY-MM-DD HH:mm:ss" */
  time: string
  agent: string
  event: string
  title: string
  /** 事件里的工作目录名（非完整路径） */
  cwdName: string
}

/** 工作站的单个项目（一个工作目录 = 一个项目） */
export interface ProjectInfo {
  name: string
  path: string
  exists: boolean
  plan: PlanSummary | null
  git: GitSummary | null
  /** 可选：该项目自带的 web 面板（如科研板的 :6420） */
  panelUrl: string | null
  /** 该项目名下最近的事件（最多 10 条，新→旧） */
  recentEvents: AgentEvent[]
  /** 最近一次事件时间（原始字符串），无事件为 null */
  lastActivityAt: string | null
}

/** 渲染进程一次拉取的完整状态 */
export interface AppState {
  projects: ProjectInfo[]
  /** 全局活动流（所有项目 + 未归属事件的合并，新→旧，最多 50 条） */
  events: AgentEvent[]
  generatedAt: string
}

/** 窗口聚焦结果 */
export interface FocusResult {
  ok: boolean
  window?: string
  error?: string
}
