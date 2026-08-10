import { supabase } from './supabaseClient'
import type { ReportConfirmation } from '../types'

export async function fetchConfirmationsForReports(reportIds: string[]): Promise<ReportConfirmation[]> {
  if (reportIds.length === 0) return []
  const { data, error } = await supabase.from('report_confirmations').select('*').in('report_id', reportIds)
  if (error) throw error
  return data as ReportConfirmation[]
}

export async function castReportConfirmation(reportId: string, userId: string, confirmed: boolean): Promise<void> {
  const { error } = await supabase
    .from('report_confirmations')
    .upsert({ report_id: reportId, user_id: userId, confirmed }, { onConflict: 'report_id,user_id' })
  if (error) throw error
}
