import { useEffect, useState } from 'react'
import { IconAlert, IconGauge, IconMountain, IconTrail, IconUpload } from './icons'
import './WelcomeModal.css'

const STORAGE_KEY = 'kern_welcome_seen'

/** Petite présentation affichée une seule fois, à la toute première visite —
 * pour donner le contexte à quelqu'un qui arrive sur Kern sans avoir vu le pitch. */
export function WelcomeModal() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="welcome-overlay">
      <div className="welcome-card">
        <IconMountain className="welcome-logo" />
        <h1>Bienvenue sur Kern</h1>
        <p className="welcome-tagline">
          Ce que l'IA et les cartes ne peuvent pas savoir — le vécu de ceux qui y étaient hier.
        </p>

        <ul className="welcome-features">
          <li>
            <IconTrail />
            <span>
              La carte superpose les traces GPX de la communauté : plus un chemin est emprunté, plus il ressort.
            </span>
          </li>
          <li>
            <IconAlert />
            <span>Signale en temps réel un danger, un point d'eau à sec ou un passage boueux, façon Waze.</span>
          </li>
          <li>
            <IconGauge />
            <span>Vote la technicité et la difficulté de chaque parcours pour aider les suivants.</span>
          </li>
          <li>
            <IconUpload />
            <span>Ajoute tes propres traces GPX pour enrichir la carte de la communauté.</span>
          </li>
        </ul>

        <button type="button" className="btn btn-primary btn-block" onClick={dismiss}>
          Compris, c'est parti !
        </button>
      </div>
    </div>
  )
}
