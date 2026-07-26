export type Technicite = 'roulant' | 'technique' | 'tres_technique'

export const TECHNICITE_LABELS: Record<Technicite, string> = {
  roulant: 'Roulant',
  technique: 'Technique',
  tres_technique: 'Très technique',
}

export type ReportType =
  | 'eau_a_sec'
  | 'passage_boueux'
  | 'danger_eboulement'
  | 'balisage_manquant'
  | 'animal'
  | 'autre'

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  eau_a_sec: "Point d'eau à sec",
  passage_boueux: 'Passage boueux',
  danger_eboulement: 'Danger / éboulement',
  balisage_manquant: 'Balisage manquant',
  animal: 'Animal sur le sentier',
  autre: 'Autre',
}

export interface TrackPoint {
  lat: number
  lng: number
  ele?: number
}

export interface GpxData {
  points: TrackPoint[]
  distanceKm: number
  elevationGainM: number
  elevationLossM: number
}

export interface RouteRecord {
  id: string
  nom: string
  gpxTrack: TrackPoint[]
  distanceKm: number
  elevationGainM: number
  technicite: Technicite | null
  saisonnalite: string | null
  createdBy: string
  createdAt: string
}

export interface RouteVote {
  id: string
  routeId: string
  userId: string
  technicite: Technicite
}

export interface Report {
  id: string
  routeId: string
  userId: string
  type: ReportType
  description: string
  latitude: number
  longitude: number
  createdAt: string
}

export interface UserProfile {
  id: string
  email: string
  pseudo: string
  ville: string | null
}
