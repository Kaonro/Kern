import { useEffect } from 'react'
import { MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import type { RouteRecord } from '../types'

// Leaflet + bundlers : les chemins d'icônes par défaut ne se résolvent pas automatiquement.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const CHAMBERY_CENTER: [number, number] = [45.5646, 5.9178]

interface RouteMapProps {
  routes: RouteRecord[]
  onSelectRoute?: (routeId: string) => void
}

function FitToRoutes({ routes }: { routes: RouteRecord[] }) {
  const map = useMap()
  const routeIds = routes.map((r) => r.id).join(',')

  useEffect(() => {
    if (routes.length === 0) return
    const bounds = L.latLngBounds(
      routes.flatMap((route) => route.gpx_track.map((p) => [p.lat, p.lng] as [number, number])),
    )
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [32, 32] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routeIds])

  return null
}

export function RouteMap({ routes, onSelectRoute }: RouteMapProps) {
  return (
    <MapContainer center={CHAMBERY_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToRoutes routes={routes} />
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.gpx_track.map((p) => [p.lat, p.lng])}
          // Opacité partielle : les tracés qui se superposent s'assombrissent naturellement (effet heatmap).
          pathOptions={{ color: '#2f6f4f', weight: 4, opacity: 0.5 }}
          eventHandlers={{
            click: () => onSelectRoute?.(route.id),
          }}
        >
          <Tooltip sticky>{route.nom}</Tooltip>
        </Polyline>
      ))}
    </MapContainer>
  )
}
