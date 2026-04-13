import ThemeSwitcher from '../common/ThemeSwitcher'
import Footer from './Footer'
import logo from '../../Logo/Logo.jpeg'

/**
 * Layout des pages publiques (confirmation, inscription).
 * Centré, sans sidebar admin. Inclut le header minimal ICC + Footer complet + ThemeSwitcher.
 */
export default function PublicLayout({ children }) {
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

        {/* ThemeSwitcher */}
        <ThemeSwitcher />
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
