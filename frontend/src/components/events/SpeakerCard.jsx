import { User } from 'lucide-react'

/**
 * SpeakerCard — Carte individuelle d'un orateur.
 *
 * @param {{ id, name, bio, photoUrl, displayOrder }} speaker
 * @param {boolean} isDay
 */
export default function SpeakerCard({ speaker, isDay }) {
  const { name, bio, photoUrl } = speaker

  return (
    <div style={{
      background   : isDay ? '#ffffff' : 'rgba(255,255,255,0.05)',
      border       : `1px solid ${isDay ? 'rgba(123,45,139,0.15)' : 'rgba(212,175,55,0.15)'}`,
      borderRadius : '16px',
      padding      : '1.5rem 1rem',
      display      : 'flex',
      flexDirection: 'column',
      alignItems   : 'center',
      textAlign    : 'center',
      gap          : '0.75rem',
      transition   : 'transform 200ms ease, box-shadow 200ms ease',
      boxShadow    : isDay ? '0 2px 12px rgba(0,0,0,0.06)' : '0 2px 12px rgba(0,0,0,0.3)',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = isDay
          ? '0 8px 24px rgba(123,45,139,0.18)'
          : '0 8px 24px rgba(212,175,55,0.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isDay
          ? '0 2px 12px rgba(0,0,0,0.06)'
          : '0 2px 12px rgba(0,0,0,0.3)'
      }}
    >
      {/* Photo ou avatar */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          style={{
            width       : '88px',
            height      : '88px',
            borderRadius: '50%',
            objectFit   : 'cover',
            border      : '3px solid #D4AF37',
            flexShrink  : 0,
          }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      ) : (
        <div style={{
          width          : '88px',
          height         : '88px',
          borderRadius   : '50%',
          background     : 'linear-gradient(135deg, #7B2D8B, #D4AF37)',
          display        : 'flex',
          alignItems     : 'center',
          justifyContent : 'center',
          flexShrink     : 0,
        }}>
          <User size={36} color="#fff" />
        </div>
      )}

      {/* Nom */}
      <div style={{
        fontFamily : 'Poppins, sans-serif',
        fontWeight : 700,
        fontSize   : '0.9375rem',
        color      : isDay ? '#1f2937' : '#ffffff',
        lineHeight : 1.3,
      }}>
        {name}
      </div>

      {/* Bio */}
      {bio && (
        <div style={{
          fontSize  : '0.8125rem',
          color     : isDay ? '#6b7280' : 'rgba(255,255,255,0.65)',
          lineHeight: 1.55,
        }}>
          {bio}
        </div>
      )}

      {/* Ligne décorative */}
      <div style={{
        width     : '32px',
        height    : '2px',
        background: 'linear-gradient(to right, #7B2D8B, #D4AF37)',
        borderRadius: '2px',
        marginTop : '0.25rem',
      }} />
    </div>
  )
}
