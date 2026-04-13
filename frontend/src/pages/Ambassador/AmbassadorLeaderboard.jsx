import { useEffect, useState } from 'react'
import { Trophy, Star } from 'lucide-react'
import ambassadorApi from '../../api/ambassador'
import AmbassadorLayout, { AvatarImg } from '../../components/layout/AmbassadorLayout'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'

const PODIUM_COLORS = {
  1: { main: '#D4AF37', light: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.5)'  },
  2: { main: '#9CA3AF', light: 'rgba(156,163,175,0.15)', border: 'rgba(156,163,175,0.5)' },
  3: { main: '#CD7F32', light: 'rgba(205,127,50,0.15)',  border: 'rgba(205,127,50,0.5)'  },
}

export default function AmbassadorLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading]         = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    ambassadorApi.getLeaderboard()
      .then(setLeaderboard)
      .catch((err) => console.error('Erreur classement', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AmbassadorLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <Loader size="lg" />
        </div>
      </AmbassadorLayout>
    )
  }

  const top3  = leaderboard.slice(0, 3)
  const others = leaderboard.slice(3)

  // Disposition visuelle : 2 – 1 – 3
  const podiumLayout = [
    { pos: 2, height: 150 },
    { pos: 1, height: 210 },
    { pos: 3, height: 110 },
  ]

  return (
    <AmbassadorLayout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* ── Titre ─────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '2.25rem',
            fontWeight: 800,
            margin: '0 0 0.5rem',
            color: 'var(--color-text-primary)',
          }}>
            Le Mur des Champions
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Découvrez les ambassadeurs ayant le plus grand impact.
          </p>
        </div>

        {/* ── Podium ─────────────────────────────────────────────── */}
        {/* 
          Architecture : chaque colonne est un flex-column.
          Le container aligne les bottoms → les marches reposent au même niveau.
          Les avatars flottent naturellement AU-DESSUS de leur marche, dans le flux normal.
        */}
        <div style={{
          display       : 'flex',
          alignItems    : 'flex-end',
          justifyContent: 'center',
          gap           : '0.75rem',
          marginBottom  : '3rem',
          padding       : '0 1rem',
        }}>
          {podiumLayout.map(({ pos, height }) => {
            const amb  = top3.find((a) => a.rankPosition === pos)
            const isMe = amb?.id === user?.id
            return (
              <PodiumStep
                key={pos}
                amb={amb}
                stepHeight={height}
                position={pos}
                isMe={isMe}
              />
            )
          })}
        </div>

        {/* ── Classement Général ─────────────────────────────────── */}
        <div style={{
          background  : 'var(--color-surface-2)',
          borderRadius: 20,
          padding     : '2rem',
          border      : '1px solid var(--color-border)',
          boxShadow   : 'var(--shadow-md)',
        }}>
          <div style={{
            display      : 'flex',
            justifyContent: 'space-between',
            alignItems   : 'center',
            marginBottom : '1.5rem',
            paddingBottom: '1rem',
            borderBottom : '1px solid var(--color-border)',
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Classement Général</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Top 20</span>
          </div>

          {others.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {others.map((amb) => {
                const isMe = amb.id === user?.id
                return (
                  <div key={amb.id} style={{
                    display      : 'flex',
                    alignItems   : 'center',
                    padding      : '1rem 1.5rem',
                    background   : isMe ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                    border       : `1px solid ${isMe ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    borderRadius : 16,
                    gap          : '1.5rem',
                  }}>
                    <div style={{ width: 30, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-muted)', textAlign: 'center' }}>
                      {amb.rankPosition}
                    </div>
                    <AvatarImg src={amb.avatarUrl} name={amb.displayName} size={48} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)', margin: '0 0 0.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {amb.displayName}
                        {isMe && <span style={{ fontSize: '0.65rem', background: 'var(--color-primary)', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: 99 }}>MOI</span>}
                      </p>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '0.1rem 0.6rem', borderRadius: 99 }}>
                        {amb.rank}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-primary)' }}>{amb.points} pts</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{amb.invitationCount} invitations</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <Star size={36} color="var(--color-text-muted)" style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: '0 0 0.4rem' }}>
                {leaderboard.length === 0
                  ? 'Aucun ambassadeur actif pour le moment.'
                  : 'Vous faites partie du Top 3 ! Continuez à inviter pour garder votre avance. 🏆'}
              </p>
            </div>
          )}
        </div>

      </div>
    </AmbassadorLayout>
  )
}

/* ──────────────────────────────────────────────────────────────────
   PodiumStep — layout en flux normal (pas d'absolute)
   Chaque colonne = [avatar + info] + [marche].
   Le container parent align-items:flex-end aligne les marches en bas.
─────────────────────────────────────────────────────────────────── */
function PodiumStep({ amb, stepHeight, position, isMe }) {
  const { main: color, light, border } = PODIUM_COLORS[position]
  const isWinner = position === 1
  const hasUser  = !!amb
  const avatarSize = isWinner ? 80 : 60

  return (
    <div style={{
      display       : 'flex',
      flexDirection : 'column',
      alignItems    : 'center',
      flex          : 1,
      maxWidth      : 200,
    }}>

      {/* ── Section avatar + nom (dans le flux, au-dessus de la marche) ── */}
      <div style={{
        display       : 'flex',
        flexDirection : 'column',
        alignItems    : 'center',
        paddingBottom : '0.75rem',
        gap           : '0.375rem',
      }}>
        {/* Trophée position 1 */}
        {isWinner && hasUser && (
          <Trophy
            size={32}
            color={color}
            fill={color}
            style={{ marginBottom: '-8px', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.25))' }}
          />
        )}

        {/* Avatar ou cercle vide */}
        <div style={{ position: 'relative' }}>
          {hasUser ? (
            <div style={{
              borderRadius : '50%',
              padding      : isMe ? '3px' : '0',
              background   : isMe ? `linear-gradient(135deg, ${color}, #fff)` : 'transparent',
            }}>
              <AvatarImg src={amb.avatarUrl} name={amb.displayName} size={avatarSize} />
            </div>
          ) : (
            <div style={{
              width         : avatarSize,
              height        : avatarSize,
              borderRadius  : '50%',
              border        : `3px dashed ${border}`,
              display       : 'flex',
              alignItems    : 'center',
              justifyContent: 'center',
              color         : border,
              fontSize      : '1.6rem',
              background    : light,
            }}>?</div>
          )}

          {/* Badge numéro */}
          <div style={{
            position      : 'absolute',
            bottom        : -5,
            right         : -5,
            width         : 24,
            height        : 24,
            borderRadius  : '50%',
            background    : color,
            display       : 'flex',
            alignItems    : 'center',
            justifyContent: 'center',
            color         : position === 1 ? '#1a1a1a' : '#fff',
            fontWeight    : 800,
            fontSize      : '0.7rem',
            border        : '2px solid var(--color-surface)',
            boxShadow     : '0 2px 6px rgba(0,0,0,0.2)',
          }}>
            {position}
          </div>
        </div>

        {/* Nom + rang */}
        {hasUser ? (
          <>
            <p style={{
              fontWeight : 800,
              fontSize   : isWinner ? '0.95rem' : '0.825rem',
              color      : 'var(--color-text-primary)',
              margin     : 0,
              textAlign  : 'center',
              maxWidth   : 140,
              overflow   : 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace : 'nowrap',
            }}>
              {amb.displayName}{isMe ? ' 👤' : ''}
            </p>
            <span style={{
              fontSize  : '0.68rem',
              fontWeight: 700,
              color     : color,
              background: light,
              padding   : '0.15rem 0.6rem',
              borderRadius: 99,
              border    : `1px solid ${border}`,
            }}>
              {amb.rank}
            </span>
          </>
        ) : (
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: border, margin: 0, textAlign: 'center' }}>
            Place libre
          </p>
        )}
      </div>

      {/* ── Marche du podium ── */}
      <div style={{
        width               : '100%',
        height              : stepHeight,
        background          : hasUser ? light : 'var(--color-surface-3)',
        border              : `2px solid ${hasUser ? border : 'var(--color-border)'}`,
        borderTop           : `4px solid ${color}`,
        borderTopLeftRadius : 14,
        borderTopRightRadius: 14,
        display             : 'flex',
        flexDirection       : 'column',
        alignItems          : 'center',
        justifyContent      : 'center',
        gap                 : '0.2rem',
        boxShadow           : hasUser ? `0 4px 20px ${color}25, inset 0 1px 0 ${color}33` : 'none',
        transition          : 'all 300ms ease',
      }}>
        {hasUser ? (
          <>
            <div style={{ fontSize: isWinner ? '1.4rem' : '1.1rem', fontWeight: 800, color }}>{amb.points} pts</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{amb.invitationCount} invit{amb.invitationCount !== 1 ? 's' : ''}</div>
          </>
        ) : (
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', opacity: 0.6, fontWeight: 600 }}>—</div>
        )}
      </div>

    </div>
  )
}
