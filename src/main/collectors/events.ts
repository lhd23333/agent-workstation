import { readFileSync, existsSync, statSync } from 'fs'
import type { AgentEvent } from '../../shared/types'

// notify-popup 日志的事件行示例：
// 2026-10-06 10:36:16 INFO 通知 agent=claude event=stop title=任务完成 cwd=科研
// title 可能含空格 → 用惰性匹配到 " cwd=" 为止；cwd 是目录名（非完整路径）
const LINE_RE =
  /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) INFO 通知 agent=(\S+) event=(\S+) title=(.*?) cwd=(\S+)\s*$/

/**
 * 解析 notify-popup 日志，返回最近的事件（新→旧）。
 * v1 简化：读文件尾部 maxBytes；文件超大后再改为"记住偏移量增量读"。
 */
export function collectEvents(logPath: string, maxBytes = 256 * 1024): AgentEvent[] {
  if (!existsSync(logPath)) return []
  let text: string
  try {
    const size = statSync(logPath).size
    text = readFileSync(logPath, 'utf8')
    if (size > maxBytes) {
      text = text.slice(-maxBytes)
      text = text.slice(text.indexOf('\n') + 1) // 丢掉被切半的首行
    }
  } catch {
    return []
  }

  const events: AgentEvent[] = []
  for (const line of text.split('\n')) {
    const m = line.match(LINE_RE)
    if (m) {
      events.push({
        time: m[1],
        agent: m[2],
        event: m[3],
        title: m[4].trim(),
        cwdName: m[5]
      })
    }
  }
  return events.reverse().slice(0, 200) // 新→旧
}
