import { haversineMeters } from './haversine'
import type { RouteRecord } from '../types'

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
