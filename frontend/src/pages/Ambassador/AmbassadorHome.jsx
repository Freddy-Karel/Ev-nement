import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Star, Trophy, ArrowRight, Share2, Calendar, Download, Loader2 } from 'lucide-react'
import ambassadorApi from '../../api/ambassador'
import AmbassadorLayout, { AvatarImg } from '../../components/layout/AmbassadorLayout'
import Loader from '../../components/common/Loader'
import InvitationPreview from '../../components/participants/InvitationPreview'
import toast from 'react-hot-toast'

export default function AmbassadorHome() {
  const [stats,       setStats]       = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [previewData, setPreviewData] = useState(null)   // carte à afficher
  const [loadingCard, setLoadingCard] = useState(null)   // participantId en cours de chargement

  useEffect(() => {
    ambassadorApi.getStats()
      .then(setStats)
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadCard = async (evt) => {
    if (!evt.participantId) {
      toast.error('Identifiant de participation introuvable.')
      return
    }
    setLoadingCard(evt.participantId)
    try {
      const card = await ambassadorApi.getMyCard(evt.participantId)
      setPreviewData(card)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Impossible de charger votre carte.')
    } finally {
      setLoadingCard(null)
    }
  }

  if (loading) {
    return (
      <AmbassadorLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader size="lg" />
        </div>
      </AmbassadorLayout>
    )
  }

  if (error || !stats) {
    return (
      <AmbassadorLayout>
        <div style={{ padding: '2rem', background: 'rgba(220,38,38,0.1)', color: '#DC2626', borderRadius: 12 }}>
          {error}
        </div>
      </AmbassadorLayout>
    )
  }

  const {
    invitationCount, points, rank,
    progressToNextRank, nextRankThreshold, currentRankThreshold,
    nextRankName, events, totalAmbassadors, totalParticipants
  } = stats

  const invitationsLeft = Math.max(0, nextRankThreshold - invitationCount)

  return (
    <AmbassadorLayout stats={stats}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Header */}
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
            Tableau de bord
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Aperçu de ton activité et de ton impact.
          </p>
        </div>

        {/* Mouvement Collectif */}
        <div style={{ background: 'linear-gradient(135deg, var(--color-primary-subtle), var(--color-surface-2))', border: '1px solid var(--color-primary)', borderRadius: 20, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 min-content' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Mouvement Collectif</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
              Déjà <strong style={{ color: 'var(--color-primary)' }}>{totalAmbassadors} ambassadeurs</strong> ont mobilisé{' '}
              <strong style={{ color: 'var(--color-primary)' }}>{totalParticipants} personnes</strong> pour les événements FEMMES ROYALES.
            </p>
          </div>
          <Link to="/ambassador/invite" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}>
            <Share2 size={16} /> Inviter maintenant
          </Link>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <KpiCard title="Invitations" value={invitationCount} icon={Users}  color="#10B981" />
          <KpiCard title="Points"      value={points}          icon={Star}   color="#D4AF37" />
          <KpiCard title="Rang Actuel" value={rank}            icon={Trophy} color="var(--color-primary)" />
        </div>

        {/* Progression */}
        <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>Progression vers le rang {nextRankName}</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: 0 }}>
                Encore {invitationsLeft} invitation{invitationsLeft !== 1 ? 's' : ''} pour passer au niveau supérieur.
              </p>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '1.25rem' }}>{progressToNextRank}%</div>
          </div>
          <div style={{ width: '100%', height: 12, background: 'var(--color-surface-3)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ width: `${progressToNextRank}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), #D4AF37)', borderRadius: 6, transition: 'width 1s ease-out' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            <span>{currentRankThreshold}</span>
            <span>{nextRankThreshold}</span>
          </div>
        </div>

        {/* Mes Inscriptions + bouton Carte */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Mes Inscriptions</h3>
            <Link to="/events" style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Voir tous les événements <ArrowRight size={14} />
            </Link>
          </div>

          {events && events.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {events.map((evt) => (
                <div key={evt.eventId} style={{
                  background   : 'var(--color-surface-2)',
                  border       : '1px solid var(--color-border)',
                  borderRadius : 16,
                  padding      : '1.25rem',
                  display      : 'flex',
                  alignItems   : 'center',
                  justifyContent: 'space-between',
                  gap          : '1rem',
                  flexWrap     : 'wrap',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>{evt.eventTitle}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      <Calendar size={14} /> {evt.eventDates}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {/* Badge statut */}
                    <span style={{
                      padding      : '0.25rem 0.75rem',
                      borderRadius : 999,
                      fontSize     : '0.75rem',
                      fontWeight   : 700,
                      background   : evt.status === 'CONFIRMED' ? 'rgba(16,185,129,0.12)' : 'var(--color-surface-3)',
                      color        : evt.status === 'CONFIRMED' ? '#10B981' : 'var(--color-text-secondary)',
                      border       : evt.status === 'CONFIRMED' ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--color-border)',
                    }}>
                      {evt.status === 'CONFIRMED' ? '✅ Confirmé' : evt.status === 'PENDING' ? '⏳ En attente' : 'Inscrit'}
                    </span>

                    {/* Bouton Carte — uniquement pour les CONFIRMED */}
                    {evt.status === 'CONFIRMED' && evt.participantId && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadCard(evt)}
                        disabled={loadingCard === evt.participantId}
                        title="Voir / télécharger ma carte"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                      >
                        {loadingCard === evt.participantId
                          ? <Loader2 size={14} className="spin" />
                          : <Download size={14} />
                        }
                        Ma carte
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 20 }}>
              <Calendar size={32} color="var(--color-text-muted)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Tu n'es inscrit à aucun événement pour le moment.
              </p>
              <Link to="/events" className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>Découvrir les événements</Link>
            </div>
          )}
        </div>

      </div>

      {/* Modal carte d'invitation / confirmation */}
      <InvitationPreview
        open={!!previewData}
        onClose={() => setPreviewData(null)}
        invitation={previewData}
      />
    </AmbassadorLayout>
  )
}

function KpiCard({ title, value, icon: Icon, color }) {
  return (
    <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
      <div>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</p>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{value}</p>
      </div>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={color} />
      </div>
    </div>
  )
}
