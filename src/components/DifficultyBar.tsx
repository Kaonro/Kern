import { DIFFICULTE_COLORS } from './icons'
import { DIFFICULTE_LABELS, DIFFICULTE_ORDER, type RouteDifficultyVote } from '../types'
import './DifficultyBar.css'

/** Barre unique divisée en segments colorés, proportionnels aux votes — reflète la
 * répartition de la communauté plutôt qu'un simple gagnant majoritaire. */
export function DifficultyBar({ votes }: { votes: RouteDifficultyVote[] }) {
  const total = votes.length

  if (total === 0) {
    return <p className="notice">Pas encore de vote sur la difficulté.</p>
  }

  const counts = DIFFICULTE_ORDER.map((level) => ({
    level,
    count: votes.filter((v) => v.difficulte === level).length,
  })).filter((c) => c.count > 0)

  return (
    <div className="difficulty-bar-wrap">
      <div className="difficulty-bar">
        {counts.map(({ level, count }) => {
          const pct = Math.round((count / total) * 100)
          return (
            <div
              key={level}
              className="difficulty-segment"
              style={{ width: `${(count / total) * 100}%`, background: DIFFICULTE_COLORS[level] }}
              title={`${DIFFICULTE_LABELS[level]} — ${pct}%`}
            />
          )
        })}
      </div>
      <div className="difficulty-legend">
        {counts.map(({ level, count }) => (
          <span key={level} className="difficulty-legend-item">
            <span className="difficulty-dot" style={{ background: DIFFICULTE_COLORS[level] }} />
            {DIFFICULTE_LABELS[level]} {Math.round((count / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}
