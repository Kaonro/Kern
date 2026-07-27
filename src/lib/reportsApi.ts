import { supabase } from './supabaseClient'
import type { Report, ReportType } from '../types'

export async function fetchAllReports(): Promise<Report[]> {
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Report[]
}

export async function fetchReportsForRoute(routeId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('route_id', routeId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Report[]
}

export async function createReport(params: {
  routeId: string
  userId: string
  type: ReportType
  description: string
  latitude: number
  longitude: number
}): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      route_id: params.routeId,
      user_id: params.userId,
      type: params.type,
      description: params.description,
      latitude: params.latitude,
      longitude: params.longitude,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReport(reportId: string): Promise<void> {
  // Supabase ne renvoie pas d'erreur quand RLS bloque un delete : il faut
  // vérifier qu'une ligne a bien été supprimée (select() renvoie les lignes affectées).
  const { data, error } = await supabase.from('reports').delete().eq('id', reportId).select('id')
  if (error) throw error
  if (!data || data.length === 0) {
    throw new Error("Suppression refusée — tu n'as peut-être pas le droit de supprimer ce signalement.")
  }
}
