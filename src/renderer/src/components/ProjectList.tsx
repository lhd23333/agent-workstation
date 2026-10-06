import type { JSX } from 'react'
import type { ProjectInfo } from '../../../shared/types'
import { isRecentlyActive, relTime } from '../utils'

interface Props {
  projects: ProjectInfo[]
  selected: string | null
  onSelect: (path: string) => void
}

/** 左栏：项目列表（一个工作目录 = 一个项目）。外层宽度/背景由 App 的容器提供。 */
export default function ProjectList({ projects, selected, onSelect }: Props): JSX.Element {
  const activeCount = projects.filter((p) => isRecentlyActive(p.lastActivityAt)).length

  return (
    <aside className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="text-[11px] font-semibold tracking-wider text-fg-faint">项目</span>
        <span className="text-[11px] text-fg-faint">
          {activeCount > 0 && <span className="mr-1 text-c-green">● {activeCount} 活跃</span>}
          {projects.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {projects.map((p) => {
          const active = isRecentlyActive(p.lastActivityAt)
          const isSel = p.path === selected
          return (
            <button
              key={p.path}
              onClick={() => onSelect(p.path)}
              className={`mb-0.5 w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                isSel ? 'bg-surface-sel' : 'hover:bg-surface-hover'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    active ? 'animate-pulse bg-c-green' : p.exists ? 'bg-fg-faint/50' : 'bg-c-red/70'
                  }`}
                />
                <span className={`truncate text-[12.5px] ${isSel ? 'text-fg' : 'text-fg-muted'}`}>
                  {p.name}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 pl-3.5 text-[10.5px] text-fg-faint">
                {p.plan && (
                  <span>
                    计划 {p.plan.counts.done}/{p.plan.counts.done + p.plan.counts.inProgress + p.plan.counts.review + p.plan.counts.todo}
                  </span>
                )}
                {p.git && <span>{p.git.branch}</span>}
                <span className="ml-auto">{relTime(p.lastActivityAt)}</span>
              </div>
            </button>
          )
        })}
        {projects.length === 0 && (
          <div className="px-2 py-4 text-[11px] leading-relaxed text-fg-faint">
            还没有登记项目。
            <br />
            在仓库根目录编辑 projects.json 添加工作目录。
          </div>
        )}
      </div>
    </aside>
  )
}
