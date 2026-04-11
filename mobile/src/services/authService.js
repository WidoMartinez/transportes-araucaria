// Servicio de autenticación para la app móvil.
// Usa los endpoints del backend en Render.com: /api/auth/*
import api from "./api";
import { guardar, obtener, eliminar } from "../lib/storage";
import { TOKEN_KEY, USER_KEY } from "../lib/config";

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, usuario: object }}
 */
export async function login(email, password) {
  const respuesta = await api.post("/api/auth/login", { email, password });
  const { token, usuario } = respuesta.data;

  // Guardar token y datos de usuario en almacenamiento local
  await guardar(TOKEN_KEY, token);
  await guardar(USER_KEY, usuario);

  return { token, usuario };
}

/**
 * Cierra la sesión del usuario actual.
 */
export async function logout() {
  try {
    await api.post("/api/auth/logout");
  } catch (error) {
    // Continuar con el cierre de sesión aunque falle la petición
    console.warn("[authService] Error al cerrar sesión en el servidor:", error);
  } finally {
    await eliminar(TOKEN_KEY);
    await eliminar(USER_KEY);
  }
}

/**
 * Recupera el usuario guardado en almacenamiento local.
 * @returns {object|null}
 */
export async function obtenerUsuarioGuardado() {
  return await obtener(USER_KEY);
}

/**
 * Recupera el token guardado en almacenamiento local.
 * @returns {string|null}
 */
export async function obtenerToken() {
  return await obtener(TOKEN_KEY);
}

/**
 * Verifica si la sesión actual sigue siendo válida con el backend.
 * @returns {boolean}
 */
export async function verificarSesion() {
  try {
    const respuesta = await api.get("/api/auth/verify");
    return respuesta.data?.valido === true;
  } catch {
    return false;
  }
}
