import type { GpxData, TrackPoint } from '../types'

function haversineMeters(a: TrackPoint, b: TrackPoint): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Parse un fichier GPX (texte XML) en distance/dénivelé/tracé, via le DOMParser natif du navigateur. */
export function parseGpx(gpxText: string): GpxData {
  const doc = new DOMParser().parseFromString(gpxText, 'application/xml')

  if (doc.querySelector('parsererror')) {
    throw new Error('Fichier GPX invalide ou corrompu.')
  }

  const trkpts = Array.from(doc.getElementsByTagName('trkpt'))
  if (trkpts.length === 0) {
    throw new Error('Aucun point de trace trouvé dans ce fichier GPX.')
  }

  const points: TrackPoint[] = trkpts.map((pt) => {
    const lat = parseFloat(pt.getAttribute('lat') ?? '')
    const lng = parseFloat(pt.getAttribute('lon') ?? '')
    const eleEl = pt.getElementsByTagName('ele')[0]
    const ele = eleEl?.textContent ? parseFloat(eleEl.textContent) : undefined
    return { lat, lng, ele }
  })

  let distanceMeters = 0
  let elevationGainM = 0
  let elevationLossM = 0

  for (let i = 1; i < points.length; i++) {
    distanceMeters += haversineMeters(points[i - 1], points[i])
    const prevEle = points[i - 1].ele
    const currEle = points[i].ele
    if (prevEle !== undefined && currEle !== undefined) {
      const delta = currEle - prevEle
      if (delta > 0) elevationGainM += delta
      else elevationLossM += -delta
    }
  }

  return {
    points,
    distanceKm: distanceMeters / 1000,
    elevationGainM: Math.round(elevationGainM),
    elevationLossM: Math.round(elevationLossM),
  }
}
