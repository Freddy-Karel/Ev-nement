import api from './axios'

const participantsApi = {
  // ── Listes ───────────────────────────────────────────────────

  /** Invités nominatifs non encore confirmés (INVITED) */
  getInvited: (eventId) =>
    api.get(`/participants/invited/${eventId}`).then((r) => r.data),

  /** Inscriptions publiques en attente (PENDING) */
  getPending: (eventId) =>
    api.get(`/participants/pending/${eventId}`).then((r) => r.data),

  /** Participants confirmés (CONFIRMED) */
  getConfirmed: (eventId) =>
    api.get(`/participants/confirmed/${eventId}`).then((r) => r.data),

  /** Tous les participants (pour export CSV) */
  getExport: (eventId) =>
    api.get(`/participants/export/${eventId}`).then((r) => r.data),

  // ── Invitation nominative ─────────────────────────────────────

  /**
   * Crée une invitation nominative
   * @param {number} eventId
   * @param {{ firstName, email, phone }} data
   * @returns {InvitationResponse} données pour générer la carte
   */
  invite: (eventId, data) =>
    api.post(`/events/${eventId}/invite`, data).then((r) => r.data),

  // ── Inscription publique ──────────────────────────────────────

  /**
   * Inscription publique d'un visiteur (sans JWT)
   * @param {number} eventId
   * @param {{ firstName, email, phone }} data
   */
  registerPublic: (eventId, data) =>
    api.post(`/public/events/${eventId}/register`, data).then((r) => r.data),

  // ── Actions admin ─────────────────────────────────────────────

  /** Valide une inscription PENDING → CONFIRMED */
  validate: (participantId) =>
    api.put(`/participants/${participantId}/validate`).then((r) => r.data),

  /** Refuse une inscription PENDING → REJECTED */
  reject: (participantId) =>
    api.put(`/participants/${participantId}/reject`).then((r) => r.data),

  /**
   * Renvoie l'invitation à un INVITED non confirmé
   * @returns {InvitationResponse} données pour régénérer la carte
   */
  resend: (participantId) =>
    api.post(`/participants/${participantId}/resend-invite`).then((r) => r.data),

  /**
   * Récupère la carte d'invitation d'un participant sans renvoyer d'email.
   * @returns {InvitationResponse}
   */
  getInvitationCard: (participantId) =>
    api.get(`/participants/${participantId}/invitation-card`).then((r) => r.data),

  // ── Confirmation par token (public) ──────────────────────────

  /**
   * Confirme la présence d'un invité via son token
   * @param {string} token UUID du token d'invitation
   * @returns {{ participantFirstName, eventTitle, eventDates, eventLocation, message }}
   */
  confirmByToken: (token) =>
    api.get(`/public/confirm/${token}`).then((r) => r.data),

  /** Alias explicite pour les pages publiques */
  confirmInvitation: (token) =>
    api.get(`/public/confirm/${token}`).then((r) => r.data),

  // ── Suppression (admin) ──────────────────────────────────────────

  /** Supprime définitivement un participant */
  delete: (participantId) =>
    api.delete(`/participants/${participantId}`).then((r) => r.data),
}

export default participantsApi
