import api from './axios'

/**
 * Génère un PDF d'invitation pour un participant et un type de billet.
 *
 * @param {Object}  params
 * @param {Object}  params.event           — EventResponse complet (JSON)
 * @param {File}    params.logoFile         — Fichier logo (PNG/JPEG), optionnel
 * @param {File}    params.bannerFile       — Fichier bannière, optionnel
 * @param {string}  params.ticketTypeName   — Nom du type de billet (ex : "VIP")
 * @param {string}  params.participantName  — Prénom de l'invité
 * @param {string}  params.qrData          — URL encodée dans le QR code
 * @returns {Promise<Blob>}                 — Blob du PDF généré
 */
export const generateInvitation = async ({
  event,
  logoFile,
  bannerFile,
  ticketTypeName,
  participantName,
  qrData,
}) => {
  // Payload allégé : exclut les champs volumineux inutiles pour la génération PDF
  // (bannerUrl peut être une data: URL base64 de plusieurs Mo, programme/program sont de gros JSON)
  // La bannière est transmise séparément via bannerFile.
  const { bannerUrl: _b, programme: _p, program: _pr, createdAt: _c, ...eventPayload } = event || {}

  const formData = new FormData()
  formData.append('event', JSON.stringify(eventPayload))
  if (logoFile)   formData.append('logo',   logoFile)
  if (bannerFile) formData.append('banner', bannerFile)
  formData.append('ticketType',      ticketTypeName  || 'STANDARD')
  formData.append('participantName', participantName || 'Invité(e)')
  formData.append('qrData',          qrData          || '')

  const response = await api.post('/invitations/generate', formData, {
    headers      : { 'Content-Type': 'multipart/form-data' },
    responseType : 'blob',
  })

  return response.data
}

/**
 * Génère un ZIP contenant un PDF par type de billet configuré pour l'événement.
 *
 * @param {Object}   params
 * @param {Object}   params.event           — EventResponse complet
 * @param {File}     params.logoFile         — Logo commun à tous les PDFs
 * @param {File}     params.bannerFile       — Bannière commune (optionnel)
 * @param {string}   params.participantName  — Prénom affiché sur toutes les cartes
 * @param {string}   params.qrData          — URL QR commune
 * @returns {Promise<Blob>}                  — Blob du ZIP généré
 */
export const generateAllInvitations = async ({
  event,
  logoFile,
  bannerFile,
  participantName,
  qrData,
}) => {
  const { bannerUrl: _b, programme: _p, program: _pr, createdAt: _c, ...eventPayload } = event || {}

  const formData = new FormData()
  formData.append('event', JSON.stringify(eventPayload))
  if (logoFile)   formData.append('logo',   logoFile)
  if (bannerFile) formData.append('banner', bannerFile)
  formData.append('participantName', participantName || 'Invité(e)')
  formData.append('qrData',          qrData          || '')

  const response = await api.post('/invitations/generate-all', formData, {
    headers      : { 'Content-Type': 'multipart/form-data' },
    responseType : 'blob',
  })

  return response.data
}

/**
 * Déclenche le téléchargement d'un Blob dans le navigateur.
 *
 * @param {Blob}   blob     — Contenu du fichier
 * @param {string} filename — Nom du fichier proposé au téléchargement
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
 * Retourne null silencieusement en cas d'échec (bannière optionnelle).
 *
 * @param {string} url      — URL ou data URL de l'image
 * @param {string} filename — Nom de fichier pour l'objet File
 * @returns {Promise<File|null>}
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
