import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Calendar, MapPin, ArrowLeft, Users, BookOpen,
  Mic, Heart, ChevronDown, Shirt,
} from 'lucide-react'
import eventsApi from '../../api/events'
import speakersApi from '../../api/speakers'
import { useTheme } from '../../context/ThemeContext'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import CountdownTimer from '../../components/common/CountdownTimer'
import ProgramTimeline from '../../components/events/ProgramTimeline'
import SpeakersSection from '../../components/events/SpeakersSection'
import logo from '../../Logo/Logo.jpeg'
import { formatEventDateRange } from '../../utils/dateUtils'
import { useOnScreen } from '../../hooks/useOnScreen'

/* ─── Data helpers ───────────────────────────────────────────────── */
function buildProgramBlocks(programme) {
  if (!programme || typeof programme !== 'object') return []
  const blocks = []
  const { plenary, workshops, uniqueService, speakers } = programme

  if (Array.isArray(plenary) && plenary.length) {
    plenary.forEach((s) => {
      let time = ''
      if (s.startTime || s.endTime) time = [s.startTime, s.endTime].filter(Boolean).join(' - ')
      else if (s.time) time = s.time.replace('-', ' - ')
      blocks.push({ type: 'plenary', date: s.date, time, label: 'PLÉNIÈRE' })
    })
  }
  if (Array.isArray(workshops) && workshops.length) {
    const labels = workshops.map((w) => (typeof w === 'string' ? w : w?.name)).filter(Boolean)
    if (labels.length) blocks.push({ type: 'workshops', labels, label: 'ATELIERS', sub: '(Au choix)' })
  }
  if (uniqueService?.enabled) {
    blocks.push({ type: 'unique', date: uniqueService.date, time: uniqueService.time, label: 'CULTE UNIQUE' })
  }
  if (Array.isArray(speakers) && speakers.length) {
    blocks.push({ type: 'speakers', speakers, label: 'ORATRICES / ORATEURS' })
  }
  return blocks
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function PublicEventDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { isDay } = useTheme()

  const [event,    setEvent]    = useState(null)
  const [speakers, setSpeakers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)

  const heroRef  = useRef(null)
  const [navSticky, setNavSticky] = useState(false)

  const [programRef, programVisible] = useOnScreen({ threshold: 0.1, triggerOnce: true })
  const [speakersRef, speakersVisible] = useOnScreen({ threshold: 0.1, triggerOnce: true })
  const [infoRef, infoVisible] = useOnScreen({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    window.scrollTo(0, 0)
    eventsApi.getPublic(id)
      .then((ev) => {
        setEvent(ev)
        return speakersApi.getPublicByEvent(id)
      })
      .then(setSpeakers)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  /* Sticky nav après scroll du hero */
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => setNavSticky(!entry.isIntersecting), { threshold: 0 })
    if (heroRef.current) obs.observe(heroRef.current)
    return () => obs.disconnect()
  }, [loading])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const dateRange = event ? formatEventDateRange(event.startDate, event.endDate) : ''
  const blocks    = event ? buildProgramBlocks(event.programme) : []

  /* ─── Skeleton ──────────────────────────────────────────────── */
  if (loading) return <PageShell isDay={isDay}><SkeletonHero /><SkeletonContent /></PageShell>
  if (error)   return <PageShell isDay={isDay}><ErrorState /></PageShell>

  return (
    <PageShell isDay={isDay}>
      {/* ── NavBar Unique Intelligente & Adaptative ──────────────── */}
      <header style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, 
        padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        background: navSticky ? 'rgba(10, 10, 10, 0.95)' : 'rgba(10, 10, 10, 0.25)', 
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)', transition: 'background 400ms ease'
      }}>
        {/* Section Gauche: Retour & Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/events" title="Retour aux événements" style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 150ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src={logo} alt="FEMMES ROYALES" style={{ height: '36px', width: 'auto', objectFit: 'contain', borderRadius: '5px' }} />
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }} className="hide-mobile">
              FEMMES ROYALES
            </div>
          </div>
        </div>

        {/* Section Centrale (Desktop): Ancres dynamiques */}
        {blocks.length > 0 && (
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
            {blocks.some(b => ['plenary','workshops','unique'].includes(b.type)) && (
              <button onClick={() => scrollTo('programme')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.85)', fontSize:'0.875rem', fontWeight:600, letterSpacing:'0.02em', cursor:'pointer', textTransform:'uppercase' }}>Programme</button>
            )}
            {speakers.length > 0 && (
              <button onClick={() => scrollTo('speakers')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.85)', fontSize:'0.875rem', fontWeight:600, letterSpacing:'0.02em', cursor:'pointer', textTransform:'uppercase' }}>Intervenants</button>
            )}
            <button onClick={() => scrollTo('infos')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.85)', fontSize:'0.875rem', fontWeight:600, letterSpacing:'0.02em', cursor:'pointer', textTransform:'uppercase' }}>Infos pratiques</button>
          </div>
        )}

        {/* Section Droite: ThemeSwitcher & CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <ThemeSwitcher />
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />
          <button
            onClick={() => navigate(`/register/${id}`)}
            style={{ background: '#D4AF37', color: '#1A0A00', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'transform 150ms ease, box-shadow 150ms' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(212,175,55,0.4)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <Heart size={14} fill="currentColor" /> <span className="hide-mobile">J'y serai !</span>
          </button>
        </div>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          position  : 'relative',
          minHeight : '100svh',
          background: event?.bannerUrl ? '#0D0B1E' : 'linear-gradient(160deg, #1E0836 0%, #2D0A5A 30%, #1B1A4B 60%, #0D0B1E 100%)',
          display   : 'flex',
          flexDirection: 'column',
          isolation : 'isolate',
          overflow  : 'hidden',
        }}
      >
        {/* Bannière en fond plein écran (Cover total, pure sans couleur altérée) */}
        {event.bannerUrl && (
          <>
            <img src={event.bannerUrl} alt="" aria-hidden
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center',
                opacity: 1, zIndex: 1, pointerEvents: 'none',
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)'
              }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            {/* Overlay sombre pour assurer la lisibilité parfaite du titre */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
              background: 'linear-gradient(to bottom, rgba(13,11,30,0.1) 0%, rgba(13,11,30,0.85) 100%)'
            }} />
          </>
        )}

        {/* Halos décoratifs */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(123,45,139,0.10) 0%, transparent 60%)', pointerEvents: 'none' }} />


        {/* Contenu centré hero (Poussé vers le bas si affiche présente) */}
        <div style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
          justifyContent: event.bannerUrl ? 'flex-end' : 'center', 
          textAlign: 'center', padding: '6rem 1.5rem 3rem', position: 'relative', zIndex: 10 
        }}>

          {!event.bannerUrl && (
            <>
              {/* Titre et détails affichés si aucune affiche personnalisée */}
              <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(2rem, 7vw, 3.75rem)', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.75rem', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '800px', textTransform: 'uppercase' }}>
                {event.title}
              </h1>

              {event.description && (
                <p style={{ color: '#D4AF37', fontSize: 'clamp(0.8rem, 2vw, 1.0625rem)', fontStyle: 'italic', marginBottom: '1.5rem', maxWidth: '600px', lineHeight: 1.6, fontFamily: 'Playfair Display, serif' }}>
                  {event.description.length > 120 ? event.description.slice(0, 120) + '…' : event.description}
                </p>
              )}

              {dateRange && (
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9375rem', fontWeight: 500, letterSpacing: '0.06em', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <Calendar size={14} color="#D4AF37" /> {dateRange}
                  {event.location && <><MapPin size={14} color="#D4AF37" style={{ marginLeft: '0.75rem' }} /> {event.location}</>}
                </p>
              )}
            </>
          )}

          {/* Compte à rebours */}
          {event.startDate && (
            <div style={{ marginBottom: '2.5rem' }}>
              <CountdownTimer targetDate={event.startDate} size="lg" />
            </div>
          )}

          {/* CTA "J'y serai !" */}
          <button
            onClick={() => navigate(`/register/${id}`)}
            style={{
              display      : 'inline-flex',
              alignItems   : 'center',
              gap          : '0.625rem',
              background   : '#D4AF37',
              color        : '#1A0A00',
              border       : 'none',
              padding      : '1rem 2.25rem',
              fontSize     : '1.0625rem',
              fontWeight   : 800,
              fontFamily   : 'Poppins, sans-serif',
              borderRadius : '999px',
              cursor       : 'pointer',
              boxShadow    : '0 8px 32px rgba(212,175,55,0.4)',
              transition   : 'all 220ms ease',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(212,175,55,0.6)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,175,55,0.4)' }}
          >
            <Heart size={18} fill="currentColor" /> J'y serai !
          </button>

          {/* Scroll indicator */}
          <div style={{ marginTop: '3rem', color: 'rgba(255,255,255,0.3)', animation: 'bounce 2s infinite' }}>
            <ChevronDown size={24} />
          </div>
        </div>
      </section>


      {/* ══ CONTENU ═══════════════════════════════════════════════ */}
      <div style={{ background: isDay ? 'var(--color-surface)' : '#0D0B1E', transition: 'background 350ms ease' }}>

        {/* ── PROGRAMME ──────────────────────────────────────────── */}
        {blocks.some(b => ['plenary','workshops','unique'].includes(b.type)) && (
          <section id="programme" style={{ padding: '5rem 1.5rem 4rem', background: 'linear-gradient(180deg, #0D0B1E 0%, #2D0A5A 50%, #15143A 100%)' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
              <SectionTitle white>Programme</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2.5rem' }}>
                {blocks.filter(b => ['plenary','workshops','unique'].includes(b.type)).map((block, i) => (
                  <ProgramBlock key={i} block={block} />
                ))}
                {/* Lieu en bas */}
                {event.location && (
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', letterSpacing: '0.04em', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                    <MapPin size={13} /> {event.location}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── PROGRAMME HORAIRE (frise dynamique) ────────────────── */}
        {event.program && event.program.length > 0 && (
          <section id="programme" style={{ padding: '4rem 1.5rem', background: isDay ? '#F9F4FF' : '#15143A' }}>
            <div ref={programRef} className={`animate-slide-up ${programVisible ? 'visible' : ''}`} style={{ maxWidth: '720px', margin: '0 auto' }}>
              <SectionTitle white={!isDay}>Programme de la journée</SectionTitle>
              <div style={{ marginTop: '2rem' }}>
                <ProgramTimeline program={event.program} isDay={isDay} />
              </div>
            </div>
          </section>
        )}

        {/* ── INTERVENANTES (depuis API speakers) ─────────────────── */}
        {speakers.length > 0 && (
          <section id="speakers" style={{ padding: '4rem 1.5rem', background: isDay ? 'var(--color-surface)' : '#0D0B1E' }}>
            <div ref={speakersRef} className={`animate-scale ${speakersVisible ? 'visible' : ''}`} style={{ maxWidth: '900px', margin: '0 auto' }}>
              <SpeakersSection speakers={speakers} isDay={isDay} />
            </div>
          </section>
        )}

        {/* ── INFOS PRATIQUES ─────────────────────────────────────── */}
        <section id="infos" style={{ padding: '4rem 1.5rem', background: isDay ? 'var(--color-surface-3)' : '#15143A' }}>
          <div ref={infoRef} className={`animate-slide-left ${infoVisible ? 'visible' : ''}`} style={{ maxWidth: '900px', margin: '0 auto' }}>
            <SectionTitle white={!isDay}>Informations pratiques</SectionTitle>
            <p style={{ color: isDay ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '2.5rem', fontSize: '0.9375rem', lineHeight: 1.65 }}>
              {event.description || 'Un rendez-vous exceptionnel pour faire la différence.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {dateRange && <InfoCard icon={<Calendar size={20} color="var(--color-primary)" />} label="Dates" value={dateRange} isDay={isDay} />}
              {event.location && <InfoCard icon={<MapPin size={20} color="var(--color-primary)" />} label="Lieu" value={event.location} isDay={isDay} />}
              {event.dressCode && <InfoCard icon={<Shirt size={20} color="var(--color-primary)" />} label="Dress Code" value={event.dressCode} isDay={isDay} />}
              <InfoCard icon={<Mic size={20} color="var(--color-primary)" />} label="Format" value="Sessions d'inspiration, partages & ateliers" isDay={isDay} />
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────── */}
        <section style={{ padding: '4rem 1.5rem 5rem', background: isDay ? 'var(--color-surface)' : '#15143A', textAlign: 'center' }}>
          <p style={{ color: isDay ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.4)', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>Rejoins-nous</p>
          <h2 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, color: isDay ? 'var(--color-text-primary)' : '#FFFFFF', marginBottom: '2rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            {event.title}
          </h2>
          <button
            onClick={() => navigate(`/register/${id}`)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '1rem 2.5rem', fontSize: '1.0625rem', fontWeight: 700, fontFamily: 'Poppins, sans-serif', borderRadius: '999px', cursor: 'pointer', boxShadow: 'var(--shadow-gold)', transition: 'all 220ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold-lg)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)' }}
          >
            <Heart size={18} fill="currentColor" /> J'y serai !
          </button>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: isDay ? '1px solid var(--color-border)' : '1px solid rgba(255,255,255,0.05)', padding: '2rem 1.5rem', textAlign: 'center', background: isDay ? 'var(--color-surface)' : '#0D0B1E' }}>
          <p style={{ color: 'var(--color-primary)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.375rem' }}>
            FEMMES ROYALES · Gabon
          </p>
          <p style={{ color: isDay ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontStyle: 'italic' }}>
            « Ce n'est pas vous qui m'avez choisi, c'est moi qui vous ai choisis. » – Jean 15:16
          </p>
        </footer>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(8px); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </PageShell>
  )
}

/* ─── Wrapper page ───────────────────────────────────────────────── */
function PageShell({ children }) {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

/* ─── Programme block (KHAYIL style) ─────────────────────────────── */
function ProgramBlock({ block }) {
  return (
    <div style={{
      background   : 'rgba(255,255,255,0.04)',
      border       : '1px solid rgba(255,255,255,0.08)',
      borderRadius : '16px',
      padding      : '1.75rem 1.5rem',
      textAlign    : 'center',
      backdropFilter: 'blur(6px)',
    }}>
      {block.date && (
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.625rem' }}>
          {block.date}
        </p>
      )}
      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1rem, 3vw, 1.5rem)', fontWeight: 800, color: '#D4AF37', margin: '0 0 0.5rem', letterSpacing: '0.06em' }}>
        {block.label}
      </h3>
      {block.sub && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{block.sub}</p>}
      {block.time && (
        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(0.9rem, 2.5vw, 1.25rem)', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
          {block.time}
        </p>
      )}
      {block.labels && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '0.625rem' }}>
          {block.labels.map((l, i) => (
            <span key={i} style={{ padding: '0.25rem 0.875rem', border: '1px solid rgba(212,175,55,0.35)', borderRadius: '6px', color: 'rgba(255,255,255,0.75)', fontSize: '0.8125rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {l}
            </span>
          ))}
        </div>
      )}
      {block.speakers && block.speakers.map((s, i) => (
        <div key={i} style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>
          <span style={{ fontWeight: 700, color: '#D4AF37' }}>{s.name}</span>
          {s.title && <span style={{ color: 'rgba(255,255,255,0.4)' }}> — {s.title}</span>}
          {s.country && <span style={{ color: 'rgba(255,255,255,0.3)' }}>, {s.country}</span>}
        </div>
      ))}
    </div>
  )
}

/* ─── Speaker card ────────────────────────────────────────────────── */
function SpeakerCard({ speaker, isDay }) {
  const initials = speaker.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  
  const bg = isDay ? 'var(--color-surface-2)' : 'rgba(255,255,255,0.03)'
  const border = isDay ? '1px solid var(--color-border)' : '1px solid rgba(255,255,255,0.06)'
  const textPrimary = isDay ? 'var(--color-text-primary)' : '#FFF'
  const textSecondary = isDay ? 'var(--color-text-muted)' : 'rgba(255,255,255,0.45)'

  return (
    <div style={{
      background  : bg,
      border      : border,
      borderRadius: '16px',
      padding     : '1.5rem 1.25rem',
      textAlign   : 'center',
      boxShadow   : isDay ? 'var(--shadow-card)' : 'none',
      transition  : 'transform 200ms ease, box-shadow 200ms ease, background 200ms ease',
      backdropFilter: isDay ? 'none' : 'blur(8px)',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.background = isDay ? 'var(--color-surface-2)' : 'rgba(255,255,255,0.06)'; if (isDay) e.currentTarget.style.boxShadow = 'var(--shadow-gold)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = bg; if (isDay) e.currentTarget.style.boxShadow = 'var(--shadow-card)' }}
    >
      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-primary-subtle)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'var(--color-primary)', fontSize: '1.125rem' }}>{initials}</span>
      </div>
      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: textPrimary, margin: '0 0 0.25rem' }}>{speaker.name}</p>
      {speaker.title && <p style={{ color: 'var(--color-primary)', fontSize: '0.8125rem', fontWeight: 500 }}>{speaker.title}</p>}
      {speaker.country && <p style={{ color: textSecondary, fontSize: '0.75rem', marginTop: '0.125rem' }}>{speaker.country}</p>}
    </div>
  )
}

