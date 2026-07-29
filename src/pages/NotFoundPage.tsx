import { Link } from 'react-router-dom'
import { IconCompass } from '../components/icons'

export function NotFoundPage() {
  return (
    <div className="empty-state">
      <span className="big-icon">
        <IconCompass />
      </span>
      <h1>Page introuvable</h1>
      <p>
        Cette page n'existe pas. <Link to="/">Retour à la carte</Link>
      </p>
    </div>
  )
}
