import api from './axios'

const eventsApi = {
  /** Liste tous les événements (ordre anti-chronologique) */
  getAll: () =>
    api.get('/events').then((r) => r.data),

  /** Détail d'un événement par id */
  getById: (id) =>
    api.get(`/events/${id}`).then((r) => r.data),

  /** Liste publique de tous les événements (sans JWT) */
  getPublicAll: () =>
    api.get('/public/events').then((r) => r.data),

  /** Détail public d'un événement (sans JWT) */
  getPublic: (id) =>
    api.get(`/public/events/${id}`).then((r) => r.data),

  /**
   * Crée un événement
   * @param {{ title, description, startDate, endDate, location, bannerUrl, programme }} data
   */
  create: (data) =>
    api.post('/events', data).then((r) => r.data),

  /**
   * Met à jour un événement
   * @param {number} id
   * @param {object} data
   */
  update: (id, data) =>
    api.put(`/events/${id}`, data).then((r) => r.data),

  /** Supprime un événement */
  delete: (id) =>
    api.delete(`/events/${id}`),
}

export default eventsApi
