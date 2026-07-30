import { bboxSWNE, type LatLng } from './geocoding'

export type PoiType = 'peak' | 'col' | 'viewpoint'

export interface Poi {
  id: number
  lat: number
  lng: number
  nom: string
  type: PoiType
  elevationM?: number
  wikipediaUrl?: string
}

interface OverpassElement {
  id: number
  lat: number
  lon: number
  tags?: Record<string, string>
}

function wikipediaUrl(wikipedia?: string): string | undefined {
  if (!wikipedia) return undefined
  const separatorIndex = wikipedia.indexOf(':')
  if (separatorIndex === -1) return undefined
  const lang = wikipedia.slice(0, separatorIndex)
  const title = wikipedia.slice(separatorIndex + 1)
  if (!title) return undefined
  return `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
]

/** L'instance publique Overpass est parfois indisponible plusieurs minutes d'affilée :
 * on garde le dernier résultat par zone pour que la couche reste utilisable en attendant. */
const CACHE_TTL_MS = 30 * 60 * 1000

function cacheKey(bbox: string): string {
  return `kern:pois:${bbox}`
}

function readCache(bbox: string): Poi[] | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(bbox))
    if (!raw) return null
    const { savedAt, pois } = JSON.parse(raw) as { savedAt: number; pois: Poi[] }
    if (Date.now() - savedAt > CACHE_TTL_MS) return null
    return pois
  } catch {
    return null
  }
}

function writeCache(bbox: string, pois: Poi[]): void {
  try {
    sessionStorage.setItem(cacheKey(bbox), JSON.stringify({ savedAt: Date.now(), pois }))
  } catch {
    // Stockage plein/indisponible : pas grave, juste pas de cache.
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Sommets, cols et points de vue depuis OpenStreetMap (Overpass API, gratuit, sans clé).
 * On ne garde que ceux avec un nom ET une fiche Wikipédia/Wikidata (sauf les cols, déjà
 * assez rares et notables par nature dès qu'ils sont nommés) — filtré côté serveur Overpass
 * plutôt que côté client : sans ce filtre, une zone comme celle-ci contient plus de 500
 * sommets et 1000+ "points de vue" au sens large d'OSM, et le temps de réponse dépassait
 * régulièrement le timeout (504) sur l'instance publique.
 * L'instance publique reste malgré tout sujette à des pannes/timeouts ponctuels sous
 * charge : on retente chaque miroir une fois avant de l'abandonner, et on retombe sur
 * le dernier résultat connu (sessionStorage) si tous les miroirs échouent.
 * `center` vient de la position de l'utilisateur ou de la ville de son profil (sinon
 * DEFAULT_MAP_CENTER) — pas de zone codée en dur, pour que ça marche à Rouen comme ailleurs.
 */
export async function fetchPois(center: LatLng): Promise<Poi[]> {
  const bbox = bboxSWNE(center)
  const query = `[out:json][timeout:25];(
    node["natural"="peak"]["name"]["wikipedia"](${bbox});
    node["natural"="peak"]["name"]["wikidata"](${bbox});
    node["natural"="saddle"]["mountain_pass"="yes"]["name"](${bbox});
    node["tourism"="viewpoint"]["name"]["wikipedia"](${bbox});
    node["tourism"="viewpoint"]["name"]["wikidata"](${bbox});
  );out body;`

  let lastError: unknown
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(endpoint, { method: 'POST', body: `data=${encodeURIComponent(query)}` })
        if (!res.ok) throw new Error('OpenStreetMap (Overpass) indisponible')
        const pois = parsePois(await res.json())
        writeCache(bbox, pois)
        return pois
      } catch (err) {
        lastError = err
        // Instance publique surchargée/en timeout : une seconde tentative résout
        // souvent le problème avant de passer au miroir suivant.
        if (attempt === 0) await sleep(1500)
      }
    }
  }

  const cached = readCache(bbox)
  if (cached) return cached
  throw lastError
}

function parsePois(data: { elements: OverpassElement[] }): Poi[] {
  const pois: Poi[] = []
  for (const el of data.elements) {
    const tags = el.tags ?? {}
    if (!tags.name) continue
    const hasWiki = Boolean(tags.wikidata || tags.wikipedia)
    const elevationM = tags.ele ? Math.round(Number(tags.ele)) : undefined

    if (tags.natural === 'peak' && hasWiki) {
      pois.push({ id: el.id, lat: el.lat, lng: el.lon, nom: tags.name, type: 'peak', elevationM, wikipediaUrl: wikipediaUrl(tags.wikipedia) })
    } else if (tags.mountain_pass === 'yes') {
      pois.push({ id: el.id, lat: el.lat, lng: el.lon, nom: tags.name, type: 'col', elevationM, wikipediaUrl: wikipediaUrl(tags.wikipedia) })
    } else if (tags.tourism === 'viewpoint' && hasWiki) {
      pois.push({ id: el.id, lat: el.lat, lng: el.lon, nom: tags.name, type: 'viewpoint', wikipediaUrl: wikipediaUrl(tags.wikipedia) })
    }
  }
  return pois
}
