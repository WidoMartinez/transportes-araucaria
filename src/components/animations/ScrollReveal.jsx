import React from "react";
import { motion } from "framer-motion";

/**
 * Componente para animar la aparición de elementos al hacer scroll.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - El contenido a animar.
 * @param {'up' | 'down' | 'left' | 'right'} [props.direction='up'] - Dirección desde la que entra el elemento.
 * @param {number} [props.delay=0] - Retraso antes de iniciar la animación.
 * @param {number} [props.duration=0.5] - Duración de la animación.
 * @param {number} [props.distance=40] - Distancia recorrida en píxeles.
 * @param {boolean} [props.once=true] - Si la animación debe ocurrir solo una vez.
 * @param {string} [props.className] - Clases adicionales de Tailwind.
 */
const ScrollReveal = ({ 
  children, 
  direction = "up", 
  delay = 0, 
  duration = 0.5, 
  distance = 40,
  once = true,
  className = "" 
}) => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directions[direction] 
      }}
      whileInView={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      viewport={{ once }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.21, 0.47, 0.32, 0.98] // Cubic bezier suave para efecto premium
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
