import { Mail, Check, X, RefreshCw, Trash2 } from 'lucide-react'

/**
 * Tableau réutilisable de participants.
 *
 * @param {'invited'|'pending'|'confirmed'} tab     - onglet actif
 * @param {Object[]}                         rows    - liste filtrée
 * @param {Function}                         onValidate  (participant) => void
 * @param {Function}                         onReject    (participant) => void
 * @param {Function}                         onResend    (participant) => void
 * @param {Function}                         onViewCard  (participant) => void
 * @param {Function}                         onDelete    (participant) => void
 * @param {Set<number>}                      loadingIds  - ids en cours d'action
 */
export default function ParticipantsTable({
  tab,
  rows,
  onValidate,
  onReject,
  onResend,
  onViewCard,
  onDelete,
  loadingIds = new Set(),
}) {
  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        Aucun participant dans cette catégorie.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table-dark" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <Th>Prénom</Th>
            <Th>Email</Th>
            <Th>Téléphone</Th>
            <Th>Date</Th>
            <Th style={{ textAlign: 'right' }}>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <Td>
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{p.firstName}</span>
              </Td>
              <Td style={{ color: 'var(--color-text-secondary)' }}>{p.email}</Td>
              <Td style={{ color: 'var(--color-text-muted)' }}>{p.phone || '—'}</Td>
              <Td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                {formatShortDate(tab === 'confirmed' ? p.confirmedAt : p.createdAt)}
              </Td>
              <Td style={{ textAlign: 'right' }}>
                <ActionCell
                  tab={tab}
                  participant={p}
                  loading={loadingIds.has(p.id)}
                  onValidate={onValidate}
                  onReject={onReject}
                  onResend={onResend}
                  onViewCard={onViewCard}
                  onDelete={onDelete}
                />
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Cellule d'actions selon l'onglet ─────────────────────────── */
function ActionCell({ tab, participant, loading, onValidate, onReject, onResend, onViewCard, onDelete }) {
  if (loading) {
    return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>…</span>
  }

  if (tab === 'pending') {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-success btn-sm"
          onClick={() => onValidate(participant)}
          title="Valider"
        >
          <Check size={13} /> Valider
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onReject(participant)}
          title="Refuser"
        >
          <X size={13} /> Refuser
        </button>
        <DeleteButton participant={participant} onDelete={onDelete} />
      </div>
    )
  }

  if (tab === 'invited') {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onViewCard(participant)}
          title="Voir la carte"
        >
          <Mail size={13} /> Carte
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onResend(participant)}
          title="Renvoyer l'invitation"
        >
          <RefreshCw size={13} /> Renvoyer
        </button>
        <DeleteButton participant={participant} onDelete={onDelete} />
      </div>
    )
  }

  // confirmed
  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
      {participant.invitedByAdmin && participant.token ? (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onViewCard(participant)}
          title="Voir la carte"
        >
          <Mail size={13} /> Carte
        </button>
      ) : (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Pas de carte</span>
      )}
      <DeleteButton participant={participant} onDelete={onDelete} />
    </div>
  )
}

/* ── Bouton Supprimer commun ──────────────────────────────────── */
function DeleteButton({ participant, onDelete }) {
  if (!onDelete) return null
  return (
    <button
      className="btn btn-danger btn-sm"
      onClick={() => {
        if (window.confirm(`Supprimer définitivement ${participant.firstName} (${participant.email}) ?`)) {
          onDelete(participant)
        }
      }}
      title="Supprimer ce participant"
      style={{ padding: '0.3rem 0.5rem' }}
    >
      <Trash2 size={13} />
    </button>
  )
}

/* ── Helpers ──────────────────────────────────────────────────── */
function Th({ children, style }) {
  return (
    <th style={{
      padding: '0.625rem 1rem',
      color: 'var(--color-text-muted)',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      textAlign: 'left',
      ...style,
    }}>
      {children}
    </th>
  )
}

function Td({ children, style }) {
  return (
    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', ...style }}>
      {children}
    </td>
  )
}

function formatShortDate(d) {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(d))
  } catch {
    return d
  }
}
