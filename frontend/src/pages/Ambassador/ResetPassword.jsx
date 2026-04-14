import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import authApi from '../../api/auth'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'

export default function ResetPassword() {
  const navigate             = useNavigate()
  const [searchParams]       = useSearchParams()
  const token                = searchParams.get('token')

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [showConf,  setShowConf]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [errors,    setErrors]    = useState({})

  // Pas de token → redirection immédiate
  useEffect(() => {
    if (!token) navigate('/ambassador/forgot-password', { replace: true })
  }, [token, navigate])

  const validate = () => {
    const e = {}
    if (!password)              e.password = 'Le mot de passe est obligatoire'
    else if (password.length < 8) e.password = 'Au moins 8 caractères'
    if (password !== confirm)   e.confirm  = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
      toast.success('Mot de passe mis à jour !')
      setTimeout(() => navigate('/ambassador/login', { replace: true }), 3000)
    } catch (err) {
      const msg = err.response?.data?.message || 'Token invalide ou expiré'
      toast.error(msg)
      if (msg.toLowerCase().includes('expiré') || msg.toLowerCase().includes('invalide')) {
        setErrors({ token: msg })
      } else {
        setErrors({ form: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  if (!token) return null

  return (
    <div style={S.page}>
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
        <ThemeSwitcher />
      </div>
      <div style={S.halo} />

      <div style={S.card} className="animate-fadeIn">

        {/* ── En-tête ──────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.iconWrapper}>🔒</div>
          <h1 style={S.title}>Nouveau mot de passe</h1>
          <p style={S.subtitle}>Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>
          <hr style={S.divider} />
        </div>

        {/* ── Token invalide ───────────────────────────────────── */}
        {errors.token && (
          <div style={S.errorBox}>
            <AlertTriangle size={28} color="#DC2626" style={{ display: 'block', margin: '0 auto 0.75rem' }} />
            <p style={{ textAlign: 'center', color: '#DC2626', fontWeight: 600, marginBottom: '0.5rem' }}>
              Lien expiré ou invalide
            </p>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Ce lien n'est plus valide. Demandez un nouveau lien de réinitialisation.
            </p>
            <Link to="/ambassador/forgot-password" style={{ ...S.link, display: 'block', textAlign: 'center', marginTop: '1.25rem' }}>
              Demander un nouveau lien →
            </Link>
          </div>
        )}

        {/* ── Succès ─────────────────────────────────────────── */}
        {done && (
          <div style={S.successBox}>
            <CheckCircle size={40} color="#16A34A" style={{ display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ textAlign: 'center', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Mot de passe mis à jour !
            </p>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Redirection vers la connexion dans 3 secondes…
            </p>
          </div>
        )}

        {/* ── Formulaire ──────────────────────────────────────── */}
        {!done && !errors.token && (
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Nouveau mot de passe */}
            <div>
              <label className="label">
                <Lock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
                Nouveau mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })) }}
                  disabled={loading}
                  autoComplete="new-password"
                  autoFocus
                  style={{ paddingRight: '2.75rem' }}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} style={S.eyeBtn} tabIndex={-1}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p style={S.fieldError}>{errors.password}</p>}
            </div>

            {/* Confirmation */}
            <div>
              <label className="label">Confirmer le mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConf ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErrors((p) => ({ ...p, confirm: undefined })) }}
                  disabled={loading}
                  autoComplete="new-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <button type="button" onClick={() => setShowConf((v) => !v)} style={S.eyeBtn} tabIndex={-1}>
                  {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm && <p style={S.fieldError}>{errors.confirm}</p>}
            </div>

            {errors.form && <div style={S.formError}>{errors.form}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <><span style={S.spinner} /> Enregistrement…</>
              ) : (
                'ENREGISTRER LE MOT DE PASSE'
              )}
            </button>

            <Link to="/ambassador/login" style={{ ...S.link, textAlign: 'center', display: 'block' }}>
              ← Retour à la connexion
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
  iconWrapper: { fontSize: '2.5rem', marginBottom: '0.75rem' },
  title: {
    fontFamily: 'Poppins, sans-serif',
    fontSize  : '1.25rem',
    fontWeight: 700,
    color     : 'var(--color-text-primary)',
    margin    : '0 0 0.5rem',
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
  errorBox: {
    background  : 'rgba(220,38,38,0.06)',
    border      : '1px solid rgba(220,38,38,0.20)',
    borderRadius: '12px',
    padding     : '1.75rem 1.5rem',
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
}
