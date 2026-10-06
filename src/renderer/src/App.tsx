import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { AppState } from '../../shared/types'
import ProjectList from './components/ProjectList'
import ProjectDetail from './components/ProjectDetail'
import ActivityFeed from './components/ActivityFeed'

/** 三栏总控台：项目列表 ｜ 项目详情 ｜ 活动流 */
export default function App(): JSX.Element {
  const [state, setState] = useState<AppState | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const load = async (): Promise<void> => {
      try {
        const s = await window.api.getState()
        if (!alive) return
        setState(s)
        setError(null)
        setSelected((cur) => cur ?? s.projects[0]?.path ?? null)
      } catch (e) {
        if (alive) setError(String(e))
      }
    }
    void load()
    const timer = window.setInterval(load, 5000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  const current = state?.projects.find((p) => p.path === selected) ?? null

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-red-300">
        状态拉取失败：{error}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <ProjectList projects={state?.projects ?? []} selected={selected} onSelect={setSelected} />
      <ProjectDetail project={current} />
      <ActivityFeed events={state?.events ?? []} />
    </div>
  )
}
