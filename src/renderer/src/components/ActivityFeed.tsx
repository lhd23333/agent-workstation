import { useState } from 'react'
import type { JSX } from 'react'
import type { AgentEvent } from '../../../shared/types'
import { agentCls, eventMeta, hhmm } from '../utils'

interface Props {
  events: AgentEvent[]
}

/** 右栏：全局活动流（所有 agent 事件，新→旧） */
export default function ActivityFeed({ events }: Props): JSX.Element {
  const [onlyWaiting, setOnlyWaiting] = useState(false)
  const waiting = (ev: string): boolean => ['permission', 'select', 'prompt', 'error', 'stop_failure'].includes(ev)

  const shown = onlyWaiting ? events.filter((e) => waiting(e.event)) : events

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-[#1e232a] bg-[#0e1116]">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-[11px] font-semibold tracking-wider text-[#6b7480]">活动流</span>
        <button
          onClick={() => setOnlyWaiting((v) => !v)}
          className={`rounded border px-1.5 py-0.5 text-[10.5px] transition-colors ${
            onlyWaiting
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              : 'border-[#262c35] text-[#6b7480] hover:text-[#9aa3ad]'
          }`}
          title="只看等待操作 / 出错的事件"
        >
          只看待处理
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {shown.map((e, i) => {
          const meta = eventMeta(e.event)
          return (
            <div key={`${e.time}-${i}`} className="border-b border-[#161b21] py-1.5 last:border-0">
              <div className="flex items-center gap-1.5 text-[10.5px]">
                <span className="text-[#6b7480]">{hhmm(e.time)}</span>
                <span className={`rounded border px-1 py-px ${agentCls(e.agent)}`}>{e.agent}</span>
                <span className={meta.cls}>{meta.label}</span>
              </div>
              <div className="mt-0.5 truncate text-[11.5px] text-[#b8bfc7]" title={e.title}>
                {e.title || '—'}
              </div>
              <div className="truncate text-[10.5px] text-[#6b7480]">{e.cwdName}</div>
            </div>
          )
        })}
        {shown.length === 0 && (
          <div className="py-4 text-[11px] text-[#6b7480]">
            {onlyWaiting ? '没有待处理事件。' : '暂无事件（来自 notify-popup 日志）。'}
          </div>
        )}
      </div>
    </aside>
  )
}
