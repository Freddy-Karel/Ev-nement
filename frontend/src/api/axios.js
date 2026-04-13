import axios from 'axios'

/**
 * Décode la partie payload d'un JWT (sans vérification de signature).
 * Retourne null si le token est invalide ou malformé.
 */
function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

/**
 * Retourne true si le token est absent, malformé ou expiré.
 */
function isTokenExpired(token) {
  if (!token) return true
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  // exp est en secondes, Date.now() en millisecondes
  return Date.now() >= payload.exp * 1000
}

/**
 * Supprime le token et redirige vers /login (sans boucle infinie).
 */
function forceLogout() {
  localStorage.removeItem('token')
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login'
  }
}

const api = axios.create({
  baseURL: '/api',   // proxifié vers http://localhost:8080/api via vite.config.js
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// ── Intercepteur requête : injecte le JWT + vérifie expiration locale ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    // Détection préventive : si le token est déjà expiré, on déconnecte
    // avant même d'envoyer la requête (évite les 403 inutiles)
    if (token && isTokenExpired(token)) {
      forceLogout()
      return Promise.reject(new Error('Token expiré — reconnexion requise'))
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Intercepteur réponse : gère 401 ET 403 (token expiré côté Spring) ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    // Spring Security renvoie 403 pour les JWT expirés/invalides
    if (status === 401 || status === 403) {
      forceLogout()
    }
    return Promise.reject(error)
  }
)

export default api
