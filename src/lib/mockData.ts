import type { Report, RouteRecord } from '../types'

/**
 * Données de démonstration en attendant le branchement Supabase (voir README.md).
 * A supprimer une fois les routes chargées depuis la base.
 */
export const MOCK_ROUTES: (RouteRecord & { popularite: number })[] = [
  {
    id: 'mock-1',
    nom: 'Crêt du Maine depuis Chambéry',
    gpxTrack: [
      { lat: 45.5646, lng: 5.9178 },
      { lat: 45.5721, lng: 5.9302 },
      { lat: 45.5789, lng: 5.9455 },
      { lat: 45.5834, lng: 5.9601 },
    ],
    distanceKm: 12.4,
    elevationGainM: 850,
    technicite: 'technique',
    saisonnalite: 'Praticable avril à novembre, enneigé et verglacé l’hiver',
    createdBy: 'demo',
    createdAt: new Date().toISOString(),
    popularite: 6,
  },
  {
    id: 'mock-2',
    nom: 'Tour du lac du Bourget',
    gpxTrack: [
      { lat: 45.6883, lng: 5.8656 },
      { lat: 45.7134, lng: 5.8712 },
      { lat: 45.7345, lng: 5.8534 },
      { lat: 45.7102, lng: 5.8321 },
    ],
    distanceKm: 21.7,
    elevationGainM: 180,
    technicite: 'roulant',
    saisonnalite: 'Praticable toute l’année',
    createdBy: 'demo',
    createdAt: new Date().toISOString(),
    popularite: 3,
  },
]

export const MOCK_REPORTS: Report[] = [
  {
    id: 'report-1',
    routeId: 'mock-1',
    userId: 'demo',
    type: 'balisage_manquant',
    description: 'Plus aucun marquage après le second lacet.',
    latitude: 45.5789,
    longitude: 5.9455,
    createdAt: new Date().toISOString(),
  },
]
