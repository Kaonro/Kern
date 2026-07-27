import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { IconKey, IconLayers, IconMap, IconMountain, IconUpload, IconUser } from './icons'
import './NavBar.css'

export function NavBar() {
  const { session } = useAuth()

  return (
    <nav className="navbar">
      <NavLink to="/" end className="navbar-brand">
        <IconMountain /> Kern
      </NavLink>
      <div className="navbar-links navbar-links-primary">
        <NavLink to="/" end>
          <IconMap /> Carte
        </NavLink>
        <NavLink to="/upload">
          <IconUpload /> Ajouter un GPX
        </NavLink>
        <NavLink to="/generation">
          <IconLayers /> Génération
        </NavLink>
        {session ? (
          <NavLink to="/profile">
            <IconUser /> Profil
          </NavLink>
        ) : (
          <NavLink to="/auth">
            <IconKey /> Connexion
          </NavLink>
        )}
      </div>
      {session && (
        <div className="navbar-links navbar-links-account">
          <span className="navbar-user">{session.user.email}</span>
          <button type="button" className="link-button" onClick={() => supabase.auth.signOut()}>
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  )
}
