// Pantalla de lista de reservas del usuario.
// Carga las reservas del backend y las muestra con TarjetaReserva.
import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useReservas } from "../hooks/useReservas";
import TarjetaReserva from "../components/TarjetaReserva";
import CargandoIndicador from "../components/CargandoIndicador";
import BotonPrimario from "../components/BotonPrimario";
import { COLORES } from "../lib/config";

export default function ReservasScreen({ navigation }) {
  const { reservas, cargando, error, recargar } = useReservas();

  const renderItem = useCallback(
    ({ item }) => (
      <TarjetaReserva
        reserva={item}
        onPress={() => navigation.navigate("DetalleReserva", { reserva: item })}
      />
    ),
    [navigation]
  );

  // Estado: error
  if (error && !cargando) {
    return (
      <View style={estilos.centrado}>
        <Text style={estilos.errorIcono}>⚠️</Text>
        <Text style={estilos.errorTexto}>{error}</Text>
        <BotonPrimario titulo="Reintentar" onPress={recargar} estiloExtra={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      {/* Botón de nueva reserva */}
      <View style={estilos.barraAccion}>
        <Text style={estilos.titulo}>Mis Reservas</Text>
        <TouchableOpacity
          style={estilos.botonNueva}
          onPress={() => navigation.navigate("NuevaReserva")}
        >
          <Text style={estilos.botonNuevaTexto}>+ Nueva</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reservas}
        keyExtractor={(item) => String(item.id || item.codigoReserva)}
        renderItem={renderItem}
        contentContainerStyle={estilos.lista}
        refreshControl={
          <RefreshControl
            refreshing={cargando}
            onRefresh={recargar}
            colors={[COLORES.primario]}
            tintColor={COLORES.primario}
          />
        }
        ListEmptyComponent={
          !cargando && (
            <View style={estilos.centrado}>
              <Text style={estilos.vacioIcono}>🗓️</Text>
              <Text style={estilos.vacioTexto}>No tienes reservas aún.</Text>
              <BotonPrimario
                titulo="Crear primera reserva"
                onPress={() => navigation.navigate("NuevaReserva")}
                estiloExtra={{ marginTop: 16 }}
              />
            </View>
          )
        }
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  barraAccion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORES.blanco,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORES.texto,
  },
  botonNueva: {
    backgroundColor: COLORES.primario,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  botonNuevaTexto: {
    color: COLORES.blanco,
    fontWeight: "600",
    fontSize: 14,
  },
  lista: {
    padding: 16,
    flexGrow: 1,
  },
  centrado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorIcono: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorTexto: {
    fontSize: 15,
    color: COLORES.error,
    textAlign: "center",
  },
  vacioIcono: {
    fontSize: 48,
    marginBottom: 12,
  },
  vacioTexto: {
    fontSize: 16,
    color: COLORES.textoSecundario,
    textAlign: "center",
  },
});
