import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save, X, Plus, Trash2, AlertCircle, Upload, ImageOff } from 'lucide-react'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'
import Loader from '../../components/common/Loader'
import eventsApi from '../../api/events'
import { toDatetimeLocal } from '../../utils/dateUtils'
import { buildProgrammeFromForm, parseProgrammeToForm, EMPTY_PROGRAMME_FORM } from '../../utils/programmeUtils'
import TicketTypesManager from '../../components/events/TicketTypesManager'

/* ── État initial du formulaire ─────────────────────────────────── */
const EMPTY_SESSION  = { date: '', startTime: '', endTime: '' }
const EMPTY_REAL_SPEAKER = { name: '', bio: '', photoUrl: '', displayOrder: 0 }

function emptyForm() {
  return {
    title:       '',
    description: '',
    startDate:   '',
    endDate:     '',
    location:    '',
    bannerUrl:   '',
    dressCode:   '',
    program:     [],
    realSpeakers: [],
    ticketTypes: [],
    ...EMPTY_PROGRAMME_FORM,
  }
}

export default function EventForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving,  setSaving]  = useState(false)
  const [form,    setForm]    = useState(emptyForm())
  const [errors,  setErrors]  = useState({})

  const fileInputRef = useRef(null)

  // ── Charge les données en mode édition ────────────────────────
  useEffect(() => {
    if (!isEdit) return
    eventsApi.getById(id)
      .then((ev) => {
        const prog = parseProgrammeToForm(ev.programme)
        setForm({
          title:           ev.title       || '',
          description:     ev.description || '',
          startDate:       toDatetimeLocal(ev.startDate),
          endDate:         toDatetimeLocal(ev.endDate),
          location:        ev.location    || '',
          bannerUrl:       ev.bannerUrl   || '',
          dressCode:       ev.dressCode   || '',
          program:         ev.program     || [],
          ticketTypes:     ev.ticketTypes || [],
          realSpeakers:    [],
          plenarySessions: prog.plenarySessions,
          workshops:       prog.workshops,
          uniqueService:   prog.uniqueService,
          speakers:        prog.speakers,
        })
        return eventsApi.getById(id)
      })
      .then(() => {
        import('../../api/speakers').then(m => {
          m.default.getByEvent(id).then(spks => {
            setForm(f => ({ ...f, realSpeakers: spks }))
          })
        })
      })
      .catch(() => {
        toast.error('Événement introuvable')
        navigate('/admin/events')
      })
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate])

  // ── Helpers ───────────────────────────────────────────────────
  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  // ── Upload d'image → base64 ───────────────────────────────────
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées.')
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, bannerUrl: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  // ── Plénières ─────────────────────────────────────────────────
  const addSession = () =>
    setForm((prev) => ({ ...prev, plenarySessions: [...prev.plenarySessions, { ...EMPTY_SESSION }] }))

  const removeSession = (i) =>
    setForm((prev) => ({ ...prev, plenarySessions: prev.plenarySessions.filter((_, idx) => idx !== i) }))

  const setSession = (i, field, value) =>
    setForm((prev) => {
      const sessions = [...prev.plenarySessions]
      sessions[i] = { ...sessions[i], [field]: value }
      return { ...prev, plenarySessions: sessions }
    })

  // ── Ateliers ──────────────────────────────────────────────────
  const addWorkshop = () =>
    setForm((prev) => ({ ...prev, workshops: [...prev.workshops, ''] }))

  const removeWorkshop = (i) =>
    setForm((prev) => ({ ...prev, workshops: prev.workshops.filter((_, idx) => idx !== i) }))

  const setWorkshop = (i, value) =>
    setForm((prev) => {
      const workshops = [...prev.workshops]
      workshops[i] = value
      return { ...prev, workshops }
    })

  // ── Culte unique ──────────────────────────────────────────────
  const setUniqueService = (field, value) =>
    setForm((prev) => ({ ...prev, uniqueService: { ...prev.uniqueService, [field]: value } }))

  // ── Oratrices ─────────────────────────────────────────────────
  const addSpeaker = () =>
    setForm((prev) => ({ ...prev, realSpeakers: [...prev.realSpeakers, { ...EMPTY_REAL_SPEAKER, displayOrder: prev.realSpeakers.length }] }))

  const removeSpeaker = (i) =>
    setForm((prev) => ({ ...prev, realSpeakers: prev.realSpeakers.filter((_, idx) => idx !== i) }))

  const setSpeaker = (i, field, value) =>
    setForm((prev) => {
      const spks = [...prev.realSpeakers]
      spks[i] = { ...spks[i], [field]: value }
      return { ...prev, realSpeakers: spks }
    })

  const handleSpeakerPhotoUpload = (i, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setSpeaker(i, 'photoUrl', reader.result)
    reader.readAsDataURL(file)
  }

  // ── Programme horaire (time/activity) ───────────────────────────
  const addProgramSlot = () =>
    setForm((prev) => ({ ...prev, program: [...prev.program, { time: '', activity: '' }] }))

  const removeProgramSlot = (i) =>
    setForm((prev) => ({ ...prev, program: prev.program.filter((_, idx) => idx !== i) }))

  const setProgramSlot = (i, field, value) =>
    setForm((prev) => {
      const program = [...prev.program]
      program[i] = { ...program[i], [field]: value }
      return { ...prev, program }
    })

  // ── Validation ────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!(form.title || '').trim()) e.title = 'Le titre est obligatoire'
    if (!form.startDate)    e.startDate = 'La date de début est obligatoire'
    if (!form.endDate)      e.endDate   = 'La date de fin est obligatoire'
    if (form.startDate && form.endDate && form.startDate >= form.endDate)
      e.endDate = 'La date de fin doit être postérieure à la date de début'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Soumission ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (!validate()) {
        toast.error('Veuillez corriger les erreurs affichées')
        return
      }

      setSaving(true)
      const payload = {
        title:       (form.title || '').trim(),
        description: (form.description || '').trim() || null,
        startDate:   form.startDate,
        endDate:     form.endDate,
        location:    (form.location || '').trim() || null,
        bannerUrl:   form.bannerUrl || null,
        programme:   buildProgrammeFromForm(form),
        dressCode:   (form.dressCode || '').trim() || null,
        program:     form.program.filter((p) => p.time || p.activity),
        realSpeakers: form.realSpeakers.filter(sp => sp.name.trim()),
        ticketTypes: form.ticketTypes
          .filter(t => t.name.trim())
          .map(t => ({ ...t, price: t.price === '' ? null : Number(t.price) })),
      }

      if (isEdit) {
        await eventsApi.update(id, payload)
        toast.success('Événement mis à jour !')
        navigate(`/admin/events/${id}`)
      } else {
        const created = await eventsApi.create(payload)
        toast.success('Événement créé !')
        navigate(`/admin/events/${created.id}`)
      }
    } catch (err) {
      console.error('Submit error:', err)
      toast.error(err?.response?.data?.message || err?.message || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
          <Loader size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="animate-fadeIn" style={{ maxWidth: '800px' }}>

        {/* ── En-tête ────────────────────────────────────────── */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={pageTitle}>
            {isEdit ? "Modifier l'événement" : 'Nouvel événement'}
          </h1>
          <p style={pageSubtitle}>
            {isEdit
              ? "Mettez à jour les informations de l'événement"
              : 'Renseignez les informations du nouvel événement'}
          </p>
          <div className="divider-gold" style={{ marginTop: '1rem' }} />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ══ Section 1 – Informations générales ══════════════ */}
            <Section title="Informations générales">
              <Field label="Titre de l'événement *" error={errors.title}>
                <input
                  className="input"
                  placeholder="Ex : Business Brunch Entre Femmes"
                  value={form.title}
                  onChange={set('title')}
                  disabled={saving}
                />
              </Field>

              <Field label="Description / Thème">
                <textarea
                  className="input"
                  placeholder="Décrivez l'événement, son thème, sa vision…"
                  value={form.description}
                  onChange={set('description')}
                  disabled={saving}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Date & heure de début *" error={errors.startDate}>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.startDate}
                    onChange={set('startDate')}
                    disabled={saving}
                    style={{ colorScheme: 'dark' }}
                  />
                </Field>
                <Field label="Date & heure de fin *" error={errors.endDate}>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.endDate}
                    onChange={set('endDate')}
                    disabled={saving}
                    style={{ colorScheme: 'dark' }}
                  />
                </Field>
              </div>

              <Field label="Lieu">
                <input
                  className="input"
                  placeholder="Ex : Gymnase d'Oloumi, Libreville"
                  value={form.location}
                  onChange={set('location')}
                  disabled={saving}
                />
              </Field>
            </Section>

            {/* ══ Section 2 – Bannière ═════════════════════════════ */}
            <Section title="Bannière">
              <Field label="URL de la bannière">
                <input
                  className="input"
                  placeholder="https://exemple.com/banniere.jpg"
                  value={form.bannerUrl.startsWith('data:') ? '' : form.bannerUrl}
                  onChange={set('bannerUrl')}
                  disabled={saving}
                />
              </Field>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>ou</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                >
                  <Upload size={14} /> Importer une image
                </button>
                {form.bannerUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setForm((prev) => ({ ...prev, bannerUrl: '' }))}
                    disabled={saving}
                    title="Supprimer l'image"
                  >
                    <ImageOff size={14} />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />

              {/* Aperçu */}
              {form.bannerUrl && (
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #2E2E2E', maxHeight: '180px' }}>
                  <img
                    src={form.bannerUrl}
                    alt="Aperçu bannière"
                    style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              )}
            </Section>

            {/* ══ Section 3 – Plénières ════════════════════════════ */}
            <Section title="Plénières" subtitle="Sessions en assemblée générale">
              {form.plenarySessions.map((session, i) => (
                <div
                  key={i}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}
                >
                  <Field label={i === 0 ? 'Date' : undefined}>
                    <input
                      type="date"
                      className="input"
                      value={session.date}
                      onChange={(e) => setSession(i, 'date', e.target.value)}
                      disabled={saving}
                      style={{ colorScheme: 'dark' }}
                    />
                  </Field>
                  <Field label={i === 0 ? 'Heure de début' : undefined}>
                    <input
                      type="time"
                      className="input"
                      value={session.startTime}
                      onChange={(e) => setSession(i, 'startTime', e.target.value)}
                      disabled={saving}
                      style={{ colorScheme: 'dark' }}
                    />
                  </Field>
                  <Field label={i === 0 ? 'Heure de fin' : undefined}>
                    <input
                      type="time"
                      className="input"
                      value={session.endTime}
                      onChange={(e) => setSession(i, 'endTime', e.target.value)}
                      disabled={saving}
                      style={{ colorScheme: 'dark' }}
                    />
                  </Field>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeSession(i)}
                    disabled={saving}
                    style={{ color: '#E53E3E', marginBottom: '1px' }}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addSession}
                disabled={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                <Plus size={14} /> Ajouter une plénière
              </button>
            </Section>

            {/* ══ Section 4 – Ateliers ═════════════════════════════ */}
            <Section title="Ateliers" subtitle="Groupes de travail thématiques">
              {form.workshops.map((name, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    className="input"
                    placeholder={`Atelier ${i + 1}`}
                    value={name}
                    onChange={(e) => setWorkshop(i, e.target.value)}
                    disabled={saving}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeWorkshop(i)}
                    disabled={saving}
                    style={{ color: '#E53E3E' }}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addWorkshop}
                disabled={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                <Plus size={14} /> Ajouter un atelier
              </button>
            </Section>

            {/* ══ Section 5 – Culte unique ═════════════════════════ */}
            <Section title="Culte unique" subtitle="Service de culte spécial (optionnel)">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={form.uniqueService.enabled}
                  onChange={(e) => setUniqueService('enabled', e.target.checked)}
                  disabled={saving}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Activer un culte unique</span>
              </label>

              {form.uniqueService.enabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                  <Field label="Date du culte">
                    <input
                      type="date"
                      className="input"
                      value={form.uniqueService.date}
                      onChange={(e) => setUniqueService('date', e.target.value)}
                      disabled={saving}
                      style={{ colorScheme: 'dark' }}
                    />
                  </Field>
                  <Field label="Horaire (ex : 09:00-12:00)">
                    <input
                      className="input"
                      placeholder="09:00-12:00"
                      value={form.uniqueService.time}
                      onChange={(e) => setUniqueService('time', e.target.value)}
                      disabled={saving}
                    />
                  </Field>
                </div>
              )}
            </Section>

            {/* ══ Section 6 – Oratrices ════════════════════════════ */}
            <Section title="Oratrices / Orateurs" subtitle="Gérez ici les intervenants (nom, fonction, photo)">
              {form.realSpeakers.map((spk, i) => (
                <div
                  key={i}
                  style={{ display: 'grid', gridTemplateColumns: 'auto 2fr 2fr 1fr auto', gap: '0.75rem', alignItems: 'center', background: 'var(--color-surface-2)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', position: 'relative' }}
                >
                  {/* Photo Upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {spk.photoUrl ? (
                         <img src={spk.photoUrl} alt="Aperçu" style={{width: '100%', height: '100%', objectFit: 'cover'}} onError={(e) => { e.target.style.display = 'none' }} />
                      ) : (
                         <ImageOff size={20} color="var(--color-text-muted)" />
                      )}
                    </div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }}>
                      + Photo
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleSpeakerPhotoUpload(i, e)} disabled={saving} />
                    </label>
                  </div>

                  <Field label="Nom complet">
                    <input className="input" placeholder="Ex: Chantal OBAME" value={spk.name} onChange={(e) => setSpeaker(i, 'name', e.target.value)} disabled={saving} />
                  </Field>
                  <Field label="Titre / Fonction courte">
                    <input className="input" placeholder="Ex: Styliste, Conférencière..." value={spk.bio} onChange={(e) => setSpeaker(i, 'bio', e.target.value)} disabled={saving} />
                  </Field>
                  <Field label="Ordre">
                    <input type="number" className="input" style={{ width: '80px' }} value={spk.displayOrder} onChange={(e) => setSpeaker(i, 'displayOrder', parseInt(e.target.value) || 0)} disabled={saving} />
                  </Field>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeSpeaker(i)} disabled={saving} style={{ color: '#E53E3E' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div style={{ marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addSpeaker} disabled={saving}>
                  <Plus size={14} /> Ajouter un(e) intervenant(e)
                </button>
              </div>
            </Section>

            {/* ══ Section 7 – Dress code ════════════════════════ */}
            <Section title="Dress Code" subtitle="Code vestimentaire recommandé aux participantes">
              <Field label="Code vestimentaire">
                <input
                  className="input"
                  placeholder="Ex : Chic et Class en Jean avec une touche Africaine"
                  value={form.dressCode}
                  onChange={set('dressCode')}
                  disabled={saving}
                />
              </Field>
            </Section>

            {/* ══ Section 8 – Types de billets ══════════════════ */}
            <Section title="Types de billets" subtitle="Configurez les tarifs et couleurs pour chaque catégorie. Laissez vide pour utiliser STANDARD / VIP / VVIP par défaut.">
              <TicketTypesManager
                ticketTypes={form.ticketTypes}
                onChange={(types) => setForm((prev) => ({ ...prev, ticketTypes: types }))}
                disabled={saving}
              />
            </Section>

            {/* ══ Section 9 – Programme horaire ═════════════════ */}
            <Section title="Programme horaire" subtitle="Frise chronologique affichée sur la page publique">
              {form.program.map((slot, i) => (
                <div
                  key={i}
                  style={{ display: 'grid', gridTemplateColumns: '130px 1fr auto', gap: '0.75rem', alignItems: 'center' }}
                >
                  <input
                    className="input"
                    placeholder="09h00"
                    value={slot.time}
                    onChange={(e) => setProgramSlot(i, 'time', e.target.value)}
                    disabled={saving}
                    style={{ fontFamily: 'Poppins, monospace', fontWeight: 600 }}
                  />
                  <input
                    className="input"
                    placeholder="Ex : Accueil des participantes"
                    value={slot.activity}
                    onChange={(e) => setProgramSlot(i, 'activity', e.target.value)}
                    disabled={saving}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeProgramSlot(i)}
                    disabled={saving}
                    style={{ color: '#E53E3E' }}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addProgramSlot}
                disabled={saving}
                style={{ alignSelf: 'flex-start' }}
              >
                <Plus size={14} /> Ajouter un créneau
              </button>
            </Section>

          </div>

          {/* ── Boutons ───────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(isEdit ? `/admin/events/${id}` : '/admin/events')}
              disabled={saving}
            >
              <X size={16} /> Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <><span style={spinner} /> Enregistrement…</>
              ) : (
                <><Save size={16} /> {isEdit ? 'Mettre à jour' : "Créer l'événement"}</>
              )}
            </button>
          </div>

        </form>
      </div>
    </AdminLayout>
  )
}

/* ── Composants utilitaires ─────────────────────────────────────── */
function Section({ title, subtitle, children }) {
  return (
    <div className="card">
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={sectionTitle}>{title}</h3>
        {subtitle && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {error && (
        <p style={{ color: '#FC8181', fontSize: '0.8rem', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}

const pageTitle    = { fontFamily: 'Playfair Display, serif', fontSize: '1.875rem', color: 'var(--color-text-primary)', margin: 0 }
const pageSubtitle = { color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }
const sectionTitle = { fontFamily: 'Playfair Display, serif', fontSize: '1.0625rem', color: 'var(--color-text-primary)', margin: 0 }
const spinner      = { display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--color-text-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }
