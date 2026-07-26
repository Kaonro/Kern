export type Technicite = 'roulant' | 'technique' | 'tres_technique'

export const TECHNICITE_LABELS: Record<Technicite, string> = {
  roulant: 'Roulant',
  technique: 'Technique',
  tres_technique: 'Très technique',
}

export const TECHNICITE_EMOJIS: Record<Technicite, string> = {
  roulant: '🟢',
  technique: '🟠',
  tres_technique: '🔴',
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

export const REPORT_TYPE_EMOJIS: Record<ReportType, string> = {
  eau_a_sec: '🚱',
  passage_boueux: '🟤',
  danger_eboulement: '⚠️',
  balisage_manquant: '🧭',
  animal: '🦌',
  autre: '📍',
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

/** Reflète directement les colonnes de la table public.routes. */
export interface RouteRecord {
  id: string
  nom: string
  gpx_track: TrackPoint[]
  distance_km: number
  denivele_m: number
  saisonnalite: string | null
  created_by: string | null
  created_at: string
}

/** Reflète directement les colonnes de la table public.route_votes. */
export interface RouteVote {
  id: string
  route_id: string
  user_id: string
  technicite: Technicite
}

/** Reflète directement les colonnes de la table public.reports. */
export interface Report {
  id: string
  route_id: string
  user_id: string | null
  type: ReportType
  description: string | null
  latitude: number
  longitude: number
  created_at: string
}

/** Reflète directement les colonnes de la table public.users. */
export interface UserProfile {
  id: string
  email: string
  pseudo: string
  ville: string | null
}
