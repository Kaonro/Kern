import type { SVGProps } from 'react'
import type { ReportType, Technicite } from '../types'

type IconProps = SVGProps<SVGSVGElement>

function Base({ children, className, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `icon ${className}` : 'icon'}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/** Logo Kern / repère de montagne. */
export function IconMountain(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="3,19 8,9 11,14 14,7 18,13 21,19" />
    </Base>
  )
}

/** Carte pliée. */
export function IconMap(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z" />
      <path d="M9 3v16" />
      <path d="M15 5v16" />
    </Base>
  )
}

/** Import / upload. */
export function IconUpload(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 16V4" />
      <path d="M7 9l5-5 5 5" />
      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </Base>
  )
}

/** Profil utilisateur. */
export function IconUser(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-4 3.5-6 7-6s7 2 7 6" />
    </Base>
  )
}

/** Clé (connexion). */
export function IconKey(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="7.5" cy="12" r="3.5" />
      <path d="M11 12h9" />
      <path d="M17 12v3" />
      <path d="M20 12v2" />
    </Base>
  )
}

/** Cadenas (accès restreint). */
export function IconLock(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Base>
  )
}

/** Sentier sinueux avec départ/arrivée (distance). */
export function IconTrail(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 17c4-6 6 4 10-2s2-6 5-8" />
      <circle cx="4.3" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19.7" cy="6.2" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  )
}

/** Profil ascendant (dénivelé). */
export function IconElevation(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="3,17 8,12 11,15 15,7 18,10" />
      <path d="M15 5h4v4" />
    </Base>
  )
}

/** Jauge à barres (niveau de technicité). */
export function IconLevel({ level, ...props }: IconProps & { level: 1 | 2 | 3 }) {
  return (
    <Base {...props}>
      <rect x="3.5" y="14" width="3.4" height="6.5" rx="1" fill={level >= 1 ? 'currentColor' : 'none'} />
      <rect x="10.3" y="9" width="3.4" height="11.5" rx="1" fill={level >= 2 ? 'currentColor' : 'none'} />
      <rect x="17.1" y="4" width="3.4" height="16.5" rx="1" fill={level >= 3 ? 'currentColor' : 'none'} />
    </Base>
  )
}

/** Goutte barrée (point d'eau à sec). */
export function IconDropletSlash(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
      <line x1="5" y1="19" x2="19" y2="5" />
    </Base>
  )
}

/** Goutte pleine (bascule d'affichage des points d'eau sur la carte). */
export function IconDroplet(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />
    </Base>
  )
}

/** Ondulations (passage boueux). */
export function IconMud(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </Base>
  )
}

/** Triangle d'alerte (danger / éboulement, erreurs). */
export function IconWarningTriangle(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3l9 16H3z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    </Base>
  )
}

/** Panneau en pointillés (balisage manquant). */
export function IconSignpost(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="6.5" y1="21" x2="6.5" y2="4" />
      <rect x="6.5" y="6" width="11" height="6" rx="1" strokeDasharray="2.2 2.2" />
    </Base>
  )
}

/** Empreinte de patte (animal). */
export function IconPaw(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="15.5" r="4" fill="currentColor" stroke="none" />
      <circle cx="6.3" cy="9" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="4.8" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="4.8" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="19.7" cy="9" r="1.7" fill="currentColor" stroke="none" />
    </Base>
  )
}

/** Barrière à rayures (route / chemin fermé). */
export function IconBarrier(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="5" y1="20" x2="5" y2="14" />
      <line x1="19" y1="20" x2="19" y2="14" />
      <rect x="3" y="9" width="18" height="4.5" rx="1" />
      <line x1="5" y1="9" x2="9.5" y2="13.5" />
      <line x1="10.5" y1="9" x2="15" y2="13.5" />
      <line x1="16" y1="9" x2="19" y2="12" />
    </Base>
  )
}

/** Clôture à piquets (chemin / propriété privée). */
export function IconFence(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="5" y1="7" x2="5" y2="20" />
      <line x1="12" y1="5" x2="12" y2="20" />
      <line x1="19" y1="7" x2="19" y2="20" />
      <line x1="3" y1="11" x2="21" y2="11" />
      <line x1="3" y1="16" x2="21" y2="16" />
    </Base>
  )
}

/** Silhouette marcheur barrée (interdit aux piétons). */
export function IconPedestrianSlash(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="5" r="1.8" fill="currentColor" stroke="none" />
      <path d="M11 8v5" />
      <path d="M11 9.5l-3.5 2.5" />
      <path d="M11 9.5l3.5 1.5" />
      <path d="M11 13l-2.5 7" />
      <path d="M11 13l2.5 7" />
      <line x1="4" y1="20" x2="20" y2="4" />
    </Base>
  )
}

