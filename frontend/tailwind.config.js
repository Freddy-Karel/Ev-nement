/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ── Palette KHAYIL 2026 ──────────────────────────────────────
      colors: {
        black:    '#000000',
        white:    '#FFFFFF',
        gold:     '#D4AF37',
        'gold-light':  '#E8C84A',
        'gold-dark':   '#B8922A',
        'surface':     '#0D0D0D',   // fond principal (noir profond)
        'surface-2':   '#1A1A1A',   // cartes / panels
        'surface-3':   '#2A2A2A',   // hover, séparateurs
        'text-primary':   '#F5F5F5',
        'text-secondary': '#B0B0B0',
        'text-muted':     '#6B6B6B',
        'border':         '#2E2E2E',
        danger:   '#E53E3E',
        success:  '#38A169',
        warning:  '#D69E2E',
        info:     '#3182CE',
      },

      // ── Typographie ───────────────────────────────────────────────
      fontFamily: {
        serif:  ['"Playfair Display"', 'Georgia', 'serif'],
        sans:   ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display':  ['3.5rem',  { lineHeight: '1.1', fontWeight: '700' }],
        'heading':  ['2.25rem', { lineHeight: '1.2', fontWeight: '600' }],
        'title':    ['1.5rem',  { lineHeight: '1.3', fontWeight: '600' }],
        'subtitle': ['1.125rem',{ lineHeight: '1.4', fontWeight: '500' }],
      },

      // ── Ombres dorées ─────────────────────────────────────────────
      boxShadow: {
        'gold':   '0 0 20px rgba(212, 175, 55, 0.25)',
        'gold-lg':'0 0 40px rgba(212, 175, 55, 0.35)',
        'card':   '0 4px 24px rgba(0, 0, 0, 0.4)',
        'modal':  '0 25px 60px rgba(0, 0, 0, 0.7)',
      },

      // ── Dégradés ──────────────────────────────────────────────────
      backgroundImage: {
        'gold-gradient':  'linear-gradient(135deg, #D4AF37 0%, #B8922A 100%)',
        'dark-gradient':  'linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%)',
        'card-gradient':  'linear-gradient(135deg, #1A1A1A 0%, #0D0D0D 100%)',
      },

      // ── Bordures ──────────────────────────────────────────────────
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '24px',
      },

      // ── Transitions ───────────────────────────────────────────────
      transitionDuration: {
        DEFAULT: '200ms',
      },
    },
  },
  plugins: [],
}
