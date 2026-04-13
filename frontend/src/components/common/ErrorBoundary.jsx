import { Component } from 'react'
import { Crown, RefreshCw } from 'lucide-react'

/**
 * Capture les erreurs de rendu React et affiche un fallback élégant.
 * Entoure les routes dans App.jsx pour éviter un écran blanc total.
 *
 * Usage :
 *   <ErrorBoundary>
 *     <MonComposant />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // En production, envoyer à un service de monitoring (ex: Sentry)
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    // Navigue vers la racine pour repartir proprement
    window.location.href = '/dashboard'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={styles.page}>
        {/* Halo décoratif */}
        <div style={styles.halo} />

        <div style={styles.card}>
          <div style={styles.iconWrap}>
            <Crown size={32} color="#D4AF37" />
          </div>

          <h1 style={styles.title}>Une erreur est survenue</h1>

          <p style={styles.subtitle}>
            L'application a rencontré un problème inattendu.
            <br />Vos données sont préservées.
          </p>

          {/* Détails techniques (accordéon discret) */}
          {this.state.error && (
            <details style={styles.details}>
              <summary style={styles.detailsSummary}>Détails techniques</summary>
              <pre style={styles.errorPre}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            className="btn btn-primary"
            style={styles.btn}
          >
            <RefreshCw size={16} />
            Retour au tableau de bord
          </button>
        </div>

        <p style={styles.footer}>
          <span style={{ fontFamily: 'Playfair Display, serif', color: '#D4AF37' }}>FEMMES ROYALES</span>
          {' '}· ICC Gabon
        </p>
      </div>
    )
  }
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #000000 0%, #0D0D0D 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
    position: 'relative',
    overflow: 'hidden',
  },
  halo: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    background: '#1A1A1A',
    border: '1px solid #2E2E2E',
    borderRadius: '16px',
    padding: '2.5rem 2rem',
    textAlign: 'center',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
    position: 'relative',
    zIndex: 1,
  },
  iconWrap: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: 'rgba(212,175,55,0.1)',
    border: '1px solid rgba(212,175,55,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
  },
  title: {
    fontFamily: 'Playfair Display, serif',
    fontSize: '1.5rem',
    color: '#F5F5F5',
    margin: '0 0 0.75rem',
  },
  subtitle: {
    color: '#B0B0B0',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    marginBottom: '1.5rem',
  },
  details: {
    background: '#0D0D0D',
    border: '1px solid #2E2E2E',
    borderRadius: '8px',
    padding: '0.75rem',
    marginBottom: '1.5rem',
    textAlign: 'left',
  },
  detailsSummary: {
    color: '#6B6B6B',
    fontSize: '0.8rem',
    cursor: 'pointer',
    userSelect: 'none',
  },
  errorPre: {
    color: '#FC8181',
    fontSize: '0.75rem',
    marginTop: '0.75rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.5,
  },
  btn: {
    width: '100%',
    justifyContent: 'center',
  },
  footer: {
    marginTop: '2rem',
    color: '#3A3A3A',
    fontSize: '0.8rem',
    position: 'relative',
    zIndex: 1,
  },
}
