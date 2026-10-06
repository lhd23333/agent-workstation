import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { AppState } from '../../shared/types'
import ProjectList from './components/ProjectList'
import ProjectDetail from './components/ProjectDetail'
import ActivityFeed from './components/ActivityFeed'
import ThemeToggle from './components/ThemeToggle'

type Theme = 'dark' | 'light'

/** 三栏总控台：项目列表 ｜ 项目详情 ｜ 活动流 */
export default function App(): JSX.Element {
  const [state, setState] = useState<AppState | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // 主题：手动切换优先（持久化到 localStorage）；否则跟随系统
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('aw-theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = (): void => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('aw-theme', next)
  }

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
      <div className="flex h-full items-center justify-center text-[12px] text-c-red">
        状态拉取失败：{error}
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
        <ProjectList projects={state?.projects ?? []} selected={selected} onSelect={setSelected} />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
      <ProjectDetail project={current} />
      <ActivityFeed events={state?.events ?? []} />
    </div>
  )
}
