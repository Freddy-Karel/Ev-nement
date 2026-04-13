import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, MapPin, Calendar, ArrowRight } from 'lucide-react'
import { formatEventDateRange } from '../../utils/dateUtils'
import './EventCarousel.css'

export default function EventCarousel({ events }) {
  // Garder seulement les 3 plus récents (triés par ID décroissant ou date, supposons qu'ils sont déjà triés par dates dans l'API ou on les inverse ici si besoin)
  // L'API renvoie souvent par ordre, on va juste prendre les 3 premiers.
  const topEvents = events.slice(0, 3)
  
  const [currentIndex, setCurrentIndex] = useState(0)
  const count = topEvents.length

  // Défilement automatique toutes les 5 secondes
  useEffect(() => {
    if (count <= 1) return // Pas de défilement si 1 ou 0 événement
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count)
    }, 7000)
    
    return () => clearInterval(timer)
  }, [count])

  const goToNext = () => setCurrentIndex((prev) => (prev + 1) % count)
  const goToPrev = () => setCurrentIndex((prev) => (prev - 1 + count) % count)

  if (count === 0) {
    // Fallback vide si aucun événement (on pourrait retourner null)
    return null
  }

  return (
    <div className="event-carousel-container">
      <div className="carousel-track">
        {topEvents.map((evt, index) => {
          const bgStyle = evt.bannerUrl
            ? { backgroundImage: `url(${evt.bannerUrl})` }
            : { background: 'linear-gradient(135deg, #7B2D8B 0%, #15143A 100%)' }

          const isActive = index === currentIndex
          const slideStyle = {
            ...bgStyle,
            position: 'absolute',
            inset: 0,
            opacity: isActive ? 1 : 0,
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 1.5s ease-in-out, transform 7s ease-out',
            zIndex: isActive ? 1 : 0,
            pointerEvents: isActive ? 'auto' : 'none'
          }

          return (
            <div key={evt.id} className="carousel-slide" style={slideStyle}>
              {/* Overlay léger uniquement en bas pour mettre en valeur les boutons sans gâcher l'affiche */}
              <div className="carousel-overlay" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%)' }}></div>
              
              {/* Contenu minimaliste positionné en bas */}
              <div className="carousel-content" style={{ justifyContent: 'flex-end', paddingBottom: '6rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                  <div className="carousel-badge" style={{ margin: 0 }}>
                    NOUVEL ÉVÉNEMENT
                  </div>
                  
                  <Link to={`/events/${evt.id}`} className="carousel-btn-primary">
                    Découvrir l'événement <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation (flèches + points) uniquement s'il y a > 1 événement */}
      {count > 1 && (
        <>
          <button className="carousel-arrow left" onClick={goToPrev} aria-label="Précédent">
            <ChevronLeft size={24} />
          </button>
          
          <button className="carousel-arrow right" onClick={goToNext} aria-label="Suivant">
            <ChevronRight size={24} />
          </button>

          <div className="carousel-dots">
            {topEvents.map((_, idx) => (
              <button 
                key={idx}
                className={`carousel-dot ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Aller à l'événement ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
