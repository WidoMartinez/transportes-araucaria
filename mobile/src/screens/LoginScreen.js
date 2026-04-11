// Pantalla de inicio de sesión para la app móvil.
// Se conecta con el endpoint POST /api/auth/login del backend.
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import BotonPrimario from "../components/BotonPrimario";
import { COLORES } from "../lib/config";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Datos incompletos", "Por favor ingresa tu email y contraseña.");
      return;
    }

    setCargando(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      const mensaje =
        error?.response?.data?.error ||
        error?.message ||
        "Error al iniciar sesión. Verifica tus credenciales.";
      Alert.alert("Error de acceso", mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={estilos.contenedor} keyboardShouldPersistTaps="handled">
        {/* Encabezado */}
        <View style={estilos.encabezado}>
          <Text style={estilos.logoTexto}>🚐</Text>
          <Text style={estilos.titulo}>Transportes Araucanía</Text>
          <Text style={estilos.subtitulo}>Inicia sesión para continuar</Text>
        </View>

        {/* Formulario */}
        <View style={estilos.formulario}>
          <Text style={estilos.etiqueta}>Correo electrónico</Text>
          <TextInput
            style={estilos.campo}
            placeholder="tu@correo.cl"
            placeholderTextColor={COLORES.textoSecundario}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={estilos.etiqueta}>Contraseña</Text>
          <TextInput
            style={estilos.campo}
            placeholder="••••••••"
            placeholderTextColor={COLORES.textoSecundario}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <BotonPrimario
            titulo="Ingresar"
            onPress={handleLogin}
            cargando={cargando}
            estiloExtra={{ marginTop: 24 }}
          />
        </View>

        <Text style={estilos.nota}>
          ¿Sin cuenta? Contacta al administrador del sistema.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    backgroundColor: COLORES.fondo,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  encabezado: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoTexto: {
    fontSize: 64,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORES.texto,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 15,
    color: COLORES.textoSecundario,
    marginTop: 6,
  },
  formulario: {
    width: "100%",
    maxWidth: 380,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORES.texto,
    marginBottom: 6,
    marginTop: 12,
  },
  campo: {
    backgroundColor: COLORES.blanco,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORES.texto,
  },
  nota: {
    marginTop: 32,
    fontSize: 13,
    color: COLORES.textoSecundario,
    textAlign: "center",
  },
});
