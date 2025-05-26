import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { isAuthenticated, currentUser, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Application de Gestion</Link>
      </div>
      <div className="navbar-menu">
        {isAuthenticated ? (
          <>
            <span className="welcome-text">Bienvenue, {currentUser.name}</span>
            <button className="logout-button" onClick={logout}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Connexion</Link>
            <Link to="/register" className="nav-link">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
