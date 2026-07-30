import { supabase } from './supabaseClient'

export type PoiType = 'peak' | 'col' | 'viewpoint' | 'monument' | 'park'

export interface Poi {
  id: number
  lat: number
  lng: number
  nom: string
  type: PoiType
  elevationM?: number
  wikipediaUrl?: string
}

interface PoiRow {
  id: number
  nom: string
  type: PoiType
  lat: number
  lng: number
  elevation_m: number | null
  wikipedia_url: string | null
}

// L'API Supabase plafonne à 1000 lignes par requête (db-max-rows) quel que soit le Range
// demandé : au-delà de ce nombre de POI, il faut paginer nous-mêmes pour tout récupérer.
const PAGE_SIZE = 1000

/**
 * Sommets, cols, points de vue, monuments/patrimoine et parcs OpenStreetMap, importés une
 * fois dans notre base (cf. supabase/013_add_pois.sql et suivantes) plutôt qu'interrogés
 * en direct sur Overpass à chaque visite : le service public gratuit est régulièrement
 * surchargé ("server too busy"), ce qui rendait la couche invisible de façon intermittente.
 */
export async function fetchPois(): Promise<Poi[]> {
  const rows: PoiRow[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('pois')
      .select('*')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    rows.push(...(data as PoiRow[]))
    if (data.length < PAGE_SIZE) break
  }

  return rows.map((row) => ({
    id: row.id,
    nom: row.nom,
    type: row.type,
    lat: row.lat,
    lng: row.lng,
    elevationM: row.elevation_m ?? undefined,
    wikipediaUrl: row.wikipedia_url ?? undefined,
  }))
}
