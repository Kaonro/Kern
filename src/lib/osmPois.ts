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

// overpass.osm.ch a été écarté : il répond vite avec un HTTP 200 mais sa base de
// données est vide/cassée (0 résultat même sur des requêtes qui devraient forcément
// matcher), ce qui court-circuitait silencieusement les autres miroirs.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
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

/** Timeout par tentative — sans ça, un miroir qui accepte la connexion mais ne répond
 * jamais (constaté sur overpass.kumi.systems) bloque `fetch` bien plus longtemps que le
 * `[timeout:25]` de la requête Overpass elle-même, qui ne s'applique qu'une fois la
 * requête reçue côté serveur. */
const FETCH_TIMEOUT_MS = 8000

async function fetchWithTimeout(url: string, body: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { method: 'POST', body, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// Une seule requête combinant sommets+cols+points de vue s'est avérée trop coûteuse
// pour Overpass sous charge (timeout même sur des miroirs par ailleurs fonctionnels) —
// trois requêtes plus légères en parallèle passent bien plus souvent, et une catégorie
// en échec n'empêche plus les deux autres de s'afficher.
const POI_QUERY_CLAUSES: ((bbox: string) => string)[] = [
  (bbox) => `node["natural"="peak"]["name"]["wikipedia"](${bbox});node["natural"="peak"]["name"]["wikidata"](${bbox});`,
  (bbox) => `node["natural"="saddle"]["mountain_pass"="yes"]["name"](${bbox});`,
  (bbox) =>
    `node["tourism"="viewpoint"]["name"]["wikipedia"](${bbox});node["tourism"="viewpoint"]["name"]["wikidata"](${bbox});`,
]

async function fetchPoiCategory(clause: string): Promise<OverpassElement[]> {
  const query = `[out:json][timeout:20];(${clause});out body;`
  let lastError: unknown
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(endpoint, `data=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('OpenStreetMap (Overpass) indisponible')
      const data = (await res.json()) as { elements: OverpassElement[] }
      return data.elements
    } catch (err) {
      lastError = err
      // Miroir en panne/en timeout : on passe directement au suivant.
    }
  }
  throw lastError
}

/**
 * Sommets, cols et points de vue depuis OpenStreetMap (Overpass API, gratuit, sans clé).
 * On ne garde que ceux avec un nom ET une fiche Wikipédia/Wikidata (sauf les cols, déjà
 * assez rares et notables par nature dès qu'ils sont nommés) — filtré côté serveur Overpass
 * plutôt que côté client : sans ce filtre, une zone comme celle-ci contient plus de 500
 * sommets et 1000+ "points de vue" au sens large d'OSM.
 * Les trois catégories partent en parallèle (cf. `POI_QUERY_CLAUSES`) et chacune essaie
 * plusieurs miroirs (timeout court, cf. `fetchWithTimeout`) : l'instance publique reste
 * sujette à des pannes ponctuelles, et une catégorie en échec ne doit pas priver les
 * autres. En dernier recours, on retombe sur le dernier résultat connu (sessionStorage).
 * `center` vient de la position de l'utilisateur ou de la ville de son profil (sinon
 * DEFAULT_MAP_CENTER) — pas de zone codée en dur, pour que ça marche à Rouen comme ailleurs.
 */
export async function fetchPois(center: LatLng): Promise<Poi[]> {
  const bbox = bboxSWNE(center)
  const results = await Promise.allSettled(POI_QUERY_CLAUSES.map((clause) => fetchPoiCategory(clause(bbox))))

  const elements = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  const pois = parsePois({ elements })

  if (results.every((r) => r.status === 'rejected')) {
    const cached = readCache(bbox)
    if (cached) return cached
    throw (results[0] as PromiseRejectedResult).reason
  }

  writeCache(bbox, pois)
  return pois
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
