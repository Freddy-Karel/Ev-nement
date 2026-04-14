import { createContext, useCallback, useEffect, useState, useContext } from 'react'
import authApi from '../api/auth'

export const AuthContext = createContext(null)

/** Décode le payload JWT côté client (sans vérif signature). */
function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  try {
    const payload = decodeJwt(token)
    return !payload?.exp || Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

/** Lit une clé depuis localStorage en priorité, puis sessionStorage. */
function getItem(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

export function AuthProvider({ children }) {
  /**
   * user = { email, role, firstName, onboardingCompleted }
   * role = 'ADMIN' | 'AMBASSADOR' | null
   */
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Restauration de session (localStorage ET sessionStorage) ──────────────
  useEffect(() => {
    const token     = getItem('token')
    const email     = getItem('userEmail')
    const role      = getItem('userRole')
    const firstName = getItem('userFirstName')
    const onboarded = getItem('onboardingCompleted') === 'true'

    if (token && email) {
      if (isTokenExpired(token)) {
        clearStorage()
      } else {
        setUser({ email, role: role || 'ADMIN', firstName, onboardingCompleted: onboarded })
      }
    }
    setLoading(false)
  }, [])

  // ── Login ────────────────────────────────────────────────────────────────
  /**
   * @param {string}  email
   * @param {string|null}  password   null si preloadedData est fourni
   * @param {boolean} rememberMe      true → localStorage (par défaut), false → sessionStorage
   * @param {object|null} preloadedData  données déjà disponibles (register → pas de 2e appel réseau)
   */
  const login = useCallback(async (email, password, rememberMe = true, preloadedData = null) => {
    const data = preloadedData ?? await authApi.login(email, password)
    persistUser(data, rememberMe)
    setUser({
      email              : data.email,
      role               : data.role || 'ADMIN',
      firstName          : data.firstName,
      onboardingCompleted: data.onboardingCompleted ?? true,
    })
    return data
  }, [])

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearStorage()
    setUser(null)
  }, [])

  // ── Mise à jour locale après onboarding ──────────────────────────────────
  const markOnboardingComplete = useCallback(() => {
    ;[localStorage, sessionStorage].forEach((s) => {
      if (s.getItem('token')) s.setItem('onboardingCompleted', 'true')
    })
    setUser((prev) => prev ? { ...prev, onboardingCompleted: true } : prev)
  }, [])

  const isAuthenticated = !!user
  const isAdmin         = user?.role === 'ADMIN'
  const isAmbassador    = user?.role === 'AMBASSADOR'

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isAmbassador,
    markOnboardingComplete,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}

// ── Helpers storage ──────────────────────────────────────────────────────────
function persistUser(data, rememberMe = true) {
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem('token',               data.token)
  storage.setItem('userEmail',           data.email)
  storage.setItem('userRole',            data.role || 'ADMIN')
  storage.setItem('userFirstName',       data.firstName || '')
  storage.setItem('onboardingCompleted', String(data.onboardingCompleted ?? true))
}

function clearStorage() {
  ;[localStorage, sessionStorage].forEach((s) => {
    s.removeItem('token')
    s.removeItem('userEmail')
    s.removeItem('userRole')
    s.removeItem('userFirstName')
    s.removeItem('onboardingCompleted')
  })
}
