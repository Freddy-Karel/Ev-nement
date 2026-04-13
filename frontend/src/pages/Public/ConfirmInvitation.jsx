import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Calendar, MapPin, CheckCircle, AlertCircle, XCircle, Download } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import participantsApi from '../../api/participants'
import eventsApi from '../../api/events'
import { generateInvitation, downloadBlob, urlToFile } from '../../api/invitations'
import { generateGoogleCalendarUrl, generateICalFile, generateWhatsAppUrl } from '../../utils/calendarUtils'
import Loader from '../../components/common/Loader'
import { useOnScreen } from '../../hooks/useOnScreen'
import logo from '../../Logo/Logo.jpeg'

// Icône WhatsApp SVG inline
const WhatsAppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

export default function ConfirmInvitation() {
  const { token } = useParams()

  // 'loading' | 'success' | 'invalid' | 'error'
  const [status, setStatus] = useState('loading')
  const [data,   setData]   = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [cardRef, cardVisible] = useOnScreen({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    participantsApi.confirmInvitation(token)
      .then((res) => {
        setData(res)
        // Backend retourne toujours 200 (idempotent) : "déjà confirmé" ou nouvelle confirmation
        setStatus('success')
      })
      .catch((err) => {
        const code = err.response?.status
        if (code === 404) setStatus('invalid')   // token inconnu
        else              setStatus('error')      // 400 (statut incompatible) ou 5xx
      })
  }, [token])

  // ── États ─────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <Page>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem 1rem' }}>
          <Loader size="lg" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Confirmation en cours…</p>
        </div>
      </Page>
    )
  }

  if (status === 'invalid') {
    return (
      <Page>
        <ErrorCard
          icon={<XCircle size={28} color="#FC8181" />}
          color="#FC8181"
          title="Lien invalide"
          message="Ce lien de confirmation est invalide ou a expiré. Contactez l'organisateur pour obtenir un nouveau lien."
        />
      </Page>
    )
  }

  if (status === 'error') {
    return (
      <Page>
        <ErrorCard
          icon={<AlertCircle size={28} color="#FC8181" />}
          color="#FC8181"
          title="Erreur"
          message="Une erreur est survenue. Veuillez réessayer plus tard ou contacter l'organisateur."
        />
      </Page>
    )
  }

  // ── Succès (première confirmation ou déjà confirmé) ──────────
  // Champs de ConfirmationResponse : message, eventTitle, eventDates,
  //                                  eventLocation, eventStartDate, eventEndDate
  const message    = data?.message    || 'Votre présence est confirmée !'
  const eventTitle = data?.eventTitle || ''
  const eventDates = data?.eventDates || ''
  const eventLoc   = data?.eventLocation || ''
  const confirmUrl = window.location.href

  // Objet synthétique pour les utilitaires calendrier (dates brutes du backend)
  const calEvent = {
    id:          token,
    title:       eventTitle,
    startDate:   data?.eventStartDate || null,
    endDate:     data?.eventEndDate   || null,
    description: 'Confirmé via FEMMES ROYALES',
    location:    eventLoc,
  }

  const hasCalendarDates = calEvent.startDate && calEvent.endDate
  const googleUrl   = hasCalendarDates ? generateGoogleCalendarUrl(calEvent) : null
  const whatsappUrl = generateWhatsAppUrl(eventTitle, eventDates, eventLoc)

  const handleDownloadPdf = async () => {
    if (pdfLoading) return
    setPdfLoading(true)
    try {
      // 1 — Charger le détail complet de l'événement (ticketTypes, bannerUrl…)
      const fullEvent = data?.eventId
        ? await eventsApi.getPublic(data.eventId)
        : null

      // 2 — Logo (asset local → File)
      const logoFile = await urlToFile(logo, 'logo.jpeg')

      // 3 — Bannière : priorité au bannerUrl spécifique au type, sinon bannière de l'événement
      const bannerUrl = (() => {
        if (!fullEvent) return null
        const ticketConfig = fullEvent.ticketTypes?.find(
          (t) => t.name === (data?.ticketType || 'STANDARD')
        )
        return ticketConfig?.bannerUrl || fullEvent.bannerUrl || null
      })()
      const bannerFile = await urlToFile(bannerUrl, 'banner.jpg')

      // 4 — Construire l'objet event compatible avec le backend
      //     Si l'API publique n'était pas accessible, on construit un minimum à partir de ConfirmationResponse
      const eventPayload = fullEvent ?? {
        title      : eventTitle,
        startDate  : data?.eventStartDate,
        endDate    : data?.eventEndDate,
        location   : eventLoc,
        ticketTypes: null,
        bannerUrl  : null,
      }

      // 5 — Appel au service de génération PDF (backend iText7)
      const pdfBlob = await generateInvitation({
        event          : eventPayload,
        logoFile,
        bannerFile,
        ticketTypeName : data?.ticketType  || 'STANDARD',
        participantName: data?.participantFirstName || 'Invité(e)',
        qrData         : data?.confirmationUrl || confirmUrl,
      })

      downloadBlob(
        pdfBlob,
        `invitation_${slugify(data?.ticketType || 'standard')}_${slugify(data?.participantFirstName || 'invite')}.pdf`
      )
    } catch (err) {
      console.error('Erreur génération PDF :', err)
      // Erreur silencieuse — l'utilisateur voit toujours la page de confirmation
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <Page>
      <div ref={cardRef} style={card} className={`animate-scale ${cardVisible ? 'visible' : ''}`}>
        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={iconCircleGold}>
            <CheckCircle size={28} color="#48BB78" />
          </div>
          <p style={badgeText}>Présence confirmée</p>
          <h1 style={titleStyle}>Merci !</h1>
          <p style={subtitleStyle}>{message}</p>
        </div>

        {/* Détails événement */}
        {(eventTitle || eventDates || eventLoc) && (
          <div style={eventBox}>
            {eventTitle && <p style={eventBoxTitle}>{eventTitle}</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: eventTitle ? '0.625rem' : 0 }}>
              {eventDates && <MetaLine icon={Calendar} text={eventDates} />}
              {eventLoc   && <MetaLine icon={MapPin}   text={eventLoc} />}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '1.5rem' }}>

          {/* WhatsApp */}
          <a href={whatsappUrl} target="_blank" rel="noreferrer" style={btnWhatsApp}>
            <WhatsAppIcon />
            Partager sur WhatsApp
          </a>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
            style={{ justifyContent: 'center' }}
          >
            {pdfLoading
              ? <><span style={spinner} /> Génération du PDF…</>
              : <><Download size={13} /> Télécharger la carte PDF</>
            }
          </button>

          {/* Calendrier — uniquement si dates disponibles */}
          {hasCalendarDates && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <a
                href={googleUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'center', textDecoration: 'none' }}
              >
                <Calendar size={13} /> Google Calendar
              </a>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => generateICalFile(calEvent)}
              >
                <Calendar size={13} /> iCal / Outlook
              </button>
            </div>
          )}

          {/* QR Code toggle */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowQr((v) => !v)}
            style={{ justifyContent: 'center' }}
          >
            {showQr ? 'Masquer le QR code' : 'Afficher le QR code'}
          </button>
        </div>

        {/* QR Code */}
        {showQr && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.25rem', gap: '0.75rem' }}>
            <div style={{ background: '#FFF', padding: '12px', borderRadius: '10px' }}>
              <QRCodeSVG
                value={confirmUrl}
                size={160}
                bgColor="#FFFFFF"
                fgColor="#0A0A0A"
                level="M"
              />
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center', maxWidth: '240px' }}>
              Présentez ce QR code à l'entrée de l'événement
            </p>
          </div>
        )}

        {/* Lien plus d'infos */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="https://icc.ga" target="_blank" rel="noreferrer"
            style={{ color: 'var(--color-primary)', fontSize: '0.8rem', textDecoration: 'none' }}>
            Découvrir FEMMES ROYALES →
          </a>
        </p>

        <Citation />
      </div>
    </Page>
  )
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'document'
}

