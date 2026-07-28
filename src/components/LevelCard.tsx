import type { CSSProperties } from 'react'
import { IconMedal } from './icons'
import { computeLevelProgress, computeScore, type ActivityStats } from '../lib/reputationApi'
import './LevelCard.css'

/** Carte "niveau" façon Waze/Google Local Guides, avec barre de progression vers le
 * prochain échelon — pour donner envie de contribuer et rassurer sur la fiabilité. */
export function LevelCard({ stats }: { stats: ActivityStats }) {
  const score = computeScore(stats)
  const { level, next, progress } = computeLevelProgress(score)

  return (
    <div className="card level-card">
      <div className="level-card-header" style={{ '--level-color': level.color } as CSSProperties}>
        <span className="level-card-icon">
          <IconMedal />
        </span>
        <div>
          <span className="level-card-index">Niveau {level.index}</span>
          <h2>{level.name}</h2>
        </div>
      </div>

      <div className="level-progress-track">
        <div
          className="level-progress-fill"
          style={{ width: `${progress * 100}%`, background: level.color }}
        />
      </div>
      <p className="notice">
        {next
          ? `Encore ${next.threshold - score} point${next.threshold - score > 1 ? 's' : ''} avant "${next.name}"`
          : 'Niveau maximum atteint — merci pour tout ce que tu apportes à la communauté !'}
      </p>

      <div className="level-stats">
        <span>
          <strong>{stats.reports}</strong> signalement{stats.reports > 1 ? 's' : ''}
        </span>
        <span>
          <strong>{stats.routes}</strong> parcours ajouté{stats.routes > 1 ? 's' : ''}
        </span>
        <span>
          <strong>{stats.votes}</strong> vote{stats.votes > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}