/* ─── InfoCard ───────────────────────────────────────────────────── */
function InfoCard({ icon, label, value, isDay }) {
  const bg = isDay ? 'var(--color-surface-2)' : 'rgba(255,255,255,0.03)'
  const border = isDay ? '1px solid var(--color-border)' : '1px solid rgba(255,255,255,0.06)'
  const textPrimary = isDay ? 'var(--color-text-primary)' : '#FFF'
  const textSecondary = isDay ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.6)'

  return (
    <div style={{
      background  : bg,
      border      : border,
      borderRadius: '16px',
      padding     : '1.5rem 1.25rem',
      textAlign   : 'center',
      boxShadow   : isDay ? 'var(--shadow-card)' : 'none',
      transition  : 'transform 200ms ease, background 200ms ease',
      backdropFilter: isDay ? 'none' : 'blur(8px)',
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = isDay ? 'var(--color-surface-2)' : 'rgba(255,255,255,0.06)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = bg }}
    >
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem' }}>
        {icon}
      </div>
      <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: textPrimary, margin: '0 0 0.375rem' }}>{label}</p>
      <p style={{ color: textSecondary, fontSize: '0.8125rem', lineHeight: 1.55 }}>{value}</p>
    </div>
  )
}

/* ─── SectionTitle ───────────────────────────────────────────────── */
function SectionTitle({ children, white }) {
  return (
    <h2 style={{
      fontFamily   : 'Poppins, sans-serif',
      fontSize     : 'clamp(1.5rem, 5vw, 2.25rem)',
      fontWeight   : 800,
      color        : white ? '#FFFFFF' : 'var(--color-text-primary)',
      margin       : 0,
      textAlign    : 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    }}>
      {children}
    </h2>
  )
}

