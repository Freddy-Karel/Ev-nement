import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, MapPin, AlertCircle, CheckCircle, Heart } from 'lucide-react'
import eventsApi from '../../api/events'
import participantsApi from '../../api/participants'
import { formatEventDateRange, formatDateTime } from '../../utils/dateUtils'
import Loader from '../../components/common/Loader'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import { useTheme } from '../../context/ThemeContext'
import logo from '../../Logo/Logo.jpeg'

/* ─── Types de billets dynamiques ───────────────────────────────── */
const FALLBACK_TICKET_TYPES = [
  { name: 'STANDARD', price: 25000,  accentColor: '#7B2D8B', icon: '🎟️', description: "Accès à l'événement – Places assises standard" },
  { name: 'VIP',      price: 50000,  accentColor: '#9E9E9E', icon: '⭐', description: 'Accès VIP – Places prioritaires + goodies'       },
  { name: 'VVIP',     price: 100000, accentColor: '#D4AF37', icon: '👑', description: "Accès VVIP – Table d'honneur + expérience premium" },
]

/** Retourne les types de l'événement ou le fallback si absents/vides */
function getTicketTypes(event) {
  if (event?.ticketTypes && event.ticketTypes.length > 0) return event.ticketTypes
  return FALLBACK_TICKET_TYPES
}

/** Formate un prix entier en "25 000 F CFA" */
function formatPrice(price) {
  if (price == null) return 'Gratuit'
  return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'
}


