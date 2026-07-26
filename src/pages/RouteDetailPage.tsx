import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchRouteById, updateSaisonnalite } from '../lib/routesApi'
import { castVote, computeMajorityTechnicite, fetchVotesForRoute } from '../lib/votesApi'
import { createReport, fetchReportsForRoute } from '../lib/reportsApi'
import {
  REPORT_TYPE_LABELS,
  TECHNICITE_LABELS,
  type Report,
  type ReportType,
  type RouteRecord,
  type RouteVote,
  type Technicite,
} from '../types'

const REPORT_MAX_AGE_DAYS = 90

function relevanceOpacity(createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0.35, 1 - ageDays / REPORT_MAX_AGE_DAYS)
}

export function RouteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()

  const [route, setRoute] = useState<RouteRecord | null>(null)
  const [votes, setVotes] = useState<RouteVote[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [saisonnalite, setSaisonnalite] = useState('')
  const [savingSaisonnalite, setSavingSaisonnalite] = useState(false)

  const [newReportType, setNewReportType] = useState<ReportType>('autre')
  const [newReportDescription, setNewReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const [routeData, votesData, reportsData] = await Promise.all([
        fetchRouteById(id),
        fetchVotesForRoute(id),
        fetchReportsForRoute(id),
      ])
      setRoute(routeData)
      setSaisonnalite(routeData?.saisonnalite ?? '')
      setVotes(votesData)
      setReports(reportsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement du parcours.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleVote(technicite: Technicite) {
    if (!id || !session) return
    try {
      await castVote(id, session.user.id, technicite)
      setVotes(await fetchVotesForRoute(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du vote.')
    }
  }

  async function handleSaveSaisonnalite() {
    if (!id || !session) return
    setSavingSaisonnalite(true)
    try {
      await updateSaisonnalite(id, saisonnalite)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement.")
    } finally {
      setSavingSaisonnalite(false)
    }
  }

  async function handleAddReport(e: React.FormEvent) {
    e.preventDefault()
    if (!route || !session) return
    setSubmittingReport(true)
    try {
      await createReport({
        routeId: route.id,
        userId: session.user.id,
        type: newReportType,
        description: newReportDescription,
        latitude: route.gpx_track[0].lat,
        longitude: route.gpx_track[0].lng,
      })
      setNewReportDescription('')
      setReports(await fetchReportsForRoute(route.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du signalement.')
    } finally {
      setSubmittingReport(false)
    }
  }

  if (loading) {
    return <p className="page-padding">Chargement...</p>
  }

  if (!route) {
    return <p className="page-padding">{error || 'Parcours introuvable.'}</p>
  }

  const majorityTechnicite = computeMajorityTechnicite(votes)

  return (
    <div className="page-padding route-detail">
      <h1>{route.nom}</h1>
      <div className="route-stats">
        <span>{route.distance_km.toFixed(1)} km</span>
        <span>+{route.denivele_m} m D+</span>
      </div>

      {error && <p className="error">{error}</p>}

      <section>
        <h2>Technicité</h2>
        <div className="technicite-votes">
          {(Object.keys(TECHNICITE_LABELS) as Technicite[]).map((t) => (
            <button
              key={t}
              type="button"
              className={t === majorityTechnicite ? 'active' : ''}
              disabled={!session}
              onClick={() => handleVote(t)}
            >
              {TECHNICITE_LABELS[t]}
            </button>
          ))}
        </div>
        {!session && <p className="notice">Connecte-toi pour voter.</p>}
      </section>

      <section>
        <h2>Praticabilité saisonnière</h2>
        <textarea
          value={saisonnalite}
          onChange={(e) => setSaisonnalite(e.target.value)}
          placeholder="ex. praticable mai à octobre, enneigé l'hiver"
          rows={2}
          disabled={!session}
        />
        {session && (
          <button type="button" onClick={handleSaveSaisonnalite} disabled={savingSaisonnalite}>
            {savingSaisonnalite ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        )}
      </section>

      <section>
        <h2>Signalements</h2>
        {session ? (
          <form className="report-form" onSubmit={handleAddReport}>
            <select value={newReportType} onChange={(e) => setNewReportType(e.target.value as ReportType)}>
              {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description courte"
              value={newReportDescription}
              onChange={(e) => setNewReportDescription(e.target.value)}
            />
            <button type="submit" disabled={submittingReport}>
              Signaler
            </button>
          </form>
        ) : (
          <p className="notice">Connecte-toi pour ajouter un signalement.</p>
        )}

        <ul className="report-list">
          {reports.map((report) => (
            <li key={report.id} style={{ opacity: relevanceOpacity(report.created_at) }}>
              <strong>{REPORT_TYPE_LABELS[report.type]}</strong>
              <span>{report.description}</span>
              <time>{new Date(report.created_at).toLocaleDateString('fr-FR')}</time>
            </li>
          ))}
          {reports.length === 0 && <li className="empty">Aucun signalement pour l'instant.</li>}
        </ul>
      </section>
    </div>
  )
}
