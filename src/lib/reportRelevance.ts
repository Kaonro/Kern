const REPORT_MAX_AGE_DAYS = 90

/** Un signalement perd en opacité avec le temps, jusqu'à un plancher, plutôt que de disparaître. */
export function relevanceOpacity(createdAt: string): number {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  return Math.max(0.35, 1 - ageDays / REPORT_MAX_AGE_DAYS)
}
