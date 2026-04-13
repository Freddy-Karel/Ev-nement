import { useState, useEffect } from 'react'
import { Upload, Check, AlertCircle, User as UserIcon, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import ambassadorApi from '../../api/ambassador'
import authApi from '../../api/auth'
import { useAuth } from '../../context/AuthContext'
import AmbassadorLayout, { AvatarImg } from '../../components/layout/AmbassadorLayout'

export default function AmbassadorProfile() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  
  const [avatarBase64, setAvatarBase64] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Password state
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [isSubmittingPwd, setIsSubmittingPwd] = useState(false)

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    if (pwdForm.newPassword.length < 6) {
      toast.error('Le nouveau mot de passe doit faire au moins 6 caractères.')
      return
    }
    
    setIsSubmittingPwd(true)
    try {
      await authApi.changePassword(pwdForm.oldPassword, pwdForm.newPassword)
      toast.success('Mot de passe modifié avec succès !')
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la modification.')
    } finally {
      setIsSubmittingPwd(false)
    }
  }

  // On récupère stats juste pour avoir l'avatar actuel + display name s'il a changé
  useEffect(() => {
    ambassadorApi.getStats().then((data) => setStats(data))
  }, [])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Merci de choisir une image valide.')
      return
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast.error('L\'image est trop volumineuse (max 2MB).')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target.result
      setAvatarBase64(base64)
      
      setIsUploading(true)
      try {
        await ambassadorApi.updateAvatar(base64)
        toast.success("Photo de profil mise à jour !")
        // Refresh stats pour sync
        const newStats = await ambassadorApi.getStats()
        setStats(newStats)
      } catch (err) {
        toast.error("Erreur lors de la mise à jour.")
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const currentAvatar = avatarBase64 || stats?.avatarUrl
  const displayName = stats?.displayName || user?.firstName

  return (
    <AmbassadorLayout stats={stats}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
            Mon Profil
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Gère tes informations personnelles.
          </p>
        </div>

        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '2.5rem', boxShadow: 'var(--shadow-sm)' }}>
          
          {/* Avatar Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <AvatarImg src={currentAvatar} name={displayName} size={100} />
              <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--color-primary)', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', border: '2px solid var(--color-surface-2)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {isUploading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> : <Upload size={14} strokeWidth={3} />}
                <input type="file" id="avatar-upload" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} disabled={isUploading} />
              </label>
            </div>
            
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{displayName}</h2>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', background: 'var(--color-primary-subtle)', padding: '0.2rem 0.6rem', borderRadius: 99 }}>
                {stats?.rank || 'Chargement...'}
              </span>
            </div>
          </div>

          {/* Info Section (Read-only for demo) */}
           <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '1.5rem' }}>
             <div>
               <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Prénom</label>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: 10, color: 'var(--color-text-primary)' }}>
                 <UserIcon size={16} color="var(--color-text-muted)"/> {stats?.firstName || user?.firstName}
               </div>
             </div>

             <div>
               <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Nom</label>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: 10, color: 'var(--color-text-primary)' }}>
                 <UserIcon size={16} color="var(--color-text-muted)"/> {stats?.lastName || '...'}
               </div>
             </div>

             <div style={{ gridColumn: '1 / -1' }}>
               <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Adresse Email</label>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', padding: '0.75rem', borderRadius: 10, color: 'var(--color-text-primary)' }}>
                 <Mail size={16} color="var(--color-text-muted)"/> {stats?.email || user?.email}
               </div>
               <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>L'adresse email ne peut pas être modifiée.</p>
             </div>
          </div>

        </div>

        {/* Password Change Section */}
        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '2.5rem', boxShadow: 'var(--shadow-sm)', marginTop: '2rem' }}>
          
          <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Sécurité et Mot de passe</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', margin: 0 }}>
              Mets à jour ton mot de passe pour sécuriser ton compte ambassadeur.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 400 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Ancien mot de passe</label>
              <input
                type="password"
                className="input"
                value={pwdForm.oldPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                disabled={isSubmittingPwd}
                placeholder="••••••••"
                required
                style={{ width: '100%', background: 'var(--color-surface-3)' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Nouveau mot de passe</label>
              <input
                type="password"
                className="input"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                disabled={isSubmittingPwd}
                placeholder="6 caractères minimum"
                minLength={6}
                required
                style={{ width: '100%', background: 'var(--color-surface-3)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="input"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                disabled={isSubmittingPwd}
                placeholder="Répète le mot de passe"
                minLength={6}
                required
                style={{ width: '100%', background: 'var(--color-surface-3)' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmittingPwd}
              style={{ padding: '0.75rem 1.5rem', marginTop: '0.5rem', width: 'fit-content' }}
            >
              {isSubmittingPwd ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>

        </div>
      </div>
    </AmbassadorLayout>
  )
}
