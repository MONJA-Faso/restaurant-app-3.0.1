import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// 📌 Ajoute ces imports :
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext' // Vérifie le bon chemin

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
