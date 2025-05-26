// Service pour simuler une API d'authentification
// Comme nous n'utilisons pas de base de données, nous stockons les utilisateurs dans le localStorage

// Fonction pour générer un token simple (dans un cas réel, utilisez jsonwebtoken côté serveur)
const generateToken = (user) => {
    // Simulation d'un JWT
    return `token_${user.email}_${Date.now()}`
  }
  
  // Fonction pour s'enregistrer
  export const registerUser = (email, password, name) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Vérifier si l'utilisateur existe déjà
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const userExists = users.find(user => user.email === email)
        
        if (userExists) {
          reject({ message: 'Cet email est déjà utilisé' })
          return
        }
        
        // Créer le nouvel utilisateur (dans un cas réel, le mot de passe serait hashé)
        const newUser = { id: Date.now(), email, password, name }
        users.push(newUser)
        localStorage.setItem('users', JSON.stringify(users))
        
        // Générer un token et renvoyer les infos utilisateur
        const token = generateToken(newUser)
        const { password: _, ...userWithoutPassword } = newUser
        resolve({ user: userWithoutPassword, token })
      }, 500) // Simule un délai réseau
    })
  }
  
  // Fonction pour se connecter
  export const loginUser = (email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Récupérer les utilisateurs
        const users = JSON.parse(localStorage.getItem('users') || '[]')
        const user = users.find(user => user.email === email && user.password === password)
        
        if (!user) {
          reject({ message: 'Email ou mot de passe incorrect' })
          return
        }
        
        // Générer un token et renvoyer les infos utilisateur
        const token = generateToken(user)
        const { password: _, ...userWithoutPassword } = user
        resolve({ user: userWithoutPassword, token })
      }, 500) // Simule un délai réseau
    })
  }
  
  // Fonction pour vérifier si un token est valide
  export const verifyToken = (token) => {
    // Dans un vrai système, vous vérifieriez la signature du JWT
    return token && token.startsWith('token_')
  }