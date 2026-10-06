import { useState } from 'react'
import type { JSX, ReactNode } from 'react'
import type { ProjectInfo } from '../../../shared/types'
import { agentCls, eventMeta, hhmm, relTime, STATUS_CLS } from '../utils'

interface Props {
  project: ProjectInfo | null
}

/** 中栏：当前项目详情 = 计划（backlog）+ agent 活动 + git */
export default function ProjectDetail({ project }: Props): JSX.Element {
  const [feedback, setFeedback] = useState<string | null>(null)

  if (!project) {
    return (
      <main className="flex flex-1 items-center justify-center text-[12px] text-fg-faint">
        左侧选择一个项目
      </main>
    )
  }

  const flash = (text: string): void => {
    setFeedback(text)
    window.setTimeout(() => setFeedback((cur) => (cur === text ? null : cur)), 3000)
  }

  const onFocus = async (): Promise<void> => {
    const r = await window.api.focusProject(project.path)
    if (r.ok) flash(`已切换到窗口：${r.window ?? ''}`)
    else flash(`未找到窗口（${r.error ?? '未知原因'}）`)
  }

  const plan = project.plan
  const git = project.git

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-bg">
      {/* 项目头 */}
      <div className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-[15px] font-semibold text-fg">{project.name}</h1>
          {!project.exists && (
            <span className="rounded border border-c-red/40 bg-c-red-bg px-1.5 py-0.5 text-[10.5px] text-c-red">
              目录不存在
            </span>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              onClick={onFocus}
              className="rounded-md border border-line-strong px-2 py-1 text-[11px] text-fg-muted transition-colors hover:border-fg-faint hover:text-fg"
              title="把该项目最近活跃的终端/编辑器窗口切到前台"
            >
              ⛳ 聚焦窗口
            </button>
            {project.panelUrl && (
              <button
                onClick={() => void window.api.openPanel(project.panelUrl!)}
                className="rounded-md border border-line-strong px-2 py-1 text-[11px] text-fg-muted transition-colors hover:border-fg-faint hover:text-fg"
                title="在浏览器打开该项目自带的 web 面板"
              >
                打开面板
              </button>
            )}
            <button
              onClick={() => void window.api.openPath(project.path)}
              className="rounded-md border border-line-strong px-2 py-1 text-[11px] text-fg-muted transition-colors hover:border-fg-faint hover:text-fg"
            >
              打开目录
            </button>
          </div>
        </div>
        <div className="mt-0.5 truncate text-[10.5px] text-fg-faint">{project.path}</div>
        {feedback && <div className="mt-1 text-[10.5px] text-c-sky">{feedback}</div>}
      </div>

      {/* 计划（backlog） */}
      <section className="px-4 pt-3">
        <SectionTitle>计划 · backlog</SectionTitle>
        {plan ? (
          <>
            <div className="mt-1.5 flex gap-2">
              <CountChip label="待办" n={plan.counts.todo} cls="text-c-neutral" />
              <CountChip label="进行中" n={plan.counts.inProgress} cls="text-c-blue" />
              <CountChip label="待审查" n={plan.counts.review} cls="text-c-amber" />
              <CountChip label="已完成" n={plan.counts.done} cls="text-c-green" />
            </div>
            <div className="mt-2 space-y-1">
              {plan.current.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5"
                >
                  <span className="shrink-0 font-mono text-[10.5px] text-fg-faint">{t.id}</span>
                  <span className="truncate text-[12px] text-fg">{t.title}</span>
                  <span
                    className={`ml-auto shrink-0 rounded border px-1.5 py-0.5 text-[10.5px] ${
                      STATUS_CLS[t.status] ?? 'border-c-neutral/30 text-c-neutral'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
              {plan.current.length === 0 && (
                <div className="text-[11px] text-fg-faint">当前没有进行中/待审查的任务。</div>
              )}
            </div>
          </>
        ) : (
          <div className="mt-1 text-[11px] text-fg-faint">该项目没有 backlog 计划目录。</div>
        )}
      </section>

      {/* agent 活动 */}
      <section className="px-4 pt-4">
        <SectionTitle>agent 活动 · {project.recentEvents.length > 0 ? `最近 ${relTime(project.lastActivityAt)}` : '无'}</SectionTitle>
        <div className="mt-1.5 space-y-1">
          {project.recentEvents.map((e, i) => {
            const meta = eventMeta(e.event)
            return (
              <div
                key={`${e.time}-${i}`}
                className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5"
              >
                <span className="shrink-0 text-[10.5px] text-fg-faint">{hhmm(e.time)}</span>
                <span className={`shrink-0 rounded border px-1 py-px text-[10.5px] ${agentCls(e.agent)}`}>
                  {e.agent}
                </span>
                <span className={`shrink-0 text-[11px] ${meta.cls}`}>{meta.label}</span>
                <span className="truncate text-[11.5px] text-fg-muted">{e.title}</span>
              </div>
            )
          })}
          {project.recentEvents.length === 0 && (
            <div className="text-[11px] text-fg-faint">
              最近没有来自该目录的 agent 事件（数据源：notify-popup 日志）。
            </div>
          )}
        </div>
      </section>

      {/* git */}
      <section className="px-4 pt-4 pb-6">
        <SectionTitle>git</SectionTitle>
        {git ? (
          <>
            <div className="mt-1.5 flex items-center gap-2 text-[11px]">
              <span className="rounded border border-line-strong px-1.5 py-0.5 font-mono text-[10.5px] text-fg-muted">
                {git.branch}
              </span>
              {git.dirty > 0 && <span className="text-c-amber">未提交 {git.dirty}</span>}
              {git.ahead > 0 && <span className="text-c-sky">↑{git.ahead}</span>}
              {git.behind > 0 && <span className="text-c-red">↓{git.behind}</span>}
              {git.dirty === 0 && git.ahead === 0 && <span className="text-c-green">工作区干净</span>}
            </div>
            <pre className="mt-2 overflow-x-auto rounded-md border border-line bg-surface p-2.5 font-mono text-[11px] leading-[1.5] text-fg-muted">
              {git.graphLines.map((line, i) => (
                <div key={i}>{highlightRefs(line)}</div>
              ))}
            </pre>
          </>
        ) : (
          <div className="mt-1 text-[11px] text-fg-faint">不是 git 仓库（或 git 不可用）。</div>
        )}
      </section>
    </main>
  )
}

function SectionTitle({ children }: { children: ReactNode }): JSX.Element {
  return <h2 className="text-[11px] font-semibold tracking-wider text-fg-faint">{children}</h2>
}

function CountChip({ label, n, cls }: { label: string; n: number; cls: string }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1">
      <span className={`text-[13px] font-semibold ${cls}`}>{n}</span>
      <span className="text-[10.5px] text-fg-faint">{label}</span>
    </div>
  )
}

/** git graph 行内的 refs（HEAD -> main, origin/main …）染色 */
function highlightRefs(line: string): JSX.Element {
  const parts = line.split(/(\(.*?\))/)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('(') ? (
          <span key={i} className="text-accent">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  )
}
