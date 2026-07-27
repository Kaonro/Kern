import { supabase } from './supabaseClient'
import type { RouteVote, Technicite } from '../types'

export async function fetchVotesForRoute(routeId: string): Promise<RouteVote[]> {
  const { data, error } = await supabase.from('route_votes').select('*').eq('route_id', routeId)
  if (error) throw error
  return data as RouteVote[]
}

export async function fetchAllVotes(): Promise<RouteVote[]> {
  const { data, error } = await supabase.from('route_votes').select('*')
  if (error) throw error
  return data as RouteVote[]
}

export async function castVote(routeId: string, userId: string, technicite: Technicite): Promise<void> {
  const { error } = await supabase
    .from('route_votes')
    .upsert({ route_id: routeId, user_id: userId, technicite }, { onConflict: 'route_id,user_id' })
  if (error) throw error
}

export function computeMajorityTechnicite(votes: RouteVote[]): Technicite | null {
  if (votes.length === 0) return null
  const counts: Record<Technicite, number> = { roulant: 0, technique: 0, tres_technique: 0 }
  for (const vote of votes) counts[vote.technicite]++
  return (Object.keys(counts) as Technicite[]).reduce((a, b) => (counts[a] >= counts[b] ? a : b))
}
