// Helper para resolver la URL del backend de forma consistente.
// Devuelve:
// - la URL definida por VITE_BACKEND_URL o VITE_API_URL si existe,
// - "http://localhost:3001" cuando se ejecuta en localhost (desarrollo),
// - cadena vacía ('') en producción para usar llamadas relativas (misma procedencia).
// Comentarios y nombres en español según las instrucciones del proyecto.
export function getBackendUrl() {
  // Preferir la variable de entorno de Vite si está definida
  const envUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    // Remover la barra final si existe
    return envUrl.replace(/\/+$/, '');
  }

  // Si estamos en desarrollo local devolver el backend por defecto
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }

  // En producción devolvemos cadena vacía para usar rutas relativas
  return '';
}
