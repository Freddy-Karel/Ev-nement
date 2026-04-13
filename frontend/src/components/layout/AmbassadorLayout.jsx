import { useState, useEffect, useCallback } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Send, Trophy, User, LogOut,
  ChevronLeft, ChevronRight, Menu, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ThemeSwitcher from '../common/ThemeSwitcher'
import ambassadorApi from '../../api/ambassador'
import logo from '../../Logo/Logo.jpeg'

/** Rendu d'avatar : photo ou initiales. */
function AvatarImg({ src, name, size = 36 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size, height: size,
          borderRadius: '50%', objectFit: 'cover',
          border: '2px solid var(--color-primary)',
          flexShrink: 0,
        }}
      />
    )
  }
  const initials = (name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, var(--color-primary), #D4AF37)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff',
      border: '2px solid var(--color-primary)', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

const NAV = [
  { to: '/ambassador',            label: 'Accueil',    Icon: LayoutDashboard },
  { to: '/ambassador/invite',     label: 'Inviter',    Icon: Send },
  { to: '/ambassador/classement', label: 'Classement', Icon: Trophy },
  { to: '/ambassador/profil',     label: 'Profil',     Icon: User },
]

/**
 * Layout principal de l'espace Ambassadeur.
 *
 * Comportement responsive :
 * - Desktop (≥ 768px) : sidebar fixe, collapsible via chevron.
 * - Mobile  (<  768px) : sidebar cachée par défaut, s'ouvre en drawer
 *   slide-in depuis la gauche avec un overlay semi-transparent.
 */
export default function AmbassadorLayout({ children, stats: propStats }) {
  const { user, logout }    = useAuth()
  const { isDay }           = useTheme()
  const navigate            = useNavigate()
  const location            = useLocation()

  // Détection mobile
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < 768)
  // Desktop : sidebar réduite ?
  const [collapsed,  setCollapsed]  = useState(false)
  // Mobile : drawer ouvert ?
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Stats auto-fetch si non fournies par la page parente
  const [localStats, setLocalStats] = useState(null)

  // Écoute du resize
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Ferme le drawer lors d'un changement de route (navigation mobile)
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  // Bloque le scroll body quand le drawer est ouvert
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = drawerOpen ? 'hidden' : ''
    }
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen, isMobile])

  // Auto-fetch des stats si pas fourni en prop
  useEffect(() => {
    if (!propStats) {
      ambassadorApi.getStats()
        .then(setLocalStats)
        .catch(() => {})
    }
  }, [propStats])

  const stats       = propStats || localStats
  // Cache the avatar and name to prevent flickering on navigation
  const cachedAvatarKey = `avatar_${user?.email}`
  const cachedNameKey   = `name_${user?.email}`

  const avatarUrl   = stats?.avatarUrl || sessionStorage.getItem(cachedAvatarKey) || null
  const displayName = stats?.displayName || sessionStorage.getItem(cachedNameKey) || user?.firstName || 'Ambassadeur'
  const rank        = stats?.rank || 'RECRUE'
  const invitations = stats?.invitationCount ?? 0

  // Mettre à jour le cache quand on reçoit les vraies datas
  useEffect(() => {
    if (stats?.avatarUrl) {
      sessionStorage.setItem(cachedAvatarKey, stats.avatarUrl)
    }
    if (stats?.displayName) {
      sessionStorage.setItem(cachedNameKey, stats.displayName)
    }
  }, [stats?.avatarUrl, stats?.displayName, cachedAvatarKey, cachedNameKey])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  // ── Contenu de la sidebar (partagé desktop + mobile) ────────────
  const SidebarContent = ({ onClose }) => (
    <>
      {/* Logo + bouton fermeture/collapse */}
      <div style={{
        padding        : '0.875rem 0.875rem',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'space-between',
        borderBottom   : '1px solid var(--color-border)',
        minHeight      : '68px',
        background     : isDay
          ? 'linear-gradient(135deg, #f9f4fc 0%, #f3e8f5 100%)'
          : 'var(--color-surface-2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
          {/* Conteneur logo avec fond adaptatif */}
          <div style={{
            width: '48px', height: '48px', flexShrink: 0,
            borderRadius: '10px',
            border: `2px solid ${isDay ? 'rgba(123,45,139,0.3)' : 'rgba(255,255,255,0.15)'}`,
            background: isDay ? '#fff' : 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDay
              ? '0 2px 8px rgba(123,45,139,0.2)'
              : '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <img
              src={logo}
              alt="Femmes Royales"
              style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
          {(!collapsed || isMobile) && (
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontFamily   : 'Poppins, sans-serif',
                fontWeight   : 800,
                fontSize     : '0.78rem',
                color        : 'var(--color-primary)',
                whiteSpace   : 'nowrap',
                letterSpacing: '0.12em',
                display      : 'block',
                lineHeight   : 1.1,
              }}>
                FEMMES
              </span>
              <span style={{
                fontFamily   : 'Poppins, sans-serif',
                fontWeight   : 800,
                fontSize     : '0.78rem',
                color        : 'var(--color-primary)',
                whiteSpace   : 'nowrap',
                letterSpacing: '0.12em',
                display      : 'block',
                lineHeight   : 1.1,
              }}>
                ROYALES
              </span>
            </div>
          )}
        </div>

        {/* Bouton fermeture — mobile uniquement dans le header */}
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              background: isDay ? 'rgba(123,45,139,0.08)' : 'rgba(255,255,255,0.08)',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              padding: '0.4rem',
              borderRadius: 8,
              display: 'flex',
              flexShrink: 0,
            }}
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Profil mini */}
      {(!collapsed || isMobile) && (
        <div style={{
          padding   : '0.875rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          background: isDay ? 'rgba(123,45,139,0.03)' : 'transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AvatarImg src={avatarUrl} name={displayName} size={40} />
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontWeight: 700, fontSize: '0.875rem',
                color: 'var(--color-text-primary)',
                margin: 0, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{displayName}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                <span style={{
                  background: 'var(--color-primary)', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 700,
                  padding: '0.1rem 0.45rem', borderRadius: '999px',
                  letterSpacing: '0.06em',
                }}>{rank}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {invitations} invitation{invitations !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/ambassador'}
            style={({ isActive }) => ({
              display       : 'flex',
              alignItems    : 'center',
              gap           : '0.75rem',
              padding       : (collapsed && !isMobile) ? '0.75rem 0' : '0.7rem 0.875rem',
              borderRadius  : '10px',
              textDecoration: 'none',
              fontWeight    : isActive ? 700 : 500,
              fontSize      : '0.875rem',
              justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start',
              background    : isActive
                ? (isDay ? 'rgba(123,45,139,0.1)' : 'var(--color-primary-subtle)')
                : 'transparent',
              color         : isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              borderLeft    : isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
              transition    : 'all 180ms ease',
            })}
            title={(collapsed && !isMobile) ? label : undefined}
          >
            <Icon size={20} strokeWidth={2} />
            {(!collapsed || isMobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bouton plier/déplier — desktop uniquement, juste avant déconnexion */}
      {!isMobile && (
        <div style={{ padding: '0.375rem 0.5rem', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              width          : '100%',
              display        : 'flex',
              alignItems     : 'center',
              justifyContent : collapsed ? 'center' : 'flex-start',
              gap            : '0.75rem',
              padding        : collapsed ? '0.7rem 0' : '0.7rem 0.875rem',
              background     : 'none',
              border         : 'none',
              borderRadius   : '10px',
              cursor         : 'pointer',
              color          : 'var(--color-text-muted)',
              fontSize       : '0.875rem',
              fontWeight     : 500,
              transition     : 'background 180ms, color 180ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDay ? 'rgba(123,45,139,0.08)' : 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'var(--color-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
              e.currentTarget.style.color = 'var(--color-text-muted)'
            }}
            title={collapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Réduire</span>}
          </button>
        </div>
      )}

      {/* Déconnexion */}
      <div style={{
        borderTop : '1px solid var(--color-border)',
        padding   : '0.625rem 0.5rem',
        background: isDay ? 'rgba(123,45,139,0.02)' : 'transparent',
      }}>
        <button
          onClick={handleLogout}
          style={{
            width          : '100%',
            display        : 'flex',
            alignItems     : 'center',
            justifyContent : (collapsed && !isMobile) ? 'center' : 'flex-start',
            gap            : '0.75rem',
            padding        : (collapsed && !isMobile) ? '0.7rem 0' : '0.7rem 0.875rem',
            background     : 'none',
            border         : 'none',
            borderRadius   : '10px',
            cursor         : 'pointer',
            color          : 'var(--color-text-muted)',
            fontSize       : '0.875rem',
            fontWeight     : 500,
            transition     : 'background 180ms, color 180ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#DC2626'
            e.currentTarget.style.background = 'rgba(220,38,38,0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-muted)'
            e.currentTarget.style.background = 'none'
          }}
          title="Déconnexion"
        >
          <LogOut size={18} />
          {(!collapsed || isMobile) && <span>Déconnexion</span>}
        </button>
      </div>
    </>
  )

  const sidebarW = collapsed ? '74px' : '240px'

  return (
    <div style={{
      minHeight  : '100vh',
      background : 'var(--color-surface)',
      display    : 'flex',
      color      : 'var(--color-text-primary)',
      fontFamily : 'Inter, sans-serif',
      transition : 'background 350ms ease',
      position   : 'relative',
    }}>

      {/* ══════════════════════════════════════════════
          DESKTOP — Sidebar fixe collapsible
      ══════════════════════════════════════════════ */}
      {!isMobile && (
        <aside style={{
          width        : sidebarW,
          minHeight    : '100vh',
          background   : isDay
            ? 'linear-gradient(180deg, #fdf8ff 0%, #f9f4fc 100%)'
            : 'var(--color-surface-2)',
          borderRight  : `1px solid ${isDay ? 'rgba(123,45,139,0.15)' : 'var(--color-border)'}`,
          boxShadow    : isDay ? '2px 0 16px rgba(123,45,139,0.08)' : 'none',
          display      : 'flex',
          flexDirection: 'column',
          transition   : 'width 280ms ease',
          overflowX    : 'hidden',
          position     : 'sticky',
          top          : 0,
          alignSelf    : 'flex-start',
          maxHeight    : '100vh',
          zIndex       : 50,
          flexShrink   : 0,
        }}>
          <SidebarContent onClose={() => {}} />
        </aside>
      )}

      {/* ══════════════════════════════════════════════
          MOBILE — Overlay + Drawer slide-in
      ══════════════════════════════════════════════ */}
      {isMobile && (
        <>
          {/* Overlay semi-transparent */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position  : 'fixed',
              inset     : 0,
              background: 'rgba(0,0,0,0.45)',
              zIndex    : 99,
              opacity   : drawerOpen ? 1 : 0,
              pointerEvents: drawerOpen ? 'auto' : 'none',
              transition: 'opacity 280ms ease',
              backdropFilter: drawerOpen ? 'blur(2px)' : 'none',
            }}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside style={{
            position     : 'fixed',
            top          : 0,
            left         : 0,
            width        : '280px',
            maxWidth     : '80vw',
            height       : '100dvh',
            background   : 'var(--color-surface-2)',
            borderRight  : '1px solid var(--color-border)',
            display      : 'flex',
            flexDirection: 'column',
            zIndex       : 100,
            transform    : drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition   : 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
            boxShadow    : drawerOpen ? '4px 0 32px rgba(0,0,0,0.18)' : 'none',
            overflowY    : 'auto',
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
          >
            <SidebarContent onClose={() => setDrawerOpen(false)} />
          </aside>
        </>
      )}

      {/* ══════════════════════════════════════════════
          CORPS principal
      ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top-bar */}
        <header style={{
          position      : 'sticky',
          top           : 0,
          zIndex        : 40,
          background    : 'var(--color-surface-2)',
          borderBottom  : '1px solid var(--color-border)',
          backdropFilter: 'blur(12px)',
          display       : 'flex',
          alignItems    : 'center',
          justifyContent: 'space-between',
          padding       : '0 1.25rem',
          height        : '64px',
          gap           : '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Hamburger — mobile uniquement */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-primary)', padding: '0.375rem',
                  borderRadius: 8, display: 'flex',
                }}
                aria-label="Ouvrir le menu"
              >
                <Menu size={22} />
              </button>
            )}

            {/* Avatar mobile dans la topbar */}
            {isMobile && (
              <button
                onClick={() => setDrawerOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="Menu profil"
              >
                <AvatarImg src={avatarUrl} name={displayName} size={32} />
              </button>
            )}

            <p style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700,
              fontSize  : isMobile ? '0.85rem' : '0.9rem',
              color     : 'var(--color-text-primary)',
              margin    : 0,
            }}>
              Bienvenue,{' '}
              <span style={{ color: 'var(--color-primary)' }}>{displayName}</span> !
            </p>
          </div>

          <ThemeSwitcher />
        </header>

        {/* Contenu page */}
        <main style={{
          flex      : 1,
          padding   : isMobile ? '1.25rem 1rem' : '2rem 1.5rem',
          maxWidth  : '1180px',
          width     : '100%',
          margin    : '0 auto',
          boxSizing : 'border-box',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export { AvatarImg }
