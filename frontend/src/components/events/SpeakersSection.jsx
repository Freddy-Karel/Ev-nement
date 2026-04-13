import { Mic } from 'lucide-react'
import SpeakerCard from './SpeakerCard'

/**
 * SpeakersSection — Grille des intervenantes/orateurs d'un événement.
 *
 * @param {Array} speakers  - Liste des orateurs depuis l'API
 * @param {boolean} isDay   - Thème jour/nuit
 */
export default function SpeakersSection({ speakers, isDay }) {
  if (!speakers || speakers.length === 0) return null

  return (
    <div>
      {/* ── Titre section ───────────────────────────────── */}
      <div style={{
        display      : 'flex',
        alignItems   : 'center',
        gap          : '0.625rem',
        marginBottom : '1.5rem',
      }}>
        <div style={{
          width          : '36px',
          height         : '36px',
          borderRadius   : '10px',
          background     : 'linear-gradient(135deg, #7B2D8B, #9D4EDD)',
          display        : 'flex',
          alignItems     : 'center',
          justifyContent : 'center',
          flexShrink     : 0,
        }}>
          <Mic size={18} color="#fff" />
        </div>
        <div>
          <h2 style={{
            fontFamily : 'Poppins, sans-serif',
            fontSize   : '1.1rem',
            fontWeight : 700,
            color      : isDay ? '#1f2937' : '#ffffff',
            margin     : 0,
          }}>
            Nos Intervenantes
          </h2>
          <p style={{
            fontSize : '0.78rem',
            color    : isDay ? '#6b7280' : 'rgba(255,255,255,0.5)',
            margin   : '2px 0 0',
          }}>
            {speakers.length} intervenant{speakers.length > 1 ? 'es' : 'e'}
          </p>
        </div>
      </div>

      {/* ── Grille responsive ───────────────────────────── */}
      <div style={{
        display             : 'grid',
        gridTemplateColumns : 'repeat(auto-fill, minmax(200px, 1fr))',
        gap                 : '1rem',
      }}>
        {speakers.map((sp) => (
          <SpeakerCard key={sp.id} speaker={sp} isDay={isDay} />
        ))}
      </div>
    </div>
  )
}
