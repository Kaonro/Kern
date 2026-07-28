import { supabase } from './supabaseClient'
import type { Difficulte, RouteDifficultyVote } from '../types'

export async function fetchDifficultyVotesForRoute(routeId: string): Promise<RouteDifficultyVote[]> {
  const { data, error } = await supabase.from('route_difficulty_votes').select('*').eq('route_id', routeId)
  if (error) throw error
  return data as RouteDifficultyVote[]
}

export async function castDifficultyVote(routeId: string, userId: string, difficulte: Difficulte): Promise<void> {
  const { error } = await supabase
    .from('route_difficulty_votes')
    .upsert({ route_id: routeId, user_id: userId, difficulte }, { onConflict: 'route_id,user_id' })
  if (error) throw error
}
