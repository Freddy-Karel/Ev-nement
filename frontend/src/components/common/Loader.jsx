/**
 * Spinner animé couleur or.
 * @param {'sm'|'md'|'lg'} size - taille du spinner (défaut: 'md')
 * @param {string} className     - classes additionnelles
 */
export default function Loader({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
  }

  return (
    <div
      className={`
        rounded-full animate-spin
        border-solid border-[#2A2A2A]
        border-t-[#D4AF37]
        ${sizes[size]} ${className}
      `}
      role="status"
      aria-label="Chargement..."
    />
  )
}
