// Configuración base de Axios para llamadas al backend de Transportes Araucanía.
// El backend se aloja en Render.com.
import axios from "axios";
import { BACKEND_URL, REQUEST_TIMEOUT, TOKEN_KEY } from "../lib/config";
import { obtener } from "../lib/storage";

// Instancia principal de Axios con baseURL del backend
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de solicitudes: agrega el token JWT si existe en almacenamiento
api.interceptors.request.use(
  async (config) => {
    const token = await obtener(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuestas: manejo centralizado de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      console.error(`[api] Error ${status}:`, data?.error || data?.message || "Error del servidor");
    } else if (error.request) {
      console.error("[api] Sin respuesta del servidor. Verificar conexión.");
    } else {
      console.error("[api] Error de configuración:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
