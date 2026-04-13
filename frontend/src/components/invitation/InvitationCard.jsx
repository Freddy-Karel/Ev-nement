import { QRCodeSVG } from 'qrcode.react'
import { formatEventDateRange, formatDateTime } from '../../utils/dateUtils'
import logo from '../../Logo/Logo.jpeg'

/**
 * Aperçu HTML de la carte d'invitation — rendu dans InvitationPreview.
 * Optimisé pour l'impression (@media print) mais surtout pensé comme
 * une preview ultra premium et élégante pour la page Web.
 */
export default function InvitationCard({ firstName, event, qrCodeData, ticketType = 'STANDARD' }) {
  const hasBanner = !!event?.bannerUrl

  return (
    <>
      <style>{printStyles}</style>

      <div className="invitation-card" style={cardWrap}>

        {/* ── En-tête : Logo et Marque ─── */}
        <div style={headerStyle}>
          <img src={logo} alt="Logo Femmes Royales" style={logoStyle} />
          <div style={brandTextStyle}>FEMMES ROYALES</div>
        </div>

        {/* ── Bannière / Cover Header ─── */}
        <div style={bannerStyle}>
          {hasBanner ? (
            <>
              <img
                src={event.bannerUrl}
                alt="Bannière événement"
                style={{ width: '100%', display: 'block' }}
              />
              <div style={bannerOverlay} />
            </>
          ) : (
            <div style={bannerFallback} />
          )}
        </div>

        {/* ── Corps : Informations du billet ─── */}
        <div style={bodyStyle}>
          
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <span style={ticketTypeBadge(ticketType)}>{ticketType}</span>
            <h1 style={titleStyle}>{event?.title || 'Événement Femmes Royales'}</h1>
            <h2 style={nameStyle}>{firstName ? `${firstName},` : ''}</h2>
            <p style={inviteStyle}>Vous êtes cordialement invité(e)</p>
          </div>

          {/* ── Détails Pratiques ─── */}
          <div style={detailsGrid}>
            <div style={detailItem}>
              <span style={detailIcon}>📅</span>
              <div>
                <div style={detailLabel}>Date</div>
                <div style={detailValue}>{formatEventDateRange(event?.startDate, event?.endDate) || 'À définir'}</div>
              </div>
            </div>
            
            <div style={detailItem}>
              <span style={detailIcon}>🕐</span>
              <div>
                <div style={detailLabel}>Heure</div>
                <div style={detailValue}>{event?.startDate ? formatDateTime(event.startDate).split('à')[1]?.trim() || formatDateTime(event.startDate) : 'À définir'}</div>
              </div>
            </div>

            <div style={detailItem}>
              <span style={detailIcon}>📍</span>
              <div>
                <div style={detailLabel}>Lieu</div>
                <div style={detailValue}>{event?.location || 'Lieu communiqué ultérieurement'}</div>
              </div>
            </div>
          </div>

          {/* ── QR Code Section ─── */}
          <div style={qrSection}>
            <div style={qrBox}>
              <QRCodeSVG
                value={qrCodeData || 'https://femmes-royales.ga'}
                size={130}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
              />
            </div>
            <p style={citationStyle}>
              « Choisie pour faire la différence » <span style={refStyle}>— Jean 15:16</span>
            </p>
          </div>

        </div>

        {/* ── Footer ─── */}
        <div style={footerStyle}>
          contact@femmesroyales.ga • +241 XX XX XX XX
        </div>

      </div>
    </>
  )
}

/* ─────────────────────────────────────────────────────────────────
   STYLES PREMIUM "FEMMES ROYALES"
───────────────────────────────────────────────────────────────── */

const cardWrap = {
  width: '100%',
  maxWidth: '420px',
  // On s'assure d'une proportion verticale élégante
  minHeight: '650px',
  margin: '0 auto',
  background: '#FFFFFF',
  borderRadius: '24px',
  boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid rgba(0,0,0,0.05)'
}

const headerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '1.25rem 1rem 1rem',
  background: '#FFFFFF',
  zIndex: 2,
}

