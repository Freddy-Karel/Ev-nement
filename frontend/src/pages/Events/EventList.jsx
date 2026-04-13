import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Calendar, MapPin, Users, Pencil, Trash2, Eye, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'
import Modal from '../../components/common/Modal'
import Loader from '../../components/common/Loader'
import { useEvents } from '../../hooks/useEvents'
import { formatEventDateRange } from '../../utils/dateUtils'

export default function EventList() {
  const navigate              = useNavigate()
  const { events, loading, deleteEvent } = useEvents()
  const [toDelete, setToDelete] = useState(null)   // événement ciblé par la suppression
  const [deleting, setDeleting] = useState(false)

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    await deleteEvent(toDelete.id)
    setDeleting(false)
    setToDelete(null)
  }

  return (
    <AdminLayout>
      <div className="animate-fadeIn">

        {/* ── En-tête page ───────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={pageTitle}>Événements</h1>
            <p style={pageSubtitle}>{events.length} événement{events.length !== 1 ? 's' : ''} enregistré{events.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/admin/events/new" className="btn btn-primary">
            <Plus size={16} /> Créer un événement
          </Link>
        </div>

        <div className="divider-gold" style={{ marginBottom: '2rem' }} />

        {/* ── Contenu ────────────────────────────────────────── */}
        {loading ? (
          <SkeletonGrid />
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <div style={grid}>
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => navigate(`/admin/events/${event.id}/edit`)}
                onDelete={() => setToDelete(event)}
                onView={() => navigate(`/admin/events/${event.id}`)}
              />
            ))}
          </div>
        )}

        {/* ── Modal de confirmation de suppression ───────────── */}
        <Modal
          open={!!toDelete}
          onClose={() => setToDelete(null)}
          title="Confirmer la suppression"
          maxWidth={420}
        >
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
            Vous êtes sur le point de supprimer :
          </p>
          <p style={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: '1.5rem' }}>
            « {toDelete?.title} »
          </p>
          <p style={{ color: '#DC2626', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            ⚠ Cette action est irréversible. Tous les participants liés seront également supprimés.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setToDelete(null)} disabled={deleting}>
              Annuler
            </button>
            <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </Modal>

      </div>
    </AdminLayout>
  )
}

/* ── Carte d'événement ─────────────────────────────────────────── */
function EventCard({ event, onView, onEdit, onDelete }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Bannière ou placeholder */}
      {event.bannerUrl ? (
        <div style={{ height: '160px', borderRadius: '12px', overflow: 'hidden', marginTop: '-0.25rem', position: 'relative', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
          <img
            src={event.bannerUrl}
            alt={event.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.9 }}
            onError={(e) => { e.target.parentElement.style.display = 'none' }}
          />
        </div>
      ) : (
        <div style={{ height: '80px', borderRadius: '8px', background: 'linear-gradient(135deg, #D4AF3715, #D4AF3705)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={28} color="#D4AF3750" />
        </div>
      )}

      {/* Titre */}
      <div>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {event.title}
        </h3>
        {event.description && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.375rem', lineHeight: 1.5,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {event.description}
          </p>
        )}
      </div>

      {/* Méta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <Meta icon={Calendar} text={formatEventDateRange(event.startDate, event.endDate)} />
        {event.location && <Meta icon={MapPin} text={event.location} />}
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={onView}>
          <Eye size={13} /> Voir
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onEdit}>
          <Pencil size={13} />
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          <Trash2 size={13} />
        </button>
      </div>

      {/* Lien participants */}
      <Link
        to={`/admin/events/${event.id}/participants`}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.5rem 0.625rem',
          background: 'var(--color-surface-3)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px', textDecoration: 'none', marginTop: '-0.25rem',
          transition: 'background 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-subtle)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-3)' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
          <Users size={13} /> Gérer les participants
        </span>
        <ChevronRight size={14} color="var(--color-primary)" />
      </Link>

    </div>
  )
}

/* ── Méta info (icône + texte) ───────────────────────────────────── */
function Meta({ icon: Icon, text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
      <Icon size={13} color="var(--color-primary)" /> {text}
    </span>
  )
}

/* ── État vide ───────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      <Calendar size={48} color="var(--color-border-strong)" style={{ margin: '0 auto 1.5rem' }} />
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
        Aucun événement
      </h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
        Commencez par créer votre premier événement.
      </p>
      <Link to="/admin/events/new" className="btn btn-primary">
        <Plus size={16} /> Créer un événement
      </Link>
    </div>
  )
}

/* ── Skeleton loader ─────────────────────────────────────────────── */
function SkeletonGrid() {
  return (
    <div style={grid}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton" style={{ height: '80px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '20px', borderRadius: '4px', width: '70%' }} />
          <div className="skeleton" style={{ height: '14px', borderRadius: '4px', width: '50%' }} />
          <div className="skeleton" style={{ height: '14px', borderRadius: '4px', width: '40%' }} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div className="skeleton" style={{ height: '32px', flex: 1, borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '32px', width: '36px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ height: '32px', width: '36px', borderRadius: '8px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Styles ──────────────────────────────────────────────────────── */
const pageTitle    = { fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.75rem', color: 'var(--color-text-primary)', margin: 0 }
const pageSubtitle = { color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }
const grid         = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }
