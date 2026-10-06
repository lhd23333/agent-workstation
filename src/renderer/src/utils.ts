/** "YYYY-MM-DD HH:mm:ss" → Date（手动解析，避免各引擎差异） */
export function parseTs(s: string): Date {
  const m = s.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
  if (!m) return new Date(0)
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
}

/** 人类可读的相对时间（如 "2 分钟前"） */
export function relTime(s: string | null): string {
  if (!s) return '无活动'
  const diff = Date.now() - parseTs(s).getTime()
  if (diff < 0) return '刚刚'
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

/** 最近 15 分钟内有事件视为活跃 */
export function isRecentlyActive(lastActivityAt: string | null): boolean {
  if (!lastActivityAt) return false
  return Date.now() - parseTs(lastActivityAt).getTime() < 15 * 60 * 1000
}

/** 取 "HH:mm" */
export function hhmm(time: string): string {
  const idx = time.indexOf(' ')
  return idx >= 0 ? time.slice(idx + 1, idx + 6) : time
}

/** agent 徽章配色（语义色 token，见 index.css；随主题自动切换） */
export function agentCls(agent: string): string {
  switch (agent) {
    case 'claude':
      return 'bg-c-orange-bg text-c-orange border-c-orange/30'
    case 'codex':
      return 'bg-c-green-bg text-c-green border-c-green/30'
    case 'pi':
      return 'bg-c-sky-bg text-c-sky border-c-sky/30'
    default:
      return 'bg-c-neutral-bg text-c-neutral border-c-neutral/30'
  }
}

/** 事件类型 → 展示文案与配色（对齐 notify-popup 的分级） */
export function eventMeta(ev: string): { label: string; cls: string } {
  switch (ev) {
    case 'stop':
      return { label: '完成', cls: 'text-c-green' }
    case 'permission':
      return { label: '等待授权', cls: 'text-c-amber' }
    case 'select':
    case 'prompt':
      return { label: '等待操作', cls: 'text-c-amber' }
    case 'error':
    case 'stop_failure':
      return { label: '出错', cls: 'text-c-red' }
    default:
      return { label: ev, cls: 'text-c-sky' }
  }
}

/** backlog 四态徽章配色 */
export const STATUS_CLS: Record<string, string> = {
  待办: 'bg-c-neutral-bg text-c-neutral border-c-neutral/30',
  进行中: 'bg-c-blue-bg text-c-blue border-c-blue/30',
  待审查: 'bg-c-amber-bg text-c-amber border-c-amber/30',
  已完成: 'bg-c-green-bg text-c-green border-c-green/30'
}
