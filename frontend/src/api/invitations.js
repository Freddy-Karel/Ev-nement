import api from './axios'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES PAR DÉFAUT (événement Femmes Royales – Business Brunch)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_EVENT = {
  eventTitleLine1: 'Business Brunch',
  eventTitleLine2: 'Entre femmes',
  edition        : '3ème Édition',
  theme          : 'Femme lève-toi et bâtis ta nation',
  date           : 'Samedi 25 Avril 2026',
  timeStart      : '09h00',
  timeEnd        : '16h30',
  venueName      : 'Le Marial Amissa',
  venueCity      : 'Akanda, Libreville',
  phone1         : '077 46 06 22',
  phone2         : '066 28 55 93',
  dressCode      : 'Chic et Class en Jean avec une touche Africaine',
  organizer      : 'Femmes Royales',
}

const ACCENT_COLORS = {
  VVIP    : '#D4A017',
  VIP     : '#AFAFAF',
  STANDARD: '#5582C8',
}

const DEFAULT_PRICES = {
  VVIP    : '100 000',
  VIP     : '50 000',
  STANDARD: '25 000',
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER – construit un InvitationRequest à partir des données d'invitation
// ─────────────────────────────────────────────────────────────────────────────
function buildInvitationRequest(invitation) {
  const { event, firstName, ticketType, confirmationUrl, qrCodeData } = invitation

  const type = ticketType || 'STANDARD'

  // Couleur accent : depuis la config du type, sinon par défaut
  const ticketConfig = event?.ticketTypes?.find(t => t.name === type)
  const accentColorHex = ticketConfig?.accentColor || ACCENT_COLORS[type] || ACCENT_COLORS.STANDARD

  // Prix : depuis la config, sinon par défaut (formaté avec espace milliers)
  const ticketPrice = ticketConfig?.price
    ? String(ticketConfig.price).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    : (DEFAULT_PRICES[type] || '25 000')

  // Date et heures depuis l'événement (si dispo)
  const date      = formatDateFr(event?.startDate) || DEFAULT_EVENT.date
  const timeStart = formatTimeFr(event?.startDate)  || DEFAULT_EVENT.timeStart
  const timeEnd   = formatTimeFr(event?.endDate)    || DEFAULT_EVENT.timeEnd

  // Lieu : découpe "VenueName, City" si disponible
  const location  = event?.location || ''
  const commaIdx  = location.indexOf(',')
  const venueName = commaIdx > 0
    ? location.slice(0, commaIdx).trim()
    : (location.trim() || DEFAULT_EVENT.venueName)
  const venueCity = commaIdx > 0
    ? location.slice(commaIdx + 1).trim()
    : DEFAULT_EVENT.venueCity

  return {
    ...DEFAULT_EVENT,
    date,
    timeStart,
    timeEnd,
    venueName,
    venueCity,
    dressCode  : event?.dressCode || DEFAULT_EVENT.dressCode,
    qrUrl      : confirmationUrl  || qrCodeData || '',
    guestName  : firstName        || 'Invité(e)',
    ticketType : type,
    ticketPrice,
    accentColorHex,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER – formatage date/heure en français
// ─────────────────────────────────────────────────────────────────────────────
function formatDateFr(isoStr) {
  if (!isoStr) return null
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return null
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).replace(/^\w/, c => c.toUpperCase())
  } catch { return null }
}

function formatTimeFr(isoStr) {
  if (!isoStr) return null
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return null
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}h${m}`
  } catch { return null }
}

// ─────────────────────────────────────────────────────────────────────────────
// API – Génère un PDF d'invitation (Design Concept A)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Génère un PDF d'invitation au format Concept A pour un participant.
 *
 * @param {Object}  params
 * @param {Object}  params.event            — EventResponse complet
 * @param {File}    params.logoFile          — Fichier logo (PNG/JPEG), optionnel
 * @param {string}  params.ticketTypeName    — Nom du type de billet (ex : "VIP")
 * @param {string}  params.participantName   — Prénom de l'invité(e)
 * @param {string}  params.qrData           — URL encodée dans le QR code
 * @returns {Promise<Blob>}                  — Blob du PDF généré
 */
export const generateInvitation = async ({
  event,
  logoFile,
  ticketTypeName,
  participantName,
  qrData,
}) => {
  // Construire l'InvitationRequest à partir des données disponibles
  const req = buildInvitationRequest({
    event,
    firstName      : participantName,
    ticketType     : ticketTypeName,
    confirmationUrl: qrData,
  })

  const formData = new FormData()
  formData.append('data', JSON.stringify(req))
  if (logoFile) formData.append('logo', logoFile)

  const response = await api.post('/invitations/generate', formData, {
    headers     : { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  })

  return response.data
}

/**
 * Génère un ZIP contenant les 3 designs (VVIP, VIP, STANDARD) pour un même invité.
 * Utile pour tester ou distribuer tous les types d'un coup.
 *
 * @param {Object}  params
 * @param {Object}  params.event           — EventResponse complet
 * @param {File}    params.logoFile         — Logo commun (optionnel)
 * @param {string}  params.participantName  — Prénom de l'invité(e)
 * @param {string}  params.qrData          — URL QR commune
 * @returns {Promise<Blob>}                 — Blob du ZIP généré
 */
export const generateAllInvitations = async ({
  event,
  logoFile,
  participantName,
  qrData,
}) => {
  // On envoie avec STANDARD comme base (le backend génère les 3 variantes)
  const req = buildInvitationRequest({
    event,
    firstName      : participantName,
    ticketType     : 'STANDARD',
    confirmationUrl: qrData,
  })

  const formData = new FormData()
  formData.append('data', JSON.stringify(req))
  if (logoFile) formData.append('logo', logoFile)

  const response = await api.post('/invitations/generate-all', formData, {
    headers     : { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  })

  return response.data
}

/**
 * Déclenche le téléchargement d'un Blob dans le navigateur.
 */
export const downloadBlob = (blob, filename) => {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Tente de récupérer une URL (absolue ou data:) comme objet File.
 * Retourne null silencieusement en cas d'échec.
 */
export const urlToFile = async (url, filename = 'image.jpg') => {
  if (!url) return null
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    return new File([blob], filename, { type: blob.type || 'image/jpeg' })
  } catch {
    return null
  }
}
