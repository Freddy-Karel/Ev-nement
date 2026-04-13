import api from './axios'

const speakersApi = {
  /** Liste des orateurs d'un événement (admin, JWT requis) */
  getByEvent: (eventId) =>
    api.get(`/speakers/event/${eventId}`).then((r) => r.data),

  /** Orateurs publics d'un événement (sans JWT) */
  getPublicByEvent: (eventId) =>
    api.get(`/public/events/${eventId}/speakers`).then((r) => r.data),

  /** Détail d'un orateur */
  getById: (id) =>
    api.get(`/speakers/${id}`).then((r) => r.data),

  /**
   * Crée un orateur
   * @param {{ eventId, name, bio, photoUrl, displayOrder }} data
   */
  create: (data) =>
    api.post('/speakers', data).then((r) => r.data),

  /** Met à jour un orateur */
  update: (id, data) =>
    api.put(`/speakers/${id}`, data).then((r) => r.data),

  /** Supprime un orateur */
  delete: (id) =>
    api.delete(`/speakers/${id}`),
}

export default speakersApi
