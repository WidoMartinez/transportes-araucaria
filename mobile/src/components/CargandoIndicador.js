// Indicador de carga centrado para mostrar mientras se esperan datos.
import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { COLORES } from "../lib/config";

/**
 * Muestra un spinner centrado con un mensaje opcional.
 * @param {string} mensaje - Texto debajo del spinner.
 */
export default function CargandoIndicador({ mensaje = "Cargando..." }) {
  return (
    <View style={estilos.contenedor}>
      <ActivityIndicator size="large" color={COLORES.primario} />
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  texto: {
    fontSize: 14,
    color: COLORES.textoSecundario,
    marginTop: 8,
  },
});