/* ─── NavItem ────────────────────────────────────────────────────── */
function NavItem({ children, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1.25rem', height: '52px', fontSize: '0.875rem', fontWeight: hov ? 600 : 500, color: hov ? 'var(--color-primary)' : 'var(--color-text-secondary)', borderBottom: hov ? '2px solid var(--color-primary)' : '2px solid transparent', transition: 'all 200ms ease', fontFamily: 'Inter, sans-serif' }}>
      {children}
    </button>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function SkeletonHero() {
  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(160deg, #1E0836 0%, #2D0A5A 30%, #1B1A4B 60%, #0D0B1E 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '3rem 1.5rem' }}>
      <div style={{ width: '80px', height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }} />
      <div style={{ width: '60%', height: '60px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px' }} />
      <div style={{ width: '40%', height: '20px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
      <div style={{ display: 'flex', gap: '1rem' }}>
        {[0,1,2,3].map(i => <div key={i} style={{ width: '70px', height: '70px', background: 'rgba(255,255,255,0.07)', borderRadius: '12px' }} />)}
      </div>
      <div style={{ width: '160px', height: '50px', background: 'rgba(212,175,55,0.2)', borderRadius: '999px' }} />
    </div>
  )
}
function SkeletonContent() {
  return (
    <div style={{ padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />)}
      </div>
    </div>
  )
}
function ErrorState() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1.5rem', background: 'var(--color-surface)' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Événement introuvable</h2>
      <Link to="/events" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '1rem' }}>
        <ArrowLeft size={14} /> Tous les événements
      </Link>
    </div>
  )
}