/* ── Sous-composants ─────────────────────────────────────────────── */
function ErrorCard({ icon, color, title, message }) {
  return (
    <div style={card}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: `${color}15`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          {icon}
        </div>
        <h2 style={titleStyle}>{title}</h2>
        <p style={{ ...subtitleStyle, maxWidth: '360px', margin: '0.75rem auto 0' }}>{message}</p>
      </div>
      <Citation />
    </div>
  )
}

function MetaLine({ icon: Icon, text }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.8375rem' }}>
      <Icon size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
      {text}
    </span>
  )
}

function Citation() {
  return (
    <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', fontStyle: 'italic', lineHeight: 1.6 }}>
        « Ce n'est pas vous qui m'avez choisi, c'est moi qui vous ai choisis. »
      </p>
      <p style={{ color: 'var(--color-primary)', fontSize: '0.7rem', marginTop: '0.25rem', letterSpacing: '0.05em' }}>
        Jean 15:16
      </p>
    </div>
  )
}

function Page({ children }) {
  return (
    <div style={{
      minHeight      : '100vh',
      background     : 'var(--color-surface)',
      display        : 'flex',
      flexDirection  : 'column',
      alignItems     : 'center',
      justifyContent : 'flex-start',
      padding        : '3rem 1rem 4rem',
      transition     : 'background 350ms ease',
    }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ color: 'var(--color-primary)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600 }}>
            FEMMES ROYALES · Gabon
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────── */
const card = {
  background   : 'var(--color-surface-2)',
  border       : '1px solid var(--color-border)',
  borderRadius : '16px',
  padding      : '2rem',
  boxShadow    : 'var(--shadow-card)',
}

const iconCircleGold = {
  width          : '72px',
  height         : '72px',
  borderRadius   : '50%',
  background     : 'rgba(22,163,74,0.1)',
  border         : '1px solid rgba(22,163,74,0.3)',
  display        : 'flex',
  alignItems     : 'center',
  justifyContent : 'center',
  margin         : '0 auto 1rem',
}

const badgeText = {
  color        : '#16A34A',
  fontSize     : '0.75rem',
  fontWeight   : 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom : '0.5rem',
}

const titleStyle = {
  fontFamily: 'Poppins, sans-serif',
  fontSize  : '1.5rem',
  fontWeight: 700,
  color     : 'var(--color-text-primary)',
  margin    : '0 0 0.5rem',
}

const subtitleStyle = {
  color     : 'var(--color-text-secondary)',
  fontSize  : '0.9rem',
  lineHeight: 1.65,
}

const eventBox = {
  background   : 'var(--color-surface-3)',
  border       : '1px solid var(--color-border)',
  borderLeft   : '3px solid var(--color-primary)',
  borderRadius : '10px',
  padding      : '1rem 1.25rem',
}

const eventBoxTitle = {
  fontFamily : 'Poppins, sans-serif',
  fontSize   : '1.0625rem',
  fontWeight : 700,
  color      : 'var(--color-primary)',
  margin     : '0 0 0.5rem',
}

const btnWhatsApp = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.625rem 1rem',
  background: '#25D36615',
  border: '1px solid #25D36640',
  borderRadius: '10px',
  color: '#25D366',
  fontSize: '0.875rem',
  fontWeight: 500,
  textDecoration: 'none',
  cursor: 'pointer',
}

const spinner = {
  display: 'inline-block',
  width: '14px',
  height: '14px',
  border: '2px solid rgba(0,0,0,0.2)',
  borderTopColor: '#000',
  borderRadius: '50%',
  animation: 'spin 0.7s linear infinite',
}