/** Vélo barré (interdit aux vélos). */
export function IconBikeSlash(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="6" cy="17" r="3" />
      <circle cx="18" cy="17" r="3" />
      <path d="M6 17l5-10h3l4 10" />
      <path d="M11 7h3" />
      <line x1="3" y1="20" x2="21" y2="4" />
    </Base>
  )
}

/** Silhouette de chien barrée (interdit aux chiens, canicross). */
export function IconDogSlash(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 16c0-2.5 2-4 4.5-4h4c1.5 0 2.5-1 3-2.3.3-.7 1.3-.6 1.4.1.2 1.1-.2 2.3-1 3.1.6.5 1.1 1.3 1.1 2.1v1" />
      <path d="M6 12l-1.5-1.5" />
      <path d="M6 16v3" />
      <path d="M10 16v3" />
      <path d="M15 16v3" />
      <line x1="3" y1="20" x2="21" y2="4" />
    </Base>
  )
}

/** Repère générique (autre signalement). */
export function IconPin(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 21s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.3" />
    </Base>
  )
}

/** Calques empilés (génération de parcours / carte de densité). */
export function IconLayers(props: IconProps) {
  return (
    <Base {...props}>
      <polygon points="12,4 21,9 12,14 3,9" />
      <polyline points="3,13 12,18 21,13" />
    </Base>
  )
}

/** Crayon (édition). */
export function IconEdit(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 20l1-4 11-11 3 3-11 11z" />
      <path d="M14 6l3 3" />
    </Base>
  )
}

/** Corbeille (supprimer). */
export function IconTrash(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 7h14" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M7 7l1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </Base>
  )
}

/** Coche (validation / succès). */
export function IconCheck(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5 5-6" />
    </Base>
  )
}

export function IconArrowLeft(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="10,7 5,12 10,17" />
    </Base>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <Base {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="14,7 19,12 14,17" />
    </Base>
  )
}

/** Point d'exclamation dans un cercle (signalement). */
export function IconAlert(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="7.5" x2="12" y2="13" />
      <circle cx="12" cy="16.3" r="1" fill="currentColor" stroke="none" />
    </Base>
  )
}

/** Chargement (rotation via CSS). */
export function IconSpinner(props: IconProps) {
  return (
    <Base className="icon-spin" {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Base>
  )
}

/** Calendrier (praticabilité saisonnière). */
export function IconCalendar(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </Base>
  )
}

/** Boussole (états vides / recherche). */
export function IconCompass(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="15,8 12,13 9,16 12,11" fill="currentColor" stroke="none" />
    </Base>
  )
}

const TECHNICITE_LEVELS: Record<Technicite, 1 | 2 | 3> = {
  roulant: 1,
  technique: 2,
  tres_technique: 3,
}

export function TechniciteIcon({ technicite, ...props }: IconProps & { technicite: Technicite }) {
  return <IconLevel level={TECHNICITE_LEVELS[technicite]} {...props} />
}

/** Chevron bas (déclencheur de menu déroulant). */
export function IconChevronDown(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="6,9 12,15 18,9" />
    </Base>
  )
}

/** Couleur d'accent par type de signalement, pour les badges du menu déroulant. */
export const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  eau_a_sec: '#2f7fb8',
  passage_boueux: '#8a6642',
  danger_eboulement: '#c0392b',
  balisage_manquant: '#c99a2e',
  animal: '#6b8f3f',
  route_fermee: '#a8432f',
  chemin_prive: '#5b6b7a',
  interdit_pietons: '#7c5cbf',
  interdit_velos: '#2c9c8f',
  interdit_chiens: '#c2547a',
  autre: '#6f7a6c',
}

export function ReportTypeIcon({ type, ...props }: IconProps & { type: ReportType }) {
  switch (type) {
    case 'eau_a_sec':
      return <IconDropletSlash {...props} />
    case 'passage_boueux':
      return <IconMud {...props} />
    case 'danger_eboulement':
      return <IconWarningTriangle {...props} />
    case 'balisage_manquant':
      return <IconSignpost {...props} />
    case 'animal':
      return <IconPaw {...props} />
    case 'route_fermee':
      return <IconBarrier {...props} />
    case 'chemin_prive':
      return <IconFence {...props} />
    case 'interdit_pietons':
      return <IconPedestrianSlash {...props} />
    case 'interdit_velos':
      return <IconBikeSlash {...props} />
    case 'interdit_chiens':
      return <IconDogSlash {...props} />
    case 'autre':
      return <IconPin {...props} />
  }
}
