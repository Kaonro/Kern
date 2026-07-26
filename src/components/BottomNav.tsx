import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import './BottomNav.css'

export function BottomNav() {
  const { session } = useAuth()

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end>
        <span className="bn-icon">🗺️</span>
        <span className="bn-label">Carte</span>
      </NavLink>
      <NavLink to="/upload">
        <span className="bn-icon">📤</span>
        <span className="bn-label">Ajouter</span>
      </NavLink>
      {session ? (
        <NavLink to="/profile">
          <span className="bn-icon">👤</span>
          <span className="bn-label">Profil</span>
        </NavLink>
      ) : (
        <NavLink to="/auth">
          <span className="bn-icon">🔑</span>
          <span className="bn-label">Connexion</span>
        </NavLink>
      )}
    </nav>
  )
}
