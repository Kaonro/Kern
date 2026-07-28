import { useEffect, useRef, useState, type ReactNode } from 'react'
import { IconCheck, IconMenu } from './icons'
import './LayersMenu.css'

export interface LayerToggle {
  key: string
  label: string
  icon: ReactNode
  active: boolean
  onToggle: () => void
}

/** Petit menu "trois barres" pour activer/désactiver les calques optionnels de la carte
 * (points d'eau, sommets...), plutôt que des boutons flottants toujours visibles. */
export function LayersMenu({ layers }: { layers: LayerToggle[] }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  if (layers.length === 0) return null

  return (
    <div className="layers-menu" ref={wrapperRef}>
      <button
        type="button"
        className="layers-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Calques de la carte"
      >
        <IconMenu />
      </button>
      {open && (
        <div className="layers-menu-panel" role="menu">
          {layers.map((layer) => (
            <button
              key={layer.key}
              type="button"
              role="menuitemcheckbox"
              aria-checked={layer.active}
              className={layer.active ? 'layers-menu-item active' : 'layers-menu-item'}
              onClick={layer.onToggle}
            >
              {layer.icon}
              <span>{layer.label}</span>
              {layer.active && <IconCheck className="layers-menu-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
