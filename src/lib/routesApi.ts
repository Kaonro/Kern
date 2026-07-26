import { supabase } from './supabaseClient'
import type { GpxData, RouteRecord, RouteWithContributor } from '../types'

export async function fetchRoutes(): Promise<RouteRecord[]> {
  const { data, error } = await supabase.from('routes').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as RouteRecord[]
}

export async function fetchRouteById(id: string): Promise<RouteWithContributor | null> {
  const { data, error } = await supabase
    .from('routes')
    .select('*, users(pseudo)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data as RouteWithContributor | null
}

export async function createRoute(params: { nom: string; gpx: GpxData; createdBy: string }): Promise<RouteRecord> {
  const { data, error } = await supabase
    .from('routes')
    .insert({
      nom: params.nom,
      gpx_track: params.gpx.points,
      distance_km: params.gpx.distanceKm,
      denivele_m: params.gpx.elevationGainM,
      created_by: params.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSaisonnalite(routeId: string, saisonnalite: string): Promise<void> {
  const { error } = await supabase.from('routes').update({ saisonnalite }).eq('id', routeId)
  if (error) throw error
}

export async function updateNom(routeId: string, nom: string): Promise<void> {
  const { error } = await supabase.from('routes').update({ nom }).eq('id', routeId)
  if (error) throw error
}
