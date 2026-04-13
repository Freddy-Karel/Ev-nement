import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Upload, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ambassadorApi from '../../api/ambassador'
import { useAuth } from '../../context/AuthContext'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import logo from '../../Logo/Logo.jpeg'

export default function AmbassadorOnboarding() {
  const navigate = useNavigate()
  const { user, markOnboardingComplete } = useAuth()
  
  const [step, setStep] = useState(1) // 1: Pseudo, 2: Avatar
  const [displayName, setDisplayName] = useState(user?.firstName ? `${user.firstName.toLowerCase()}.${Math.floor(Math.random() * 1000)}` : '')
  const [avatarBase64, setAvatarBase64] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ── Step 1: Pseudo
  const handlePseudoSubmit = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Choisis un pseudo pour continuer.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await ambassadorApi.onboard({ displayName: displayName.trim() })
      toast.success('Pseudo enregistré !')
      setStep(2)
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.message?.includes('déjà utilisé')) {
        setError('Ce pseudo est déjà pris. Essaie un autre.')
      } else {
        setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: Avatar
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Merci de choisir une image valide.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB max
      toast.error('L\'image est trop volumineuse (max 2MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => setAvatarBase64(event.target.result)
    reader.readAsDataURL(file)
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      if (avatarBase64) {
        await ambassadorApi.updateAvatar(avatarBase64)
      }
      // Marquer complet côté client (l'API l'a déjà fait côté serveur à l'étape 1)
      markOnboardingComplete()
      toast.success('Bienvenue dans ton espace ambassadeur !')
      navigate('/ambassador', { replace: true })
    } catch (err) {
      toast.error('Erreur lors de la finalisation.')
    } finally {
      setLoading(false)
    }
  }

  // ── UI
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-surface)',
      color: 'var(--color-text-primary)',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background 350ms ease',
    }}>
      {/* Header compact */}
      <header style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', background: 'var(--header-bg)', backdropFilter: 'blur(12px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
            border: '2px solid rgba(123,45,139,0.25)',
            background: '#F3E8F5',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(123,45,139,0.15)',
          }}>
            <img src={logo} alt="Femmes Royales" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Poppins' }}>Espace Ambassadeur</span>
        </div>
        <ThemeSwitcher />
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid var(--color-border)' }}>
              <User size={24} color="var(--color-primary)" />
            </div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Finalisons ton profil
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {step === 1 ? 'Comment souhaites-tu apparaître sur le classement ?' : 'Une photo rendra ton profil plus authentique.'}
            </p>
          </div>

          <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
            {/* Step 1: Pseudo */}
            {step === 1 && (
              <form onSubmit={handlePseudoSubmit} noValidate>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(220,38,38,0.1)', color: '#DC2626', borderRadius: 8, fontSize: '0.8125rem', marginBottom: '1rem' }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                  Ton pseudo
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="ex: jean.dupont77"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  autoFocus
                  style={{ width: '100%', marginBottom: '1.5rem' }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !displayName.trim()}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
                >
                  {loading ? 'Vérification...' : 'Continuer'}
                </button>
              </form>
            )}

            {/* Step 2: Avatar */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ position: 'relative' }}>
                    {avatarBase64 ? (
                      <img src={avatarBase64} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }} />
                    ) : (
                      <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-surface-3), var(--color-border))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px dashed var(--color-border)' }}>
                        <Upload size={28} color="var(--color-text-muted)" />
                      </div>
                    )}
                  </div>
                  
                  <div style={{ width: '100%' }}>
                    <input type="file" id="avatar-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    <label htmlFor="avatar-upload" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                      <Upload size={16} /> {avatarBase64 ? 'Changer de photo' : 'Choisir une photo'}
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleFinish}
                    disabled={loading}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Passer
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleFinish}
                    disabled={loading || !avatarBase64}
                    style={{ flex: 2, justifyContent: 'center' }}
                  >
                    {loading ? 'Chargement...' : <><Check size={16} /> Terminer</>}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
             <div style={{ width: 24, height: 4, borderRadius: 2, background: step === 1 ? 'var(--color-primary)' : 'var(--color-border)', transition: 'background 300ms' }} />
             <div style={{ width: 24, height: 4, borderRadius: 2, background: step === 2 ? 'var(--color-primary)' : 'var(--color-border)', transition: 'background 300ms' }} />
          </div>

        </div>
      </main>
    </div>
  )
}
