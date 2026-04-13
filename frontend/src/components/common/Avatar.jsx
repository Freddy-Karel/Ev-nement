/**
 * Avatar — affiche un cercle avec les initiales de l'utilisateur.
 * Props :
 *   name  : string  — prénom ou email (les initiales sont extraites automatiquement)
 *   size  : 'sm' | 'md' | 'lg'  (défaut : 'md')
 *   onClick : function  — rend l'avatar cliquable
 */
export default function Avatar({ name = '', size = 'md', onClick, style = {} }) {
  const initials = extractInitials(name)

  const sizeMap = {
    sm : { diameter: '30px', fontSize: '0.7rem'  },
    md : { diameter: '36px', fontSize: '0.8125rem' },
    lg : { diameter: '44px', fontSize: '1rem'    },
  }
  const { diameter, fontSize } = sizeMap[size] || sizeMap.md

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(e) } : undefined}
      title={name}
      style={{
        width          : diameter,
        height         : diameter,
        borderRadius   : '50%',
        background     : 'var(--color-primary-subtle)',
        border         : '2px solid var(--color-primary)',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'center',
        color          : 'var(--color-primary)',
        fontSize,
        fontFamily     : 'Poppins, sans-serif',
        fontWeight     : 700,
        cursor         : onClick ? 'pointer' : 'default',
        flexShrink     : 0,
        userSelect     : 'none',
        transition     : 'transform 150ms ease, box-shadow 150ms ease',
        letterSpacing  : '0.04em',
        ...style,
      }}
      onMouseEnter={onClick ? (e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = 'var(--shadow-gold)'
      } : undefined}
      onMouseLeave={onClick ? (e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      } : undefined}
    >
      {initials}
    </div>
  )
}

/** Extrait 1 ou 2 initiales depuis un nom ou un email. */
function extractInitials(name) {
  if (!name) return '?'
  // Cas email : prend la partie avant "@"
  const base = name.includes('@') ? name.split('@')[0] : name
  const words = base
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // supprime accents
    .replace(/[^a-zA-Z\s-_]/g, '')
    .split(/[\s\-_]+/)
    .filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
