import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Convertit un tableau d'objets en chaîne CSV.
 * @param {Object[]} rows    - données
 * @param {string[]} headers - en-têtes des colonnes
 * @param {Function} rowFn  - (row) => string[] — extrait les valeurs d'une ligne
 * @returns {string} contenu CSV avec BOM UTF-8
 */
function toCsv(rows, headers, rowFn) {
  const escape = (v) => {
    const s = v == null ? '' : String(v)
    // Encadre les valeurs contenant une virgule, un guillemet ou un saut de ligne
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const lines = [
    headers.map(escape).join(','),
    ...rows.map((r) => rowFn(r).map(escape).join(',')),
  ]

  // BOM UTF-8 pour que Excel ouvre correctement les accents
  return '\uFEFF' + lines.join('\r\n')
}

/**
 * Déclenche le téléchargement d'un fichier dans le navigateur.
 * @param {string} content  - contenu du fichier
 * @param {string} filename - nom du fichier
 * @param {string} mime     - type MIME
 */
function download(content, filename, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Exporte la liste des participants au format CSV.
 *
 * @param {Object[]} participants - liste retournée par l'API
 * @param {string}   eventTitle   - titre de l'événement (pour le nom de fichier)
 * @param {number}   eventId      - id de l'événement
 */
export function exportParticipantsCsv(participants, eventTitle, eventId) {
  const today    = format(new Date(), 'yyyy-MM-dd')
  const safeName = (eventTitle || `event_${eventId}`)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40)

  const filename = `participants_${safeName}_${today}.csv`

  const headers = ['Prénom', 'Email', 'Téléphone', 'Statut', 'Date d\'inscription', 'Date de confirmation']

  const formatDate = (d) => {
    if (!d) return ''
    try { return format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: fr }) }
    catch { return d }
  }

  const content = toCsv(participants, headers, (p) => [
    p.firstName,
    p.email,
    p.phone     || '',
    p.status,
    formatDate(p.createdAt),
    formatDate(p.confirmedAt),
  ])

  download(content, filename)
}
