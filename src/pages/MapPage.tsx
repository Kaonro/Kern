import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RouteMap, DEFAULT_MAP_CENTER } from '../components/RouteMap'
import {
  IconCheck,
  IconCompass,
  IconAlert,
  IconDroplet,
  IconMap,
  IconMountain,
  IconPin,
  IconSpinner,
  IconWarningTriangle,
} from '../components/icons'
import { ReportTypeSelect } from '../components/ReportTypeSelect'
import { LayersMenu } from '../components/LayersMenu'
import { useAuth } from '../lib/AuthContext'
import { toFriendlyError } from '../lib/errors'
import { findNearestRoute } from '../lib/geo'
import { geocodeCity, type LatLng, type MapBounds } from '../lib/geocoding'
import { fetchProfile } from '../lib/profileApi'
import { fetchRoutes } from '../lib/routesApi'
import { createReport, fetchAllReports } from '../lib/reportsApi'
import { fetchAllVotes } from '../lib/votesApi'
import { fetchWaterPoints, type WaterPoint } from '../lib/refugesInfo'
import { fetchPois, type Poi } from '../lib/poisApi'
import type { Report, ReportType, RouteRecord, RouteVote } from '../types'

/** Nombre de parcours mis en avant sur la carte d'accueil simplifiée. */
const FEATURED_ROUTES_COUNT = 8

// En dessous de ce zoom (vue régionale/pays), la zone visible est énorme — sur un grand
// écran PC ça peut représenter une bonne partie de la France. Plutôt que d'essayer de
// plafonner finement, on coupe net : aucun point d'eau/sommet/lieu chargé ni affiché.
const MIN_ZOOM_FOR_LAYERS = 8

// Plafond de marqueurs (points d'eau + sommets/lieux) selon le zoom : une vue dézoomée
// couvre une zone large, un plafond bas évite de surcharger un téléphone avec des
// milliers de marqueurs illisibles à cette échelle. Plus on zoome, plus la zone visible
// est petite et plus on peut se permettre d'en afficher.
function poiLimitForZoom(zoom: number): number {
  if (zoom < 9) return 80
  if (zoom < 11) return 150
  if (zoom < 13) return 300
  if (zoom < 15) return 600
  return 1000
}

/** Débounce léger : on ne relance pas les requêtes à chaque frame de pan/zoom, seulement
 * une fois le mouvement stabilisé (moveend/zoomend le sont déjà, mais des clics de zoom
 * rapprochés peuvent quand même s'enchaîner). */
