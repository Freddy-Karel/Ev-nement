import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Accès simplifié au contexte d'authentification.
 * À utiliser dans n'importe quel composant enfant d'AuthProvider.
 *
 * @returns {{ user, loading, login, logout, isAuthenticated }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans un <AuthProvider>')
  return ctx
}
