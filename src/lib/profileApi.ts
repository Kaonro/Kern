import { supabase } from './supabaseClient'
import type { UserProfile } from '../types'

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, params: { pseudo: string; ville: string }): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ pseudo: params.pseudo, ville: params.ville || null })
    .eq('id', userId)
  if (error) throw error
}
