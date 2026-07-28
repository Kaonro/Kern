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

// Sud, ouest, nord, est — zone du lancement pilote (même zone que refuges.info).
const PILOT_BBOX = '45.1,5.5,45.8,6.3'

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

/**
 * Sommets, cols et points de vue depuis OpenStreetMap (Overpass API, gratuit, sans clé).
 * On récupère large puis on filtre nous-mêmes côté client : sans filtre, une zone comme
 * celle-ci contient plus de 500 sommets et 1000+ "points de vue" au sens large d'OSM —
 * on ne garde que ceux avec un nom ET une fiche Wikipédia/Wikidata (sauf les cols, déjà
 * assez rares et notables par nature dès qu'ils sont nommés).
 */
export async function fetchPois(): Promise<Poi[]> {
  const query = `[out:json][timeout:25];(node["natural"="peak"](${PILOT_BBOX});node["natural"="saddle"]["mountain_pass"="yes"](${PILOT_BBOX});node["tourism"="viewpoint"](${PILOT_BBOX}););out body;`
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
  })
  if (!res.ok) throw new Error('OpenStreetMap (Overpass) indisponible')
  const data = (await res.json()) as { elements: OverpassElement[] }

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
