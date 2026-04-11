// Contexto de autenticación para la app móvil de Transportes Araucanía.
// Provee estado de sesión (usuario, token) y funciones de login/logout
// a toda la jerarquía de componentes.
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  login as loginService,
  logout as logoutService,
  obtenerUsuarioGuardado,
  verificarSesion,
} from "../services/authService";

const AuthContext = createContext(null);

/**
 * Proveedor del contexto de autenticación.
 * Envuelve la app para que todas las pantallas accedan al estado de sesión.
 */
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  // Al montar: verificar si hay sesión guardada
  useEffect(() => {
    async function inicializar() {
      try {
        const usuarioGuardado = await obtenerUsuarioGuardado();
        if (usuarioGuardado) {
          const sesionValida = await verificarSesion();
          if (sesionValida) {
            setUsuario(usuarioGuardado);
            setAutenticado(true);
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error al inicializar sesión:", error);
      } finally {
        setCargando(false);
      }
    }
    inicializar();
  }, []);

  /**
   * Inicia sesión con email y contraseña.
   */
  const login = useCallback(async (email, password) => {
    const { usuario: usuarioData } = await loginService(email, password);
    setUsuario(usuarioData);
    setAutenticado(true);
    return usuarioData;
  }, []);

  /**
   * Cierra la sesión del usuario.
   */
  const logout = useCallback(async () => {
    await logoutService();
    setUsuario(null);
    setAutenticado(false);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, autenticado, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de autenticación.
 * @returns {{ usuario, autenticado, cargando, login, logout }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
}
