/**
 * ProgramTimeline — Affiche le programme horaire d'un événement
 * sous forme de frise verticale élégante (thème jour/nuit).
 *
 * @param {Array<{time: string, activity: string}>} program  - Liste des créneaux
 * @param {boolean} isDay  - true = thème clair, false = thème sombre
 */
export default function ProgramTimeline({ program, isDay }) {
  if (!program || program.length === 0) return null

  return (
    <div style={{ width: '100%' }}>
      {/* ── Ligne de temps ──────────────────────────────── */}
      <div style={{ position: 'relative', paddingLeft: '2.5rem' }}>

        {/* Barre verticale */}
        <div style={{
          position   : 'absolute',
          left       : '0.9rem',
          top        : '0.75rem',
          bottom     : '0.75rem',
          width      : '2px',
          background : isDay
            ? 'linear-gradient(to bottom, #7B2D8B, #D4AF37, transparent)'
            : 'linear-gradient(to bottom, #9D4EDD, #D4AF37, transparent)',
          borderRadius: '2px',
        }} />

        {program.map((item, i) => {
          const isLast   = i === program.length - 1
          const isHighlight = (item.activity || '').toLowerCase().includes('pause') ||
                              (item.activity || '').toLowerCase().includes('pause')

          return (
            <div
              key={i}
              style={{
                position     : 'relative',
                display      : 'flex',
                alignItems   : 'flex-start',
                gap          : '1rem',
                marginBottom : isLast ? 0 : '1.25rem',
              }}
            >
              {/* Pastille */}
              <div style={{
                position        : 'absolute',
                left            : '-1.65rem',
                top             : '0.25rem',
                width           : '12px',
                height          : '12px',
                borderRadius    : '50%',
                background      : i % 2 === 0 ? '#7B2D8B' : '#D4AF37',
                border          : `2px solid ${isDay ? '#fff' : '#1a1a2e'}`,
                boxShadow       : `0 0 0 2px ${i % 2 === 0 ? '#7B2D8B33' : '#D4AF3733'}`,
                flexShrink      : 0,
                zIndex          : 1,
              }} />

              {/* Contenu */}
              <div style={{
                flex       : 1,
                background : isDay
                  ? (i % 2 === 0 ? 'rgba(123,45,139,0.05)' : 'rgba(212,175,55,0.06)')
                  : (i % 2 === 0 ? 'rgba(123,45,139,0.12)' : 'rgba(212,175,55,0.10)'),
                border     : `1px solid ${
                  isDay
                    ? (i % 2 === 0 ? 'rgba(123,45,139,0.15)' : 'rgba(212,175,55,0.2)')
                    : (i % 2 === 0 ? 'rgba(123,45,139,0.3)'  : 'rgba(212,175,55,0.25)')
                }`,
                borderRadius    : '10px',
                padding         : '0.625rem 1rem',
                transition      : 'transform 150ms ease',
              }}>
                {/* Heure */}
                <div style={{
                  fontFamily  : 'Poppins, sans-serif',
                  fontSize    : '0.75rem',
                  fontWeight  : 700,
                  color       : i % 2 === 0 ? '#7B2D8B' : '#D4AF37',
                  marginBottom: '0.175rem',
                  letterSpacing: '0.04em',
                }}>
                  {item.time || '—'}
                </div>

                {/* Activité */}
                <div style={{
                  fontSize   : '0.875rem',
                  fontWeight : isHighlight ? 400 : 500,
                  color      : isDay ? '#374151' : 'rgba(255,255,255,0.88)',
                  lineHeight : 1.45,
                  fontStyle  : (item.activity || '').toLowerCase().includes('pause') ? 'italic' : 'normal',
                }}>
                  {item.activity || '—'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