const logoStyle = {
  width: '48px',
  height: '48px',
  objectFit: 'contain',
  marginBottom: '0.5rem',
  borderRadius: '8px'
}

const brandTextStyle = {
  fontFamily: 'Poppins, sans-serif',
  fontSize: '0.875rem',
  fontWeight: 700,
  color: '#1A1A1A',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
}

const bannerStyle = {
  width: '100%',
  maxHeight: '200px',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const bannerOverlay = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(255,255,255,0.85) 100%)',
  pointerEvents: 'none',
}

const bannerFallback = {
  width: '100%',
  height: '160px',
  background: 'linear-gradient(135deg, #7B2D8B 0%, #4c1d95 100%)',
}

const bodyStyle = {
  flex: 1,
  padding: '0 2rem',
  position: 'relative',
  marginTop: '-30px', // Remonte le texte sur le fondu
  zIndex: 3,
  display: 'flex',
  flexDirection: 'column',
}

function ticketTypeBadge(type) {
  const isVip = type === 'VIP' || type === 'VVIP'
  return {
    display: 'inline-block',
    padding: '0.35rem 1rem',
    borderRadius: '50px',
    background: isVip ? 'linear-gradient(135deg, #D4AF37 0%, #AA8C2C 100%)' : '#F3E8F5',
    color: isVip ? '#FFFFFF' : '#7B2D8B',
    fontFamily: 'Poppins, sans-serif',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    marginBottom: '1rem',
    boxShadow: isVip ? '0 4px 10px rgba(212, 175, 55, 0.3)' : 'none',
  }
}

const titleStyle = {
  fontFamily: 'Playfair Display, serif',
  fontSize: '1.75rem',
  fontWeight: 800,
  color: '#1A1A1A',
  margin: '0 0 0.5rem',
  lineHeight: 1.2,
}

const nameStyle = {
  fontFamily: 'Playfair Display, serif',
  fontSize: '1.25rem',
  color: '#7B2D8B',
  margin: '0 0 0.25rem',
  fontStyle: 'italic'
}

const inviteStyle = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.85rem',
  color: '#6B7280',
  margin: 0
}

const detailsGrid = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  margin: '1.5rem 0',
  padding: '1.25rem',
  background: '#F9F9FB',
  borderRadius: '16px',
  border: '1px solid #F1F1F4'
}

const detailItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.75rem'
}

const detailIcon = {
  fontSize: '1.1rem',
  marginTop: '2px'
}

const detailLabel = {
  fontSize: '0.65rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  color: '#9CA3AF',
  letterSpacing: '0.05em',
  marginBottom: '2px'
}

const detailValue = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '0.875rem',
  color: '#1F2937',
  fontWeight: 500,
  lineHeight: 1.4
}

const qrSection = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: 'auto',
  paddingBottom: '1.5rem'
}

const qrBox = {
  background: '#FFFFFF',
  padding: '0.75rem',
  borderRadius: '16px',
  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
  border: '1px solid #F3F4F6',
  marginBottom: '1.25rem'
}

const citationStyle = {
  fontFamily: 'Playfair Display, serif',
  fontSize: '1rem',
  fontStyle: 'italic',
  color: '#D4AF37',
  textAlign: 'center',
  margin: 0,
  lineHeight: 1.4
}

const refStyle = {
  fontSize: '0.75rem',
  fontFamily: 'Inter, sans-serif',
  color: '#9CA3AF',
  fontStyle: 'normal'
}

const footerStyle = {
  background: '#1A1A1A',
  color: '#F3F4F6',
  textAlign: 'center',
  padding: '1rem',
  fontSize: '0.7rem',
  fontFamily: 'Inter, sans-serif',
  letterSpacing: '0.05em'
}

/* ── Styles Impression ──────────────────────────────────────────── */
const printStyles = `
  @media print {
    body * { visibility: hidden !important; }
    .invitation-card,
    .invitation-card * { visibility: visible !important; }
    .invitation-card {
      position: fixed !important;
      top: 0 !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      box-shadow: none !important;
      border: none !important;
      width: 420px !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`
