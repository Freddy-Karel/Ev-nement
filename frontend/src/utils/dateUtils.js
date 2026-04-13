import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Normalise une valeur date (string ISO ou objet Date).
 * @param {string|Date} value
 * @returns {Date}
 */
const toDate = (value) => (typeof value === 'string' ? parseISO(value) : value)

/**
 * Formate la plage de dates d'un événement.
 * Ex : "du 09 au 12 avril 2026"
 *      "le 09 avril 2026" (si même jour)
 *
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {string}
 */
export function formatEventDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '—'
  const start = toDate(startDate)
  const end   = toDate(endDate)

  const startDay  = format(start, 'dd')
  const endFull   = format(end, 'dd MMMM yyyy', { locale: fr })

  if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
    return `le ${format(start, 'dd MMMM yyyy', { locale: fr })}`
  }
  return `du ${startDay} au ${endFull}`
}

/**
 * Formate une date et heure complète.
 * Ex : "09 avril 2026 à 17h30"
 *
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '—'
  return format(toDate(date), "dd MMMM yyyy 'à' HH'h'mm", { locale: fr })
}

/**
 * Formate uniquement la date.
 * Ex : "09 avril 2026"
 *
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '—'
  return format(toDate(date), 'dd MMMM yyyy', { locale: fr })
}

/**
 * Convertit une date ISO en valeur compatible input[type="datetime-local"].
 * Ex : "2026-04-09T17:30"
 *
 * @param {string|Date} date
 * @returns {string}
 */
export function toDatetimeLocal(date) {
  if (!date) return ''
  return format(toDate(date), "yyyy-MM-dd'T'HH:mm")
}
