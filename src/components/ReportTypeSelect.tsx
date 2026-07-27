import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { REPORT_TYPE_LABELS, type ReportType } from '../types'
import { IconChevronDown, REPORT_TYPE_COLORS, ReportTypeIcon } from './icons'
import './ReportTypeSelect.css'

const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[]

interface ReportTypeSelectProps {
  value: ReportType
  onChange: (type: ReportType) => void
  disabled?: boolean
}

function ReportTypeBadge({ type }: { type: ReportType }) {
  return (
    <span className="report-type-badge" style={{ '--badge-color': REPORT_TYPE_COLORS[type] } as CSSProperties}>
      <ReportTypeIcon type={type} />
    </span>
  )
}

export function ReportTypeSelect({ value, onChange, disabled }: ReportTypeSelectProps) {
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

  return (
    <div className="report-type-select" ref={wrapperRef}>
      <button
        type="button"
        className="report-type-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <ReportTypeBadge type={value} />
        <span>{REPORT_TYPE_LABELS[value]}</span>
        <IconChevronDown className="report-type-chevron" />
      </button>
      {open && (
        <ul className="report-type-menu" role="listbox">
          {REPORT_TYPES.map((type) => (
            <li key={type} role="option" aria-selected={type === value}>
              <button
                type="button"
                className={type === value ? 'active' : ''}
                onClick={() => {
                  onChange(type)
                  setOpen(false)
                }}
              >
                <ReportTypeBadge type={type} />
                <span>{REPORT_TYPE_LABELS[type]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
