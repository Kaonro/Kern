import { useEffect, useState } from 'react'
import { IconChart, IconSpinner, IconWarningTriangle } from '../components/icons'
import { toFriendlyError } from '../lib/errors'
import { fetchDashboardStats, type DashboardStats } from '../lib/statsApi'

/** Tableau de bord minimal pour suivre le démarrage du pilote — pas dans la navigation,
 * accessible uniquement en tapant l'URL /stats directement. */
export function StatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch((err) => setError(toFriendlyError(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loading-state">
        <span className="big-icon">
          <IconSpinner />
        </span>
        Chargement des statistiques...
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="empty-state">
        <span className="big-icon">
          <IconWarningTriangle />
        </span>
        {error || 'Statistiques indisponibles.'}
      </div>
    )
  }

  const maxViews = Math.max(1, ...stats.viewsByDay.map((d) => d.count))

  return (
    <div className="page-padding">
      <h1>
        <IconChart /> Stats du pilote
      </h1>

      <div className="stats-tiles">
        <div className="stat-tile">
          <span className="value">{stats.totalViews}</span>
          <span className="label">Visites</span>
        </div>
        <div className="stat-tile">
          <span className="value">{stats.totalUsers}</span>
          <span className="label">Comptes</span>
        </div>
        <div className="stat-tile">
          <span className="value">{stats.totalRoutes}</span>
          <span className="label">Parcours</span>
        </div>
        <div className="stat-tile">
          <span className="value">{stats.totalReports}</span>
          <span className="label">Signalements</span>
        </div>
        <div className="stat-tile">
          <span className="value">{stats.totalVotes}</span>
          <span className="label">Votes</span>
        </div>
      </div>

      <div className="card">
        <h2>Visites — 14 derniers jours</h2>
        <div className="stats-chart">
          {stats.viewsByDay.map(({ date, count }) => (
            <div key={date} className="stats-bar-col" title={`${date} : ${count} visite${count > 1 ? 's' : ''}`}>
              <div className="stats-bar" style={{ height: `${(count / maxViews) * 100}%` }} />
              <span className="stats-bar-label">{date.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
