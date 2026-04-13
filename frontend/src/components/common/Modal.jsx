import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Modal générique avec fond semi-transparent.
 *
 * @param {boolean}  open       - contrôle l'affichage
 * @param {function} onClose    - callback fermeture
 * @param {string}   title      - titre de la modale
 * @param {number}   maxWidth   - largeur max en px (défaut: 480)
 * @param {node}     children   - contenu
 */
export default function Modal({ open, onClose, title, maxWidth = 480, children }) {
  // Ferme au Escape + bloque le scroll body
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div style={overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        style={{ ...dialog, maxWidth }}
        className="animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        {title && (
          <div style={header}>
            <h2 style={titleStyle}>{title}</h2>
            <button onClick={onClose} style={closeBtn} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        )}

        {/* ── Body ── */}
        <div style={{ ...body, padding: title ? '1.5rem' : '2rem' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

const overlay = {
  position      : 'fixed', inset: 0, zIndex: 100,
  background    : 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(6px)',
  display       : 'flex', alignItems: 'center', justifyContent: 'center',
  padding       : '1rem',
}
const dialog = {
  width        : '100%',
  background   : 'var(--color-surface-2)',
  border       : '1px solid var(--color-border)',
  borderRadius : '16px',
  boxShadow    : 'var(--shadow-lg)',
  maxHeight    : 'calc(100vh - 2rem)',
  display      : 'flex',
  flexDirection: 'column',
  transition   : 'background 350ms ease',
}
const header = {
  display        : 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding        : '1.25rem 1.5rem',
  borderBottom   : '1px solid var(--color-border)',
  flexShrink     : 0,
}
const body = {
  overflowY: 'auto',
}
const titleStyle = {
  fontFamily: 'Poppins, sans-serif',
  fontSize  : '1.0625rem',
  fontWeight: 700,
  color     : 'var(--color-text-primary)',
  margin    : 0,
}
const closeBtn = {
  background  : 'none', border: 'none',
  color       : 'var(--color-text-muted)',
  cursor      : 'pointer', padding: '0.25rem',
  display     : 'flex', alignItems: 'center', borderRadius: '6px',
  transition  : 'color 150ms, background 150ms',
}
