import { useState } from 'react'
import { Download, Printer, X, UserPlus } from 'lucide-react'
import Modal from '../common/Modal'
import InvitationCard from '../invitation/InvitationCard'
import { useTheme } from '../../context/ThemeContext'
import { generateInvitation, downloadBlob, urlToFile } from '../../api/invitations'
import logo from '../../Logo/Logo.jpeg'

/**
 * Modal d'apercu de la carte d'invitation.
 * Affiche apres une invitation nominative reussie ou apres "Renvoyer".
 */
export default function InvitationPreview({ open, onClose, onInviteAnother, invitation }) {
  const { isDay } = useTheme()
  const [tab, setTab] = useState('preview')
  const [pdfLoading, setPdfLoading] = useState(false)

  const resetState = () => {
    setTab('preview')
    setPdfLoading(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleInviteAnother = () => {
    resetState()
    onInviteAnother?.()
  }

  const handleDownloadPdf = async () => {
    if (!invitation || pdfLoading) return

    setPdfLoading(true)
    try {
      // 1 - Logo (asset local -> File)
      const logoFile = await urlToFile(logo, 'logo.jpeg')

      // 2 - Banniere : priorite au bannerUrl specifique au type, sinon banniere de l'evenement
      const bannerUrl = (() => {
        const event = invitation.event
        if (!event) return null
        const ticketConfig = event.ticketTypes?.find(
          (t) => t.name === (invitation.ticketType || 'STANDARD')
        )
        return ticketConfig?.bannerUrl || event.bannerUrl || null
      })()
      const bannerFile = await urlToFile(bannerUrl, 'banner.jpg')

      // 3 - Appel au service de generation PDF (backend iText7)
      const pdfBlob = await generateInvitation({
        event          : invitation.event,
        logoFile,
        bannerFile,
        ticketTypeName : invitation.ticketType
                     || invitation.event?.ticketTypes?.[0]?.name
                     || 'STANDARD',
        participantName: invitation.firstName   || 'Invite(e)',
        qrData         : invitation.confirmationUrl || invitation.qrCodeData || '',
      })

      downloadBlob(pdfBlob, buildPdfFilename(invitation))
    } catch (err) {
      console.error('Erreur generation PDF :', err)
    } finally {
      setPdfLoading(false)
    }
  }

  if (!invitation) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Carte d'invitation - ${invitation.firstName}`}
      maxWidth={420}
    >
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
        <TabBtn active={tab === 'preview'} onClick={() => setTab('preview')}>Apercu</TabBtn>
        <TabBtn active={tab === 'pdf'} onClick={() => setTab('pdf')}>PDF</TabBtn>
      </div>

      {tab === 'preview' && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '0.5rem' }}>
          <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
            <InvitationCard
              firstName={invitation.firstName}
              event={invitation.event}
              qrCodeData={invitation.qrCodeData}
            />
          </div>
        </div>
      )}

      {tab === 'pdf' && (
        <div style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background  : 'var(--color-surface-2)',
            border      : '1px solid var(--color-border)',
            borderLeft  : '3px solid var(--color-primary)',
            borderRadius: '10px',
            padding     : '1.25rem',
            textAlign   : 'center',
            width       : '100%',
          }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Format <strong style={{ color: 'var(--color-text-primary)' }}>A6</strong>
              {' '}· carte {isDay ? 'blanc/violet ICC' : 'noir/or'}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              Invitation pour{' '}
              <strong style={{ color: 'var(--color-primary)' }}>{invitation.firstName}</strong>
              {invitation.event?.title && ` - ${invitation.event.title}`}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.625rem' }}>
              ID {invitation.participantId ?? '-'} · Statut {invitation.status || 'INVITED'}
            </p>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleDownloadPdf}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <><span style={spinner} /> Generation du PDF...</>
              : <><Download size={15} /> Telecharger le PDF</>
            }
          </button>
        </div>
      )}

      <div style={{
        borderTop : '1px solid var(--color-border)',
        paddingTop: '1rem',
        marginTop : '0.5rem',
        display   : 'flex',
        gap       : '0.625rem',
        flexWrap  : 'wrap',
      }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => window.print()}
          title="Imprimer la carte"
        >
          <Printer size={14} /> Imprimer
        </button>

        <div style={{ flex: 1 }} />

        {onInviteAnother && (
          <button className="btn btn-ghost btn-sm" onClick={handleInviteAnother}>
            <UserPlus size={14} /> Inviter une autre personne
          </button>
        )}

        <button className="btn btn-primary btn-sm" onClick={handleClose}>
          <X size={14} /> Fermer
        </button>
      </div>
    </Modal>
  )
}

function buildPdfFilename(invitation) {
  const firstName  = slugify(invitation.firstName || 'invite')
  const eventTitle = slugify(invitation.event?.title || 'femmes_royales_event')
  return `invitation_fr_${firstName}_${eventTitle}.pdf`
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase() || 'document'
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      className={`tab-btn${active ? ' active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
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
