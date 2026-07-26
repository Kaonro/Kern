import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RouteMap } from '../components/RouteMap'
import { fetchRoutes } from '../lib/routesApi'
import type { RouteRecord } from '../types'

export function MapPage() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<RouteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchRoutes()
      .then(setRoutes)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement des parcours.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-map">
      {error && <p className="error map-error">⚠️ {error}</p>}
      {!loading && !error && routes.length === 0 && (
        <p className="map-empty-banner">🥾 Aucun parcours pour l'instant — sois le premier à en ajouter !</p>
      )}
      <RouteMap routes={routes} onSelectRoute={(id) => navigate(`/routes/${id}`)} />
    </div>
  )
}
