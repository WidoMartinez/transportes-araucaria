/**
 * Utilidades de Validación de Pagos
 * 
 * Proporciona funciones centralizadas para validar y normalizar montos de pago
 * en todos los flujos del sistema, asegurando conversiones correctas en Google Ads.
 */

/**
 * Valida y normaliza montos de pago
 * 
 * @param {any} amount - Monto a validar (puede ser string, number, null, undefined)
 * @param {number} fallbackValue - Valor por defecto si el monto es inválido (default: 1.0)
 * @returns {number} Monto validado y normalizado a 2 decimales
 * 
 * @example
 * validatePaymentAmount(1500.5) // 1500.5
 * validatePaymentAmount("2000") // 2000
 * validatePaymentAmount(0) // 1.0 (fallback)
 * validatePaymentAmount(null) // 1.0 (fallback)
 */
export const validatePaymentAmount = (amount, fallbackValue = 1.0) => {
    // Intentar convertir a número
    const parsed = Number(amount);
    
    // Validar que sea un número válido y mayor a 0
    if (isNaN(parsed) || parsed <= 0) {
        console.warn(`⚠️ [PaymentValidation] Monto inválido detectado: "${amount}". Usando fallback: ${fallbackValue}`);
        return fallbackValue;
    }
    
    // Normalizar a 2 decimales para evitar problemas de precisión
    return Math.round(parsed * 100) / 100;
};

/**
 * Valida datos completos de pago antes de enviar al backend
 * 
 * @param {Object} paymentData - Objeto con datos del pago
 * @param {number|string} paymentData.amount - Monto del pago
 * @param {string} paymentData.email - Email del cliente
 * @param {string} paymentData.description - Descripción del pago
 * @returns {Object} Resultado de validación con estructura:
 *   - valid: boolean - Indica si los datos son válidos
 *   - error: string|null - Mensaje de error si valid es false
 *   - validatedAmount: number|null - Monto validado si valid es true
 * 
 * @example
 * validatePaymentData({ 
 *   amount: 1500, 
 *   email: "cliente@example.com", 
 *   description: "Reserva #123" 
 * })
 * // { valid: true, error: null, validatedAmount: 1500 }
 */
export const validatePaymentData = (paymentData) => {
    const { amount, email, description } = paymentData || {};
    
    // Validar monto
    const parsed = Number(amount);
    if (isNaN(parsed) || parsed <= 0) {
        return { 
            valid: false, 
            error: 'El monto de pago no es válido o debe ser mayor a 0', 
            validatedAmount: null 
        };
    }
    
    const validatedAmount = Math.round(parsed * 100) / 100;
    
    // Validar email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return { 
            valid: false, 
            error: 'El email no es válido', 
            validatedAmount: null 
        };
    }
    
    // Validar descripción
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return { 
            valid: false, 
            error: 'La descripción del pago es requerida', 
            validatedAmount: null 
        };
    }
    
    return { valid: true, error: null, validatedAmount };
};

/**
 * Valida que un monto esté dentro de un rango razonable
 * 
 * @param {number} amount - Monto a validar
 * @param {number} min - Monto mínimo permitido (default: 500 CLP)
 * @param {number} max - Monto máximo permitido (default: 10,000,000 CLP)
 * @returns {boolean} true si el monto está dentro del rango
 * 
 * @example
 * isAmountInRange(1500) // true
 * isAmountInRange(100) // false (menor al mínimo)
 * isAmountInRange(15000000) // false (mayor al máximo)
 */
export const isAmountInRange = (amount, min = 500, max = 10000000) => {
    const parsed = Number(amount);
    if (isNaN(parsed)) return false;
    return parsed >= min && parsed <= max;
};

/**
 * Formatea un monto para mostrar en la UI
 * 
 * @param {number|string} amount - Monto a formatear
 * @param {string} currency - Símbolo de moneda (default: '$')
 * @returns {string} Monto formateado (ej: "$1.500")
 * 
 * @example
 * formatAmount(1500) // "$1.500"
 * formatAmount(1500.50, 'CLP') // "CLP 1.500,50"
 */
export const formatAmount = (amount, currency = '$') => {
    const parsed = Number(amount);
    if (isNaN(parsed)) return `${currency}0`;
    
    return `${currency}${parsed.toLocaleString('es-CL', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
    })}`;
};
