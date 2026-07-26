import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabaseClient'
import './NavBar.css'

export function NavBar() {
  const { session } = useAuth()

  return (
    <nav className="navbar">
      <NavLink to="/" end className="navbar-brand">
        🏔️ Kern
      </NavLink>
      <div className="navbar-links navbar-links-primary">
        <NavLink to="/" end>
          🗺️ Carte
        </NavLink>
        <NavLink to="/upload">📤 Ajouter un GPX</NavLink>
        {session ? (
          <NavLink to="/profile">👤 Profil</NavLink>
        ) : (
          <NavLink to="/auth">🔑 Connexion</NavLink>
        )}
      </div>
      {session && (
        <div className="navbar-links navbar-links-account">
          <span className="navbar-user">👋 {session.user.email}</span>
          <button type="button" className="link-button" onClick={() => supabase.auth.signOut()}>
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  )
}
