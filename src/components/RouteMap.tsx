import { useEffect } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { REPORT_TYPE_COLORS } from './icons'
import { relevanceOpacity } from '../lib/reportRelevance'
import { REPORT_TYPE_LABELS, type Report, type RouteRecord } from '../types'

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
  reports?: Report[]
  onSelectRoute?: (routeId: string) => void
  pickMode?: boolean
  onPick?: (lat: number, lng: number) => void
  pickedPosition?: { lat: number; lng: number } | null
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

function PickModeHandler({ active, onPick }: { active: boolean; onPick?: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      if (active) onPick?.(e.latlng.lat, e.latlng.lng)
    },
  })

  useEffect(() => {
    map.getContainer().style.cursor = active ? 'crosshair' : ''
  }, [map, active])

  return null
}

export function RouteMap({
  routes,
  reports = [],
  onSelectRoute,
  pickMode = false,
  onPick,
  pickedPosition,
}: RouteMapProps) {
  return (
    <MapContainer center={CHAMBERY_CENTER} zoom={12} zoomControl={false} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomleft" />
      <FitToRoutes routes={routes} />
      <PickModeHandler active={pickMode} onPick={onPick} />
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.gpx_track.map((p) => [p.lat, p.lng])}
          // Opacité partielle : les tracés qui se superposent s'assombrissent naturellement (effet heatmap).
          pathOptions={{ color: '#2f6f4f', weight: 4, opacity: 0.5 }}
          eventHandlers={{
            click: (e) => {
              if (pickMode) {
                onPick?.(e.latlng.lat, e.latlng.lng)
              } else {
                onSelectRoute?.(route.id)
              }
            },
          }}
        >
          <Tooltip sticky>{route.nom}</Tooltip>
        </Polyline>
      ))}
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.latitude, report.longitude]}
          radius={7}
          pathOptions={{
            color: '#fff',
            weight: 2,
            fillColor: REPORT_TYPE_COLORS[report.type],
            fillOpacity: relevanceOpacity(report.created_at),
            opacity: 1,
          }}
          eventHandlers={{
            click: () => onSelectRoute?.(report.route_id),
          }}
        >
          <Tooltip>
            {REPORT_TYPE_LABELS[report.type]}
            {report.description ? ` — ${report.description}` : ''}
          </Tooltip>
        </CircleMarker>
      ))}
      {pickedPosition && <Marker position={[pickedPosition.lat, pickedPosition.lng]} />}
    </MapContainer>
  )
}
