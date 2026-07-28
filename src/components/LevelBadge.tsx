import type { CSSProperties } from 'react'
import { computeLevelProgress, computeScore, type ActivityStats } from '../lib/reputationApi'
import { IconMedal } from './icons'
import './LevelBadge.css'

export function LevelBadge({ stats }: { stats: ActivityStats }) {
  const { level } = computeLevelProgress(computeScore(stats))
  return (
    <span className="level-badge" style={{ '--level-color': level.color } as CSSProperties}>
      <IconMedal /> {level.name}
    </span>
  )
}
