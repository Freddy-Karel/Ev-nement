import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import logo from '../../Logo/Logo.jpeg'

export default function AmbassadorLogin() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()

  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading,    setLoading]    = useState(false)
  const [errors,     setErrors]     = useState({})

  const from = location.state?.from?.pathname

  const validate = () => {
    const e = {}
    if (!email.trim())                    e.email    = "L'email est obligatoire"
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = "Format d'email invalide"
    if (!password)                         e.password = 'Le mot de passe est obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const data = await login(email.trim(), password, rememberMe)
      toast.success('Connexion réussie !')

      if (data.role === 'AMBASSADOR') {
        const defaultDest = data.onboardingCompleted ? '/ambassador' : '/ambassador/onboarding'
        navigate(from || defaultDest, { replace: true })
      } else {
        // Admin arrivé sur la mauvaise page → espace admin
        navigate('/dashboard', { replace: true })
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
    <div style={S.page}>
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
        <ThemeSwitcher />
      </div>

      {/* Halo décoratif */}
      <div style={S.halo} />

      <div style={S.card} className="animate-fadeIn">

        {/* ── En-tête ──────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.logoWrapper}>
            <img src={logo} alt="FEMMES ROYALES" style={S.logoImg} />
          </div>
          <h1 style={S.title}>FEMMES ROYALES</h1>
          <div style={S.badge}>👑 ESPACE AMBASSADEUR</div>
          <hr style={S.divider} />
        </div>

        {/* ── Formulaire ──────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

          {/* Email */}
          <div>
            <label className="label">Adresse email</label>
            <input
              type="email"
              className="input"
              placeholder="ambassadeur@femmes-royales.ga"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })) }}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <p style={S.fieldError}>{errors.email}</p>}
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
                style={S.eyeBtn}
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={S.fieldError}>{errors.password}</p>}
          </div>

          {/* Se souvenir de moi */}
          <label style={S.checkLabel}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--color-primary)', width: '15px', height: '15px', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              Se souvenir de moi
            </span>
          </label>

          {/* Erreur générale */}
          {errors.form && <div style={S.formError}>{errors.form}</div>}

          {/* Bouton connexion */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ marginTop: '0.25rem', width: '100%', justifyContent: 'center' }}
          >
            {loading ? (
              <><span style={S.spinner} /> Connexion en cours…</>
            ) : (
              <><LogIn size={18} /> SE CONNECTER</>
            )}
          </button>

        </form>

        {/* ── Mot de passe oublié ──────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: '1.1rem' }}>
          <Link to="/ambassador/forgot-password" style={S.link}>
            🔑 Mot de passe oublié ?
          </Link>
        </div>

        {/* ── Séparateur ──────────────────────────────────────── */}
        <div style={S.separator}>
          <span style={S.separatorLine} />
          <span style={S.separatorText}>ou</span>
          <span style={S.separatorLine} />
        </div>

        {/* ── Devenir ambassadeur ──────────────────────────────── */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            Pas encore de compte ?
          </p>
          <Link to="/ambassador/register" style={S.registerLink}>
            Devenir ambassadeur →
          </Link>
        </div>

      </div>
    </div>
  )
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const S = {
  page: {
    minHeight    : '100vh',
    background   : 'var(--color-surface)',
    display      : 'flex',
    alignItems   : 'center',
    justifyContent: 'center',
    padding      : '1.5rem',
    position     : 'relative',
    overflow     : 'hidden',
    transition   : 'background 350ms ease',
  },
  halo: {
    position     : 'absolute',
    top          : '5%',
    left         : '50%',
    transform    : 'translateX(-50%)',
    width        : '560px',
    height       : '560px',
    background   : 'radial-gradient(circle, var(--color-primary-subtle) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  card: {
    width       : '100%',
    maxWidth    : '420px',
    background  : 'var(--color-surface-2)',
    border      : '1px solid var(--color-border)',
    borderRadius: '20px',
    padding     : '2.5rem 2rem',
    boxShadow   : 'var(--shadow-lg)',
    position    : 'relative',
    zIndex      : 1,
    transition  : 'background 350ms ease, border-color 350ms ease',
  },
  header     : { textAlign: 'center', marginBottom: '1.75rem' },
  logoWrapper: {
    width       : '80px',
    height      : '80px',
    borderRadius: '18px',
    background  : '#FFFFFF',
    boxShadow   : '0 6px 20px rgba(0,0,0,0.10)',
    display     : 'flex',
    alignItems  : 'center',
    justifyContent: 'center',
    margin      : '0 auto 1rem',
    border      : '2px solid rgba(123,45,139,0.12)',
  },
  logoImg: { width: '72%', height: '72%', objectFit: 'contain' },
  title: {
    fontFamily   : 'Poppins, sans-serif',
    fontSize     : '1.25rem',
    fontWeight   : 700,
    color        : 'var(--color-text-primary)',
    margin       : '0 0 0.5rem',
    letterSpacing: '0.01em',
  },
  badge: {
    display    : 'inline-block',
    background : 'linear-gradient(135deg, #7B2D8B 0%, #D4AF37 100%)',
    color      : '#FFFFFF',
    fontSize   : '0.75rem',
    fontWeight : 700,
    padding    : '0.3rem 1rem',
    borderRadius: '50px',
    letterSpacing: '0.06em',
    fontFamily : 'Inter, sans-serif',
  },
  divider: {
    border    : 'none',
    height    : '1px',
    background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
    marginTop : '1.1rem',
  },
  fieldError: { color: '#DC2626', fontSize: '0.8rem', marginTop: '0.35rem', marginLeft: '0.25rem' },
  formError: {
    background  : 'rgba(220,38,38,0.08)',
    border      : '1px solid rgba(220,38,38,0.25)',
    borderRadius: '8px',
    padding     : '0.75rem 1rem',
    color       : '#DC2626',
    fontSize    : '0.875rem',
    textAlign   : 'center',
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
  checkLabel: {
    display   : 'flex',
    alignItems: 'center',
    gap       : '0.5rem',
    cursor    : 'pointer',
  },
  spinner: {
    display       : 'inline-block',
    width         : '16px',
    height        : '16px',
    border        : '2px solid rgba(255,255,255,0.2)',
    borderTopColor: '#FFFFFF',
    borderRadius  : '50%',
    animation     : 'spin 0.7s linear infinite',
  },
  link: {
    color         : 'var(--color-primary)',
    fontSize      : '0.875rem',
    textDecoration: 'none',
    fontFamily    : 'Inter, sans-serif',
  },
  separator: {
    display   : 'flex',
    alignItems: 'center',
    gap       : '0.75rem',
    margin    : '1.25rem 0 1rem',
  },
  separatorLine: {
    flex      : 1,
    height    : '1px',
    background: 'var(--color-border)',
    display   : 'block',
  },
  separatorText: {
    color    : 'var(--color-text-muted)',
    fontSize : '0.75rem',
    fontFamily: 'Inter, sans-serif',
  },
  registerLink: {
    display        : 'inline-block',
    background     : 'linear-gradient(135deg, #7B2D8B 0%, #D4AF37 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight     : 700,
    fontSize       : '0.9rem',
    textDecoration : 'none',
    fontFamily     : 'Inter, sans-serif',
  },
}
