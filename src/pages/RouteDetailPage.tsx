import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ElevationChart } from '../components/ElevationChart'
import { ReportTypeSelect } from '../components/ReportTypeSelect'
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconCompass,
  IconEdit,
  IconElevation,
  IconAlert,
  IconLock,
  IconSpinner,
  IconTrail,
  IconTrash,
  IconUser,
  IconWarningTriangle,
  ReportTypeIcon,
  TechniciteIcon,
} from '../components/icons'
import { useAuth } from '../lib/AuthContext'
import { toFriendlyError } from '../lib/errors'
import { relevanceOpacity } from '../lib/reportRelevance'
import { fetchRouteById, updateNom, updateSaisonnalite } from '../lib/routesApi'
import { castVote, computeMajorityTechnicite, fetchVotesForRoute } from '../lib/votesApi'
import { createReport, deleteReport, fetchReportsForRoute } from '../lib/reportsApi'
import {
  REPORT_TYPE_LABELS,
  TECHNICITE_LABELS,
  type Report,
  type ReportType,
  type RouteVote,
  type RouteWithContributor,
  type Technicite,
} from '../types'

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
  const [saisonnaliteSaved, setSaisonnaliteSaved] = useState(false)
  const saisonnaliteSavedTimeout = useRef<ReturnType<typeof setTimeout>>()

  const [newReportType, setNewReportType] = useState<ReportType>('autre')
  const [newReportDescription, setNewReportDescription] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null)

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
      setSaisonnaliteSaved(true)
      clearTimeout(saisonnaliteSavedTimeout.current)
      saisonnaliteSavedTimeout.current = setTimeout(() => setSaisonnaliteSaved(false), 3000)
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

  async function handleDeleteReport(reportId: string) {
    if (!route) return
    if (!window.confirm('Supprimer ce signalement ?')) return
    setDeletingReportId(reportId)
    try {
      await deleteReport(reportId)
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch (err) {
      setError(toFriendlyError(err))
    } finally {
      setDeletingReportId(null)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="big-icon">
          <IconSpinner />
        </span>
        Chargement du parcours...
      </div>
    )
  }

  if (!route) {
    return (
      <div className="empty-state">
        <span className="big-icon">
          <IconCompass />
        </span>
        {error || 'Parcours introuvable.'}
      </div>
    )
  }

  const majorityTechnicite = computeMajorityTechnicite(votes)

  return (
    <div className="page-padding route-detail">
      <Link to="/" className="back-link">
        <IconArrowLeft /> Retour à la carte
      </Link>

      {error && (
        <p className="error">
          <IconWarningTriangle /> {error}
        </p>
      )}

      <div className="card route-header">
        <div style={{ width: '100%' }}>
          {editingNom ? (
            <div className="nom-edit">
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveNom}
                disabled={savingNom}
                aria-label="Enregistrer le nom"
              >
                {savingNom ? <IconSpinner /> : <IconEdit />}
              </button>
              <button type="button" className="link-button" onClick={() => setEditingNom(false)}>
                Annuler
              </button>
            </div>
          ) : (
            <h1>
              {route.nom}{' '}
              {session && (
                <button
                  type="button"
                  className="link-button edit-nom-btn"
                  onClick={() => setEditingNom(true)}
                  aria-label="Modifier le nom du parcours"
                >
                  <IconEdit />
                </button>
              )}
            </h1>
          )}
          <div className="stat-tiles">
            <div className="stat-tile">
              <span className="value">
                <IconTrail /> {route.distance_km.toFixed(1)} km
              </span>
              <span className="label">Distance</span>
            </div>
            <div className="stat-tile">
              <span className="value">
                <IconElevation /> +{route.denivele_m} m
              </span>
              <span className="label">Dénivelé</span>
            </div>
          </div>
          {route.gpx_track.some((p) => p.ele !== undefined) && (
            <div className="elevation-section">
              <ElevationChart points={route.gpx_track} />
            </div>
          )}
          {route.users?.pseudo && (
            <p className="notice contributor">
              <IconUser /> Ajouté par {route.users.pseudo}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>
          <TechniciteIcon technicite="tres_technique" /> Technicité
        </h2>
        <div className="technicite-votes">
          {(Object.keys(TECHNICITE_LABELS) as Technicite[]).map((t) => (
            <button
              key={t}
              type="button"
              className={t === majorityTechnicite ? `active ${t}` : t}
              disabled={!session}
              onClick={() => handleVote(t)}
            >
              <TechniciteIcon technicite={t} /> {TECHNICITE_LABELS[t]}
            </button>
          ))}
        </div>
        {!session && (
          <p className="notice">
            <IconLock /> <Link to="/auth">Connecte-toi</Link> pour voter.
          </p>
        )}
      </div>

      <div className="card">
        <h2>
          <IconCalendar /> Praticabilité saisonnière
        </h2>
        <textarea
          value={saisonnalite}
          onChange={(e) => setSaisonnalite(e.target.value)}
          placeholder="ex. praticable mai à octobre, enneigé l'hiver"
          rows={2}
          disabled={!session}
        />
        {session && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveSaisonnalite}
              disabled={savingSaisonnalite}
            >
              {savingSaisonnalite ? (
                <>
                  <IconSpinner /> Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
            {saisonnaliteSaved && (
              <p className="notice">
                <IconCheck /> Enregistré.
              </p>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>
          <IconAlert /> Signalements
        </h2>
        {session ? (
          <form className="report-form" onSubmit={handleAddReport}>
            <ReportTypeSelect value={newReportType} onChange={setNewReportType} />
            <input
              type="text"
              placeholder="Description courte"
              value={newReportDescription}
              onChange={(e) => setNewReportDescription(e.target.value)}
            />
            <button type="submit" className="btn btn-accent" disabled={submittingReport}>
              {submittingReport ? <IconSpinner /> : <IconAlert />} Signaler
            </button>
          </form>
        ) : (
          <p className="notice">
            <IconLock /> <Link to="/auth">Connecte-toi</Link> pour ajouter un signalement.
          </p>
        )}

        <ul className="report-list">
          {reports.map((report) => (
            <li key={report.id} style={{ opacity: relevanceOpacity(report.created_at) }}>
              <div className="report-item-header">
                <strong>
                  <ReportTypeIcon type={report.type} /> {REPORT_TYPE_LABELS[report.type]}
                </strong>
                <div className="report-item-meta">
                  <time>{new Date(report.created_at).toLocaleDateString('fr-FR')}</time>
                  {session?.user.id === report.user_id && (
                    <button
                      type="button"
                      className="link-button report-delete-btn"
                      onClick={() => handleDeleteReport(report.id)}
                      disabled={deletingReportId === report.id}
                      aria-label="Supprimer ce signalement"
                    >
                      {deletingReportId === report.id ? <IconSpinner /> : <IconTrash />}
                    </button>
                  )}
                </div>
              </div>
              {report.description && <p>{report.description}</p>}
            </li>
          ))}
          {reports.length === 0 && <li className="empty">Aucun signalement pour l'instant.</li>}
        </ul>
      </div>
    </div>
  )
}
