import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import eventsApi from '../api/events'

/**
 * Hook de gestion des événements.
 * Fournit la liste, les états de chargement et les actions CRUD.
 *
 * @param {boolean} autoLoad - charge la liste au montage (défaut: true)
 */
export function useEvents(autoLoad = true) {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── Chargement de la liste ────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await eventsApi.getAll()
      setEvents(data)
    } catch (err) {
      const msg = err.response?.data?.message || 'Impossible de charger les événements'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoLoad) fetchEvents()
  }, [autoLoad, fetchEvents])

  // ── Suppression ───────────────────────────────────────────────
  const deleteEvent = useCallback(async (id) => {
    try {
      await eventsApi.delete(id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
      toast.success('Événement supprimé')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }, [])

  return { events, loading, error, fetchEvents, deleteEvent }
}
