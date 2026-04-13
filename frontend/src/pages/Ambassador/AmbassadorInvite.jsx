import { useEffect, useState } from 'react'
import { Copy, Share2, Check, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import ambassadorApi from '../../api/ambassador'
import AmbassadorLayout from '../../components/layout/AmbassadorLayout'
import Loader from '../../components/common/Loader'

export default function AmbassadorInvite() {
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    ambassadorApi.generateInviteLink()
      .then((res) => {
        try {
          // Rend le lien dynamique pour ignorer l'IP obsolète du backend
          const urlObj = new URL(res.inviteLink)
          const dynamicUrl = window.location.origin + urlObj.pathname + urlObj.search
          setInviteLink(dynamicUrl)
        } catch (e) {
          setInviteLink(res.inviteLink)
        }
      })
      .catch(() => toast.error('Erreur lors de la génération du lien.'))
      .finally(() => setLoading(false))
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    toast.success('Lien copié dans le presse-papier !', {
      icon: '📋'
    })
    setTimeout(() => setCopied(false), 3000)
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins le mouvement Ambassadeur FEMMES ROYALES',
          text: 'Inscris-toi via mon lien et participe aux événements FEMMES ROYALES !',
          url: inviteLink,
        })
        toast.success('Lien partagé avec succès !')
      } catch (err) {
        if (err.name !== 'AbortError') {
           console.error("Erreur de partage:", err)
        }
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <AmbassadorLayout>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '1px solid var(--color-border)', boxShadow: '0 0 30px rgba(123,45,139,0.15)' }}>
            <Share2 size={32} color="var(--color-primary)" />
          </div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
            Inviter ton réseau
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
            Partage ce lien avec tes amis et cumule des points à chaque nouvelle inscription confirmée.
          </p>
        </div>

        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 24, padding: '3rem 2rem', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Ton lien unique de parrainage</h2>
          
          {loading ? (
            <div style={{ padding: '2rem' }}><Loader /></div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.5rem', borderRadius: 16, alignItems: 'center' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={inviteLink} 
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-text-primary)', padding: '0.5rem 1rem', fontSize: '0.95rem', outline: 'none' }} 
                />
                <button 
                  onClick={copyToClipboard}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.25rem', gap: '0.5rem' }}
                >
                  {copied ? <Check size={18} color="#10B981" /> : <Copy size={18} />} 
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button onClick={shareLink} className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', gap: '0.75rem' }}>
                  <Users size={20} />
                  Partager via WhatsApp / Réseaux sociaux
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎁</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>10 Points par filleul</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Chaque ami qui s'inscrit te rapporte des points bonus.</p>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📈</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Monter en grade</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Passe du rang Recrue à Légende en mobilisant un maximum de personnes.</p>
            </div>
             <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🙌</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Impact collectif</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Contribue à la croissance de notre communauté et de nos événements.</p>
            </div>
          </div>

        </div>
      </div>
    </AmbassadorLayout>
  )
}
