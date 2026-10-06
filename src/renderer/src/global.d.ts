/// <reference types="vite/client" />

import type { AppState, FocusResult } from '../../shared/types'

declare global {
  interface Window {
    api: {
      getState(): Promise<AppState>
      focusProject(path: string): Promise<FocusResult>
      openPanel(url: string): Promise<void>
      openPath(p: string): Promise<void>
    }
  }
}

export {}
