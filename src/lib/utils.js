import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un monto en pesos chilenos (CLP)
 * @param {number} amount - Monto a formatear
 * @returns {string} Monto formateado como moneda chilena
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(amount || 0);
}
