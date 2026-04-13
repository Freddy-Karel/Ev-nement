import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Clock, CheckCircle, Plus, ArrowRight, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../components/layout/AdminLayout'
import Loader from '../components/common/Loader'
import Avatar from '../components/common/Avatar'
import { useAuth } from '../hooks/useAuth'
import eventsApi from '../api/events'
import participantsApi from '../api/participants'
import { formatEventDateRange } from '../utils/dateUtils'

const REFRESH_INTERVAL = 30_000

export default function Dashboard() {
  const { user } = useAuth()

  const [events,       setEvents]       = useState([])
  const [stats,        setStats]        = useState({ total: 0, pending: 0, confirmed: 0, invited: 0 })
  const [lastConfirmed, setLastConfirmed] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [refreshing,   setRefreshing]   = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else         setRefreshing(true)

    try {
      const evts = await eventsApi.getAll()
      setEvents(evts)

      if (evts.length > 0) {
        const results = await Promise.allSettled(
          evts.map((e) => Promise.all([
            participantsApi.getPending(e.id),
            participantsApi.getConfirmed(e.id),
            participantsApi.getInvited(e.id),
          ]))
        )

        let pending = 0, confirmed = 0, invited = 0
        const allConfirmed = []

        results.forEach((r, i) => {
          if (r.status === 'fulfilled') {
            pending   += r.value[0].length
            confirmed += r.value[1].length
            invited   += r.value[2].length
            r.value[1].forEach((p) => allConfirmed.push({ ...p, _eventTitle: evts[i].title }))
          }
        })

        setStats({ total: pending + confirmed + invited, pending, confirmed, invited })

        const sorted = allConfirmed
          .filter((p) => p.confirmedAt)
          .sort((a, b) => new Date(b.confirmedAt) - new Date(a.confirmedAt))
          .slice(0, 5)
        setLastConfirmed(sorted)
      }
    } catch {
      toast.error('Impossible de charger les données')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const timer = setInterval(() => load(true), REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [load])

  const displayName    = user?.email?.split('@')[0] ?? 'Admin'
  const totalForBar    = Math.max(stats.total, 1)

  const upcomingEvents = [...events]
    .filter((e) => e.startDate && new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 3)

  return (
    <AdminLayout>
      <div className="animate-fadeIn">

        {/* ── En-tête page ─────────────────────────────────────── */}
        <div style={{
          display       : 'flex',
          alignItems    : 'flex-start',
          justifyContent: 'space-between',
          marginBottom  : '2rem',
          gap           : '1rem',
          flexWrap      : 'wrap',
        }}>
          <div>
            <h1 style={{
              fontFamily  : 'Poppins, sans-serif',
              fontSize    : 'clamp(1.375rem, 3vw, 1.75rem)',
              fontWeight  : 700,
              color       : 'var(--color-text-primary)',
              marginBottom: '0.25rem',
            }}>
              Bienvenue,{' '}
              <span style={{ color: 'var(--color-primary)' }}>
                {displayName}
              </span>
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Tableau de bord · FEMMES ROYALES
            </p>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={() => load(true)}
            disabled={refreshing}
            title="Rafraîchir les données"
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Actualisation…' : 'Actualiser'}
          </button>
        </div>

        {/* Séparateur couleur primaire */}
        <div className="divider-gold" style={{ marginBottom: '2rem' }} />

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader size="lg" />
          </div>
        ) : (
          <>
            {/* ── Statistiques (4 cartes) ──────────────────────── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}>
              <StatCard icon={Calendar}    label="Événements"  value={events.length}    color="#7B2D8B" />
              <StatCard icon={Users}       label="Participants" value={stats.total}      color="#3B82F6" />
              <StatCard icon={Clock}       label="En attente"  value={stats.pending}    color="#F59E0B" />
              <StatCard icon={CheckCircle} label="Confirmés"   value={stats.confirmed}  color="#10B981" />
            </div>

            {/* ── Barre de répartition ─────────────────────────── */}
            {stats.total > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
                <p style={{
                  color: 'var(--color-text-muted)', fontSize: '0.72rem',
                  fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: '0.875rem',
                }}>
                  Répartition des participants
                </p>
                <div style={{ display: 'flex', height: '8px', borderRadius: '999px', overflow: 'hidden', gap: '2px' }}>
                  {stats.invited   > 0 && <div style={{ width: `${(stats.invited   / totalForBar) * 100}%`, background: '#3B82F6', borderRadius: '999px', transition: 'width 0.5s ease' }} title={`Invités: ${stats.invited}`} />}
                  {stats.pending   > 0 && <div style={{ width: `${(stats.pending   / totalForBar) * 100}%`, background: '#F59E0B', borderRadius: '999px', transition: 'width 0.5s ease' }} title={`En attente: ${stats.pending}`} />}
                  {stats.confirmed > 0 && <div style={{ width: `${(stats.confirmed / totalForBar) * 100}%`, background: '#10B981', borderRadius: '999px', transition: 'width 0.5s ease' }} title={`Confirmés: ${stats.confirmed}`} />}
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <Legend color="#3B82F6" label="Invités"    count={stats.invited} />
                  <Legend color="#F59E0B" label="En attente" count={stats.pending} />
                  <Legend color="#10B981" label="Confirmés"  count={stats.confirmed} />
                </div>
              </div>
            )}

            {/* ── Grille inférieure 2 colonnes ─────────────────── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}>

              {/* ⬅ Prochains événements */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
                    {upcomingEvents.length > 0 ? 'Prochains événements' : 'Événements récents'}
                  </h2>
                  <Link to="/admin/events/new" className="btn btn-primary btn-sm">
                    <Plus size={14} /> Nouveau
                  </Link>
                </div>

                {events.length === 0 ? (
                  <EmptyState msg="Aucun événement créé" />
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {(upcomingEvents.length > 0 ? upcomingEvents : events.slice(0, 3)).map((ev) => (
                      <li key={ev.id}>
                        <Link
                          to={`/admin/events/${ev.id}`}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            gap: '0.5rem', padding: '0.625rem 0.75rem', borderRadius: '9px',
                            textDecoration: 'none', transition: 'background 150ms',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-subtle)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ minWidth: 0 }}>
                            <p style={{
                              fontWeight: 600, fontSize: '0.875rem',
                              color: 'var(--color-text-primary)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {ev.title}
                            </p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                              {ev.startDate
                                ? formatEventDateRange(ev.startDate, ev.endDate)
                                : ev.location || 'Lieu non défini'}
                            </p>
                          </div>
                          <ArrowRight size={14} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {events.length > 0 && (
                  <Link to="/admin/events" style={{
                    display: 'block', textAlign: 'center', marginTop: '1rem',
                    color: 'var(--color-primary)', fontSize: '0.85rem', textDecoration: 'none',
                    fontWeight: 500,
                  }}>
                    Voir tous les événements →
                  </Link>
                )}
              </div>

              {/* ➡ Colonne droite */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Derniers confirmés */}
                <div className="card">
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.875rem' }}>
                    Derniers confirmés
                  </h2>
                  {lastConfirmed.length === 0 ? (
                    <EmptyState msg="Aucun participant confirmé" />
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {lastConfirmed.map((p) => (
                        <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Avatar name={p.firstName || '?'} size="sm" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.firstName}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p._eventTitle}
                            </p>
                          </div>
                          <span style={{
                            fontSize: '0.65rem', padding: '0.15rem 0.5rem', borderRadius: '999px',
                            background: 'rgba(16,185,129,0.12)', color: '#10B981',
                            border: '1px solid rgba(16,185,129,0.3)', flexShrink: 0,
                            fontWeight: 600,
                          }}>
                            ✓ Confirmé
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actions rapides */}
                <div className="card">
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 1rem' }}>
                    Actions rapides
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <QuickAction to="/admin/events/new" icon={Plus}  label="Créer un événement"    desc="Ajouter un nouvel événement" />
                    {events.length > 0 && (
                      <QuickAction
                        to="/admin/events"
                        icon={Users}
                        label="Gérer les participants"
                        desc="Choisir un événement"
                      />
                    )}
                  </div>

                  {/* Citation */}
                  <div style={{
                    marginTop: '1.25rem', padding: '0.875rem 1rem',
                    background: 'var(--color-primary-subtle)',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                  }}>
                    <p className="bible-ref" style={{ fontSize: '0.8125rem', textAlign: 'center' }}>
                      « Choisie pour faire la différence »
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', textAlign: 'center', marginTop: '0.25rem' }}>
                      Jean 15:16
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}

/* ── Sous-composants ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{
        width: '46px', height: '46px', borderRadius: '12px',
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
          {value}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          {label}
        </p>
      </div>
    </div>
  )
}

function Legend({ color, label, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{label}</span>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 600 }}>{count}</span>
    </div>
  )
}

function QuickAction({ to, icon: Icon, label, desc }) {
  const [hov, setHov] = useState(false)
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.75rem', borderRadius: '10px',
        background: hov ? 'var(--color-primary-subtle)' : 'var(--color-surface-3)',
        border: `1px solid ${hov ? 'var(--color-primary)' : 'var(--color-border)'}`,
        textDecoration: 'none',
        transition: 'all 200ms ease',
      }}
    >
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: 'var(--color-primary-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={16} color="var(--color-primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </p>
        {desc && (
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {desc}
          </p>
        )}
      </div>
      <ArrowRight size={14} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
    </Link>
  )
}

function EmptyState({ msg }) {
  return (
    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0' }}>
      {msg}
    </p>
  )
}
