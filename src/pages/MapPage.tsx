import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RouteMap } from '../components/RouteMap'
import { useAuth } from '../lib/AuthContext'
import { toFriendlyError } from '../lib/errors'
import { findNearestRoute } from '../lib/geo'
import { fetchRoutes } from '../lib/routesApi'
import { createReport } from '../lib/reportsApi'
import { REPORT_TYPE_EMOJIS, REPORT_TYPE_LABELS, type ReportType, type RouteRecord } from '../types'

type PlacementStep = 'idle' | 'action-sheet' | 'choosing-location' | 'locating' | 'form'

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
  })
}

export function MapPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [routes, setRoutes] = useState<RouteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [step, setStep] = useState<PlacementStep>('idle')
  const [pickedPosition, setPickedPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [nearestRoute, setNearestRoute] = useState<RouteRecord | null>(null)
  const [placeError, setPlaceError] = useState('')

  const [reportType, setReportType] = useState<ReportType>('autre')
  const [reportDescription, setReportDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchRoutes()
      .then(setRoutes)
      .catch((err) => setError(toFriendlyError(err)))
      .finally(() => setLoading(false))
  }, [])

  function resetPlacement() {
    setStep('idle')
    setPickedPosition(null)
    setNearestRoute(null)
    setPlaceError('')
    setReportDescription('')
    setReportType('autre')
  }

  function handleOpenReportMenu() {
    if (!session) {
      navigate('/auth')
      return
    }
    setSuccessMessage('')
    setStep('action-sheet')
  }

  async function handleUseMyPosition() {
    setStep('locating')
    setPlaceError('')
    try {
      const position = await getCurrentPosition()
      resolvePosition(position.coords.latitude, position.coords.longitude)
    } catch (err) {
      setPlaceError(toFriendlyError(err))
      setStep('action-sheet')
    }
  }

  function handleChooseOnMap() {
    setPlaceError('')
    setStep('choosing-location')
  }

  function handleMapPick(lat: number, lng: number) {
    resolvePosition(lat, lng)
  }

  function resolvePosition(lat: number, lng: number) {
    const match = findNearestRoute(routes, { lat, lng })
    if (!match) {
      setPlaceError("Ce point est trop loin d'un parcours existant — rapproche-toi d'un tracé.")
      setPickedPosition({ lat, lng })
      setStep('choosing-location')
      return
    }
    setPlaceError('')
    setPickedPosition({ lat, lng })
    setNearestRoute(match.route)
    setStep('form')
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !nearestRoute || !pickedPosition) return
    setSubmitting(true)
    try {
      await createReport({
        routeId: nearestRoute.id,
        userId: session.user.id,
        type: reportType,
        description: reportDescription,
        latitude: pickedPosition.lat,
        longitude: pickedPosition.lng,
      })
      setSuccessMessage(`✅ Signalement ajouté sur "${nearestRoute.nom}"`)
      resetPlacement()
    } catch (err) {
      setPlaceError(toFriendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-map">
      {loading && <p className="map-empty-banner">⏳ Chargement des parcours...</p>}
      {error && <p className="error map-error">⚠️ {error}</p>}
      {!loading && !error && routes.length === 0 && (
        <p className="map-empty-banner">🥾 Aucun parcours pour l'instant — sois le premier à en ajouter !</p>
      )}
      {successMessage && <p className="map-empty-banner success">{successMessage}</p>}

      {step === 'choosing-location' && (
        <div className="picking-banner">
          📍 Touche la carte à l'endroit du signalement
          <button type="button" className="link-button" onClick={resetPlacement}>
            Annuler
          </button>
        </div>
      )}

      <RouteMap
        routes={routes}
        onSelectRoute={(id) => navigate(`/routes/${id}`)}
        pickMode={step === 'choosing-location'}
        onPick={handleMapPick}
        pickedPosition={pickedPosition}
      />

      {step === 'idle' && (
        <button type="button" className="map-fab" onClick={handleOpenReportMenu} aria-label="Ajouter un signalement">
          🚨
        </button>
      )}

      {step === 'action-sheet' && (
        <div className="action-sheet">
          <h2>🚨 Ajouter un signalement</h2>
          {placeError && <p className="error">{placeError}</p>}
          <button type="button" className="btn btn-primary btn-block" onClick={handleUseMyPosition}>
            📍 Utiliser ma position actuelle
          </button>
          <button type="button" className="btn btn-accent btn-block" onClick={handleChooseOnMap}>
            🗺️ Choisir un point sur la carte
          </button>
          <button type="button" className="link-button auth-switch" onClick={resetPlacement}>
            Annuler
          </button>
        </div>
      )}

      {step === 'locating' && (
        <div className="action-sheet">
          <p className="notice">📡 Recherche de ta position...</p>
        </div>
      )}

      {step === 'choosing-location' && placeError && (
        <div className="action-sheet">
          <p className="error">{placeError}</p>
          <button type="button" className="link-button" onClick={resetPlacement}>
            Annuler
          </button>
        </div>
      )}

      {step === 'form' && nearestRoute && (
        <form className="action-sheet" onSubmit={handleSubmitReport}>
          <h2>🚨 Signaler sur "{nearestRoute.nom}"</h2>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
            {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {REPORT_TYPE_EMOJIS[value as ReportType]} {label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Description courte"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
          />
          {placeError && <p className="error">{placeError}</p>}
          <button type="submit" className="btn btn-accent btn-block" disabled={submitting}>
            {submitting ? '⏳ Envoi...' : '🚨 Valider le signalement'}
          </button>
          <button type="button" className="link-button auth-switch" onClick={resetPlacement}>
            Annuler
          </button>
        </form>
      )}
    </div>
  )
}
