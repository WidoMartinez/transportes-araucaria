// Pantalla de perfil del usuario.
// Muestra datos del usuario autenticado y permite cerrar sesión.
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import BotonPrimario from "../components/BotonPrimario";
import { COLORES } from "../lib/config";

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();

  async function handleLogout() {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas cerrar tu sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  }

  // Obtener iniciales del nombre para el avatar
  const iniciales = usuario?.nombre
    ? usuario.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <ScrollView style={estilos.contenedor} contentContainerStyle={estilos.contenido}>
      {/* Avatar */}
      <View style={estilos.avatarContenedor}>
        <View style={estilos.avatar}>
          <Text style={estilos.avatarTexto}>{iniciales}</Text>
        </View>
        <Text style={estilos.nombre}>{usuario?.nombre || "Usuario"}</Text>
        <Text style={estilos.email}>{usuario?.email || ""}</Text>
      </View>

      {/* Información de la cuenta */}
      <View style={estilos.seccionCard}>
        <Text style={estilos.seccionTitulo}>Información de cuenta</Text>
        <FilaInfo icono="👤" label="Nombre" valor={usuario?.nombre || "—"} />
        <FilaInfo icono="📧" label="Email" valor={usuario?.email || "—"} />
        <FilaInfo icono="🔑" label="Rol" valor={usuario?.rol || "usuario"} />
      </View>

      {/* Acciones */}
      <View style={estilos.seccionCard}>
        <Text style={estilos.seccionTitulo}>Acciones</Text>
        <TouchableOpacity style={estilos.filaAccion}>
          <Text style={estilos.filaAccionIcono}>🔒</Text>
          <Text style={estilos.filaAccionTexto}>Cambiar contraseña</Text>
          <Text style={estilos.flecha}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={estilos.filaAccion}>
          <Text style={estilos.filaAccionIcono}>🔔</Text>
          <Text style={estilos.filaAccionTexto}>Notificaciones</Text>
          <Text style={estilos.flecha}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Botón cerrar sesión */}
      <BotonPrimario
        titulo="Cerrar sesión"
        onPress={handleLogout}
        estiloExtra={estilos.botonLogout}
      />

      <Text style={estilos.version}>Transportes Araucanía v1.0.0</Text>
    </ScrollView>
  );
}

// Fila de información
function FilaInfo({ icono, label, valor }) {
  return (
    <View style={estilos.filaInfo}>
      <Text style={estilos.filaInfoIcono}>{icono}</Text>
      <View>
        <Text style={estilos.filaInfoLabel}>{label}</Text>
        <Text style={estilos.filaInfoValor}>{valor}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarContenedor: {
    alignItems: "center",
    paddingVertical: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORES.primario,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarTexto: {
    color: COLORES.blanco,
    fontSize: 30,
    fontWeight: "700",
  },
  nombre: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORES.texto,
  },
  email: {
    fontSize: 14,
    color: COLORES.textoSecundario,
    marginTop: 4,
  },
  seccionCard: {
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  seccionTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORES.textoSecundario,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  filaInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  filaInfoIcono: {
    fontSize: 18,
    width: 28,
  },
  filaInfoLabel: {
    fontSize: 12,
    color: COLORES.textoSecundario,
  },
  filaInfoValor: {
    fontSize: 15,
    color: COLORES.texto,
    fontWeight: "500",
  },
  filaAccion: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filaAccionIcono: {
    fontSize: 18,
    width: 28,
  },
  filaAccionTexto: {
    flex: 1,
    fontSize: 15,
    color: COLORES.texto,
  },
  flecha: {
    fontSize: 20,
    color: COLORES.textoSecundario,
  },
  botonLogout: {
    backgroundColor: COLORES.error,
    marginTop: 8,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    color: COLORES.textoSecundario,
    marginTop: 24,
  },
});
