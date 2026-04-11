// Pantalla de destinos/mapa: muestra lista de destinos disponibles.
// En fases futuras incluirá integración con mapa interactivo.
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { obtenerDestinos } from "../services/destinosService";
import CargandoIndicador from "../components/CargandoIndicador";
import { COLORES } from "../lib/config";

export default function MapaScreen() {
  const [destinos, setDestinos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const lista = await obtenerDestinos();
        setDestinos(lista);
      } catch (err) {
        setError("Error al cargar destinos.");
        console.error("[MapaScreen]", err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  if (cargando) return <CargandoIndicador mensaje="Cargando destinos..." />;

  return (
    <View style={estilos.contenedor}>
      {/* Nota sobre mapa */}
      <View style={estilos.notaMapa}>
        <Text style={estilos.notaIcono}>🗺️</Text>
        <Text style={estilos.notaTexto}>
          Integración con mapa interactivo disponible en próxima versión.
        </Text>
      </View>

      <FlatList
        data={destinos}
        keyExtractor={(item, idx) => String(item.id || item.nombre || idx)}
        contentContainerStyle={estilos.lista}
        ListHeaderComponent={
          <Text style={estilos.titulo}>Destinos disponibles</Text>
        }
        ListEmptyComponent={
          !cargando && (
            <View style={estilos.vacio}>
              <Text style={estilos.vacioTexto}>
                {error || "No hay destinos registrados."}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={estilos.tarjeta} activeOpacity={0.8}>
            <View style={estilos.tarjetaIconoContenedor}>
              <Text style={estilos.tarjetaIcono}>📍</Text>
            </View>
            <View style={estilos.tarjetaContenido}>
              <Text style={estilos.tarjetaNombre}>{item.nombre || item.destino || "Destino"}</Text>
              {item.precioBase != null && (
                <Text style={estilos.tarjetaPrecio}>
                  Desde ${Number(item.precioBase).toLocaleString("es-CL")}
                </Text>
              )}
            </View>
            <Text style={estilos.flecha}>›</Text>
          </TouchableOpacity>
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
  notaMapa: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    margin: 16,
    padding: 12,
    borderRadius: 10,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORES.advertencia,
  },
  notaIcono: {
    fontSize: 20,
  },
  notaTexto: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    lineHeight: 18,
  },
  lista: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORES.texto,
    marginBottom: 12,
  },
  tarjeta: {
    backgroundColor: COLORES.blanco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tarjetaIconoContenedor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  tarjetaIcono: {
    fontSize: 20,
  },
  tarjetaContenido: {
    flex: 1,
  },
  tarjetaNombre: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORES.texto,
  },
  tarjetaPrecio: {
    fontSize: 13,
    color: COLORES.textoSecundario,
    marginTop: 2,
  },
  flecha: {
    fontSize: 20,
    color: COLORES.textoSecundario,
  },
  vacio: {
    alignItems: "center",
    padding: 32,
  },
  vacioTexto: {
    fontSize: 15,
    color: COLORES.textoSecundario,
    textAlign: "center",
  },
});
