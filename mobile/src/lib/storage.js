// Wrapper sobre AsyncStorage para persistir datos de sesión y preferencias.
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Guarda un valor en el almacenamiento local.
 * @param {string} clave - Clave de identificación.
 * @param {*} valor - Valor a guardar (se serializa a JSON).
 */
export async function guardar(clave, valor) {
  try {
    await AsyncStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    console.error(`[storage] Error al guardar "${clave}":`, error);
  }
}

/**
 * Recupera un valor del almacenamiento local.
 * @param {string} clave - Clave de identificación.
 * @returns {*} Valor deserializado o null si no existe.
 */
export async function obtener(clave) {
  try {
    const raw = await AsyncStorage.getItem(clave);
    return raw != null ? JSON.parse(raw) : null;
  } catch (error) {
    console.error(`[storage] Error al obtener "${clave}":`, error);
    return null;
  }
}

/**
 * Elimina un valor del almacenamiento local.
 * @param {string} clave - Clave de identificación.
 */
export async function eliminar(clave) {
  try {
    await AsyncStorage.removeItem(clave);
  } catch (error) {
    console.error(`[storage] Error al eliminar "${clave}":`, error);
  }
}

/**
 * Limpia todos los datos del almacenamiento local.
 */
export async function limpiarTodo() {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("[storage] Error al limpiar almacenamiento:", error);
  }
}
