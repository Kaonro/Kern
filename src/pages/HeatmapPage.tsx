import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RouteMap } from '../components/RouteMap'
import { IconArrowLeft, IconCompass, IconLayers, IconSpinner, IconWarningTriangle } from '../components/icons'
import { toFriendlyError } from '../lib/errors'
import { fetchRoutes } from '../lib/routesApi'
import type { RouteRecord } from '../types'

/**
 * Carte de densité : tous les tracés superposés avec l'effet heatmap. Volontairement séparée
 * de la carte d'accueil (simplifiée, façon Komoot) — sert de base à une future génération
 * automatique de parcours à partir des chemins les plus fréquentés (pas encore implémentée).
 */
export function HeatmapPage() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<RouteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRoutes()
      .then(setRoutes)
      .catch((err) => setError(toFriendlyError(err)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-generation">
      <div className="generation-header">
        <Link to="/" className="back-link">
          <IconArrowLeft /> Retour à la carte
        </Link>
        <h1>
          <IconLayers /> Génération de parcours
        </h1>
        <p className="notice">
          Carte de densité : plus un chemin est emprunté par la communauté, plus il apparaît
          foncé. Elle servira de base à une future génération automatique d'itinéraires à
          partir des sentiers les plus fréquentés.
        </p>
      </div>
      <div className="page-map generation-map">
        {loading && (
          <p className="map-empty-banner">
            <IconSpinner /> Chargement de la carte de densité...
          </p>
        )}
        {error && (
          <p className="error map-error">
            <IconWarningTriangle /> {error}
          </p>
        )}
        {!loading && !error && routes.length === 0 && (
          <p className="map-empty-banner">
            <IconCompass /> Aucun parcours pour l'instant.
          </p>
        )}
        <RouteMap routes={routes} heatmap onSelectRoute={(id) => navigate(`/routes/${id}`)} />
      </div>
    </div>
  )
}
