import { format } from 'date-fns'

/**
 * Formate une date pour les formats iCal / Google Calendar.
 * Ex : "20260409T173000"
 */
function toCalDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "yyyyMMdd'T'HHmmss")
}

/**
 * Génère l'URL Google Calendar pour un événement.
 *
 * @param {{ title, startDate, endDate, description, location }} event
 * @returns {string} URL prête à ouvrir dans un nouvel onglet
 */
export function generateGoogleCalendarUrl(event) {
  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     event.title       || '',
    dates:    `${toCalDate(event.startDate)}/${toCalDate(event.endDate)}`,
    details:  event.description || '',
    location: event.location    || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Génère et télécharge un fichier .ics (standard iCal).
 * Compatible Apple Calendar, Outlook, Google Calendar.
 *
 * @param {{ id, title, startDate, endDate, description, location }} event
 */
export function generateICalFile(event) {
  const now  = format(new Date(), "yyyyMMdd'T'HHmmss'Z'")
  const uid  = `event-${event.id || Date.now()}@icc.ga`
  const safe = (str) => (str || '').replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FEMMES ROYALES//Gabon//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toCalDate(event.startDate)}`,
    `DTEND:${toCalDate(event.endDate)}`,
    `SUMMARY:${safe(event.title)}`,
    event.description ? `DESCRIPTION:${safe(event.description)}` : null,
    event.location    ? `LOCATION:${safe(event.location)}`        : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  const blob = new Blob([lines], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${(event.title || 'evenement').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Génère un lien de partage WhatsApp pré-rempli.
 *
 * @param {string} eventTitle
 * @param {string} eventDates   - chaîne déjà formatée (ex : "du 09 au 12 avril 2026")
 * @param {string} [location]
 * @returns {string} URL wa.me
 */
export function generateWhatsAppUrl(eventTitle, eventDates, location) {
  const parts = [
    `Je confirme ma présence à *${eventTitle}* !`,
    eventDates ? `📅 ${eventDates}` : null,
    location   ? `📍 ${location}`   : null,
    `\n_Événement organisé par FEMMES ROYALES_`,
  ].filter(Boolean)

  return `https://wa.me/?text=${encodeURIComponent(parts.join('\n'))}`
}
