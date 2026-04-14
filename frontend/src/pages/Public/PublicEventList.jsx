import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, ArrowRight, ChevronDown, Heart } from 'lucide-react'
import eventsApi from '../../api/events'
import { formatEventDateRange } from '../../utils/dateUtils'
import logo from '../../Logo/Logo.jpeg'
import ThemeSwitcher from '../../components/common/ThemeSwitcher'
import Footer from '../../components/layout/Footer'
import EventCarousel from '../../components/common/EventCarousel'
import { useOnScreen } from '../../hooks/useOnScreen'

export default function PublicEventList() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  const [heroRef, heroVisible] = useOnScreen({ threshold: 0.1, triggerOnce: true })
  const [eventsRef, eventsVisible] = useOnScreen({ threshold: 0.1, triggerOnce: true })

  useEffect(() => {
    // Les événements récents arrivent en premier si le backend trie par défaut, ou on pourrait inverser
    eventsApi.getPublicAll()
      .then(data => {
        // Optionnel : s'assurer que c'est trié par ID ou date desc pour avoir les vrais "récents"
        const sorted = data.sort((a,b) => b.id - a.id)
        setEvents(sorted)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      minHeight  : '100vh',
      background : 'var(--color-surface)',
      color      : 'var(--color-text-primary)',
      fontFamily : 'Inter, sans-serif',
      display    : 'flex',
      flexDirection: 'column',
      transition : 'background 350ms ease',
    }}>

      <style>{`
        .desktop-nav { display: flex; align-items: center; gap: 2.5rem; }
        @media (max-width: 950px) { .desktop-nav { display: none; } }
      `}</style>

      {/* ── Header public Glassmorphisme superposé ───────────────────────────── */}
      <header style={{
        position       : 'fixed',
        top            : 0, left: 0, right: 0,
        zIndex         : 50,
        background     : 'rgba(10, 10, 10, 0.25)', // Fond sombre très transparent
        backdropFilter : 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom   : '1px solid rgba(255, 255, 255, 0.08)',
        padding        : '1rem 2rem',
        transition     : 'background 350ms ease',
      }}>
        <div style={{
          maxWidth       : '1400px',
          margin         : '0 auto',
          display        : 'flex',
          alignItems     : 'center',
          justifyContent : 'space-between',
        }}>
          {/* Logo FEMMES ROYALES */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img
              src={logo}
              alt="FEMMES ROYALES"
              style={{ height: '36px', width: 'auto', objectFit: 'contain', borderRadius: '5px' }}
            />
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
              FEMMES ROYALES
            </div>
          </div>

          {/* Navigation */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              to="/ambassador/login"
              style={{
                background    : 'linear-gradient(135deg, #7B2D8B 0%, #D4AF37 100%)',
                color         : '#FFFFFF',
                padding       : '0.45rem 1.1rem',
                borderRadius  : '50px',
                fontWeight    : 600,
                fontSize      : '0.8125rem',
                textDecoration: 'none',
                display       : 'inline-flex',
                alignItems    : 'center',
                gap           : '0.35rem',
                boxShadow     : '0 2px 10px rgba(123,45,139,0.35)',
                fontFamily    : 'Inter, sans-serif',
                transition    : 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.04)' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'scale(1)' }}
            >
              👑 Espace Ambassadeur
            </Link>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* ── HERO CAROUSEL DYNAMIQUE (Phase 4) ──────────────── */}
      <div ref={heroRef} className={`animate-fade ${heroVisible ? 'visible' : ''}`}>
        <EventCarousel events={events} />
      </div>

      {/* ── Sous-titre liste événements ───────────────────────────── */}
      <div style={{
        textAlign    : 'center',
        padding      : '2.5rem 1.5rem 1.5rem',
        maxWidth     : '600px',
        margin       : '0 auto',
      }}>
        <h2 style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize  : 'clamp(1.25rem, 3vw, 1.75rem)',
          fontWeight: 700,
          color     : 'var(--color-text-primary)',
          marginBottom: '0.5rem',
        }}>
          Nos événements
        </h2>
        <div style={{
          height    : '3px',
          background: 'linear-gradient(90deg, transparent, var(--color-primary), transparent)',
          width     : '80px',
          margin    : '0 auto 0.75rem',
          borderRadius: '2px',
        }}/>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Découvrez les événements organisés par ICC Gabon et inscrivez-vous.
        </p>
      </div>

      {/* ── Liste des événements ───────────────────────────────────── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem 4rem', width: '100%', flex: 1 }}>
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <EmptyState icon="⚠" title="Impossible de charger les événements" desc="Vérifiez votre connexion et réessayez." />
        ) : events.length === 0 ? (
          <EmptyState icon="📅" title="Aucun événement à venir" desc="Revenez bientôt pour découvrir nos prochains événements." />
        ) : (
          <div ref={eventsRef} className={`stagger-grid ${eventsVisible ? 'visible' : ''}`} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}>
            {events.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </main>

      {/* ── Footer ICC complet ─────────────────────────────────────── */}
      <Footer />
    </div>
  )
}

/* ── Carte événement (thémable) ──────────────────────────────────── */
function EventCard({ event }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        background   : 'var(--color-surface-2)',
        border       : `1px solid ${hovered ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius : '14px',
        overflow     : 'hidden',
        display      : 'flex',
        flexDirection: 'column',
        transition   : 'border-color 200ms, transform 200ms, box-shadow 200ms',
        boxShadow    : hovered ? 'var(--shadow-gold)' : 'var(--shadow-card)',
        transform    : hovered ? 'translateY(-3px)' : 'translateY(0)',
        cursor       : 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Bannière */}
      <div style={{ height: '180px', overflow: 'hidden', position: 'relative', background: 'var(--color-surface-3)' }}>
        {event.bannerUrl ? (
          <img
            src={event.bannerUrl}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.9)', transition: 'transform 300ms ease' }}
            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.querySelector('.banner-fallback').style.display = 'flex' }}
          />
        ) : null}
        <div
          className="banner-fallback"
          style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(135deg, var(--color-primary-subtle) 0%, var(--color-surface-3) 100%)',
            display: event.bannerUrl ? 'none' : 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'var(--color-primary-subtle)', border: '1px solid var(--color-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)' }}>ICC</span>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
        <h3 style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize  : '1.0625rem',
          fontWeight: 700,
          color     : 'var(--color-text-primary)',
          margin    : 0, lineHeight: 1.3,
        }}>
          {event.title}
        </h3>

        {event.description && (
          <p style={{
            color: 'var(--color-text-muted)', fontSize: '0.8125rem', lineHeight: 1.6,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {event.description}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: 'auto', paddingTop: '0.375rem' }}>
          {(event.startDate || event.endDate) && <MetaLine icon={Calendar} text={formatEventDateRange(event.startDate, event.endDate)} />}
          {event.location && <MetaLine icon={MapPin} text={event.location} />}
        </div>

        <Link
          to={`/events/${event.id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            padding: '0.625rem 1rem', marginTop: '0.25rem',
            background: 'var(--color-primary)', color: '#FFFFFF',
            fontWeight: 600, fontSize: '0.875rem', borderRadius: '8px',
            textDecoration: 'none', transition: 'background 200ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-light)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-primary)' }}
        >
          Voir l'événement <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  )
}

function MetaLine({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Icon size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{text}</span>
    </div>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</p>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{title}</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{desc}</p>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden' }}>
          <div className="skeleton" style={{ height: '180px' }} />
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton" style={{ height: '22px', width: '70%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '14px', width: '50%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '38px', borderRadius: '8px', marginTop: '0.5rem' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
