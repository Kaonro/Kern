import { Fragment, useEffect, useMemo } from 'react'
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
import { extractTrackSegment, nearestTrackIndex } from '../lib/geo'
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
  const routesById = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes])

  function handleReportClick(e: { latlng: { lat: number; lng: number } }, routeId: string) {
    if (pickMode) {
      onPick?.(e.latlng.lat, e.latlng.lng)
    } else {
      onSelectRoute?.(routeId)
    }
  }

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
      {reports.map((report) => {
        const parentRoute = routesById.get(report.route_id)
        const segment = parentRoute
          ? extractTrackSegment(
              parentRoute.gpx_track,
              nearestTrackIndex(parentRoute.gpx_track, { lat: report.latitude, lng: report.longitude }),
            )
          : null
        const opacity = relevanceOpacity(report.created_at)
        const tooltip = (
          <Tooltip>
            {REPORT_TYPE_LABELS[report.type]}
            {report.description ? ` — ${report.description}` : ''}
          </Tooltip>
        )

        return (
          <Fragment key={report.id}>
            {segment && segment.length >= 2 && (
              // Portion du tracé "rayée" dans la couleur du type de signalement, superposée à la ligne verte.
              <Polyline
                positions={segment.map((p) => [p.lat, p.lng])}
                pathOptions={{
                  color: REPORT_TYPE_COLORS[report.type],
                  weight: 7,
                  opacity,
                  dashArray: '10 8',
                  lineCap: 'round',
                }}
                eventHandlers={{ click: (e) => handleReportClick(e, report.route_id) }}
              >
                {tooltip}
              </Polyline>
            )}
            <CircleMarker
              center={[report.latitude, report.longitude]}
              radius={7}
              pathOptions={{
                color: '#fff',
                weight: 2,
                fillColor: REPORT_TYPE_COLORS[report.type],
                fillOpacity: opacity,
                opacity: 1,
              }}
              eventHandlers={{ click: (e) => handleReportClick(e, report.route_id) }}
            >
              {tooltip}
            </CircleMarker>
          </Fragment>
        )
      })}
      {pickedPosition && <Marker position={[pickedPosition.lat, pickedPosition.lng]} />}
    </MapContainer>
  )
}
