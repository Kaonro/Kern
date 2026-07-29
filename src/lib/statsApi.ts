import { supabase } from './supabaseClient'

/** Enregistre une visite de page. Best-effort : n'importe quel échec est ignoré,
 * ce n'est jamais bloquant pour la navigation. */
export function logPageView(path: string): void {
  supabase
    .from('page_views')
    .insert({ path })
    .then(
      () => {},
      () => {},
    )
}

export interface DashboardStats {
  totalViews: number
  totalUsers: number
  totalRoutes: number
  totalReports: number
  totalVotes: number
  viewsByDay: { date: string; count: number }[]
}

async function safeCount(table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
  return error ? 0 : (count ?? 0)
}

const DAYS_TRACKED = 14

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const since = new Date(Date.now() - DAYS_TRACKED * 24 * 60 * 60 * 1000).toISOString()

  const [totalViews, totalUsers, totalRoutes, totalReports, totalVotes, recentViews] = await Promise.all([
    safeCount('page_views'),
    safeCount('users'),
    safeCount('routes'),
    safeCount('reports'),
    safeCount('route_votes'),
    supabase.from('page_views').select('created_at').gte('created_at', since),
  ])

  const countsByDay = new Map<string, number>()
  const dates: string[] = []
  for (let i = DAYS_TRACKED - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    dates.push(key)
    countsByDay.set(key, 0)
  }
  if (!recentViews.error) {
    for (const row of recentViews.data as { created_at: string }[]) {
      const key = row.created_at.slice(0, 10)
      if (countsByDay.has(key)) countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1)
    }
  }

  return {
    totalViews,
    totalUsers,
    totalRoutes,
    totalReports,
    totalVotes,
    viewsByDay: dates.map((date) => ({ date, count: countsByDay.get(date) ?? 0 })),
  }
}
