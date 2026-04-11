// Tarjeta de reserva para mostrar en listas.
// Muestra el resumen de origen, destino, fecha y estado.
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORES } from "../lib/config";

// Mapeo de estados a colores e íconos de texto
const ESTADO_CONFIG = {
  pendiente:   { color: COLORES.advertencia, etiqueta: "Pendiente" },
  confirmada:  { color: COLORES.primario,     etiqueta: "Confirmada" },
  completada:  { color: COLORES.exito,        etiqueta: "Completada" },
  cancelada:   { color: COLORES.error,        etiqueta: "Cancelada" },
};

/**
 * Tarjeta que muestra el resumen de una reserva.
 * @param {object} reserva - Objeto de reserva del backend.
 * @param {function} onPress - Callback al presionar la tarjeta.
 */
export default function TarjetaReserva({ reserva, onPress }) {
  const config = ESTADO_CONFIG[reserva.estado] || ESTADO_CONFIG.pendiente;

  // Formatear fecha para mostrar
  const fechaFormateada = reserva.fecha
    ? new Date(reserva.fecha + "T00:00:00").toLocaleDateString("es-CL", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Sin fecha";

  return (
    <TouchableOpacity style={estilos.tarjeta} onPress={onPress} activeOpacity={0.85}>
      {/* Encabezado: código y estado */}
      <View style={estilos.encabezado}>
        <Text style={estilos.codigo}>{reserva.codigoReserva || "—"}</Text>
        <View style={[estilos.badgeEstado, { backgroundColor: config.color }]}>
          <Text style={estilos.textoEstado}>{config.etiqueta}</Text>
        </View>
      </View>

      {/* Ruta */}
      <Text style={estilos.ruta}>
        {reserva.origen || "—"}  →  {reserva.destino || "—"}
      </Text>

      {/* Fecha y hora */}
      <Text style={estilos.fecha}>
        {fechaFormateada}  ·  {reserva.hora || ""}
      </Text>

      {/* Pasajeros y monto */}
      <View style={estilos.pie}>
        <Text style={estilos.pasajeros}>👥 {reserva.pasajeros || 1} pasajero(s)</Text>
        {reserva.totalConDescuento != null && (
          <Text style={estilos.monto}>
            ${Number(reserva.totalConDescuento).toLocaleString("es-CL")}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  codigo: {
    fontWeight: "700",
    fontSize: 14,
    color: COLORES.texto,
  },
  badgeEstado: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  textoEstado: {
    color: COLORES.blanco,
    fontSize: 12,
    fontWeight: "600",
  },
  ruta: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORES.texto,
    marginBottom: 4,
  },
  fecha: {
    fontSize: 13,
    color: COLORES.textoSecundario,
    marginBottom: 8,
  },
  pie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pasajeros: {
    fontSize: 13,
    color: COLORES.textoSecundario,
  },
  monto: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORES.primario,
  },
});
