import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Pencil, Trash2, Users, Calendar, MapPin,
  Copy, Check, ExternalLink, ArrowLeft, BarChart2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/common/Modal'
import Loader from '../../components/common/Loader'
import ProgramDisplay from '../../components/common/ProgramDisplay'
import eventsApi from '../../api/events'
import participantsApi from '../../api/participants'
import { formatEventDateRange, formatDateTime } from '../../utils/dateUtils'
import { useEvents } from '../../hooks/useEvents'

export default function EventDetail() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const { deleteEvent } = useEvents(false)

  const [event,      setEvent]      = useState(null)
  const [stats,      setStats]      = useState({ invited: 0, pending: 0, confirmed: 0 })
  const [loading,    setLoading]    = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [copied,     setCopied]     = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [ev, invited, pending, confirmed] = await Promise.all([
          eventsApi.getById(id),
          participantsApi.getInvited(id),
          participantsApi.getPending(id),
          participantsApi.getConfirmed(id),
        ])
        setEvent(ev)
        setStats({ invited: invited.length, pending: pending.length, confirmed: confirmed.length })
      } catch {
        toast.error('Événement introuvable')
        navigate('/admin/events')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleDelete = async () => {
    setDeleting(true)
    await deleteEvent(id)
    setDeleting(false)
    navigate('/admin/events')
  }

  const publicUrl = `${window.location.origin}/events/${id}`
  const copyLink  = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader size="lg" />
        </div>
      </AdminLayout>
    )
  }

  const total     = stats.invited + stats.pending + stats.confirmed
  const pctBar    = { invited: t(stats.invited, total), pending: t(stats.pending, total), confirmed: t(stats.confirmed, total) }
  const dateRange = formatEventDateRange(event.startDate, event.endDate)

  return (
    <AdminLayout>
      <div className="animate-fadeIn">

        {/* ── Breadcrumb + actions ──────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Link to="/admin/events" style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ArrowLeft size={12} /> Événements
              </Link>
              <span style={{ opacity: 0.4 }}>/</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>{event.title}</span>
            </p>
            <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>
              {event.title}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', flexShrink: 0 }}>
            <Link to={`/admin/events/${id}/edit`} className="btn btn-secondary btn-sm">
              <Pencil size={14} /> Modifier
            </Link>
            <Link to={`/admin/events/${id}/participants`} className="btn btn-primary btn-sm">
              <Users size={14} /> Participants
            </Link>
            <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="divider-gold" style={{ marginBottom: '1.75rem' }} />

        {/* ── Bannière ─────────────────────────────────────────── */}
        {event.bannerUrl && (
          <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)', maxHeight: '260px', marginBottom: '1.5rem', position: 'relative' }}>
            <img src={event.bannerUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', maxHeight: '260px' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)', pointerEvents: 'none' }} />
          </div>
        )}

        {/* ── Statistiques 4 tuiles ────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatTile value={total}           label="Total"      color="#7B2D8B" bg="rgba(123,45,139,0.1)" />
          <StatTile value={stats.invited}   label="Invités"    color="#3B82F6" bg="rgba(59,130,246,0.1)" />
          <StatTile value={stats.pending}   label="En attente" color="#F59E0B" bg="rgba(245,158,11,0.1)" />
          <StatTile value={stats.confirmed} label="Confirmés"  color="#10B981" bg="rgba(16,185,129,0.1)" />
        </div>

        {/* Barre répartition */}
        {total > 0 && (
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', height: '7px', borderRadius: '999px', overflow: 'hidden', gap: '2px' }}>
              {pctBar.invited   > 0 && <div style={{ width: pctBar.invited   + '%', background: '#3B82F6', borderRadius: '999px' }} />}
              {pctBar.pending   > 0 && <div style={{ width: pctBar.pending   + '%', background: '#F59E0B', borderRadius: '999px' }} />}
              {pctBar.confirmed > 0 && <div style={{ width: pctBar.confirmed + '%', background: '#10B981', borderRadius: '999px' }} />}
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.625rem', flexWrap: 'wrap' }}>
              <Legend color="#3B82F6" label="Invités"    count={stats.invited} />
              <Legend color="#F59E0B" label="En attente" count={stats.pending} />
              <Legend color="#10B981" label="Confirmés"  count={stats.confirmed} />
            </div>
          </div>
        )}

        {/* ── Grille principale ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>

          {/* ── Colonne principale ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Informations */}
            <div className="card">
              <SectionHead icon={<Calendar size={15} color="var(--color-primary)" />} title="Informations" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <InfoRow label="Dates"  value={dateRange} />
                <InfoRow label="Début"  value={formatDateTime(event.startDate)} />
                <InfoRow label="Fin"    value={formatDateTime(event.endDate)} />
                {event.location && <InfoRow label="Lieu" value={event.location} icon={<MapPin size={13} color="var(--color-primary)" />} />}
              </div>
              {event.description && (
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7, margin: 0 }}>{event.description}</p>
                </div>
              )}
            </div>

            {/* Programme */}
            <div className="card">
              <SectionHead icon={<BarChart2 size={15} color="var(--color-primary)" />} title="Programme" />
              <div style={{ marginTop: '1rem' }}>
                <ProgramDisplay programme={event.programme} />
              </div>
            </div>

          </div>

          {/* ── Colonne latérale ───────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Actions rapides */}
            <div className="card card-gold">
              <SectionHead icon={<Users size={15} color="var(--color-primary)" />} title="Participants" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                <StatRow label="Invités"    value={stats.invited}   badge="badge-invited" />
                <StatRow label="En attente" value={stats.pending}   badge="badge-pending" />
                <StatRow label="Confirmés"  value={stats.confirmed} badge="badge-confirmed" />
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                  <StatRow label="Total" value={total} bold />
                </div>
              </div>
              <Link
                to={`/admin/events/${id}/participants`}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'center' }}
              >
                <Users size={15} /> Gérer les participants
              </Link>
            </div>

            {/* Lien public */}
            <div className="card">
              <SectionHead icon={<ExternalLink size={15} color="var(--color-primary)" />} title="Inscription publique" />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '0.625rem', marginBottom: '0.875rem', lineHeight: 1.55 }}>
                Partagez ce lien pour permettre les inscriptions publiques.
              </p>
              <div style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.625rem 0.875rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {publicUrl}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={copyLink}>
                  {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier</>}
                </button>
                <a href={publicUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* ── Modal suppression ─────────────────────────────────── */}
        <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Supprimer l'événement" maxWidth={420}>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.65 }}>
            Supprimer <strong style={{ color: 'var(--color-text-primary)' }}>« {event.title} »</strong> ?<br />
            <span style={{ color: '#DC2626', fontSize: '0.875rem' }}>⚠ Cette action est irréversible. Tous les participants seront également supprimés.</span>
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowDelete(false)} disabled={deleting}>Annuler</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </Modal>

      </div>
    </AdminLayout>
  )
}

/* ─── Sub-components ───────────────────────────────────────────── */
function t(val, total) { return total > 0 ? Math.round((val / total) * 100) : 0 }

function StatTile({ value, label, color, bg }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '11px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <BarChart2 size={18} color={color} />
      </div>
      <div>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1, margin: 0 }}>{value}</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{label}</p>
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

function SectionHead({ icon, title }) {
  return (
    <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon} {title}
    </h3>
  )
}

function InfoRow({ label, value, icon }) {
  return (
    <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
      {icon || <Calendar size={13} color="var(--color-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', minWidth: '42px', flexShrink: 0 }}>{label}</span>
        <span style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem', fontWeight: 500 }}>{value}</span>
      </div>
    </div>
  )
}

function StatRow({ label, value, badge, bold }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: bold ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontSize: '0.875rem', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span className={badge || ''} style={badge ? {} : { fontWeight: 800, color: 'var(--color-text-primary)', fontSize: '0.9375rem' }}>{value}</span>
    </div>
  )
}
