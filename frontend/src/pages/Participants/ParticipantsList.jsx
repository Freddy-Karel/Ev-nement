import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { UserPlus, Download, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'
import Loader from '../../components/common/Loader'
import ParticipantsTable from '../../components/participants/ParticipantsTable'
import InviteForm from '../../components/participants/InviteForm'
import InvitationPreview from '../../components/participants/InvitationPreview'
import eventsApi from '../../api/events'
import participantsApi from '../../api/participants'
import { exportParticipantsCsv } from '../../utils/exportUtils'

const TABS = [
  { key: 'invited',   label: 'Invités' },
  { key: 'pending',   label: 'En attente' },
  { key: 'confirmed', label: 'Confirmés' },
]

export default function ParticipantsList() {
  const { eventId: id } = useParams()

  const [event,      setEvent]      = useState(null)
  const [invited,    setInvited]    = useState([])
  const [pending,    setPending]    = useState([])
  const [confirmed,  setConfirmed]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('invited')
  const [search,     setSearch]     = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [loadingIds,    setLoadingIds]    = useState(new Set())
  const [exporting,     setExporting]     = useState(false)
  const [previewData,   setPreviewData]   = useState(null)   // InvitationResponse pour la preview

  // ── Chargement initial ───────────────────────────────────────
  const reload = async () => {
    try {
      const [ev, inv, pen, con] = await Promise.all([
        eventsApi.getById(id),
        participantsApi.getInvited(id),
        participantsApi.getPending(id),
        participantsApi.getConfirmed(id),
      ])
      setEvent(ev)
      setInvited(inv)
      setPending(pen)
      setConfirmed(con)
    } catch {
      toast.error('Impossible de charger les participants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [id])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Données de l'onglet courant ──────────────────────────────
  const currentRows = { invited, pending, confirmed }[tab] ?? []

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return currentRows
    return currentRows.filter(
      (p) =>
        p.firstName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q),
    )
  }, [currentRows, search])

  // ── Actions ──────────────────────────────────────────────────
  const setLoading1 = (id, on) =>
    setLoadingIds((prev) => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })

  const handleValidate = async (p) => {
    setLoading1(p.id, true)
    try {
      await participantsApi.validate(p.id)
      toast.success(`${p.firstName} confirmé(e) !`)
      await reload()
    } catch {
      toast.error('Erreur lors de la validation')
    } finally {
      setLoading1(p.id, false)
    }
  }

  const handleReject = async (p) => {
    setLoading1(p.id, true)
    try {
      await participantsApi.reject(p.id)
      toast.success(`${p.firstName} refusé(e).`)
      await reload()
    } catch {
      toast.error('Erreur lors du refus')
    } finally {
      setLoading1(p.id, false)
    }
  }

  const handleResend = async (p) => {
    setLoading1(p.id, true)
    try {
      const invitation = await participantsApi.resend(p.id)
      toast.success(`Invitation renvoyée à ${p.email}`)
      setPreviewData(invitation)   // ouvre la preview avec les données fraîches
    } catch {
      toast.error('Erreur lors du renvoi')
    } finally {
      setLoading1(p.id, false)
    }
  }

  // Bouton "Carte" : même flux que "Renvoyer" — récupère l'invitation et ouvre la preview
  const handleViewCard = async (p) => {
    setLoading1(p.id, true)
    try {
      const invitation = await participantsApi.getInvitationCard(p.id)
      setPreviewData(invitation)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible d\'afficher la carte')
    } finally {
      setLoading1(p.id, false)
    }
  }

  const handleInviteSuccess = (invitation) => {
    toast.success(`${invitation.firstName} invité(e) avec succès !`)
    setTab('invited')
    reload()
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const all = await participantsApi.getExport(id)
      exportParticipantsCsv(all, event?.title, id)
    } catch {
      toast.error('Erreur lors de l\'export')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (p) => {
    setLoading1(p.id, true)
    try {
      await participantsApi.delete(p.id)
      toast.success(`${p.firstName} supprimé(e).`)
      await reload()
    } catch {
      toast.error('Erreur lors de la suppression')
    } finally {
      setLoading1(p.id, false)
    }
  }

  // ── Rendu ────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader size="lg" />
        </div>
      </AdminLayout>
    )
  }

  const counts = {
    invited:   invited.length,
    pending:   pending.length,
    confirmed: confirmed.length,
  }

  return (
    <AdminLayout>
      <div className="animate-fadeIn">

        {/* ── En-tête ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
              <Link to="/admin/events" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Événements</Link>
              {' / '}
              <Link to={`/admin/events/${id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                {event?.title}
              </Link>
              {' / '}Participants
            </p>
            <h1 style={pageTitle}>Participants</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={14} /> {exporting ? 'Export…' : 'Exporter CSV'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Inviter
            </button>
          </div>
        </div>

        <div className="divider-gold" style={{ marginBottom: '1.5rem' }} />

        {/* ── Onglets ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-btn${tab === t.key ? ' active' : ''}`}
              onClick={() => { setTab(t.key); setSearch('') }}
            >
              {t.label}
              <span style={{
                marginLeft  : '0.4rem',
                padding     : '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize    : '0.7rem',
                fontWeight  : 600,
                background  : tab === t.key ? 'var(--color-primary-subtle)' : 'var(--color-surface-3)',
                color       : tab === t.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Recherche ────────────────────────────────────────── */}
        <div style={{ position: 'relative', maxWidth: '360px', marginBottom: '1.25rem' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* ── Tableau ──────────────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <ParticipantsTable
            tab={tab}
            rows={filteredRows}
            onValidate={handleValidate}
            onReject={handleReject}
            onResend={handleResend}
            onViewCard={handleViewCard}
            onDelete={handleDelete}
            loadingIds={loadingIds}
          />
        </div>

      </div>

      {/* ── Modal d'invitation ───────────────────────────────── */}
      <InviteForm
        open={showInvite}
        onClose={() => setShowInvite(false)}
        eventId={id}
        onSuccess={handleInviteSuccess}
      />

      {/* ── Preview carte (Renvoyer / Voir carte) ────────────── */}
      <InvitationPreview
        open={!!previewData}
        onClose={() => { setPreviewData(null); reload() }}
        invitation={previewData}
      />

    </AdminLayout>
  )
}

const pageTitle = { fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.75rem', color: 'var(--color-text-primary)', margin: 0 }
