import { bboxWSEN, type LatLng } from './geocoding'

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
 * on interroge en direct à chaque chargement pour rester à jour avec leur communauté.
 * `center` vient de la position de l'utilisateur ou de la ville de son profil (sinon
 * DEFAULT_MAP_CENTER) — pas de zone codée en dur, pour que ça marche à Rouen comme ailleurs.
 */
export async function fetchWaterPoints(center: LatLng): Promise<WaterPoint[]> {
  const url = `https://www.refuges.info/api/bbox?bbox=${bboxWSEN(center)}&type_points=${WATER_POINT_TYPE_ID}&nb_points=all&format=geojson&detail=simple`
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
