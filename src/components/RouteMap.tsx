import { Fragment, useEffect, useMemo } from 'react'
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
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
import type { WaterPoint } from '../lib/refugesInfo'
import type { Poi, PoiType } from '../lib/osmPois'
import { REPORT_TYPE_LABELS, type Report, type RouteRecord } from '../types'

// Leaflet + bundlers : les chemins d'icônes par défaut ne se résolvent pas automatiquement.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

// Goutte d'eau maison (cohérente avec le bleu "eau à sec" des signalements), pour les points
// d'eau importés de refuges.info — volontairement distincte des marqueurs de signalement.
const waterPointIcon = L.divIcon({
  className: 'water-point-icon',
  html: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#eaf3fa" stroke="${REPORT_TYPE_COLORS.eau_a_sec}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></svg>`,
  iconSize: [22, 22],
  iconAnchor: [11, 20],
  popupAnchor: [0, -18],
})

const POI_COLORS: Record<PoiType, string> = {
  peak: '#8a6642',
  col: '#5b6b7a',
  viewpoint: '#a15c9e',
}

const POI_ICON_SHAPES: Record<PoiType, string> = {
  peak: '<polyline points="3,19 8,9 11,14 14,7 18,13 21,19"/>',
  col: '<path d="M2 18L7 9l3 4 2-9 2 9 3-4 5 9"/>',
  viewpoint: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.6"/>',
}

const poiIcons: Record<PoiType, L.DivIcon> = {
  peak: L.divIcon({
    className: 'poi-icon',
    html: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${POI_COLORS.peak}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${POI_ICON_SHAPES.peak}</svg>`,
    iconSize: [20, 20],
    iconAnchor: [10, 18],
    popupAnchor: [0, -16],
  }),
  col: L.divIcon({
    className: 'poi-icon',
    html: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${POI_COLORS.col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${POI_ICON_SHAPES.col}</svg>`,
    iconSize: [20, 20],
    iconAnchor: [10, 18],
    popupAnchor: [0, -16],
  }),
  viewpoint: L.divIcon({
    className: 'poi-icon',
    html: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${POI_COLORS.viewpoint}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${POI_ICON_SHAPES.viewpoint}</svg>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -8],
  }),
}

const POI_TYPE_LABELS: Record<PoiType, string> = {
  peak: 'Sommet',
  col: 'Col',
  viewpoint: 'Point de vue',
}

const CHAMBERY_CENTER: [number, number] = [45.5646, 5.9178]

// Palette pastel pour différencier les parcours à l'œil sur la carte simple (accueil),
// sans être trop criarde sur le fond de carte. En mode heatmap, tous les tracés restent
// d'une seule couleur pour préserver l'effet de superposition (plus un chemin est
// emprunté, plus il s'assombrit).
const ROUTE_COLORS = ['#5fae82', '#6fa8d9', '#d99a5f', '#a980c4', '#c97a97', '#6fbfae', '#dfc06a', '#7f93c4']

interface RouteMapProps {
  routes: RouteRecord[]
  reports?: Report[]
  waterPoints?: WaterPoint[]
  pois?: Poi[]
  onSelectRoute?: (routeId: string) => void
  pickMode?: boolean
  onPick?: (lat: number, lng: number) => void
  pickedPosition?: { lat: number; lng: number } | null
  /** Effet heatmap (tracés semi-transparents qui s'assombrissent en se superposant) —
   * réservé à la vue densité dédiée à la génération de parcours. La carte d'accueil
   * utilise des tracés pleins, plus lisibles avec peu de parcours affichés. */
  heatmap?: boolean
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
  waterPoints = [],
  pois = [],
  onSelectRoute,
  pickMode = false,
  onPick,
  pickedPosition,
  heatmap = false,
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
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Points d&#39;eau : <a href="https://www.refuges.info">refuges.info</a> (CC BY-SA)'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomleft" />
      <FitToRoutes routes={routes} />
      <PickModeHandler active={pickMode} onPick={onPick} />
      {routes.map((route, index) => (
        <Polyline
          key={route.id}
          positions={route.gpx_track.map((p) => [p.lat, p.lng])}
          // En mode heatmap, l'opacité partielle fait que les tracés qui se superposent
          // s'assombrissent naturellement. En mode simple, un trait plein coloré par
          // position dans la liste (pas par hachage de l'id, qui donnait des collisions
          // de couleur quasi garanties avec seulement 8 teintes pour 8 parcours affichés).
          pathOptions={{
            color: heatmap ? '#2f6f4f' : ROUTE_COLORS[index % ROUTE_COLORS.length],
            weight: heatmap ? 4 : 5,
            opacity: heatmap ? 0.5 : 0.9,
          }}
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
      {waterPoints.map((point) => (
        <Marker key={`water-${point.id}`} position={[point.lat, point.lng]} icon={waterPointIcon}>
          <Popup>
            <strong>{point.nom}</strong>
            {point.etat && <div>{point.etat}</div>}
            <div>
              <a href={point.lien} target="_blank" rel="noreferrer">
                Voir sur refuges.info
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
      {pois.map((poi) => (
        <Marker key={`poi-${poi.id}`} position={[poi.lat, poi.lng]} icon={poiIcons[poi.type]}>
          <Popup>
            <strong>{poi.nom}</strong>
            <div>
              {POI_TYPE_LABELS[poi.type]}
              {poi.elevationM ? ` — ${poi.elevationM} m` : ''}
            </div>
            {poi.wikipediaUrl && (
              <div>
                <a href={poi.wikipediaUrl} target="_blank" rel="noreferrer">
                  Voir sur Wikipédia
                </a>
              </div>
            )}
          </Popup>
        </Marker>
      ))}
      {pickedPosition && <Marker position={[pickedPosition.lat, pickedPosition.lng]} />}
    </MapContainer>
  )
}
