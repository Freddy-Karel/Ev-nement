import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Calendar, LayoutDashboard, LogOut, User, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'
import ThemeSwitcher from '../common/ThemeSwitcher'
import Avatar from '../common/Avatar'
import toast from 'react-hot-toast'
import logo from '../../Logo/Logo.jpeg'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/admin/events', label: 'Événements', icon: Calendar },
]

export default function Header() {
  const { user, logout }            = useAuth()
  const { isDay }                   = useTheme()
  const navigate                    = useNavigate()
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [dropOpen,   setDropOpen]   = useState(false)
  const dropRef                     = useRef(null)

  /* Ferme le dropdown si clic extérieur */
  useEffect(() => {
    function handleOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleLogout = () => {
    setDropOpen(false)
    logout()
    toast.success('Déconnexion réussie')
    navigate('/login')
  }

  const displayName = user?.email?.split('@')[0] ?? 'Admin'
  const role        = user?.role ?? 'Administrateur'

  return (
    <header style={{
      background   : 'var(--header-bg)',
      borderBottom : '1px solid var(--header-border)',
      boxShadow    : 'var(--header-shadow)',
      position     : 'sticky',
      top          : 0,
      zIndex       : 50,
      transition   : 'background 350ms ease, border-color 350ms ease',
    }}>
      {/* ── Barre principale ──────────────────────────────────────── */}
      <div style={{
        maxWidth       : '1280px',
        margin         : '0 auto',
        padding        : '0 1.5rem',
        height         : '64px',
        display        : 'flex',
        alignItems     : 'center',
        justifyContent : 'space-between',
        gap            : '1rem',
      }}>

        {/* ── Logo FEMMES ROYALES ───────────────────────────────── */}
        <Link
          to="/dashboard"
          id="header-logo-link"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}
        >
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0,
            border: `2px solid ${isDay ? 'rgba(123,45,139,0.25)' : 'rgba(255,255,255,0.15)'}`,
            background: isDay ? '#F3E8F5' : 'rgba(255,255,255,0.06)',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isDay ? '0 2px 8px rgba(123,45,139,0.15)' : '0 2px 8px rgba(0,0,0,0.3)',
          }}>
            <img
              src={logo}
              alt="FEMMES ROYALES"
              style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px' }}
            />
          </div>
          <div style={{ lineHeight: 1.2 }} className="hide-mobile">
            <div style={{
              fontSize: '0.6rem', color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600,
            }}>
              Plateforme d'invitations
            </div>
          </div>
        </Link>

        {/* ── Navigation desktop ───────────────────────────────── */}
        <nav style={{ display: 'flex', gap: '0.25rem', flex: 1, justifyContent: 'center' }} className="hide-mobile">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.9rem', borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                transition: 'all 200ms ease',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Actions droite ─────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>

          {/* Switch thème */}
          <ThemeSwitcher />

          {/* Avatar + dropdown utilisateur */}
          {user && (
            <div ref={dropRef} style={{ position: 'relative' }}>
              {/* Déclencheur */}
              <button
                id="header-user-menu-btn"
                onClick={() => setDropOpen((v) => !v)}
                style={{
                  display    : 'flex',
                  alignItems : 'center',
                  gap        : '0.5rem',
                  background : 'none',
                  border     : `1px solid ${dropOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: '10px',
                  padding    : '0.35rem 0.625rem 0.35rem 0.35rem',
                  cursor     : 'pointer',
                  transition : 'all 200ms ease',
                  color      : 'var(--color-text-primary)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onMouseLeave={(e) => { if (!dropOpen) e.currentTarget.style.borderColor = 'var(--color-border)' }}
              >
                <Avatar name={displayName} size="sm" />
                <div style={{ lineHeight: 1.25, textAlign: 'left' }} className="hide-mobile">
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                    {role}
                  </div>
                </div>
                <ChevronDown
                  size={14}
                  style={{
                    color: 'var(--color-text-muted)',
                    transform: dropOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 200ms ease',
                  }}
                  className="hide-mobile"
                />
              </button>

              {/* Dropdown menu */}
              {dropOpen && (
                <div style={{
                  position   : 'absolute',
                  top        : 'calc(100% + 8px)',
                  right      : 0,
                  minWidth   : '200px',
                  background : 'var(--color-surface-2)',
                  border     : '1px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow  : 'var(--shadow-lg)',
                  overflow   : 'hidden',
                  zIndex     : 100,
                  animation  : 'fadeIn 0.15s ease',
                }}>
                  {/* En-tête utilisateur */}
                  <div style={{
                    padding    : '0.875rem 1rem',
                    borderBottom: '1px solid var(--color-border)',
                    display    : 'flex',
                    alignItems : 'center',
                    gap        : '0.75rem',
                  }}>
                    <Avatar name={displayName} size="md" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ padding: '0.375rem' }}>
                    <DropItem icon={User} label="Mon profil" onClick={() => setDropOpen(false)} />
                    <div style={{ height: '1px', background: 'var(--color-border)', margin: '0.25rem 0.5rem' }} />
                    <DropItem icon={LogOut} label="Déconnexion" onClick={handleLogout} danger />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Burger mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: 'none',
              border: `1px solid var(--color-border)`,
              borderRadius: '7px',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: '0.35rem',
              lineHeight: 0,
              display: 'none',
            }}
            className="show-mobile"
            aria-label="Menu"
          >
            <span style={{ fontSize: '1.1rem' }}>{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* ── Menu mobile ───────────────────────────────────────────── */}
      {menuOpen && (
        <div style={{
          borderTop  : '1px solid var(--color-border)',
          background : 'var(--header-bg)',
          padding    : '0.625rem 1.25rem 1rem',
        }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 0.75rem', borderRadius: '8px',
                textDecoration: 'none', fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-primary-subtle)' : 'transparent',
                marginBottom: '0.125rem',
              })}
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              marginTop: '0.5rem', padding: '0.625rem 0.75rem', borderRadius: '8px',
              border: 'none', background: 'none', cursor: 'pointer',
              color: '#DC2626', fontSize: '0.875rem', width: '100%', textAlign: 'left',
            }}
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </header>
  )
}

/* ── Dropdown item ─────────────────────────────────────────────── */
function DropItem({ icon: Icon, label, onClick, danger = false }) {
  const [hov, setHov] = useState(false)
  const col = danger
    ? (hov ? '#DC2626' : '#EF4444')
    : (hov ? 'var(--color-primary)' : 'var(--color-text-secondary)')

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display     : 'flex',
        alignItems  : 'center',
        gap         : '0.625rem',
        width       : '100%',
        padding     : '0.55rem 0.75rem',
        border      : 'none',
        borderRadius: '8px',
        background  : hov
          ? (danger ? 'rgba(220,38,38,0.07)' : 'var(--color-primary-subtle)')
          : 'transparent',
        color       : col,
        fontSize    : '0.875rem',
        cursor      : 'pointer',
        textAlign   : 'left',
        transition  : 'background 150ms ease, color 150ms ease',
        fontFamily  : 'Inter, sans-serif',
        fontWeight  : 500,
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
