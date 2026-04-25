// Pantalla de pagos: muestra historial de pagos de las reservas del usuario.
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import api from "../services/api";
import CargandoIndicador from "../components/CargandoIndicador";
import BotonPrimario from "../components/BotonPrimario";
import { COLORES } from "../lib/config";

export default function PagosScreen() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarPagos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // Endpoint de historial de pagos del usuario autenticado
      const respuesta = await api.get("/api/reservas/mis-reservas");
      const reservasConPago = (respuesta.data?.reservas || []).filter(
        (r) => r.estadoPago === "pagado" || r.flowToken
      );
      setPagos(reservasConPago);
    } catch (err) {
      setError("Error al cargar historial de pagos.");
      console.error("[PagosScreen]", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPagos();
  }, [cargarPagos]);

  if (cargando && pagos.length === 0) {
    return <CargandoIndicador mensaje="Cargando historial de pagos..." />;
  }

  if (error) {
    return (
      <View style={estilos.centrado}>
        <Text style={estilos.errorIcono}>⚠️</Text>
        <Text style={estilos.errorTexto}>{error}</Text>
        <BotonPrimario titulo="Reintentar" onPress={cargarPagos} estiloExtra={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <FlatList
        data={pagos}
        keyExtractor={(item) => String(item.id || item.codigoReserva)}
        contentContainerStyle={estilos.lista}
        refreshControl={
          <RefreshControl
            refreshing={cargando}
            onRefresh={cargarPagos}
            colors={[COLORES.primario]}
            tintColor={COLORES.primario}
          />
        }
        ListHeaderComponent={
          <Text style={estilos.encabezado}>Historial de Pagos</Text>
        }
        ListEmptyComponent={
          !cargando && (
            <View style={estilos.vacio}>
              <Text style={estilos.vacioIcono}>💳</Text>
              <Text style={estilos.vacioTexto}>No tienes pagos registrados.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={estilos.tarjeta}>
            {/* Código de reserva */}
            <View style={estilos.tarjetaEncabezado}>
              <Text style={estilos.codigo}>{item.codigoReserva || "—"}</Text>
              <View style={estilos.badgePagado}>
                <Text style={estilos.badgeTexto}>Pagado</Text>
              </View>
            </View>

            {/* Ruta */}
            <Text style={estilos.ruta}>
              {item.origen}  →  {item.destino}
            </Text>

            {/* Fecha */}
            <Text style={estilos.fecha}>{item.fecha}  ·  {item.hora}</Text>

            {/* Monto */}
            <Text style={estilos.monto}>
              ${Number(item.totalConDescuento || 0).toLocaleString("es-CL")}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  lista: {
    padding: 16,
    flexGrow: 1,
  },
  encabezado: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORES.texto,
    marginBottom: 16,
  },
  tarjeta: {
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  tarjetaEncabezado: {
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
  badgePagado: {
    backgroundColor: COLORES.exito,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeTexto: {
    color: COLORES.blanco,
    fontSize: 12,
    fontWeight: "600",
  },
  ruta: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORES.texto,
    marginBottom: 4,
  },
  fecha: {
    fontSize: 13,
    color: COLORES.textoSecundario,
    marginBottom: 8,
  },
  monto: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORES.primario,
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
  vacio: {
    alignItems: "center",
    paddingTop: 60,
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
