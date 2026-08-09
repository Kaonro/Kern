import { supabase } from './supabaseClient'
import type { MapBounds } from './geocoding'

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

function mapRow(row: PoiRow): Poi {
  return {
    id: row.id,
    nom: row.nom,
    type: row.type,
    lat: row.lat,
    lng: row.lng,
    elevationM: row.elevation_m ?? undefined,
    wikipediaUrl: row.wikipedia_url ?? undefined,
  }
}

/**
 * Sommets, cols, points de vue, monuments/patrimoine et parcs OpenStreetMap, importés une
 * fois dans notre base (cf. supabase/013_add_pois.sql et suivantes) plutôt qu'interrogés
 * en direct sur Overpass à chaque visite : le service public gratuit est régulièrement
 * surchargé ("server too busy"), ce qui rendait la couche invisible de façon intermittente.
 *
 * `bounds` limite la requête à la zone actuellement affichée (pas de rayon fixe autour
 * d'une ville) et `limit` plafonne le nombre de marqueurs selon le zoom, pour ne pas
 * surcharger un téléphone quand la zone visible est très grande (vue dézoomée). `types`
 * restreint aux catégories demandées et est requêté séparément par calque (plutôt qu'un
 * seul appel mélangeant tout) : trier par altitude pour prioriser les points hauts
 * enterrerait sinon systématiquement monuments/parcs (altitude toujours nulle) derrière
 * les sommets dès que la limite est atteinte.
 */
export async function fetchPois(bounds: MapBounds, types: PoiType[], limit: number): Promise<Poi[]> {
  const { data, error } = await supabase
    .from('pois')
    .select('*')
    .in('type', types)
    .gte('lat', bounds.south)
    .lte('lat', bounds.north)
    .gte('lng', bounds.west)
    .lte('lng', bounds.east)
    .order('elevation_m', { ascending: false, nullsFirst: false })
    .limit(limit)
  if (error) throw error

  return (data as PoiRow[]).map(mapRow)
}
