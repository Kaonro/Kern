export interface LatLng {
  lat: number
  lng: number
}

// Demi-étendue (en degrés) de la zone couverte autour d'un centre pour les données
// externes (points d'eau, sommets...) — calée sur la taille de la zone pilote initiale
// (Chambéry/Grenoble/Chartreuse/Bauges), pour que ça marche pareil ailleurs (Rouen...).
const HALF_SPAN_LAT = 0.4
const HALF_SPAN_LNG = 0.45

/** Boîte "ouest,sud,est,nord" (format refuges.info) autour d'un centre. */
export function bboxWSEN(center: LatLng): string {
  return `${center.lng - HALF_SPAN_LNG},${center.lat - HALF_SPAN_LAT},${center.lng + HALF_SPAN_LNG},${center.lat + HALF_SPAN_LAT}`
}

/** Boîte "sud,ouest,nord,est" (format Overpass) autour d'un centre. */
export function bboxSWNE(center: LatLng): string {
  return `${center.lat - HALF_SPAN_LAT},${center.lng - HALF_SPAN_LNG},${center.lat + HALF_SPAN_LAT},${center.lng + HALF_SPAN_LNG}`
}

/** Géocode un nom de ville via Nominatim (OpenStreetMap), gratuit et sans clé.
 * Renvoie null si la ville n'est pas trouvée ou en cas d'erreur réseau. */
export async function geocodeCity(city: string): Promise<LatLng | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
  const res = await fetch(url)
  if (!res.ok) return null
  const results = (await res.json()) as { lat: string; lon: string }[]
  if (results.length === 0) return null
  return { lat: Number(results[0].lat), lng: Number(results[0].lon) }
}