const VIEWPORT_DEBOUNCE_MS = 300

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
  const { session, loading: authLoading } = useAuth()

  const [routes, setRoutes] = useState<RouteRecord[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [votes, setVotes] = useState<RouteVote[]>([])
  const [waterPoints, setWaterPoints] = useState<WaterPoint[]>([])
  const [showWaterPoints, setShowWaterPoints] = useState(false)
  // Deux calques distincts, chacun requêté séparément (cf. poisApi.fetchPois) : le côté
  // montagne (sommets, cols, points de vue) et les "lieux à visiter" façon Komoot
  // (monuments, parcs) — pour que l'un ne prenne pas toute la place de l'autre.
  const [mountainPois, setMountainPois] = useState<Poi[]>([])
  const [placePois, setPlacePois] = useState<Poi[]>([])
  const [showPois, setShowPois] = useState(false)
  const [showPlaces, setShowPlaces] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Position de l'utilisateur ou ville de son profil plutôt que Chambéry en dur — pour
  // qu'un nouvel arrivant loin du pilote (ex. Rouen) voie une carte qui le concerne.
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_MAP_CENTER)
  const [centerResolved, setCenterResolved] = useState(false)

  // Zone actuellement affichée (bornes + zoom), pour charger points d'eau/sommets/lieux
  // à la demande plutôt que sur un rayon fixe autour d'une poignée de villes pilotes.
  const [viewport, setViewport] = useState<{ bounds: MapBounds; zoom: number } | null>(null)
  const viewportDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleViewportChange(bounds: MapBounds, zoom: number) {
    if (viewportDebounce.current) clearTimeout(viewportDebounce.current)
    viewportDebounce.current = setTimeout(() => setViewport({ bounds, zoom }), VIEWPORT_DEBOUNCE_MS)
  }

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
    fetchAllReports()
      .then(setReports)
      .catch(() => {
        // Pas bloquant : la carte reste utilisable sans les marqueurs de signalement.
      })
    fetchAllVotes()
      .then(setVotes)
      .catch(() => {
        // Pas bloquant : sans les votes, la mise en avant retombe sur l'ordre par défaut.
      })
  }, [])

  // Priorité : géolocalisation du navigateur, sinon ville renseignée dans le profil,
  // sinon on reste sur DEFAULT_MAP_CENTER (et FitToRoutes prend le relais comme avant).
  useEffect(() => {
    if (authLoading) return
    let cancelled = false

    async function resolveCenter() {
      try {
        const position = await getCurrentPosition()
        if (!cancelled) {
          setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude })
          setCenterResolved(true)
        }
        return
      } catch {
        // Géolocalisation refusée/indisponible : on retombe sur la ville du profil.
      }

      if (session) {
        try {
          const profile = await fetchProfile(session.user.id)
          if (profile?.ville) {
            const geocoded = await geocodeCity(profile.ville)
            if (geocoded && !cancelled) {
              setMapCenter(geocoded)
              setCenterResolved(true)
            }
          }
        } catch {
          // Pas grave, on reste sur le centre par défaut.
        }
      }
    }

    resolveCenter()
    return () => {
      cancelled = true
    }
  }, [authLoading, session])

  // Points d'eau et sommets/lieux rechargés à chaque déplacement/zoom de la carte
  // (`viewport`, mis à jour par RouteMap via `onViewportChange`, débounced). `cancelled`
  // évite qu'une réponse pour une zone quittée entre-temps n'écrase le résultat de la
  // zone actuelle — sinon la réponse la plus lente gagne, pas la plus récente.
  useEffect(() => {
    if (!viewport) return
    let cancelled = false

    if (viewport.zoom < MIN_ZOOM_FOR_LAYERS) {
      setWaterPoints([])
      setMountainPois([])
      setPlacePois([])
      return
    }

    fetchWaterPoints(viewport.bounds)
      .then((data) => {
        if (!cancelled) setWaterPoints(data)
      })
      .catch(() => {
        // Pas bloquant : refuges.info est une source externe optionnelle.
      })

    const limit = poiLimitForZoom(viewport.zoom)
    fetchPois(viewport.bounds, ['peak', 'col', 'viewpoint'], limit)
      .then((data) => {
        if (!cancelled) setMountainPois(data)
      })
      .catch(() => {
        // Pas bloquant : la couche sommets/cols/points de vue reste optionnelle.
      })
    fetchPois(viewport.bounds, ['monument', 'park'], limit)
      .then((data) => {
        if (!cancelled) setPlacePois(data)
      })
      .catch(() => {
        // Pas bloquant : la couche lieux à visiter reste optionnelle.
      })

    return () => {
      cancelled = true
    }
  }, [viewport])

  // Carte d'accueil simplifiée façon Komoot : seulement les parcours les plus actifs
  // dans la communauté (votes + signalements cumulés), pas tous les tracés en heatmap.
  const featuredRoutes = useMemo(() => {
    const score = new Map<string, number>()
    for (const vote of votes) score.set(vote.route_id, (score.get(vote.route_id) ?? 0) + 1)
    for (const report of reports) score.set(report.route_id, (score.get(report.route_id) ?? 0) + 1)
    return [...routes].sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0)).slice(0, FEATURED_ROUTES_COUNT)
  }, [routes, votes, reports])

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
      setSuccessMessage(`Signalement ajouté sur "${nearestRoute.nom}"`)
      setReports(await fetchAllReports())
      resetPlacement()
    } catch (err) {
      setPlaceError(toFriendlyError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-map">
      {loading && (
        <p className="map-empty-banner">
          <IconSpinner /> Chargement des parcours...
        </p>
      )}
      {error && (
        <p className="error map-error">
          <IconWarningTriangle /> {error}
        </p>
      )}
      {!loading && !error && routes.length === 0 && (
        <p className="map-empty-banner">
          <IconCompass /> Aucun parcours pour l'instant — sois le premier à en ajouter !
        </p>
      )}
      {successMessage && (
        <p className="map-empty-banner success">
          <IconCheck /> {successMessage}
        </p>
      )}

      {step === 'choosing-location' && (
        <div className="picking-banner">
          <IconMap /> Touche la carte à l'endroit du signalement
          <button type="button" className="link-button" onClick={resetPlacement}>
            Annuler
          </button>
        </div>
      )}

      <RouteMap
        routes={featuredRoutes}
        reports={reports}
        waterPoints={showWaterPoints ? waterPoints : []}
        pois={[...(showPois ? mountainPois : []), ...(showPlaces ? placePois : [])]}
        onSelectRoute={(id) => navigate(`/routes/${id}`)}
        pickMode={step === 'choosing-location'}
        onPick={handleMapPick}
        pickedPosition={pickedPosition}
        center={mapCenter}
        fitToRoutes={!centerResolved}
        onViewportChange={handleViewportChange}
      />

      {routes.length > FEATURED_ROUTES_COUNT && step === 'idle' && (
        <Link to="/generation" className="heatmap-link">
          <IconMap /> Voir tous les parcours
        </Link>
      )}

      <LayersMenu
        layers={[
          ...(waterPoints.length > 0
            ? [
                {
                  key: 'water',
                  label: "Points d'eau",
                  icon: <IconDroplet />,
                  active: showWaterPoints,
                  onToggle: () => setShowWaterPoints((v) => !v),
                },
              ]
            : []),
          ...(mountainPois.length > 0
            ? [
                {
                  key: 'pois',
                  label: 'Sommets, cols, points de vue',
                  icon: <IconMountain />,
                  active: showPois,
                  onToggle: () => setShowPois((v) => !v),
                },
              ]
            : []),
          ...(placePois.length > 0
            ? [
                {
                  key: 'places',
                  label: 'Lieux à visiter',
                  icon: <IconPin />,
                  active: showPlaces,
                  onToggle: () => setShowPlaces((v) => !v),
                },
              ]
            : []),
        ]}
      />

      {step === 'idle' && (
        <button type="button" className="map-fab" onClick={handleOpenReportMenu} aria-label="Ajouter un signalement">
          <IconAlert />
        </button>
      )}

      {step === 'action-sheet' && (
        <div className="action-sheet">
          <h2>
            <IconAlert /> Ajouter un signalement
          </h2>
          {placeError && (
            <p className="error">
              <IconWarningTriangle /> {placeError}
            </p>
          )}
          <button type="button" className="btn btn-primary btn-block" onClick={handleUseMyPosition}>
            <IconCompass /> Utiliser ma position actuelle
          </button>
          <button type="button" className="btn btn-accent btn-block" onClick={handleChooseOnMap}>
            <IconMap /> Choisir un point sur la carte
          </button>
          <button type="button" className="link-button auth-switch" onClick={resetPlacement}>
            Annuler
          </button>
        </div>
      )}

      {step === 'locating' && (
        <div className="action-sheet">
          <p className="notice">
            <IconSpinner /> Recherche de ta position...
          </p>
        </div>
      )}

      {step === 'choosing-location' && placeError && (
        <div className="action-sheet">
          <p className="error">
            <IconWarningTriangle /> {placeError}
          </p>
          <button type="button" className="link-button" onClick={resetPlacement}>
            Annuler
          </button>
        </div>
      )}

      {step === 'form' && nearestRoute && (
        <form className="action-sheet" onSubmit={handleSubmitReport}>
          <h2>
            <IconAlert /> Signaler sur "{nearestRoute.nom}"
          </h2>
          <ReportTypeSelect value={reportType} onChange={setReportType} />
          <input
            type="text"
            placeholder="Description courte"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
          />
          {placeError && (
            <p className="error">
              <IconWarningTriangle /> {placeError}
            </p>
          )}
          <button type="submit" className="btn btn-accent btn-block" disabled={submitting}>
            {submitting ? (
              <>
                <IconSpinner /> Envoi...
              </>
            ) : (
              <>
                <IconAlert /> Valider le signalement
              </>
            )}
          </button>
          <button type="button" className="link-button auth-switch" onClick={resetPlacement}>
            Annuler
          </button>
        </form>
      )}
    </div>
  )
}
