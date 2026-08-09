import { bboxWSEN, type MapBounds } from './geocoding'

export interface WaterPoint {
  id: number
  nom: string
  lat: number
  lng: number
  etat: string
  lien: string
}

/** type_points=23 = "point d'eau" sur refuges.info (vérifié via l'API, absent de leur doc écrite). */
const WATER_POINT_TYPE_ID = 23

/**
 * Points d'eau de refuges.info (API publique, lecture seule, CC BY-SA, pas de clé requise)
 * pour pré-remplir la carte avant d'avoir une communauté active. Pas de stockage en base :
 * on interroge en direct à chaque déplacement de la carte pour rester à jour avec leur
 * communauté. `bounds` vient de la zone actuellement affichée (pas de zone codée en dur,
 * ni de rayon fixe autour d'une ville — ça marche pareil n'importe où en France).
 */
export async function fetchWaterPoints(bounds: MapBounds): Promise<WaterPoint[]> {
  const url = `https://www.refuges.info/api/bbox?bbox=${bboxWSEN(bounds)}&type_points=${WATER_POINT_TYPE_ID}&nb_points=all&format=geojson&detail=simple`
  const res = await fetch(url)
  if (!res.ok) throw new Error('refuges.info indisponible')
  const data = await res.json()

  return (data.features as RefugesInfoFeature[])
    .filter((f) => f.properties.etat?.valeur !== 'Détruite')
    .map((f) => ({
      id: f.id,
      nom: f.properties.nom,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      etat: f.properties.etat?.valeur ?? '',
      lien: f.properties.lien,
    }))
}

interface RefugesInfoFeature {
  id: number
  geometry: { coordinates: [number, number] }
  properties: {
    nom: string
    etat?: { valeur: string }
    lien: string
  }
}
