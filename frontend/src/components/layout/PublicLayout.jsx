import { useState } from 'react'
import { Link } from 'react-router-dom'
import ThemeSwitcher from '../common/ThemeSwitcher'
import Footer from './Footer'
import logo from '../../Logo/Logo.jpeg'

/**
 * Layout des pages publiques (confirmation, inscription).
 * Centré, sans sidebar admin. Inclut le header minimal ICC + Footer complet + ThemeSwitcher.
 */
export default function PublicLayout({ children }) {
  const [hoverAmb, setHoverAmb] = useState(false)

  return (
    <div style={{
      minHeight       : '100vh',
      background      : 'var(--color-surface)',
      display         : 'flex',
      flexDirection   : 'column',
      transition      : 'background 350ms ease',
    }}>

      {/* ── Header public minimaliste ──────────────────────────── */}
      <header style={{
        borderBottom : '1px solid var(--color-border)',
        background   : 'var(--header-bg)',
        padding      : '0.875rem 1.5rem',
        display      : 'flex',
        alignItems   : 'center',
        justifyContent: 'space-between',
        position     : 'sticky',
        top          : 0,
        zIndex       : 40,
        boxShadow    : 'var(--header-shadow)',
        transition   : 'background 350ms ease, border-color 350ms ease',
      }}>
        {/* Logo FEMMES ROYALES */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img
            src={logo}
            alt="FEMMES ROYALES"
            style={{ height: '32px', width: 'auto', objectFit: 'contain', borderRadius: '5px' }}
          />
          <div style={{ lineHeight: 1.2 }}>
            <span style={{
              fontFamily : 'Poppins, sans-serif',
              fontSize   : '0.9rem',
              fontWeight : 700,
              color      : 'var(--color-text-primary)',
              display    : 'block',
            }}>
              FEMMES ROYALES
            </span>
            <span style={{
              fontFamily   : 'Inter, sans-serif',
              fontSize     : '0.65rem',
              color        : 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              Gabon
            </span>
          </div>
        </div>

        {/* Navigation + ThemeSwitcher */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/events"
            style={{
              fontFamily   : 'Inter, sans-serif',
              fontSize     : '0.875rem',
              fontWeight   : 500,
              color        : 'var(--color-text-secondary)',
              textDecoration: 'none',
              padding      : '0.4rem 0.75rem',
              borderRadius : '8px',
              transition   : 'color 0.2s',
            }}
          >
            Événements
          </Link>

          <Link
            to="/ambassador/login"
            style={{
              background     : hoverAmb
                ? 'linear-gradient(135deg, #6A1F78 0%, #B8920F 100%)'
                : 'linear-gradient(135deg, #7B2D8B 0%, #D4AF37 100%)',
              color          : '#FFFFFF',
              padding        : '0.45rem 1rem',
              borderRadius   : '50px',
              fontWeight     : 600,
              fontSize       : '0.8125rem',
              textDecoration : 'none',
              display        : 'inline-flex',
              alignItems     : 'center',
              gap            : '0.35rem',
              boxShadow      : hoverAmb ? '0 4px 14px rgba(123,45,139,0.40)' : '0 2px 8px rgba(123,45,139,0.25)',
              transform      : hoverAmb ? 'scale(1.04)' : 'scale(1)',
              transition     : 'all 0.2s ease',
              fontFamily     : 'Inter, sans-serif',
            }}
            onMouseEnter={() => setHoverAmb(true)}
            onMouseLeave={() => setHoverAmb(false)}
          >
            👑 Espace Ambassadeur
          </Link>

          <ThemeSwitcher />
        </nav>
      </header>

      {/* ── Contenu principal ──────────────────────────────────── */}
      <main style={{
        flex           : 1,
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        padding        : '2rem 1.5rem',
      }} className="animate-fadeIn">
        {children}
      </main>

      {/* ── Footer ICC complet ─────────────────────────────────── */}
      <Footer />
    </div>
  )
}
