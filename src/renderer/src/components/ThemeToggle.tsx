import type { JSX } from 'react'

interface Props {
  theme: 'dark' | 'light'
  onToggle: () => void
}

/** 左栏底部：暗色 / 亮色皮肤切换 */
export default function ThemeToggle({ theme, onToggle }: Props): JSX.Element {
  const dark = theme === 'dark'
  return (
    <div className="border-t border-line px-2.5 py-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-[11px] text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
        title="切换暗色 / 亮色皮肤"
      >
        {dark ? (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        ) : (
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
          </svg>
        )}
        <span>{dark ? '暗色皮肤' : '亮色皮肤'}</span>
      </button>
    </div>
  )
}
