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
      <div className="navbar-links">
        <NavLink to="/" end>
          🗺️ Carte
        </NavLink>
        <NavLink to="/upload">📤 Ajouter un GPX</NavLink>
        {session ? (
          <>
            <span className="navbar-user">👋 {session.user.email}</span>
            <button type="button" className="link-button" onClick={() => supabase.auth.signOut()}>
              Déconnexion
            </button>
          </>
        ) : (
          <NavLink to="/auth">🔑 Connexion</NavLink>
        )}
      </div>
    </nav>
  )
}
