import api from './axios'

const authApi = {
  /**
   * Authentifie un utilisateur (admin ou ambassadeur).
   * @returns { token, email, role, onboardingCompleted, firstName }
   */
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),

  /**
   * Inscrit un nouvel ambassadeur.
   * @param {{ email, firstName, lastName, referralCode? }} data
   * @returns { token, email, role, onboardingCompleted, firstName }
   */
  register: (data) =>
    api.post('/auth/register', data).then((r) => r.data),
  /**
   * Modifie le mot de passe de l'utilisateur.
   * @param {string} oldPassword
   * @param {string} newPassword
   */
  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword }).then((r) => r.data),
}

export default authApi
