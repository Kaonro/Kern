import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { toFriendlyError } from '../lib/errors'
import { fetchRouteById, updateNom, updateSaisonnalite } from '../lib/routesApi'
import { castVote, computeMajorityTechnicite, fetchVotesForRoute } from '../lib/votesApi'
import { createReport, fetchReportsForRoute } from '../lib/reportsApi'
import {
  REPORT_TYPE_EMOJIS,
  REPORT_TYPE_LABELS,
  TECHNICITE_EMOJIS,
  TECHNICITE_LABELS,
  type Report,
  type ReportType,
  type RouteVote,
  type RouteWithContributor,
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

  const [route, setRoute] = useState<RouteWithContributor | null>(null)
  const [votes, setVotes] = useState<RouteVote[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editingNom, setEditingNom] = useState(false)
  const [nom, setNom] = useState('')
  const [savingNom, setSavingNom] = useState(false)

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
      setNom(routeData?.nom ?? '')
      setSaisonnalite(routeData?.saisonnalite ?? '')
      setVotes(votesData)
      setReports(reportsData)
    } catch (err) {
      setError(toFriendlyError(err))
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
      setError(toFriendlyError(err))
    }
  }

  async function handleSaveNom() {
    if (!id || !session || !nom.trim()) return
    setSavingNom(true)
    try {
      await updateNom(id, nom.trim())
      setRoute((prev) => (prev ? { ...prev, nom: nom.trim() } : prev))
      setEditingNom(false)
    } catch (err) {
      setError(toFriendlyError(err))
    } finally {
      setSavingNom(false)
    }
  }

  async function handleSaveSaisonnalite() {
    if (!id || !session) return
    setSavingSaisonnalite(true)
    try {
      await updateSaisonnalite(id, saisonnalite)
    } catch (err) {
      setError(toFriendlyError(err))
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
      setError(toFriendlyError(err))
    } finally {
      setSubmittingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="big-emoji">🥾</span>
        Chargement du parcours...
      </div>
    )
  }

  if (!route) {
    return (
      <div className="empty-state">
        <span className="big-emoji">🤷</span>
        {error || 'Parcours introuvable.'}
      </div>
    )
  }

  const majorityTechnicite = computeMajorityTechnicite(votes)

  return (
    <div className="page-padding route-detail">
      <Link to="/" className="back-link">
        ⬅️ Retour à la carte
      </Link>

      {error && <p className="error">{error}</p>}

      <div className="card route-header">
        <div style={{ width: '100%' }}>
          {editingNom ? (
            <div className="nom-edit">
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} />
              <button type="button" className="btn btn-primary" onClick={handleSaveNom} disabled={savingNom}>
                {savingNom ? '⏳' : '💾'}
              </button>
              <button type="button" className="link-button" onClick={() => setEditingNom(false)}>
                Annuler
              </button>
            </div>
          ) : (
            <h1>
              🏔️ {route.nom}{' '}
              {session && (
                <button type="button" className="link-button edit-nom-btn" onClick={() => setEditingNom(true)}>
                  ✏️
                </button>
              )}
            </h1>
          )}
          <div className="route-stats">
            <span className="stat-pill">📏 {route.distance_km.toFixed(1)} km</span>
            <span className="stat-pill">⛰️ +{route.denivele_m} m D+</span>
          </div>
          {route.users?.pseudo && <p className="notice contributor">🙋 Ajouté par {route.users.pseudo}</p>}
        </div>
      </div>

      <div className="card">
        <h2>🎯 Technicité</h2>
        <div className="technicite-votes">
          {(Object.keys(TECHNICITE_LABELS) as Technicite[]).map((t) => (
            <button
              key={t}
              type="button"
              className={t === majorityTechnicite ? `active ${t}` : t}
              disabled={!session}
              onClick={() => handleVote(t)}
            >
              {TECHNICITE_EMOJIS[t]} {TECHNICITE_LABELS[t]}
            </button>
          ))}
        </div>
        {!session && <p className="notice">🔒 Connecte-toi pour voter.</p>}
      </div>

      <div className="card">
        <h2>📅 Praticabilité saisonnière</h2>
        <textarea
          value={saisonnalite}
          onChange={(e) => setSaisonnalite(e.target.value)}
          placeholder="ex. praticable mai à octobre, enneigé l'hiver ❄️"
          rows={2}
          disabled={!session}
        />
        {session && (
          <button type="button" className="btn btn-primary" onClick={handleSaveSaisonnalite} disabled={savingSaisonnalite}>
            {savingSaisonnalite ? '⏳ Enregistrement...' : '💾 Enregistrer'}
          </button>
        )}
      </div>

      <div className="card">
        <h2>📢 Signalements</h2>
        {session ? (
          <form className="report-form" onSubmit={handleAddReport}>
            <select value={newReportType} onChange={(e) => setNewReportType(e.target.value as ReportType)}>
              {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {REPORT_TYPE_EMOJIS[value as ReportType]} {label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Description courte"
              value={newReportDescription}
              onChange={(e) => setNewReportDescription(e.target.value)}
            />
            <button type="submit" className="btn btn-accent" disabled={submittingReport}>
              {submittingReport ? '⏳' : '🚨 Signaler'}
            </button>
          </form>
        ) : (
          <p className="notice">🔒 Connecte-toi pour ajouter un signalement.</p>
        )}

        <ul className="report-list">
          {reports.map((report) => (
            <li key={report.id} style={{ opacity: relevanceOpacity(report.created_at) }}>
              <div className="report-item-header">
                <strong>
                  {REPORT_TYPE_EMOJIS[report.type]} {REPORT_TYPE_LABELS[report.type]}
                </strong>
                <time>{new Date(report.created_at).toLocaleDateString('fr-FR')}</time>
              </div>
              {report.description && <p>{report.description}</p>}
            </li>
          ))}
          {reports.length === 0 && <li className="empty">🤷 Aucun signalement pour l'instant.</li>}
        </ul>
      </div>
    </div>
  )
}
