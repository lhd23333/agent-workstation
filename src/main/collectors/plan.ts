import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { PlanSummary, TaskBrief } from '../../shared/types'

const STATUS_TODO = '待办'
const STATUS_DOING = '进行中'
const STATUS_REVIEW = '待审查'
const STATUS_DONE = '已完成'

/** 解析单张任务卡的 frontmatter（前 40 行），逻辑与科研仓库 backlog面板/notify-bridge.ps1 对齐 */
function parseTask(fullPath: string): TaskBrief | null {
  let text: string
  try {
    text = readFileSync(fullPath, 'utf8')
  } catch {
    return null
  }
  const head = text.split('\n').slice(0, 40)
  if (head.length < 3 || head[0].replace(/^﻿/, '').trim() !== '---') return null
  let id = ''
  let title = ''
  let status = ''
  let milestone = ''
  for (let i = 1; i < head.length; i++) {
    const line = head[i]
    if (line.trim() === '---') break
    const idm = line.match(/^id:\s*(.+)$/)
    const tm = line.match(/^title:\s*(.+)$/)
    const sm = line.match(/^status:\s*(.+)$/)
    const mm = line.match(/^milestone:\s*(.+)$/)
    if (idm) id = idm[1].trim().replace(/^'|'$/g, '')
    else if (tm) title = tm[1].trim().replace(/^'|'$/g, '')
    else if (sm) status = sm[1].trim().replace(/^'|'$/g, '')
    else if (mm) milestone = mm[1].trim().replace(/^'|'$/g, '')
  }
  if (!id) return null
  return { id, title, status, milestone: milestone || null }
}

/** 采集项目的计划摘要；无 backlog 目录返回 null */
export function collectPlan(projectPath: string): PlanSummary | null {
  const tasksDir = join(projectPath, 'backlog', 'tasks')
  if (!existsSync(tasksDir)) return null
  const tasks: TaskBrief[] = []
  for (const f of readdirSync(tasksDir)) {
    if (!f.endsWith('.md')) continue
    const t = parseTask(join(tasksDir, f))
    if (t) tasks.push(t)
  }
  const count = (s: string): number => tasks.filter((t) => t.status === s).length
  return {
    counts: {
      todo: count(STATUS_TODO),
      inProgress: count(STATUS_DOING),
      review: count(STATUS_REVIEW),
      done: count(STATUS_DONE)
    },
    current: tasks.filter((t) => t.status === STATUS_DOING || t.status === STATUS_REVIEW)
  }
}
