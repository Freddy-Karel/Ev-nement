import { Plus, Trash2, Ticket } from 'lucide-react'

/** Icônes suggérées pour les types de billets */
const ICON_PRESETS = ['🎟️', '⭐', '👑', '💎', '🌟', '🎫', '🏅', '🥇']

/** Couleurs d'accent par défaut selon le nom du type */
const DEFAULT_COLORS = {
  STANDARD : '#5582C8',
  VIP      : '#D4AF37',
  VVIP     : '#9B59B6',
  PREMIUM  : '#E67E22',
  GOLD     : '#F1C40F',
  PLATINUM : '#BDC3C7',
}

function emptyType() {
  return {
    name        : '',
    price       : '',
    accentColor : '#7B2D8B',
    description : '',
    icon        : '🎟️',
    bannerUrl   : '',
  }
}

/**
 * Gestionnaire de types de billets pour le formulaire événement.
 *
 * Props :
 *   ticketTypes  {Array}    — état courant du parent
 *   onChange     {Function} — rappelée avec le nouveau tableau
 *   disabled     {boolean}  — désactive tous les champs
 */
export default function TicketTypesManager({ ticketTypes = [], onChange, disabled }) {

  const add = () => onChange([...ticketTypes, emptyType()])

  const remove = (i) => onChange(ticketTypes.filter((_, idx) => idx !== i))

  const update = (i, field, value) => {
    const updated = ticketTypes.map((t, idx) => idx === i ? { ...t, [field]: value } : t)
    onChange(updated)
  }

  /** Applique la couleur par défaut quand le nom change et que la couleur est encore la valeur initiale */
  const handleNameChange = (i, value) => {
    const upper = value.toUpperCase()
    const type  = ticketTypes[i]
    const autoColor = DEFAULT_COLORS[upper]
    if (autoColor && (type.accentColor === '#7B2D8B' || !type.accentColor)) {
      onChange(ticketTypes.map((t, idx) =>
        idx === i ? { ...t, name: value, accentColor: autoColor } : t
      ))
    } else {
      update(i, 'name', value)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {ticketTypes.length === 0 && (
        <div style={emptyState}>
          <Ticket size={28} color="var(--color-text-muted)" />
          <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Aucun type configuré — les types STANDARD / VIP / VVIP seront utilisés par défaut.
          </p>
        </div>
      )}

      {ticketTypes.map((type, i) => (
        <div key={i} style={typeCard}>

          {/* Barre colorée gauche */}
          <div style={{ ...colorBar, background: type.accentColor || '#7B2D8B' }} />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Ligne 1 : Icône · Nom · Prix · Couleur */}
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 140px 52px', gap: '0.75rem', alignItems: 'end' }}>

              {/* Icône */}
              <div>
                <label style={labelStyle}>Icône</label>
                <select
                  value={type.icon}
                  onChange={(e) => update(i, 'icon', e.target.value)}
                  disabled={disabled}
                  style={{ ...selectStyle, fontSize: '1.2rem', textAlign: 'center' }}
                >
                  {ICON_PRESETS.map((ic) => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>

              {/* Nom */}
              <div>
                <label style={labelStyle}>Nom du type *</label>
                <input
                  className="input"
                  placeholder="Ex : VIP, PREMIUM, GOLD…"
                  value={type.name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  disabled={disabled}
                />
              </div>

              {/* Prix */}
              <div>
                <label style={labelStyle}>Prix (F CFA)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="25000"
                  min={0}
                  value={type.price}
                  onChange={(e) => update(i, 'price', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  disabled={disabled}
                />
              </div>

              {/* Couleur accent */}
              <div>
                <label style={labelStyle}>Couleur</label>
                <input
                  type="color"
                  value={type.accentColor || '#7B2D8B'}
                  onChange={(e) => update(i, 'accentColor', e.target.value)}
                  disabled={disabled}
                  style={colorInput}
                  title="Couleur d'accent (QR, badge, stub…)"
                />
              </div>
            </div>

            {/* Ligne 2 : Description */}
            <div>
              <label style={labelStyle}>Description (optionnel)</label>
              <input
                className="input"
                placeholder="Ex : Accès prioritaire + goodies offerts"
                value={type.description}
                onChange={(e) => update(i, 'description', e.target.value)}
                disabled={disabled}
              />
            </div>

          </div>

          {/* Bouton supprimer */}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => remove(i)}
            disabled={disabled}
            style={{ color: '#E53E3E', alignSelf: 'flex-start', marginTop: '2px' }}
            title="Supprimer ce type"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={add}
        disabled={disabled}
        style={{ alignSelf: 'flex-start' }}
      >
        <Plus size={14} /> Ajouter un type de billet
      </button>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────── */
const typeCard = {
  display        : 'flex',
  gap            : '0.875rem',
  alignItems     : 'flex-start',
  background     : 'var(--color-surface-2)',
  borderRadius   : '12px',
  padding        : '1rem',
  border         : '1px solid var(--color-border)',
  position       : 'relative',
  overflow       : 'hidden',
}

const colorBar = {
  width        : '4px',
  borderRadius : '2px',
  alignSelf    : 'stretch',
  flexShrink   : 0,
}

const emptyState = {
  display        : 'flex',
  flexDirection  : 'column',
  alignItems     : 'center',
  padding        : '1.5rem',
  background     : 'var(--color-surface-2)',
  borderRadius   : '10px',
  border         : '1px dashed var(--color-border)',
  textAlign      : 'center',
}

const labelStyle = {
  display      : 'block',
  fontSize     : '0.75rem',
  fontWeight   : 600,
  color        : 'var(--color-text-muted)',
  marginBottom : '0.375rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const selectStyle = {
  width      : '100%',
  background : 'var(--color-surface-3)',
  border     : '1px solid var(--color-border)',
  borderRadius: '8px',
  color      : 'var(--color-text-primary)',
  padding    : '0.5rem',
  cursor     : 'pointer',
}

const colorInput = {
  width        : '44px',
  height       : '38px',
  padding      : '2px',
  border       : '1px solid var(--color-border)',
  borderRadius : '8px',
  background   : 'var(--color-surface-3)',
  cursor       : 'pointer',
}
