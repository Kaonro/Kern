import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { IconKey, IconMap, IconUpload, IconUser } from './icons'
import './BottomNav.css'

export function BottomNav() {
  const { session } = useAuth()

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end>
        <IconMap className="bn-icon" />
        <span className="bn-label">Carte</span>
      </NavLink>
      <NavLink to="/upload">
        <IconUpload className="bn-icon" />
        <span className="bn-label">Ajouter</span>
      </NavLink>
      {session ? (
        <NavLink to="/profile">
          <IconUser className="bn-icon" />
          <span className="bn-label">Profil</span>
        </NavLink>
      ) : (
        <NavLink to="/auth">
          <IconKey className="bn-icon" />
          <span className="bn-label">Connexion</span>
        </NavLink>
      )}
    </nav>
  )
}
