import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar media queries y breakpoints responsivos
 * @param {string} query - Media query CSS (ej: '(min-width: 768px)')
 * @returns {boolean} - true si la media query coincide, false en caso contrario
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Establecer el estado inicial
    setMatches(media.matches);
    
    // Listener para cambios en el media query
    const listener = (event) => setMatches(event.matches);
    
    // Agregar listener (usando addListener para compatibilidad)
    if (media.addListener) {
      media.addListener(listener);
    } else {
      media.addEventListener('change', listener);
    }
    
    // Cleanup al desmontar
    return () => {
      if (media.removeListener) {
        media.removeListener(listener);
      } else {
        media.removeEventListener('change', listener);
      }
    };
  }, [query]);
  
  return matches;
}
