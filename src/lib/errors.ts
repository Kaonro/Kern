function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string') return message
  }
  return String(err)
}

function extractCode(err: unknown): unknown {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return (err as { code: unknown }).code
  }
  return undefined
}

/** Traduit les erreurs techniques (réseau, Postgres/RLS, géolocalisation) en messages compréhensibles. */
export function toFriendlyError(err: unknown): string {
  const code = extractCode(err)
  if (typeof code === 'number') {
    if (code === 1) {
      return "Localisation refusée — autorise l'accès à ta position dans les réglages de ton navigateur, ou choisis un point sur la carte."
    }
    if (code === 2) {
      return 'Position introuvable — réessaie en extérieur, ou choisis un point sur la carte.'
    }
    if (code === 3) {
      return 'La localisation a pris trop de temps — réessaie, ou choisis un point sur la carte.'
    }
  }

  const raw = extractMessage(err)
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
  if (lower.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.'
  }
  if (lower.includes('email not confirmed')) {
    return "Ton adresse email n'est pas encore confirmée — vérifie ta boîte mail."
  }
  if (lower.includes('user already registered')) {
    return 'Un compte existe déjà avec cet email.'
  }
  if (lower.includes('unable to validate email address')) {
    return 'Adresse email invalide.'
  }
  if (lower.includes('password should be at least')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.'
  }

  return raw
}
