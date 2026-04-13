import Header from './Header'
import Footer from './Footer'

/**
 * Layout des pages admin.
 * Compose le Header commun (avec ThemeSwitcher intégré) + contenu + Footer ICC.
 * Les couleurs s'adaptent automatiquement via les variables CSS du thème actif.
 */
export default function AdminLayout({ children }) {
  return (
    <div style={{
      minHeight     : '100vh',
      background    : 'var(--color-surface)',
      display       : 'flex',
      flexDirection : 'column',
      transition    : 'background 350ms ease',
    }}>
      <Header />

      <main
        style={{
          flex      : 1,
          maxWidth  : '1280px',
          width     : '100%',
          margin    : '0 auto',
          padding   : '2rem 1.5rem',
        }}
        className="animate-fadeIn"
      >
        {children}
      </main>

      {/* Footer compact admin */}
      <footer style={{
        borderTop : '1px solid var(--color-border)',
        padding   : '1rem 1.5rem',
        textAlign : 'center',
        fontSize  : '0.78rem',
        color     : 'var(--color-text-muted)',
        transition: 'border-color 350ms ease',
      }}>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: 'var(--color-primary)' }}>
          FEMMES ROYALES
        </span>
        {' '}· Plateforme d’invitations
      </footer>
    </div>
  )
}
