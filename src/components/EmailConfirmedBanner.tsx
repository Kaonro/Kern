import { useEffect, useState } from 'react'
import { IconCheck } from './icons'
import './EmailConfirmedBanner.css'

/** Le seul moyen d'atterrir sur l'appli avec ces paramètres dans l'URL est le lien de
 * confirmation envoyé après inscription (Supabase y redirige avec `type=signup` en hash
 * ou en query selon le flux). Sans ce bandeau, l'utilisateur clique le lien, revient sur
 * la carte sans aucune indication que son compte est bien confirmé. */
function isSignupConfirmation(): boolean {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  return hash.get('type') === 'signup' || search.get('type') === 'signup'
}

export function EmailConfirmedBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isSignupConfirmation()) return
    setVisible(true)
    // Retire les jetons de l'URL une fois lus : rien à laisser trainer dans la barre
    // d'adresse ou l'historique du navigateur.
    window.history.replaceState(null, '', window.location.pathname)
    const timer = setTimeout(() => setVisible(false), 6000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="email-confirmed-banner">
      <IconCheck /> Email confirmé, bienvenue sur Kern !
    </div>
  )
}
