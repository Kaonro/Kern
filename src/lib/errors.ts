/** Traduit les erreurs techniques (réseau, Postgres/RLS) en messages compréhensibles. */
export function toFriendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const lower = raw.toLowerCase()

  if (lower.includes('failed to fetch') || lower.includes('networkerror')) {
    return 'Impossible de contacter le serveur — vérifie ta connexion internet.'
  }
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return "Tu n'as pas le droit de faire ça (connecte-toi si ce n'est pas déjà fait)."
  }
  if (lower.includes('duplicate key')) {
    return 'Cette action a déjà été faite.'
  }
  if (lower.includes('jwt') || lower.includes('not authenticated')) {
    return 'Ta session a expiré — reconnecte-toi.'
  }

  return raw
}
