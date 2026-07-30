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

/**
 * Sommets, cols, points de vue, monuments/patrimoine et parcs OpenStreetMap, importés une
 * fois dans notre base (cf. supabase/013_add_pois.sql et 014_add_poi_categories.sql)
 * plutôt qu'interrogés en direct sur Overpass à chaque visite : le service public gratuit
 * est régulièrement surchargé ("server too busy"), ce qui rendait la couche invisible de
 * façon intermittente pour les visiteurs.
 */
export async function fetchPois(): Promise<Poi[]> {
  const { data, error } = await supabase.from('pois').select('*')
  if (error) throw error
  return (data as PoiRow[]).map((row) => ({
    id: row.id,
    nom: row.nom,
    type: row.type,
    lat: row.lat,
    lng: row.lng,
    elevationM: row.elevation_m ?? undefined,
    wikipediaUrl: row.wikipedia_url ?? undefined,
  }))
}
