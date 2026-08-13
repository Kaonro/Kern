import { useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import { MascotChamois, MascotMarmotte, MascotMoufflon, MascotOurs, MascotPatou } from './mascots'
import './WelcomeModal.css'

const STORAGE_KEY = 'kern_welcome_seen'

type Shape = 'circle' | 'pill' | 'rect'

type Step = {
  mascot: typeof MascotMarmotte
  title: string
  text: string
  hero?: boolean
  /** Sélecteur CSS d'un vrai bouton de l'app à mettre en évidence. Plusieurs éléments
   * peuvent matcher (nav mobile + nav desktop) : on prend le premier réellement visible. */
  target?: string
  shape?: Shape
}

const STEPS: Step[] = [
  {
    mascot: MascotMarmotte,
    title: 'Bienvenue sur Kern',
    text: "Ce que l'IA et les cartes ne peuvent pas savoir — le vécu de ceux qui y étaient hier.",
    hero: true,
  },
  {
    mascot: MascotChamois,
    title: 'La carte vit de vos traces',
    text: 'Chaque parcours GPX importé vient épaissir la carte : plus un chemin est emprunté, plus il ressort.',
    target: '.heatmap-link',
    shape: 'pill',
  },
  {
    mascot: MascotPatou,
    title: 'Signale en temps réel',
    text: "Un danger, un point d'eau à sec, un passage boueux : signale-le en quelques secondes, façon Waze.",
    target: '.map-fab',
    shape: 'circle',
  },
  {
    mascot: MascotOurs,
    title: 'Vote pour les suivants',
    text: 'Technicité et difficulté de chaque parcours, notées par ceux qui y étaient vraiment — pas une estimation automatique.',
  },
  {
    mascot: MascotMoufflon,
    title: 'À toi de jouer',
    text: 'Ajoute tes propres traces pour enrichir la carte de la communauté.',
    target: 'a[href="/upload"]',
    shape: 'rect',
  },
]

const SHAPE_RADIUS: Record<Shape, string> = {
  circle: '50%',
  pill: '999px',
  rect: '14px',
}

const MASCOT_BADGE = 58
const RING_PAD = 8

/** Rect du premier élément qui matche vraiment le sélecteur ET qui est affiché — la nav
 * mobile et la nav desktop rendent chacune un lien vers /upload, une seule est visible
 * à la fois (l'autre est en display:none via media query, donc de taille nulle). */
function findVisibleRect(selector: string): DOMRect | null {
  const candidates = document.querySelectorAll<HTMLElement>(selector)
  for (const el of candidates) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return rect
  }
  return null
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Onboarding en plusieurs écrans, affiché une seule fois à la toute première visite.
 * Les écrans qui parlent d'un vrai bouton de l'app (signaler, ajouter un GPX...) le
 * mettent en évidence directement sur la carte : un halo sur le bouton, la mascotte
 * postée juste à côté et une flèche qui relie la carte à l'endroit exact — plutôt que
 * de décrire une capture d'écran. */
export function WelcomeModal() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(STORAGE_KEY))
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [cardRect, setCardRect] = useState<DOMRect | null>(null)
  const touchStartX = useRef<number | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const current = STEPS[step]

  useEffect(() => {
    if (!visible || !current.target) {
      setTargetRect(null)
      setCardRect(null)
      return
    }

    function measure() {
      setTargetRect(current.target ? findVisibleRect(current.target) : null)
      setCardRect(cardRef.current?.getBoundingClientRect() ?? null)
    }

    // Un tick après le render : la carte doit avoir sa taille finale (le texte varie
    // d'une étape à l'autre) avant de calculer où poser la mascotte et la flèche.
    measure()
    const raf = requestAnimationFrame(measure)
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [visible, step, current.target])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function goTo(index: number) {
    setStep(() => Math.max(0, Math.min(STEPS.length - 1, index)))
  }

  function next() {
    if (step === STEPS.length - 1) {
      dismiss()
      return
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  function handleTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta < -40) next()
    else if (delta > 40) goTo(step - 1)
  }

  if (!visible) return null

  const isLast = step === STEPS.length - 1
  const Mascot = current.mascot
  // Écran centré classique si pas de cible réelle (ou si la cible a disparu du DOM,
  // ex. le lien "voir tous les parcours" qui n'existe que s'il y a assez de parcours).
  const coachMark = Boolean(current.target) && targetRect !== null
  // Carte ancrée du côté opposé à la cible pour ne jamais la recouvrir.
  const dockBottom = coachMark && targetRect!.top + targetRect!.height / 2 < window.innerHeight / 2

  // Mascotte postée juste contre le halo, du côté qui fait face à la carte — c'est elle
  // qui "montre" la cible, la flèche part de la carte et vient jusqu'à elle.
  let mascotBox: { left: number; top: number } | null = null
  let arrow: { x1: number; y1: number; x2: number; y2: number } | null = null

  if (coachMark && cardRect) {
    const targetCenterX = targetRect!.left + targetRect!.width / 2
    const mascotLeft = clamp(targetCenterX - MASCOT_BADGE / 2, 8, window.innerWidth - MASCOT_BADGE - 8)
    const mascotTop = dockBottom
      ? targetRect!.bottom + RING_PAD + 6
      : targetRect!.top - RING_PAD - 6 - MASCOT_BADGE
    mascotBox = { left: mascotLeft, top: mascotTop }

    const cardCenterX = cardRect.left + cardRect.width / 2
    arrow = dockBottom
      ? { x1: cardCenterX, y1: cardRect.top, x2: mascotLeft + MASCOT_BADGE / 2, y2: mascotTop + MASCOT_BADGE }
      : { x1: cardCenterX, y1: cardRect.bottom, x2: mascotLeft + MASCOT_BADGE / 2, y2: mascotTop }
  }

  return (
    <div className={coachMark ? 'welcome-overlay welcome-overlay-coach' : 'welcome-overlay'}>
      {coachMark && (
        <div
          className="welcome-ring"
          style={{
            top: targetRect!.top - RING_PAD,
            left: targetRect!.left - RING_PAD,
            width: targetRect!.width + RING_PAD * 2,
            height: targetRect!.height + RING_PAD * 2,
            borderRadius: SHAPE_RADIUS[current.shape ?? 'rect'],
          }}
        />
      )}

      {arrow && (
        <svg className="welcome-arrow-layer" aria-hidden="true">
          <defs>
            <marker id="welcome-arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-accent)" />
            </marker>
          </defs>
          <line
            className="welcome-arrow-line"
            x1={arrow.x1}
            y1={arrow.y1}
            x2={arrow.x2}
            y2={arrow.y2}
            markerEnd="url(#welcome-arrowhead)"
          />
        </svg>
      )}

      {mascotBox && (
        <div className="welcome-mascot-badge" style={{ left: mascotBox.left, top: mascotBox.top }}>
          <Mascot />
        </div>
      )}

      <div
        ref={cardRef}
        className={
          coachMark ? `welcome-card welcome-card-coach ${dockBottom ? 'dock-bottom' : 'dock-top'}` : 'welcome-card'
        }
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button type="button" className="welcome-skip" onClick={dismiss}>
          Passer
        </button>

        <div className={current.hero ? 'welcome-step welcome-step-hero' : 'welcome-step'}>
          {!coachMark && <Mascot className="welcome-mascot" />}
          {current.hero ? <h1>{current.title}</h1> : <h2>{current.title}</h2>}
          <p>{current.text}</p>
        </div>

        <div className="welcome-dots">
          {STEPS.map((_, i) => (
            <button
              type="button"
              key={i}
              className={i === step ? 'welcome-dot welcome-dot-active' : 'welcome-dot'}
              aria-label={`Étape ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={next}>
          {isLast ? "Compris, c'est parti !" : 'Suivant'}
        </button>
      </div>
    </div>
  )
}
