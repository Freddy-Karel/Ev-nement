import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

/**
 * ThemeSwitcher — bouton Soleil/Lune (Lucide) pour basculer entre thèmes.
 * Peut être intégré dans n'importe quel layout.
 */
export default function ThemeSwitcher() {
  const { isDay, toggleTheme } = useTheme()

  return (
    <button
      id="theme-switcher-btn"
      onClick={toggleTheme}
      title={isDay ? 'Passer en mode sombre' : 'Passer en mode clair'}
      aria-label={isDay ? 'Activer le mode sombre' : 'Activer le mode clair'}
      style={{
        display        : 'inline-flex',
        alignItems     : 'center',
        justifyContent : 'center',
        width          : '38px',
        height         : '38px',
        borderRadius   : '50%',
        border         : '1px solid var(--color-border)',
        background     : 'var(--color-surface-2)',
        color          : 'var(--color-primary)',
        cursor         : 'pointer',
        transition     : 'all 220ms ease',
        flexShrink     : 0,
        boxShadow      : 'var(--shadow-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform  = 'scale(1.1) rotate(12deg)'
        e.currentTarget.style.boxShadow  = 'var(--shadow-gold)'
        e.currentTarget.style.borderColor = 'var(--color-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform  = 'scale(1) rotate(0deg)'
        e.currentTarget.style.boxShadow  = 'var(--shadow-card)'
        e.currentTarget.style.borderColor = 'var(--color-border)'
      }}
    >
      {isDay
        ? <Moon  size={17} strokeWidth={2} />
        : <Sun   size={17} strokeWidth={2} />
      }
    </button>
  )
}
