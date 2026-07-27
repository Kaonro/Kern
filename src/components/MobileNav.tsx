import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { IconKey, IconLayers, IconMap, IconUpload, IconUser } from './icons'
import './MobileNav.css'

export function MobileNav() {
  const { session } = useAuth()

  return (
    <nav className="mobile-nav">
      <NavLink to="/" end>
        <IconMap className="mn-icon" />
        <span className="mn-label">Carte</span>
      </NavLink>
      <NavLink to="/upload">
        <IconUpload className="mn-icon" />
        <span className="mn-label">Ajouter</span>
      </NavLink>
      <NavLink to="/generation">
        <IconLayers className="mn-icon" />
        <span className="mn-label">Générer</span>
      </NavLink>
      {session ? (
        <NavLink to="/profile">
          <IconUser className="mn-icon" />
          <span className="mn-label">Profil</span>
        </NavLink>
      ) : (
        <NavLink to="/auth">
          <IconKey className="mn-icon" />
          <span className="mn-label">Connexion</span>
        </NavLink>
      )}
    </nav>
  )
}
