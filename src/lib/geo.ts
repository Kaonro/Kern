import { haversineMeters } from './haversine'
import type { RouteRecord, TrackPoint } from '../types'

/** Un signalement doit rester proche d'un tracé existant. */
export const MAX_REPORT_DISTANCE_METERS = 250

interface LatLng {
  lat: number
  lng: number
}

export interface NearestRouteResult {
  route: RouteRecord
  distanceMeters: number
}

/** Trouve le parcours dont le tracé passe le plus près de `position`, si un point est à moins de MAX_REPORT_DISTANCE_METERS. */
export function findNearestRoute(routes: RouteRecord[], position: LatLng): NearestRouteResult | null {
  let best: NearestRouteResult | null = null

  for (const route of routes) {
    for (const point of route.gpx_track) {
      const distanceMeters = haversineMeters(point, position)
      if (!best || distanceMeters < best.distanceMeters) {
        best = { route, distanceMeters }
      }
    }
  }

  if (best && best.distanceMeters <= MAX_REPORT_DISTANCE_METERS) return best
  return null
}

/** Index du point du tracé le plus proche de `position`. */
export function nearestTrackIndex(track: TrackPoint[], position: LatLng): number {
  let bestIndex = 0
  let bestDistance = Infinity
  track.forEach((point, i) => {
    const distance = haversineMeters(point, position)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = i
    }
  })
  return bestIndex
}

/** Extrait la portion du tracé de part et d'autre de `centerIndex`, sur ~`halfWindowMeters` de chaque côté. */
export function extractTrackSegment(track: TrackPoint[], centerIndex: number, halfWindowMeters = 60): TrackPoint[] {
  let start = centerIndex
  let accumulated = 0
  while (start > 0) {
    accumulated += haversineMeters(track[start], track[start - 1])
    if (accumulated >= halfWindowMeters) break
    start--
  }

  let end = centerIndex
  accumulated = 0
  while (end < track.length - 1) {
    accumulated += haversineMeters(track[end], track[end + 1])
    if (accumulated >= halfWindowMeters) break
    end++
  }

  return track.slice(start, end + 1)
}
