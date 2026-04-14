import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { UserCheck, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import logo from '../../Logo/Logo.jpeg'

export default function AmbassadorRegister() {
  const { login }        = useAuth()
  const navigate         = useNavigate()
  const [searchParams]   = useSearchParams()

  const [form,    setForm]    = useState({
    firstName   : '',
    lastName    : '',
    email       : '',
    phone       : '',
    referralCode: searchParams.get('ref') || '',
  })
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [errors,  setErrors]  = useState({})

  const update = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: undefined, form: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim())                          e.firstName = 'Le prénom est obligatoire'
    else if (form.firstName.trim().length < 2)            e.firstName = 'Au moins 2 caractères'
    if (!form.lastName.trim())                           e.lastName  = 'Le nom est obligatoire'
    else if (form.lastName.trim().length < 2)             e.lastName  = 'Au moins 2 caractères'
    if (!form.email.trim())                              e.email     = "L'email est obligatoire"
    else if (!/\S+@\S+\.\S+/.test(form.email))           e.email     = "Format d'email invalide"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      // POST /api/auth/register → retourne token + données utilisateur
      const authApi = (await import('../../api/auth')).default
      const data    = await authApi.register({
        firstName   : form.firstName.trim(),
        lastName    : form.lastName.trim(),
        email       : form.email.trim(),
        referralCode: form.referralCode.trim() || undefined,
      })

      // Connexion automatique
      await login(form.email.trim(), null, true, data)

      setDone(true)
      toast.success(`Bienvenue ${data.firstName} ! Consultez vos emails pour vos identifiants.`)
      setTimeout(() => {
        navigate(data.onboardingCompleted ? '/ambassador' : '/ambassador/onboarding', { replace: true })
      }, 3500)
    } catch (err) {
      const msg = err.response?.data?.email
        || err.response?.data?.message
        || "Une erreur est survenue. Veuillez réessayer."
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
      <div style={S.halo} />

      <div style={S.card} className="animate-fadeIn">

        {/* ── En-tête ──────────────────────────────────────────── */}
        <div style={S.header}>
          <div style={S.logoWrapper}>
            <img src={logo} alt="FEMMES ROYALES" style={S.logoImg} />
          </div>
          <h1 style={S.title}>Devenir Ambassadeur</h1>
          <div style={S.badge}>👑 FEMMES ROYALES</div>
          <hr style={S.divider} />
        </div>

        {/* ── Succès ─────────────────────────────────────────── */}
        {done ? (
          <div style={S.successBox}>
            <CheckCircle size={42} color="#16A34A" style={{ display: 'block', margin: '0 auto 1rem' }} />
            <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
              Inscription réussie !
            </p>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Un email avec vos identifiants de connexion vous a été envoyé.
              Vous allez être redirigé(e) vers votre espace ambassadeur…
            </p>
          </div>
        ) : (
          /* ── Formulaire ──────────────────────────────────────── */
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Prénom / Nom (2 colonnes) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="label">Prénom</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Marie"
                  value={form.firstName}
                  onChange={update('firstName')}
                  disabled={loading}
                  autoComplete="given-name"
                  autoFocus
                />
                {errors.firstName && <p style={S.fieldError}>{errors.firstName}</p>}
              </div>
              <div>
                <label className="label">Nom</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Dupont"
                  value={form.lastName}
                  onChange={update('lastName')}
                  disabled={loading}
                  autoComplete="family-name"
                />
                {errors.lastName && <p style={S.fieldError}>{errors.lastName}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Adresse email</label>
              <input
                type="email"
                className="input"
                placeholder="marie.dupont@email.com"
                value={form.email}
                onChange={update('email')}
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && <p style={S.fieldError}>{errors.email}</p>}
            </div>

            {/* Téléphone (optionnel) */}
            <div>
              <label className="label">
                Téléphone
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '0.35rem', fontSize: '0.8rem' }}>
                  (optionnel)
                </span>
              </label>
              <input
                type="tel"
                className="input"
                placeholder="+241 07 00 00 00"
                value={form.phone}
                onChange={update('phone')}
                disabled={loading}
                autoComplete="tel"
              />
            </div>

            {/* Code de parrainage (pré-rempli si ?ref=CODE) */}
            <div>
              <label className="label">
                Code de parrainage
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '0.35rem', fontSize: '0.8rem' }}>
                  (optionnel)
                </span>
              </label>
              <input
                type="text"
                className="input"
                placeholder="CODE_AMBASSADEUR"
                value={form.referralCode}
                onChange={update('referralCode')}
                disabled={loading}
                autoComplete="off"
                style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}
              />
            </div>

            {/* Erreur générale */}
            {errors.form && <div style={S.formError}>{errors.form}</div>}

            {/* Bouton */}
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: '0.25rem', width: '100%', justifyContent: 'center' }}
            >
              {loading ? (
                <><span style={S.spinner} /> Inscription en cours…</>
              ) : (
                <><UserCheck size={18} /> S'INSCRIRE</>
              )}
            </button>

          </form>
        )}

        {/* ── Lien déjà inscrit ────────────────────────────────── */}
        {!done && (
          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
              Déjà inscrit(e) ?
            </p>
            <Link to="/ambassador/login" style={S.loginLink}>
              ← Se connecter
            </Link>
          </div>
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
    width        : '560px',
    height       : '560px',
    background   : 'radial-gradient(circle, var(--color-primary-subtle) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  card: {
    width       : '100%',
    maxWidth    : '460px',
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
    width        : '80px',
    height       : '80px',
    borderRadius : '18px',
    background   : '#FFFFFF',
    boxShadow    : '0 6px 20px rgba(0,0,0,0.10)',
    display      : 'flex',
    alignItems   : 'center',
    justifyContent: 'center',
    margin       : '0 auto 1rem',
    border       : '2px solid rgba(123,45,139,0.12)',
  },
  logoImg: { width: '72%', height: '72%', objectFit: 'contain' },
  title: {
    fontFamily   : 'Poppins, sans-serif',
    fontSize     : '1.25rem',
    fontWeight   : 700,
    color        : 'var(--color-text-primary)',
    margin       : '0 0 0.5rem',
  },
  badge: {
    display      : 'inline-block',
    background   : 'linear-gradient(135deg, #7B2D8B 0%, #D4AF37 100%)',
    color        : '#FFFFFF',
    fontSize     : '0.75rem',
    fontWeight   : 700,
    padding      : '0.3rem 1rem',
    borderRadius : '50px',
    letterSpacing: '0.06em',
    fontFamily   : 'Inter, sans-serif',
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
    padding     : '2rem 1.5rem',
  },
  fieldError: { color: '#DC2626', fontSize: '0.78rem', marginTop: '0.3rem', marginLeft: '0.2rem' },
  formError: {
    background  : 'rgba(220,38,38,0.08)',
    border      : '1px solid rgba(220,38,38,0.25)',
    borderRadius: '8px',
    padding     : '0.75rem 1rem',
    color       : '#DC2626',
    fontSize    : '0.875rem',
    textAlign   : 'center',
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
  loginLink: {
    color         : 'var(--color-primary)',
    fontSize      : '0.875rem',
    fontWeight    : 600,
    textDecoration: 'none',
    fontFamily    : 'Inter, sans-serif',
  },
}
