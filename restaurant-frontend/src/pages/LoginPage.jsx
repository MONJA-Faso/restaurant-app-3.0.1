import { useState } from 'react'
import { loginUser } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import './AuthPages.css'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation simple
    if (!email || !password) {
      setError('Veuillez remplir tous les champs')
      return
    }
    
    try {
      setError('')
      setLoading(true)
      
      // Appel au service d'authentification
      const result = await loginUser(email, password)
      
      // Si succès, mettre à jour le contexte
      login(result.user, result.token)
    } catch (err) {
      setError(err.message || 'Échec de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <h2>Connexion</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}

export default LoginPage