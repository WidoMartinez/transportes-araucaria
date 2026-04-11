// Botón principal estilizado con los colores de Transportes Araucanía.
import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORES } from "../lib/config";

/**
 * Botón primario de la app.
 * @param {string} titulo - Texto del botón.
 * @param {function} onPress - Función al presionar.
 * @param {boolean} cargando - Muestra spinner si es true.
 * @param {boolean} deshabilitado - Deshabilita el botón.
 * @param {object} estiloExtra - Estilos adicionales para el contenedor.
 */
export default function BotonPrimario({ titulo, onPress, cargando = false, deshabilitado = false, estiloExtra }) {
  return (
    <TouchableOpacity
      style={[
        estilos.boton,
        (deshabilitado || cargando) && estilos.deshabilitado,
        estiloExtra,
      ]}
      onPress={onPress}
      disabled={deshabilitado || cargando}
      activeOpacity={0.8}
    >
      {cargando ? (
        <ActivityIndicator color={COLORES.blanco} size="small" />
      ) : (
        <Text style={estilos.texto}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  boton: {
    backgroundColor: COLORES.primario,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deshabilitado: {
    backgroundColor: COLORES.textoSecundario,
    opacity: 0.7,
  },
  texto: {
    color: COLORES.blanco,
    fontSize: 16,
    fontWeight: "600",
  },
});
