import { execFile } from 'child_process'
import { promisify } from 'util'
import type { GitSummary } from '../../shared/types'

const pexec = promisify(execFile)
const OPTS = { maxBuffer: 4 * 1024 * 1024, windowsHide: true, timeout: 15_000 }

/**
 * 采集项目的 git 摘要（直接调 git CLI，不引重库）。
 * 非 git 目录 / 命令失败 → null。
 */
export async function collectGit(projectPath: string): Promise<GitSummary | null> {
  try {
    const { stdout: statusOut } = await pexec(
      'git',
      ['-C', projectPath, 'status', '--porcelain=v1', '-b'],
      OPTS
    )
    const lines = statusOut.split('\n').filter((l) => l.trim() !== '')
    const head = lines[0] ?? ''
    let branch = ''
    let ahead = 0
    let behind = 0
    // 形如 "## main...origin/main [ahead 2, behind 1]" / "## main" / "## HEAD (no branch)"
    const m = head.match(/^##\s+([^.\s]+)(?:\.\.\.\S+)?(?:\s\[(.+)\])?/)
    if (m) {
      branch = m[1]
      const ab = m[2] ?? ''
      const am = ab.match(/ahead (\d+)/)
      const bm = ab.match(/behind (\d+)/)
      if (am) ahead = Number(am[1])
      if (bm) behind = Number(bm[1])
    }
    const dirty = Math.max(0, lines.length - 1)

    const { stdout: graphOut } = await pexec(
      'git',
      ['-C', projectPath, 'log', '--graph', '--oneline', '--decorate', '-n', '15'],
      OPTS
    )
    const graphLines = graphOut.split('\n').filter((l) => l.trim() !== '')

    return { branch, dirty, ahead, behind, graphLines }
  } catch {
    return null
  }
}
