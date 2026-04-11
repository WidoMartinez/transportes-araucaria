// Configuración global de la app móvil de Transportes Araucanía.
// La URL del backend apunta al servidor en Render.com.

// URL base del backend (Render.com). Ajustar si cambia el dominio.
export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  "https://transportes-araucaria.onrender.com";

// Tiempo máximo de espera para peticiones HTTP (ms)
export const REQUEST_TIMEOUT = 15000;

// Nombre de la clave para almacenar el token de autenticación
export const TOKEN_KEY = "auth_token";

// Nombre de la clave para almacenar el usuario en sesión
export const USER_KEY = "auth_user";

// Colores principales de la marca Transportes Araucanía
export const COLORES = {
  primario: "#2563EB",      // Azul principal
  secundario: "#1E40AF",    // Azul oscuro
  acento: "#F59E0B",        // Amarillo acento
  fondo: "#F3F4F6",         // Fondo gris claro
  texto: "#111827",         // Texto oscuro
  textoSecundario: "#6B7280", // Texto gris
  exito: "#10B981",         // Verde éxito
  error: "#EF4444",         // Rojo error
  advertencia: "#F59E0B",   // Amarillo advertencia
  blanco: "#FFFFFF",
};
