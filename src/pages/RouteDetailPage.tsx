import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MOCK_REPORTS, MOCK_ROUTES } from '../lib/mockData'
import { REPORT_TYPE_LABELS, TECHNICITE_LABELS, type Report, type ReportType, type Technicite } from '../types'

const REPORT_MAX_AGE_DAYS = 90

function relevanceOpacity(createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0.35, 1 - ageDays / REPORT_MAX_AGE_DAYS)
}

export function RouteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const route = useMemo(() => MOCK_ROUTES.find((r) => r.id === id), [id])

  const [saisonnalite, setSaisonnalite] = useState(route?.saisonnalite ?? '')
  const [reports, setReports] = useState<Report[]>(
    MOCK_REPORTS.filter((r) => r.routeId === id).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  )
  const [newReportType, setNewReportType] = useState<ReportType>('autre')
  const [newReportDescription, setNewReportDescription] = useState('')

  if (!route) {
    return <p className="page-padding">Parcours introuvable.</p>
  }

  function handleAddReport(e: React.FormEvent) {
    e.preventDefault()
    if (!route) return
    const report: Report = {
      id: crypto.randomUUID(),
      routeId: route.id,
      userId: 'moi',
      type: newReportType,
      description: newReportDescription,
      latitude: route.gpxTrack[0].lat,
      longitude: route.gpxTrack[0].lng,
      createdAt: new Date().toISOString(),
    }
    setReports((prev) => [report, ...prev])
    setNewReportDescription('')
  }

  return (
    <div className="page-padding route-detail">
      <h1>{route.nom}</h1>
      <div className="route-stats">
        <span>{route.distanceKm.toFixed(1)} km</span>
        <span>+{route.elevationGainM} m D+</span>
      </div>

      <section>
        <h2>Technicité</h2>
        <div className="technicite-votes">
          {(Object.keys(TECHNICITE_LABELS) as Technicite[]).map((t) => (
            <button key={t} type="button" className={t === route.technicite ? 'active' : ''}>
              {TECHNICITE_LABELS[t]}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Praticabilité saisonnière</h2>
        <textarea
          value={saisonnalite}
          onChange={(e) => setSaisonnalite(e.target.value)}
          placeholder="ex. praticable mai à octobre, enneigé l'hiver"
          rows={2}
        />
      </section>

      <section>
        <h2>Signalements</h2>
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
          <button type="submit">Signaler</button>
        </form>

        <ul className="report-list">
          {reports.map((report) => (
            <li key={report.id} style={{ opacity: relevanceOpacity(report.createdAt) }}>
              <strong>{REPORT_TYPE_LABELS[report.type]}</strong>
              <span>{report.description}</span>
              <time>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</time>
            </li>
          ))}
          {reports.length === 0 && <li className="empty">Aucun signalement pour l'instant.</li>}
        </ul>
      </section>
    </div>
  )
}
