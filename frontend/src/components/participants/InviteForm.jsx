import { useState } from 'react'
import { UserPlus, AlertCircle } from 'lucide-react'
import Modal from '../common/Modal'
import InvitationPreview from './InvitationPreview'
import participantsApi from '../../api/participants'

/**
 * Modal d'invitation nominative.
 * Après succès, affiche automatiquement InvitationPreview avec la carte.
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {number}   eventId
 * @param {Function} onSuccess (invitationResponse) => void  — appelé à la fermeture finale
 */
export default function InviteForm({ open, onClose, eventId, onSuccess }) {
  const [form,           setForm]           = useState({ firstName: '', email: '', phone: '' })
  const [errors,         setErrors]         = useState({})
  const [saving,         setSaving]         = useState(false)
  const [invitationData, setInvitationData] = useState(null)   // défini = affiche preview

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Le prénom est obligatoire'
    if (!form.email.trim())     e.email = 'L\'email est obligatoire'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const invitation = await participantsApi.invite(eventId, {
        firstName: form.firstName.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim() || null,
      })
      // Au lieu de fermer, on affiche la carte
      setInvitationData(invitation)
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ email: 'Cet email est déjà inscrit à cet événement' })
      } else {
        setErrors({ global: err.response?.data?.message || 'Erreur lors de l\'invitation' })
      }
    } finally {
      setSaving(false)
    }
  }

  // Fermeture complète (depuis la preview ou directement)
  const handleClose = () => {
    if (invitationData) onSuccess?.(invitationData)
    resetAll()
    onClose()
  }

  // Réinitialise pour inviter une autre personne
  const handleInviteAnother = () => {
    setInvitationData(null)
    setForm({ firstName: '', email: '', phone: '' })
    setErrors({})
    // onSuccess appelé pour recharger la liste
    onSuccess?.(invitationData)
  }

  const resetAll = () => {
    setForm({ firstName: '', email: '', phone: '' })
    setErrors({})
    setInvitationData(null)
  }

  // Si on a les données d'invitation, on cède la main à InvitationPreview
  if (invitationData) {
    return (
      <InvitationPreview
        open={open}
        onClose={handleClose}
        onInviteAnother={handleInviteAnother}
        invitation={invitationData}
      />
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Inviter un participant" maxWidth={460}>
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {errors.global && (
            <p style={{ color: '#FC8181', fontSize: '0.8375rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={14} /> {errors.global}
            </p>
          )}

          {/* Prénom */}
          <div>
            <label className="label">Prénom *</label>
            <input
              className="input"
              placeholder="Ex : Kofi"
              value={form.firstName}
              onChange={set('firstName')}
              disabled={saving}
              autoFocus
            />
            {errors.firstName && <FieldError msg={errors.firstName} />}
          </div>

          {/* Email */}
          <div>
            <label className="label">Email *</label>
            <input
              className="input"
              type="email"
              placeholder="kofi@example.com"
              value={form.email}
              onChange={set('email')}
              disabled={saving}
            />
            {errors.email && <FieldError msg={errors.email} />}
          </div>

          {/* Téléphone */}
          <div>
            <label className="label">Téléphone (optionnel)</label>
            <input
              className="input"
              placeholder="+241 77 000 000"
              value={form.phone}
              onChange={set('phone')}
              disabled={saving}
            />
          </div>

        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={saving}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <><span style={spinner} /> Envoi…</>
            ) : (
              <><UserPlus size={15} /> Inviter</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function FieldError({ msg }) {
  return (
    <p style={{ color: '#FC8181', fontSize: '0.8rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
      <AlertCircle size={12} /> {msg}
    </p>
  )
}

const spinner = {
  display: 'inline-block', width: '14px', height: '14px',
  border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000',
  borderRadius: '50%', animation: 'spin 0.7s linear infinite',
}
