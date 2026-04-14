import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import authApi from '../../api/auth'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const validate = () => {
    if (!email.trim())                    return "L'email est obligatoire"
    if (!/\S+@\S+\.\S+/.test(email))     return "Format d'email invalide"
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
      toast.success('Email envoyé !')
    } catch {
      // L'API renvoie toujours 200 pour éviter l'énumération d'emails
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
        <ThemeSwitcher />
      </div>
      <div style={S.halo} />

      <div style={S.card} className="animate-fadeIn">

        {/* ── En-tête ──────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.iconWrapper}>🔑</div>
          <h1 style={S.title}>Mot de passe oublié ?</h1>
          <p style={S.subtitle}>
            Entrez votre email, nous vous enverrons un lien de réinitialisation valable 1 heure.
          </p>
          <hr style={S.divider} />
        </div>

        {/* ── Succès ─────────────────────────────────────────── */}
        {sent ? (
          <div style={S.successBox}>
            <CheckCircle size={40} color="#16A34A" style={{ margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' }}>
              Email envoyé !
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', lineHeight: 1.6 }}>
              Si un compte est associé à <strong>{email}</strong>, vous recevrez un lien
              de réinitialisation dans quelques minutes. Pensez à vérifier vos spams.
            </p>
            <Link to="/ambassador/login" style={{ ...S.backLink, display: 'block', textAlign: 'center', marginTop: '1.5rem' }}>
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          /* ── Formulaire ──────────────────────────────────────── */
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label className="label">Votre adresse email</label>
              <input
                type="email"
                className="input"
                placeholder="ambassadeur@femmes-royales.ga"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                disabled={loading}
                autoComplete="email"
                autoFocus
              />
              {error && <p style={S.fieldError}>{error}</p>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <><span style={S.spinner} /> Envoi en cours…</>
              ) : (
                <><Send size={17} /> ENVOYER LE LIEN</>
              )}
            </button>

            <Link to="/ambassador/login" style={{ ...S.backLink, textAlign: 'center', display: 'block' }}>
              <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
              Retour à la connexion
            </Link>
          </form>
        )}

      </div>
    </div>
  )
}

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
    width        : '500px',
    height       : '500px',
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
  },
  header    : { textAlign: 'center', marginBottom: '1.75rem' },
  iconWrapper: {
    fontSize    : '2.5rem',
    marginBottom: '0.75rem',
  },
  title: {
    fontFamily   : 'Poppins, sans-serif',
    fontSize     : '1.25rem',
    fontWeight   : 700,
    color        : 'var(--color-text-primary)',
    margin       : '0 0 0.5rem',
  },
  subtitle: {
    color     : 'var(--color-text-muted)',
    fontSize  : '0.875rem',
    lineHeight: 1.6,
    margin    : 0,
    fontFamily: 'Inter, sans-serif',
  },
  divider: {
    border    : 'none',
    height    : '1px',
    background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
    marginTop : '1.1rem',
  },
  successBox: {
    background  : 'rgba(22,163,74,0.07)',
    border      : '1px solid rgba(22,163,74,0.20)',
    borderRadius: '12px',
    padding     : '1.75rem 1.5rem',
  },
  fieldError: { color: '#DC2626', fontSize: '0.8rem', marginTop: '0.35rem', marginLeft: '0.25rem' },
  spinner: {
    display       : 'inline-block',
    width         : '16px',
    height        : '16px',
    border        : '2px solid rgba(255,255,255,0.2)',
    borderTopColor: '#FFFFFF',
    borderRadius  : '50%',
    animation     : 'spin 0.7s linear infinite',
  },
  backLink: {
    color         : 'var(--color-primary)',
    fontSize      : '0.875rem',
    textDecoration: 'none',
    fontFamily    : 'Inter, sans-serif',
  },
}
