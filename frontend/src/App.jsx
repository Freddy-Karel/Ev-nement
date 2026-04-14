import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import Loader from './components/common/Loader'
import './styles/animations.css'

// ── Pages admin ──────────────────────────────────────────────────────────────
const Login            = lazy(() => import('./pages/Login'))
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const EventList        = lazy(() => import('./pages/Events/EventList'))
const EventForm        = lazy(() => import('./pages/Events/EventForm'))
const EventDetail      = lazy(() => import('./pages/Events/EventDetail'))
const ParticipantsList = lazy(() => import('./pages/Participants/ParticipantsList'))

// ── Pages publiques ──────────────────────────────────────────────────────────
const PublicEventList   = lazy(() => import('./pages/Public/PublicEventList'))
const PublicEventDetail = lazy(() => import('./pages/Public/PublicEventDetail'))
const PublicRegister    = lazy(() => import('./pages/Public/PublicRegister'))
const ConfirmInvitation = lazy(() => import('./pages/Public/ConfirmInvitation'))
const AmbassadorSignup  = lazy(() => import('./pages/Public/AmbassadorSignup'))

// ── Pages Ambassadeur (auth) ─────────────────────────────────────────────────
const AmbassadorLogin    = lazy(() => import('./pages/Ambassador/AmbassadorLogin'))
const ForgotPassword     = lazy(() => import('./pages/Ambassador/ForgotPassword'))
const ResetPassword      = lazy(() => import('./pages/Ambassador/ResetPassword'))
const AmbassadorRegister = lazy(() => import('./pages/Ambassador/AmbassadorRegister'))

// ── Pages Ambassadeur (espace privé) ─────────────────────────────────────────
const AmbassadorOnboarding  = lazy(() => import('./pages/Ambassador/AmbassadorOnboarding'))
const AmbassadorHome        = lazy(() => import('./pages/Ambassador/AmbassadorHome'))
const AmbassadorInvite      = lazy(() => import('./pages/Ambassador/AmbassadorInvite'))
const AmbassadorLeaderboard = lazy(() => import('./pages/Ambassador/AmbassadorLeaderboard'))
const AmbassadorProfile     = lazy(() => import('./pages/Ambassador/AmbassadorProfile'))

// ── Loader plein écran ───────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight     : '100vh',
      background    : 'var(--color-surface)',
      display       : 'flex',
      alignItems    : 'center',
      justifyContent: 'center',
    }}>
      <Loader size="lg" />
    </div>
  )
}

// ── Toast adaptatif au thème ─────────────────────────────────────────────────
function ThemedToaster() {
  const { isDay } = useTheme()
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration : 4000,
        style    : {
          background : isDay ? '#FFFFFF' : '#1A1A1A',
          color      : isDay ? '#1A1A2E' : '#F5F5F5',
          border     : `1px solid ${isDay ? '#E5E7EB' : '#2E2E2E'}`,
          fontFamily : 'Inter, sans-serif',
          fontSize   : '0.875rem',
          boxShadow  : isDay
            ? '0 4px 16px rgba(26,26,46,0.12)'
            : '0 4px 16px rgba(0,0,0,0.4)',
        },
        success : { iconTheme: { primary: isDay ? '#7B2D8B' : '#D4AF37', secondary: isDay ? '#fff' : '#000' } },
        error   : { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
      }}
    />
  )
}

/**
 * Route protégée pour les admins.
 * ADMIN → accès. AMBASSADOR → redirige vers /ambassador. Non connecté → /login.
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/ambassador" replace />
  return children
}

/**
 * Route protégée pour les ambassadeurs.
 * Non connecté → /ambassador/login. Admin → /dashboard.
 * Onboarding non complété → /ambassador/onboarding.
 */
function AmbassadorRoute({ children, requireOnboarding = true }) {
  const { isAuthenticated, isAmbassador, user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/ambassador/login" replace />
  if (!isAmbassador) return <Navigate to="/dashboard" replace />
  if (requireOnboarding && !user?.onboardingCompleted) {
    return <Navigate to="/ambassador/onboarding" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <ThemedToaster />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>

                {/* ── Authentification Admin ────────────────────────── */}
                <Route path="/login" element={<Login />} />

                {/* ── Espace Ambassadeur – pages publiques ─────────── */}
                <Route path="/ambassador/login"           element={<AmbassadorLogin />} />
                <Route path="/ambassador/forgot-password" element={<ForgotPassword />} />
                <Route path="/ambassador/reset-password"  element={<ResetPassword />} />
                <Route path="/ambassador/register"        element={<AmbassadorRegister />} />

                {/* ── Inscription Ambassadeur legacy (/register?ref=) ── */}
                <Route path="/register" element={<AmbassadorSignup />} />

                {/* ── Pages publiques événements ───────────────────── */}
                <Route path="/events"            element={<PublicEventList />} />
                <Route path="/events/:id"        element={<PublicEventDetail />} />
                <Route path="/register/:eventId" element={<PublicRegister />} />
                <Route path="/confirm/:token"    element={<ConfirmInvitation />} />

                {/* ── Espace Ambassadeur – pages protégées ─────────── */}
                <Route path="/ambassador/onboarding" element={
                  <AmbassadorRoute requireOnboarding={false}>
                    <AmbassadorOnboarding />
                  </AmbassadorRoute>
                } />
                <Route path="/ambassador" element={
                  <AmbassadorRoute><AmbassadorHome /></AmbassadorRoute>
                } />
                <Route path="/ambassador/invite" element={
                  <AmbassadorRoute><AmbassadorInvite /></AmbassadorRoute>
                } />
                <Route path="/ambassador/classement" element={
                  <AmbassadorRoute><AmbassadorLeaderboard /></AmbassadorRoute>
                } />
                <Route path="/ambassador/profil" element={
                  <AmbassadorRoute><AmbassadorProfile /></AmbassadorRoute>
                } />

                {/* ── Routes admin protégées ───────────────────────── */}
                <Route path="/dashboard" element={
                  <AdminRoute><Dashboard /></AdminRoute>
                } />
                <Route path="/admin/events" element={
                  <AdminRoute><EventList /></AdminRoute>
                } />
                <Route path="/admin/events/new" element={
                  <AdminRoute><EventForm /></AdminRoute>
                } />
                <Route path="/admin/events/:id" element={
                  <AdminRoute><EventDetail /></AdminRoute>
                } />
                <Route path="/admin/events/:id/edit" element={
                  <AdminRoute><EventForm /></AdminRoute>
                } />
                <Route path="/admin/events/:eventId/participants" element={
                  <AdminRoute><ParticipantsList /></AdminRoute>
                } />

                {/* ── Redirections par défaut ──────────────────────── */}
                <Route path="/"  element={<Navigate to="/login" replace />} />
                <Route path="*"  element={<Navigate to="/login" replace />} />

              </Routes>
            </Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
