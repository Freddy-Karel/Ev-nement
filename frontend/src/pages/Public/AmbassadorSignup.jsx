import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import authApi from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import { useTheme } from '../../context/ThemeContext'

/**
 * Page d'inscription publique pour les ambassadeurs.
 * Supporte le parrainage via le paramètre ?ref={referralCode}.
 * Après inscription réussie : redirige vers /ambassador/onboarding.
 */
export default function AmbassadorSignup() {
  const navigate          = useNavigate()
  const [searchParams]    = useSearchParams()
  const { login }         = useAuth()
  const { isDay }         = useTheme()
  const referralCode      = searchParams.get('ref') || ''

  const [step,    setStep]    = useState('form') // 'form' | 'success'
  const [form,    setForm]    = useState({ firstName: '', lastName: '', email: '', referralCode })
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: undefined, global: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Le prénom est obligatoire'
    if (!form.lastName.trim())  e.lastName  = 'Le nom est obligatoire'
    if (!form.email.trim())     e.email     = "L'email est obligatoire"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const data = await authApi.register({
        firstName:    form.firstName.trim(),
        lastName:     form.lastName.trim(),
        email:        form.email.trim(),
        referralCode: form.referralCode.trim() || null,
      })
      // Stocker le token + données de session
      localStorage.setItem('token',               data.token)
      localStorage.setItem('userEmail',           data.email)
      localStorage.setItem('userRole',            data.role)
      localStorage.setItem('userFirstName',       data.firstName || form.firstName.trim())
      localStorage.setItem('onboardingCompleted', 'false')

      navigate('/ambassador/onboarding', { replace: true })
    } catch (err) {
      const status = err.response?.status
      if (status === 409) {
        setErrors({ email: 'Un compte existe déjà avec cet email.' })
      } else {
        setErrors({ global: err.response?.data?.email || 'Une erreur est survenue. Veuillez réessayer.' })
      }
    } finally {
      setSaving(false)
    }
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight    : '100vh',
      background   : 'var(--color-surface)',
      color        : 'var(--color-text-primary)',
      fontFamily   : 'Inter, sans-serif',
      display      : 'flex',
      flexDirection: 'column',
      transition   : 'background 350ms ease',
    }}>

      {/* Déco halos */}
      <div style={{ position: 'fixed', top: '-15%', right: '-10%', width: '60vmin', height: '60vmin', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,45,139,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-15%', left: '-10%',  width: '50vmin', height: '50vmin', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--header-bg)', zIndex: 50, backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Poppins', fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>ICC</span>
          </div>
          <span style={{ fontFamily: 'Poppins', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>FEMMES ROYALES</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/login" style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', textDecoration: 'none' }}>Connexion</Link>
          <ThemeSwitcher />
        </div>
      </header>

      {/* Contenu */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>

          {/* En-tête */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            {/* Icône */}
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--color-primary-subtle)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 30px rgba(123,45,139,0.15)' }}>
              <UserPlus size={28} color="var(--color-primary)" strokeWidth={1.5} />
            </div>
            <p style={{ color: 'var(--color-primary)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
              ✦ Espace Ambassadeur ✦
            </p>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>
              Rejoins le mouvement
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Crée ton compte et commence à inviter tes proches.
            </p>
            {referralCode && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '999px', padding: '0.35rem 1rem', marginTop: '0.875rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>🤝 Invité(e) par un ambassadeur</span>
              </div>
            )}
          </div>

          {/* Card formulaire */}
          <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '2rem', boxShadow: 'var(--shadow-lg)' }}>

            {errors.global && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#DC2626', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={15} />
                <span>{errors.global}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* Prénom + Nom sur la même ligne */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Field label="Prénom" required error={errors.firstName}>
                    <input
                      className="input"
                      placeholder="Jean"
                      value={form.firstName}
                      onChange={set('firstName')}
                      disabled={saving}
                      autoFocus
                    />
                  </Field>
                  <Field label="Nom" required error={errors.lastName}>
                    <input
                      className="input"
                      placeholder="Dupont"
                      value={form.lastName}
                      onChange={set('lastName')}
                      disabled={saving}
                    />
                  </Field>
                </div>

                <Field label="Adresse email" required error={errors.email}>
                  <input
                    className="input"
                    type="email"
                    placeholder="jean@example.com"
                    value={form.email}
                    onChange={set('email')}
                    disabled={saving}
                    style={errors.email ? { borderColor: '#DC2626' } : {}}
                  />
                </Field>

                {/* Code de parrainage */}
                {referralCode ? (
                  <Field label="Code de parrainage">
                    <input
                      className="input"
                      value={referralCode}
                      disabled
                      style={{ opacity: 0.7, cursor: 'not-allowed' }}
                    />
                  </Field>
                ) : (
                  <Field label="Code de parrainage" hint="optionnel">
                    <input
                      className="input"
                      placeholder="CODE_XXXX"
                      value={form.referralCode}
                      onChange={set('referralCode')}
                      disabled={saving}
                    />
                  </Field>
                )}

                {/* Note mot de passe */}
                <div style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  📧 Un <strong style={{ color: 'var(--color-text-secondary)' }}>mot de passe temporaire</strong> vous sera envoyé par email après inscription.
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.9rem 1.5rem', fontSize: '0.9375rem', gap: '0.5rem', marginTop: '0.25rem' }}
                >
                  {saving
                    ? <><Spinner /> Création du compte…</>
                    : <><ArrowRight size={16} /> Créer mon compte</>
                  }
                </button>

              </div>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              Déjà un compte ?{' '}
              <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                Se connecter
              </Link>
            </div>
          </div>

          {/* Citation */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.77rem', fontStyle: 'italic', lineHeight: 1.65 }}>
              « Ce n'est pas vous qui m'avez choisi, c'est moi qui vous ai choisis. »
            </p>
            <p style={{ color: 'var(--color-primary)', fontSize: '0.7rem', marginTop: '0.25rem', letterSpacing: '0.06em' }}>Jean 15:16</p>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ── Sous-composants ────────────────────────────────────────────────────── */
function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
        {label}
        {required && <span style={{ color: '#DC2626' }}> *</span>}
        {hint && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> ({hint})</span>}
      </label>
      {children}
      {error && (
        <p style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  )
}
