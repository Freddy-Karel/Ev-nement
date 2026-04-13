/**
 * Convertit les champs structurés du formulaire en objet JSON pour l'API.
 *
 * Règle : une section vide (tableau vide, uniqueService désactivé)
 * n'est pas incluse dans le résultat — le programme peut être null.
 *
 * @param {{ plenarySessions, workshops, uniqueService, speakers }} formData
 * @returns {object|null}
 */
export function buildProgrammeFromForm(formData) {
  const programme = {}

  // ── Plénières ──────────────────────────────────────────────────
  const validSessions = (formData.plenarySessions || []).filter(
    (s) => s.date || s.startTime || s.endTime,
  )
  if (validSessions.length > 0) {
    programme.plenary = validSessions.map((s) => ({
      date:      s.date      || '',
      startTime: s.startTime || '',
      endTime:   s.endTime   || '',
    }))
  }

  // ── Ateliers ───────────────────────────────────────────────────
  const validWorkshops = (formData.workshops || []).filter(
    (w) => typeof w === 'string' ? w.trim() : w?.name?.trim(),
  )
  if (validWorkshops.length > 0) {
    programme.workshops = validWorkshops.map(
      (w) => (typeof w === 'string' ? w.trim() : w),
    )
  }

  // ── Culte unique ───────────────────────────────────────────────
  if (formData.uniqueService?.enabled) {
    programme.uniqueService = {
      enabled: true,
      date:    formData.uniqueService.date || '',
      time:    formData.uniqueService.time || '',
    }
  }

  // ── Oratrices ──────────────────────────────────────────────────
  const validSpeakers = (formData.speakers || []).filter((s) => s.name?.trim())
  if (validSpeakers.length > 0) {
    programme.speakers = validSpeakers.map((s) => ({
      name:    s.name    || '',
      title:   s.title   || '',
      country: s.country || '',
    }))
  }

  return Object.keys(programme).length > 0 ? programme : null
}

/**
 * Convertit un objet programme JSON (stocké en base) en champs structurés
 * pour pré-remplir le formulaire.
 *
 * Gère la rétrocompatibilité :
 *   - plenary[].time  (ex "17:30-21:30") → startTime / endTime
 *   - workshops[] peut être un tableau d'objets { name } ou de strings
 *
 * @param {object|null} programme
 * @returns {{ plenarySessions, workshops, uniqueService, speakers }}
 */
export function parseProgrammeToForm(programme) {
  const result = {
    plenarySessions: [],
    workshops:       [],
    uniqueService:   { enabled: false, date: '', time: '' },
    speakers:        [],
  }

  if (!programme || typeof programme !== 'object') return result

  // ── Plénières ──────────────────────────────────────────────────
  if (Array.isArray(programme.plenary)) {
    result.plenarySessions = programme.plenary.map((s) => {
      // Nouveau format : startTime / endTime
      if (s.startTime !== undefined || s.endTime !== undefined) {
        return {
          date:      s.date      || '',
          startTime: s.startTime || '',
          endTime:   s.endTime   || '',
        }
      }
      // Ancien format : time = "17:30-21:30"
      const parts    = typeof s.time === 'string' ? s.time.split('-') : []
      const startTime = parts[0]?.trim() || ''
      const endTime   = parts[1]?.trim() || ''
      return { date: s.date || '', startTime, endTime }
    })
  }

  // ── Ateliers ───────────────────────────────────────────────────
  if (Array.isArray(programme.workshops)) {
    result.workshops = programme.workshops.map((w) => {
      // Peut être une string ou { name }
      if (typeof w === 'string') return w
      if (w?.name)               return w.name
      return ''
    }).filter(Boolean)
  }

  // ── Culte unique ───────────────────────────────────────────────
  if (programme.uniqueService?.enabled) {
    result.uniqueService = {
      enabled: true,
      date:    programme.uniqueService.date || '',
      time:    programme.uniqueService.time || '',
    }
  }

  // ── Oratrices ──────────────────────────────────────────────────
  if (Array.isArray(programme.speakers)) {
    result.speakers = programme.speakers.map((s) => ({
      name:    s.name    || '',
      title:   s.title   || '',
      country: s.country || '',
    }))
  }

  return result
}

/**
 * Valeur initiale vide pour les champs programme du formulaire.
 * Utilisée lors de la création d'un événement.
 */
export const EMPTY_PROGRAMME_FORM = {
  plenarySessions: [],
  workshops:       [],
  uniqueService:   { enabled: false, date: '', time: '' },
  speakers:        [],
}
