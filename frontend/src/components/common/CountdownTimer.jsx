import { useState, useEffect } from 'react'

/**
 * CountdownTimer — Compte à rebours FEMMES ROYALES.
 * @param {string|Date} targetDate - date cible (startDate de l'événement)
 * @param {string} [size='lg']     - 'sm' | 'lg'
 */
export default function CountdownTimer({ targetDate, size = 'lg' }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(targetDate))

  useEffect(() => {
    if (!targetDate) return
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  if (!targetDate) return null
  if (timeLeft.total <= 0) {
    return (
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Événement en cours
      </p>
    )
  }

  const units = [
    { value: timeLeft.days,    label: 'Jours' },
    { value: timeLeft.hours,   label: 'Hrs' },
    { value: timeLeft.minutes, label: 'Min' },
    { value: timeLeft.seconds, label: 'Sec' },
  ]

  const isLg = size === 'lg'

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: isLg ? '0.375rem' : '0.25rem' }}>
      {units.map(({ value, label }, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: isLg ? '0.375rem' : '0.25rem' }}>
          {/* Bloc chiffre */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize     : isLg ? 'clamp(2rem, 5vw, 3rem)' : '1.5rem',
              fontWeight   : 800,
              fontFamily   : 'Poppins, sans-serif',
              color        : '#FFFFFF',
              background   : 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(12px)',
              border       : '1px solid rgba(255,255,255,0.18)',
              borderRadius : isLg ? '14px' : '8px',
              padding      : isLg ? '0.5rem 0.875rem' : '0.3rem 0.625rem',
              minWidth     : isLg ? '66px' : '44px',
              lineHeight   : 1.15,
              letterSpacing: '-0.02em',
              transition   : 'opacity 150ms ease',
            }}>
              {String(value).padStart(2, '0')}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: isLg ? '0.6rem' : '0.5rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: '0.375rem' }}>
              {label}
            </div>
          </div>
          {/* Séparateur */}
          {i < 3 && (
            <span style={{ color: '#D4AF37', fontSize: isLg ? '2rem' : '1.25rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1 }}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function getTimeLeft(targetDate) {
  const diff = Math.max(0, new Date(targetDate) - new Date())
  return {
    total  : diff,
    days   : Math.floor(diff / 86_400_000),
    hours  : Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000)   % 60,
    seconds: Math.floor(diff / 1_000)    % 60,
  }
}
