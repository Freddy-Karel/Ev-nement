import { createContext, useCallback, useContext, useEffect, useState } from 'react'

/**
 * ThemeContext — gestion du double thème (diurne ICC / nocturne or).
 *
 * Fonctionnement :
 *  - La classe 'theme-day' ou 'theme-night' est appliquée sur <html>
 *  - Le choix est persisté dans localStorage (clé : 'icc-theme')
 *  - Par défaut : 'theme-day' (thème ICC diurne)
 *  - Le composant ThemeSwitcher consomme ce contexte pour afficher le bouton
 */

const ThemeContext = createContext(null)

const STORAGE_KEY = 'icc-theme'
const THEMES = { DAY: 'theme-day', NIGHT: 'theme-night' }

/** Applique la classe thème sur <html> en retirant l'autre. */
function applyTheme(theme) {
  const root = document.documentElement
  root.classList.remove(THEMES.DAY, THEMES.NIGHT)
  root.classList.add(theme)
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Lecture du choix persisté, sinon thème diurne par défaut
    return localStorage.getItem(STORAGE_KEY) || THEMES.DAY
  })

  // Applique le thème au montage et à chaque changement
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === THEMES.DAY ? THEMES.NIGHT : THEMES.DAY))
  }, [])

  const isDay   = theme === THEMES.DAY
  const isNight = theme === THEMES.NIGHT

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDay, isNight, THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Hook utilitaire — à utiliser dans n'importe quel composant. */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error(`useTheme doit être utilisé à l'intérieur de <ThemeProvider>`)
  return ctx
}
