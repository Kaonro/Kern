export interface LatLng {
  lat: number
  lng: number
}

/** Zone rectangulaire (bornes de la carte affichée) — remplace l'ancien rayon fixe autour
 * d'un centre : les points d'eau/sommets/lieux se chargent maintenant pour ce qui est
 * réellement visible à l'écran, pas une zone figée autour de quelques villes pilotes. */
export interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

/** Boîte "ouest,sud,est,nord" (format refuges.info). */
export function bboxWSEN(bounds: MapBounds): string {
  return `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`
}

/** Boîte "sud,ouest,nord,est" (format Overpass). */
export function bboxSWNE(bounds: MapBounds): string {
  return `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
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
