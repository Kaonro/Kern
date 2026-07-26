import { NavLink } from 'react-router-dom'
import './NavBar.css'

export function NavBar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Kern</span>
      <div className="navbar-links">
        <NavLink to="/" end>
          Carte
        </NavLink>
        <NavLink to="/upload">Ajouter un GPX</NavLink>
        <NavLink to="/auth">Connexion</NavLink>
      </div>
    </nav>
  )
}
