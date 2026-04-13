import { formatDate } from '../../utils/dateUtils'

/**
 * Affiche le programme d'un événement de façon lisible.
 * Entièrement thémable via variables CSS.
 *
 * Formats supportés :
 *   Nouveau  — { plenary: [{ date, startTime, endTime }],
 *               workshops: ["Leadership", ...],
 *               uniqueService: { enabled, date, time },
 *               speakers: [{ name, title, country }] }
 *   Ancien   — { plenary: [{ date, time: "17:30-21:30" }] }
 *   Générique — toute autre clé → liste de tags
 */
export default function ProgramDisplay({ programme }) {
  if (!programme || typeof programme !== 'object' || Object.keys(programme).length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Programme non renseigné</p>
  }

  const { plenary, workshops, uniqueService, speakers, ...rest } = programme

  const hasPlenary       = Array.isArray(plenary)   && plenary.length > 0
  const hasWorkshops     = Array.isArray(workshops)  && workshops.length > 0
  const hasUniqueService = uniqueService?.enabled    === true
  const hasSpeakers      = Array.isArray(speakers)   && speakers.length > 0
  const hasRest          = Object.keys(rest).length  > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Plénières ─────────────────────────────────────────── */}
      {hasPlenary && (
        <Block title="Plénières">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {plenary.map((session, idx) => <SessionRow key={idx} session={session} />)}
          </div>
        </Block>
      )}

      {/* ── Ateliers ──────────────────────────────────────────── */}
      {hasWorkshops && (
        <Block title="Ateliers">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {workshops.map((w, idx) => {
              const label = typeof w === 'string' ? w : (w?.name || '')
              return label ? <Tag key={idx} label={label} /> : null
            })}
          </div>
        </Block>
      )}

      {/* ── Culte unique ──────────────────────────────────────── */}
      {hasUniqueService && (
        <Block title="Culte unique">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {uniqueService.date && <Tag label={formatDate(uniqueService.date)} variant="blue" />}
            {uniqueService.time && <Tag label={uniqueService.time} variant="gold" />}
          </div>
        </Block>
      )}

      {/* ── Oratrices / Orateurs ──────────────────────────────── */}
      {hasSpeakers && (
        <Block title="Oratrices / Orateurs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {speakers.map((spk, idx) => <SpeakerRow key={idx} speaker={spk} />)}
          </div>
        </Block>
      )}

      {/* ── Clés non reconnues (rétrocompatibilité) ───────────── */}
      {hasRest && Object.entries(rest).map(([key, items]) => (
        <Block key={key} title={capitalize(key)}>
          <GenericSection items={items} />
        </Block>
      ))}

    </div>
  )
}

/* ── Ligne de session plénière ──────────────────────────────────── */
function SessionRow({ session }) {
  let timeDisplay = ''
  if (session.startTime || session.endTime) {
    timeDisplay = [session.startTime, session.endTime].filter(Boolean).join(' – ')
  } else if (typeof session.time === 'string' && session.time) {
    timeDisplay = session.time.replace('-', ' – ')
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
      {session.date   && <Tag label={formatDate(session.date)} variant="blue" />}
      {timeDisplay    && <Tag label={timeDisplay}              variant="gold" />}
    </div>
  )
}

/* ── Ligne d'orateur ────────────────────────────────────────────── */
function SpeakerRow({ speaker }) {
  const parts = []
  if (speaker.title)   parts.push(speaker.title)
  if (speaker.country) parts.push(speaker.country)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
      <span style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>
        {speaker.name}
      </span>
      {parts.length > 0 && (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          — {parts.join(', ')}
        </span>
      )}
    </div>
  )
}

/* ── Rendu générique ─────────────────────────────────────────────── */
function GenericSection({ items }) {
  const list = Array.isArray(items) ? items : [items]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {list.map((item, i) => {
        if (typeof item === 'string') return <Tag key={i} label={item} />
        if (typeof item !== 'object' || item === null) return null
        if (item.date || item.time) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {item.date && <Tag label={item.date} variant="blue" />}
              {item.time && <Tag label={item.time} variant="gold" />}
              {item.name && <span style={{ color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>{item.name}</span>}
            </div>
          )
        }
        if (item.name) return <Tag key={i} label={item.name} />
        return (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(item).map(([k, v]) => <Tag key={k} label={`${capitalize(k)}: ${v}`} />)}
          </div>
        )
      })}
    </div>
  )
}

/* ── Sous-composants ─────────────────────────────────────────────── */
function Block({ title, children }) {
  return (
    <div>
      <h4 style={{
        color        : 'var(--color-primary)',
        fontSize     : '0.75rem',
        fontWeight   : 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        margin       : '0 0 0.625rem',
      }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function Tag({ label, variant = 'default' }) {
  const styles = {
    gold   : { color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)',  bg: 'rgba(212,175,55,0.06)' },
    blue   : { color: '#60A5FA', borderColor: 'rgba(96,165,250,0.3)',  bg: 'rgba(96,165,250,0.06)' },
    default: { color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)', bg: 'var(--color-surface-3)' },
  }
  const { color, borderColor, bg } = styles[variant] || styles.default
  return (
    <span style={{
      display    : 'inline-flex',
      alignItems : 'center',
      padding    : '0.2rem 0.65rem',
      background : bg,
      border     : `1px solid ${borderColor}`,
      borderRadius: '6px',
      fontSize   : '0.8125rem',
      color,
    }}>
      {label}
    </span>
  )
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)
