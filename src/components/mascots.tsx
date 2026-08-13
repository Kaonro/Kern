import type { SVGProps } from 'react'

type MascotProps = SVGProps<SVGSVGElement>

function Base({ children, className, ...props }: MascotProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" className={className ? `mascot ${className}` : 'mascot'} aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

/** Ours — brun, museau plus clair. Bande de raccord sous les pattes pour qu'elles
 * fassent corps avec le ventre plutôt que de flotter séparément. */
export function MascotOurs(props: MascotProps) {
  return (
    <Base {...props}>
      <g transform="translate(4,8)" fill="#5b4636">
        <rect x="10" y="68" width="60" height="16" rx="6" />
        <rect x="12" y="66" width="12" height="20" rx="5" />
        <rect x="24" y="70" width="14" height="18" rx="5" />
        <rect x="42" y="70" width="14" height="18" rx="5" />
        <rect x="56" y="66" width="12" height="20" rx="5" />
        <path d="M8,80 C4,56 12,40 32,37 C50,34 64,40 68,54 C71,64 66,74 54,78 C38,83 18,82 8,80 Z" />
        <circle cx="63" cy="31" r="15" />
        <circle cx="55" cy="17" r="5.5" />
        <circle cx="73" cy="15" r="5.5" />
        <ellipse cx="75" cy="34" rx="6" ry="4.5" fill="#8a6b52" />
        <circle cx="79" cy="33" r="1.2" fill="#1f2a24" />
        <circle cx="58" cy="27" r="1.3" fill="#1f2a24" />
      </g>
    </Base>
  )
}

/** Chamois — fauve, masque sombre autour de l'œil, cornes fines noires en crochet.
 * Bande de raccord sous le corps + cou épaissi pour que pattes et tête fassent
 * vraiment corps avec le tronc plutôt que d'y toucher à peine. */
export function MascotChamois(props: MascotProps) {
  return (
    <Base {...props}>
      <g transform="translate(2,10)">
        <rect x="16" y="50" width="36" height="14" rx="6" fill="#b98d55" />
        <g fill="#3a2c22">
          <path d="M19,53 L15,78 L21,78 L24,54 Z" />
          <path d="M27,54 L26,80 L32,80 L34,54 Z" />
          <path d="M36,54 L37,82 L43,82 L44,54 Z" />
          <path d="M46,53 L46,80 L52,80 L52,53 Z" />
        </g>
        <g fill="#b98d55">
          <path d="M18,50 C10,50 6,53 8,56 C11,58 16,55 17,51 Z" />
          <ellipse cx="34" cy="50" rx="16" ry="9" />
          <path d="M44,48 C50,44 56,36 56,27 L67,28 C67,37 61,45 50,52 Z" />
          <ellipse cx="63" cy="25" rx="9" ry="7.5" />
          <ellipse cx="71" cy="26" rx="3.3" ry="2.6" />
        </g>
        <path d="M58,20 C63,21 66,24 66,28 C63,29 59,27 57,24 Z" fill="#3a2c22" opacity={0.85} />
        <g fill="#241a12">
          <path d="M57,19 C52,11 55,5 60,9 C62,13 60,18 57,19 Z" />
          <path d="M67,18 C70,9 75,6 76,11 C75,16 70,19 67,18 Z" />
          <path d="M59,13 C57,7 56,2 59,1 C62,2 61,7 61,12 Z" />
          <path d="M68,12 C69,6 71,1 74,2 C74,7 71,11 70,13 Z" />
        </g>
        <circle cx="64" cy="23" r="1.3" fill="#1f2a24" />
      </g>
    </Base>
  )
}

/** Marmotte — de face, assise, dorée avec un poitrail plus clair et de petites pattes
 * croisées bien visibles ; moustaches ajoutées pour aider à lire "rongeur". Tête et
 * corps se chevauchent largement pour ne laisser aucune ligne de jonction. */
export function MascotMarmotte(props: MascotProps) {
  return (
    <Base {...props}>
      <g transform="translate(4,2)">
        <path d="M6,52 Q-1,50 0,55 Q5,58 9,54 Z" fill="#a9793f" />
        <path d="M10,88 C4,60 15,42 32,38 C49,42 60,60 54,88 Z" fill="#c69a5c" />
        <ellipse cx="32" cy="32" rx="15" ry="15" fill="#c69a5c" />
        <path d="M20,20 Q15,13 21,11 Q26,15 24,22 Z" fill="#c69a5c" />
        <path d="M44,20 Q49,13 53,16 Q50,22 46,23 Z" fill="#c69a5c" />
        <ellipse cx="30" cy="60" rx="11" ry="16" fill="#e8d4a8" />
        <ellipse cx="24" cy="56" rx="5.5" ry="10" fill="#f6ecd4" />
        <ellipse cx="36" cy="57" rx="5.5" ry="10" fill="#f6ecd4" />
        <circle cx="38" cy="29" r="1.6" fill="#1f2a24" />
        <circle cx="26" cy="30" r="1.5" fill="#1f2a24" />
        <ellipse cx="32" cy="36" rx="2.6" ry="1.8" fill="#3a2c17" />
        <g stroke="#3a2c17" strokeWidth={1}>
          <line x1="14" y1="33" x2="4" y2="31" />
          <line x1="14" y1="37" x2="5" y2="38" />
          <line x1="50" y1="33" x2="60" y2="31" />
          <line x1="50" y1="37" x2="59" y2="38" />
        </g>
      </g>
    </Base>
  )
}

/** Patou — blanc/crème, corps lisse et bas (plutôt qu'un pelage bouclé sur tout le dos,
 * qui lisait comme la laine d'un mouton) avec juste une collerette fournie autour de
 * l'encolure, vrai trait de la race. Queue en panache, oreilles tombantes, pattes et
 * cou largement rattachés au corps. */
export function MascotPatou(props: MascotProps) {
  return (
    <Base {...props}>
      <g transform="translate(0,6)">
        <rect x="12" y="64" width="60" height="16" rx="6" fill="#eee6d0" />
        <g fill="#e4dcc4">
          <path d="M17,66 L14,90 L21,90 L24,67 Z" />
          <path d="M29,68 L28,92 L35,92 L36,68 Z" />
          <path d="M45,68 L45,92 L52,92 L51,68 Z" />
          <path d="M57,66 L59,90 L66,90 L63,65 Z" />
        </g>
        <ellipse cx="30" cy="62" rx="27" ry="15" fill="#eee6d0" stroke="#d9cfae" strokeWidth={1} />
        <g fill="#eee6d0" stroke="#d9cfae" strokeWidth={1}>
          <circle cx="46" cy="46" r="7" />
          <circle cx="55" cy="42" r="7.5" />
          <circle cx="52" cy="55" r="7" />
        </g>
        <path d="M53,50 C56,32 78,30 78,44 C78,56 68,64 55,63 Z" fill="#eee6d0" stroke="#d9cfae" strokeWidth={1} />
        <circle cx="72" cy="28" r="11.5" fill="#eee6d0" stroke="#d9cfae" strokeWidth={1} />
        <g fill="#d9cfae">
          <path d="M63,21 Q55,17 57,30 Q64,32 66,24 Z" />
          <path d="M81,21 Q89,18 88,30 Q81,32 78,25 Z" />
        </g>
        <ellipse cx="82" cy="31" rx="5.2" ry="4.2" fill="#7c7361" />
        <circle cx="86" cy="31" r="1.2" fill="#f7f5ef" />
        <circle cx="67" cy="25" r="1.2" fill="#2a2a2a" />
      </g>
    </Base>
  )
}

/** Moufflon — grandes cornes enroulées façon bélier, tache de selle plus claire sur le
 * dos (vrai trait de l'espèce). Silhouette bien distincte du chamois (cornes massives
 * vs. petit crochet fin, robe grise vs. fauve), pattes et cou largement rattachés. */
export function MascotMoufflon(props: MascotProps) {
  return (
    <Base {...props}>
      <g transform="translate(0,10)">
        <rect x="18" y="52" width="38" height="15" rx="6" fill="#8a7864" />
        <g fill="#463c30">
          <path d="M21,55 L17,80 L23,80 L26,56 Z" />
          <path d="M29,56 L28,82 L34,82 L35,56 Z" />
          <path d="M39,56 L39,84 L45,84 L45,56 Z" />
          <path d="M48,55 L48,80 L54,80 L53,55 Z" />
        </g>
        <ellipse cx="36" cy="52" rx="18" ry="10" fill="#8a7864" />
        <ellipse cx="30" cy="46" rx="10" ry="6" fill="#cbbfa4" />
        <path d="M46,49 C52,45 56,37 56,29 L69,30 C69,39 63,46 51,53 Z" fill="#8a7864" />
        <ellipse cx="65" cy="27" rx="9.5" ry="8" fill="#8a7864" />
        <ellipse cx="73" cy="28" rx="3.3" ry="2.6" fill="#8a7864" />
        <path d="M60,21 Q56,17 59,15 Q63,17 62,21 Z" fill="#6b5c48" />
        <path d="M68,22 C74,16 76,7 71,3 C69,8 70,15 65,18 C68,20 66,25 70,25 C73,25 72,20 68,22 Z" fill="#3a2c22" />
        <path d="M60,20 C56,13 58,4 65,3 C64,8 61,15 63,20 C60,21 62,24 60,20 Z" fill="#241a12" />
        <circle cx="67" cy="25" r="1.3" fill="#1f2a24" />
      </g>
    </Base>
  )
}
