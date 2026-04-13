import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import ThemeSwitcher from '../components/common/ThemeSwitcher'
import logo from '../Logo/Logo.jpeg'

export default function Login() {
  const { login }    = useAuth()
  const navigate     = useNavigate()
  const location     = useLocation()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [errors,    setErrors]    = useState({})

  // URL à rejoindre après connexion (mémorisée par ProtectedRoute)
  const from = location.state?.from?.pathname || '/dashboard'

  // ── Validation locale ──────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!email.trim())              e.email    = "L'email est obligatoire"
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Format d\'email invalide'
    if (!password)                  e.password = 'Le mot de passe est obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Soumission ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const data = await login(email.trim(), password)
      toast.success('Connexion réussie !')
      
      // Gestion de la redirection basée sur le rôle
      if (data.role === 'AMBASSADOR') {
        const dest = data.onboardingCompleted ? '/ambassador' : '/ambassador/onboarding'
        // Si la page 'from' était /dashboard (par defaut), on force le dashboard ambassadeur.
        const finalDest = (from === '/dashboard') ? dest : from
        navigate(finalDest, { replace: true })
      } else {
        navigate(from, { replace: true })
      }
      
    } catch (err) {
      const msg = err.response?.data?.message || 'Email ou mot de passe incorrect'
      toast.error(msg)
      setErrors({ form: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>

      {/* ThemeSwitcher coin haut droit */}
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
        <ThemeSwitcher />
      </div>

      {/* Halo décoratif */}
      <div style={styles.halo} />

      <div style={styles.card} className="animate-fadeIn">

        {/* ── En-tête ────────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.logoWrapper}>
            <img
              src={logo}
              alt="FEMMES ROYALES"
              style={styles.logoImg}
            />
          </div>
          <h1 style={styles.title}>FEMMES ROYALES</h1>
          <p style={styles.subtitle}>Portail de Connexion</p>
          <hr style={styles.divider} />
        </div>

        {/* ── Formulaire ────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Email */}
          <div>
            <label className="label">Adresse email</label>
            <input
              type="email"
              className="input"
              placeholder="admin@icc.ga"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <p style={styles.fieldError}>{errors.email}</p>}
          </div>

          {/* Mot de passe */}
          <div>
            <label className="label">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
                disabled={loading}
                autoComplete="current-password"
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={styles.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={styles.fieldError}>{errors.password}</p>}
          </div>

          {/* Erreur générale */}
          {errors.form && (
            <div style={styles.formError}>
              {errors.form}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: '0.25rem', width: '100%' }}
          >
            {loading ? (
              <>
                <span style={styles.spinner} />
                Connexion en cours…
              </>
            ) : (
              <>
                <LogIn size={18} />
                Se connecter
              </>
            )}
          </button>

        </form>

        {/* ── Citation ──────────────────────────────────────── */}
        <div style={styles.quote}>
          <p className="bible-ref"
            style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            « Ce n'est pas vous qui m'avez choisi ; c'est moi qui vous ai choisis »
          </p>
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
            — Jean 15:16
          </p>
        </div>

      </div>
    </div>
  )
}

/* ── Styles inline thémables ───────────────────────────────────── */
const styles = {
  page: {
    minHeight      : '100vh',
    background     : 'var(--color-surface)',
    display        : 'flex',
    alignItems     : 'center',
    justifyContent : 'center',
    padding        : '1.5rem',
    position       : 'relative',
    overflow       : 'hidden',
    transition     : 'background 350ms ease',
  },
  halo: {
    position      : 'absolute',
    top           : '10%',
    left          : '50%',
    transform     : 'translateX(-50%)',
    width         : '500px',
    height        : '500px',
    background    : 'radial-gradient(circle, var(--color-primary-subtle) 0%, transparent 70%)',
    pointerEvents : 'none',
  },
  card: {
    width        : '100%',
    maxWidth     : '420px',
    background   : 'var(--color-surface-2)',
    border       : '1px solid var(--color-border)',
    borderRadius : '16px',
    padding      : '2.5rem 2rem',
    boxShadow    : 'var(--shadow-lg)',
    position     : 'relative',
    zIndex       : 1,
    transition   : 'background 350ms ease, border-color 350ms ease',
  },
  header      : { textAlign: 'center', marginBottom: '2rem' },
  logoWrapper : {
    width: '85px',
    height: '85px',
    borderRadius: '20px',
    background: '#FFFFFF',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.25rem',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  logoImg: {
    width: '75%',
    height: '75%',
    objectFit: 'contain',
  },
  title: {
    fontFamily   : 'Poppins, sans-serif',
    fontSize     : '1.375rem',
    fontWeight   : 700,
    color        : 'var(--color-text-primary)',
    margin       : 0,
    letterSpacing: '0.01em',
  },
  subtitle: {
    color      : 'var(--color-text-muted)',
    fontSize   : '0.875rem',
    marginTop  : '0.375rem',
    fontFamily : 'Inter, sans-serif',
  },
  divider: {
    border     : 'none',
    height     : '1px',
    background : 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
    marginTop  : '1.25rem',
  },
  fieldError: {
    color      : '#DC2626',
    fontSize   : '0.8rem',
    marginTop  : '0.375rem',
    marginLeft : '0.25rem',
  },
  formError: {
    background   : 'rgba(220,38,38,0.08)',
    border       : '1px solid rgba(220,38,38,0.25)',
    borderRadius : '8px',
    padding      : '0.75rem 1rem',
    color        : '#DC2626',
    fontSize     : '0.875rem',
    textAlign    : 'center',
  },
  eyeBtn: {
    position  : 'absolute',
    right     : '0.75rem',
    top       : '50%',
    transform : 'translateY(-50%)',
    background: 'none',
    border    : 'none',
    color     : 'var(--color-text-muted)',
    cursor    : 'pointer',
    padding   : '0.25rem',
    display   : 'flex',
    alignItems: 'center',
  },
  spinner: {
    display        : 'inline-block',
    width          : '16px',
    height         : '16px',
    border         : '2px solid rgba(255,255,255,0.2)',
    borderTopColor : '#FFFFFF',
    borderRadius   : '50%',
    animation      : 'spin 0.7s linear infinite',
  },
  quote: {
    borderTop  : '1px solid var(--color-border)',
    paddingTop : '1rem',
    marginTop  : '0.5rem',
  },
}