export default function PublicRegister() {
  const { eventId } = useParams()
  const { isDay }   = useTheme()

  const [event,     setEvent]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [form,   setForm]   = useState({ firstName: '', email: '', phone: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [ticketType, setTicketType] = useState('')

  useEffect(() => {
    eventsApi.getPublic(eventId)
      .then((ev) => {
        setEvent(ev)
        // Sélectionne le premier type disponible par défaut
        const types = getTicketTypes(ev)
        if (types.length > 0) setTicketType(types[0].name)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [eventId])

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }))
    setErrors((p) => ({ ...p, [field]: undefined, global: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Le prénom est obligatoire'
    if (!form.email.trim())     e.email     = 'L\'email est obligatoire'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Adresse email invalide'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await participantsApi.registerPublic(eventId, {
        firstName:  form.firstName.trim(),
        email:      form.email.trim(),
        phone:      form.phone.trim() || null,
        ticketType: ticketType,
      })
      setSubmitted(true)
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ email: 'Cet email est déjà inscrit à cet événement' })
      } else {
        setErrors({ global: err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.' })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight  : '100vh',
      background : 'var(--color-surface)',
      color      : 'var(--color-text-primary)',
      fontFamily : 'Inter, sans-serif',
      position   : 'relative',
      transition : 'background 350ms ease',
    }}>

      {/* Halo déco */}
      <div style={{ position: 'fixed', top: '-20%', right: '-20%', width: '70vmin', height: '70vmin', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,45,139,0.06) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--color-border)', padding: '0 1.5rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--header-bg)', zIndex: 50, boxShadow: 'var(--header-shadow)' }}>

        {/* Gauche : logo + retour */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
            border: `2px solid ${isDay ? 'rgba(123,45,139,0.25)' : 'rgba(255,255,255,0.15)'}`,
            background: isDay ? '#F3E8F5' : 'rgba(255,255,255,0.06)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDay ? '0 2px 8px rgba(123,45,139,0.15)' : '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <img src={logo} alt="FEMMES ROYALES" style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
          <div style={{ width: '1px', height: '28px', background: 'var(--color-border)' }} />
          <Link to={`/events/${eventId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'color 200ms ease' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <ArrowLeft size={15} /> Retour à l'événement
          </Link>
        </div>

        {/* Droite : switcher thème */}
        <ThemeSwitcher />
      </header>

      {/* Contenu centré */}
      <main style={{ position: 'relative', zIndex: 1, padding: '3rem 1.5rem 5rem', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '500px' }}>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
              <Loader size="lg" />
            </div>
          )}

          {notFound && (
            <Card>
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>
                  Événement introuvable
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                  Ce lien d'inscription n'est plus valide ou a expiré.
                </p>
                <Link to="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textDecoration: 'none', marginTop: '1.5rem', fontWeight: 600 }}>
                  <ArrowLeft size={14} /> Voir tous les événements
                </Link>
              </div>
            </Card>
          )}

          {!loading && !notFound && submitted && (
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <CheckCircle size={32} color="#16A34A" />
                </div>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-text-primary)', margin: '0 0 0.75rem' }}>
                  Inscription enregistrée !
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.75rem', maxWidth: '380px', margin: '0 auto 1.75rem' }}>
                  Votre inscription a bien été enregistrée.<br />
                  <strong style={{ color: 'var(--color-text-primary)' }}>En attente de validation</strong> par l'organisateur.<br />
                  Vous recevrez une confirmation par email.
                </p>
                {event && (
                  <div style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-primary)', borderRadius: '10px', padding: '1rem 1.25rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--color-primary)', margin: '0 0 0.5rem' }}>{event.title}</p>
                    <MetaLine icon={Calendar} text={formatEventDateRange(event.startDate, event.endDate)} />
                    {event.location && <MetaLine icon={MapPin} text={event.location} />}
                  </div>
                )}
                <Link to={`/events/${eventId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                  <ArrowLeft size={14} /> Retour à l'événement
                </Link>
              </div>
              <Citation />
            </Card>
          )}

          {!loading && !notFound && !submitted && (
            <Card>
              {/* Accroche */}
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-subtle)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.3rem 1rem', marginBottom: '1rem' }}>
                  <Heart size={13} color="var(--color-primary)" fill="var(--color-primary)" />
                  <span style={{ color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rejoins-nous</span>
                </div>
                <h1 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--color-text-primary)', margin: '0 0 0.375rem' }}>
                  S'inscrire à l'événement
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  FEMMES ROYALES · Gabon
                </p>
              </div>

              {/* Récap événement */}
              {event && (
                <div style={{ background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderLeft: '3px solid var(--color-primary)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
                  <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', margin: '0 0 0.5rem' }}>{event.title}</p>
                  <MetaLine icon={Calendar} text={formatEventDateRange(event.startDate, event.endDate)} />
                  {event.startDate && <MetaLine icon={Calendar} text={`Début : ${formatDateTime(event.startDate)}`} />}
                  {event.location && <MetaLine icon={MapPin} text={event.location} />}
                  {event.description && (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.75rem', lineHeight: 1.65, borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                      {event.description}
                    </p>
                  )}
                </div>
              )}

              {/* Formulaire */}
              <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '1.0625rem', color: 'var(--color-text-primary)', margin: '0 0 1.25rem' }}>
                Vos informations
              </h2>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {errors.global && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: '#DC2626', fontSize: '0.875rem' }}>
                      <AlertCircle size={14} /> <span>{errors.global}</span>
                    </div>
                  )}

                  <RField label="Prénom" required error={errors.firstName}>
                    <input className="input" placeholder="Votre prénom" value={form.firstName} onChange={set('firstName')} disabled={saving} autoFocus />
                  </RField>

                  <RField label="Adresse email" required error={errors.email}>
                    <input className="input" type="email" placeholder="votre@email.com" value={form.email} onChange={set('email')} disabled={saving} style={errors.email ? { borderColor: '#DC2626' } : {}} />
                  </RField>

                  <RField label="Téléphone" hint="optionnel">
                    <input className="input" placeholder="+241 77 000 000" value={form.phone} onChange={set('phone')} disabled={saving} />
                  </RField>

                  {/* Selection du billet (dynamique) */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                      Type de billet
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {getTicketTypes(event).map((opt) => {
                        const selected = ticketType === opt.name
                        const color = opt.accentColor || '#7B2D8B'
                        return (
                          <button
                            key={opt.name}
                            type="button"
                            onClick={() => setTicketType(opt.name)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                              padding: '0.75rem 1rem',
                              borderRadius: '10px',
                              border: `2px solid ${selected ? color : 'var(--color-border)'}`,
                              background: selected ? `${color}14` : 'var(--color-surface-3)',
                              cursor: 'pointer',
                              transition: 'all 200ms ease',
                              textAlign: 'left',
                              width: '100%',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: color, display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', flexShrink: 0,
                              }}>
                                {opt.icon || '\uD83C\uDFAB'}
                              </div>
                              <div>
                                <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                                  Ticket {opt.name}
                                </div>
                                {opt.description && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                                    {opt.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '0.9375rem', color: color }}>
                                {formatPrice(opt.price)}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                      Le paiement s'effectue sur place le jour de l'evenement.
                    </p>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}
                    style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.875rem 1.5rem', fontSize: '0.9375rem', gap: '0.5rem' }}>
                    {saving
                      ? <><span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Envoi en cours…</>
                      : <><Heart size={15} fill="white" /> Confirmer mon inscription</>
                    }
                  </button>
                </div>
              </form>

              <Citation />
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────────────── */
function Card({ children }) {
  return (
    <div style={{
      background  : 'var(--color-surface-2)',
      border      : '1px solid var(--color-border)',
      borderRadius: '20px',
      padding     : '2rem',
      boxShadow   : 'var(--shadow-lg)',
      transition  : 'background 350ms ease',
    }}>
      {children}
    </div>
  )
}

function RField({ label, required, hint, error, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>
        {label}
        {required && <span style={{ color: '#DC2626' }}> *</span>}
        {hint && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}> ({hint})</span>}
      </label>
      {children}
      {error && (
        <p style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
}

function MetaLine({ icon: Icon, text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.8375rem' }}>
      <Icon size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} /> {text}
    </span>
  )
}

function Citation() {
  return (
    <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', fontStyle: 'italic', lineHeight: 1.6 }}>
        « Ce n'est pas vous qui m'avez choisi, c'est moi qui vous ai choisis. »
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginTop: '0.25rem', letterSpacing: '0.06em' }}>
        Jean 15:16
      </p>
    </div>
  )
}
