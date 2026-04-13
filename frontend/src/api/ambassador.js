import api from './axios'

/**
 * Appels API dédiés à l'espace Ambassadeur.
 * Tous les endpoints nécessitent un JWT valide inclus automatiquement par axios.js.
 */
const ambassadorApi = {

  /** Inscription publique d'un ambassadeur (optionnel: code de parrainage). */
  register: (data) =>
    api.post('/auth/register', data).then((r) => r.data),

  /** Statistiques complètes du tableau de bord. */
  getStats: () =>
    api.get('/ambassador/stats').then((r) => r.data),

  /** Compléter l'onboarding (pseudo + avatar optionnel). */
  onboard: (data) =>
    api.post('/ambassador/onboard', data).then((r) => r.data),

  /** Mettre à jour l'avatar (Base64). */
  updateAvatar: (avatarBase64) =>
    api.post('/ambassador/avatar', { avatarBase64 }).then((r) => r.data),

  /** Classement Top 20 des ambassadeurs. */
  getLeaderboard: () =>
    api.get('/ambassador/leaderboard').then((r) => r.data),

  /** Générer / récupérer le lien de parrainage unique. */
  generateInviteLink: () =>
    api.post('/ambassador/generate-invite-link').then((r) => r.data),

  /**
   * Récupère les données de carte d'invitation/confirmation de l'ambassadeur
   * pour une participation donnée (nominative ou publique CONFIRMED).
   * @param {number} participantId
   * @returns {InvitationResponse}
   */
  getMyCard: (participantId) =>
    api.get(`/ambassador/my-card/${participantId}`).then((r) => r.data),
}

export default ambassadorApi
