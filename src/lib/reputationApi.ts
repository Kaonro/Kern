import { supabase } from './supabaseClient'

export interface ActivityStats {
  reports: number
  routes: number
  votes: number
}

export interface Level {
  index: number
  threshold: number
  name: string
  color: string
}

/** Échelons façon Waze/Google Local Guides — les noms montent en "fiabilité perçue"
 * pour donner envie de contribuer et pour rassurer les autres sur qui a signalé quoi. */
export const LEVELS: Level[] = [
  { index: 1, threshold: 0, name: 'Marcheur du dimanche', color: '#9a9a8f' },
  { index: 2, threshold: 3, name: 'Trotteur de sentiers', color: '#7a9a5f' },
  { index: 3, threshold: 10, name: 'Éclaireur', color: '#3fa66a' },
  { index: 4, threshold: 25, name: 'Guide de confiance', color: '#2f7fb8' },
  { index: 5, threshold: 50, name: 'Pilier de la communauté', color: '#7c5cbf' },
  { index: 6, threshold: 100, name: 'Légende du sentier', color: '#d4a017' },
]

// Une trace GPX ajoutée compte plus qu'un signalement, qui compte plus qu'un simple vote —
// reflète l'effort relatif de chaque contribution.
export function computeScore(stats: ActivityStats): number {
  return stats.reports * 3 + stats.routes * 5 + stats.votes * 1
}

export function computeLevelProgress(score: number): { level: Level; next: Level | null; progress: number } {
  let current = LEVELS[0]
  let next: Level | null = null
  for (const level of LEVELS) {
    if (score >= level.threshold) current = level
    else {
      next = level
      break
    }
  }
  const progress = next ? (score - current.threshold) / (next.threshold - current.threshold) : 1
  return { level: current, next, progress: Math.min(1, Math.max(0, progress)) }
}

async function safeCount(
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const { count, error } = await query
  return error ? 0 : (count ?? 0)
}

/** Compte les contributions d'un utilisateur (signalements, parcours ajoutés, votes cumulés).
 * Chaque compteur échoue silencieusement à 0 plutôt que de faire planter tout l'appelant —
 * utile si une des tables (ex. route_difficulty_votes) n'a pas encore sa migration en base. */
export async function fetchActivityStats(userId: string): Promise<ActivityStats> {
  const [reports, routes, votes, difficultyVotes] = await Promise.all([
    safeCount(supabase.from('reports').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
    safeCount(supabase.from('routes').select('id', { count: 'exact', head: true }).eq('created_by', userId)),
    safeCount(supabase.from('route_votes').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
    safeCount(
      supabase.from('route_difficulty_votes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ),
  ])
  return { reports, routes, votes: votes + difficultyVotes }
}
