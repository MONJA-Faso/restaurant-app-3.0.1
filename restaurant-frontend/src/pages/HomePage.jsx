import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'


const HomePage = () => {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const handleDashboardRedirect = () => {
    navigate('/DashboardPage') // Assure-toi que cette route existe bien
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>Bienvenue dans le Système de Gestion du Restaurant</h1>
        <p>Bonjour {currentUser?.name}, prêt à gérer votre établissement efficacement ?</p>
      </header>

      <section className="user-info-card">
        <h2>Votre Profil</h2>
        <div className="user-details">
          <p><strong>Nom:</strong> {currentUser?.name}</p>
          <p><strong>Email:</strong> {currentUser?.email}</p>
          <p><strong>ID utilisateur:</strong> {currentUser?.id}</p>
        </div>
      </section>

      <section className="features">
        <h2>Fonctionnalités principales</h2>
        <div className="feature-grid">
          <div className="feature-card clickable" onClick={handleDashboardRedirect}>
            <h3>Tableau de bord</h3>
            <p>Visualisez en temps réel vos réservations, commandes et ventes.</p>
          </div>

          <div className="feature-card">
            <h3>Gestion des menus</h3>
            <p>Créez, modifiez et organisez facilement vos menus et plats.</p>
          </div>

          <div className="feature-card">
            <h3>Suivi des stocks</h3>
            <p>Gardez un œil sur vos niveaux de stock et recevez des alertes intelligentes.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
