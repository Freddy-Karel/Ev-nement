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

export function AuthProvider({ children }) {
  /**
   * user = { email, role, firstName, onboardingCompleted }
   * role = 'ADMIN' | 'AMBASSADOR' | null
   */
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // ── Restauration de session depuis localStorage ──────────────────────────
  useEffect(() => {
    const token     = localStorage.getItem('token')
    const email     = localStorage.getItem('userEmail')
    const role      = localStorage.getItem('userRole')
    const firstName = localStorage.getItem('userFirstName')
    const onboarded = localStorage.getItem('onboardingCompleted') === 'true'

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
  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    persistUser(data)
    setUser({
      email: data.email,
      role: data.role || 'ADMIN',
      firstName: data.firstName,
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
    localStorage.setItem('onboardingCompleted', 'true')
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
function persistUser(data) {
  localStorage.setItem('token',               data.token)
  localStorage.setItem('userEmail',           data.email)
  localStorage.setItem('userRole',            data.role || 'ADMIN')
  localStorage.setItem('userFirstName',       data.firstName || '')
  localStorage.setItem('onboardingCompleted', String(data.onboardingCompleted ?? true))
}

function clearStorage() {
  localStorage.removeItem('token')
  localStorage.removeItem('userEmail')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userFirstName')
  localStorage.removeItem('onboardingCompleted')
}
