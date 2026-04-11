// Pantalla de inicio (Home) de la app móvil.
// Muestra un resumen rápido con accesos directos a las funciones principales.
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { COLORES } from "../lib/config";

// Tarjetas de acceso rápido a las funciones principales
const ACCESOS_RAPIDOS = [
  { icono: "🗓️", titulo: "Nueva Reserva",  descripcion: "Reserva un traslado", destino: "NuevaReserva" },
  { icono: "📋", titulo: "Mis Reservas",   descripcion: "Historial de traslados", destino: "Reservas" },
  { icono: "💳", titulo: "Pagos",          descripcion: "Historial de pagos",    destino: "Pagos" },
  { icono: "🗺️", titulo: "Destinos",       descripcion: "Ver rutas disponibles", destino: "Mapa" },
];

export default function HomeScreen({ navigation }) {
  const { usuario } = useAuth();
  const nombreUsuario = usuario?.nombre || usuario?.email || "Usuario";
  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "¡Buenos días" : hora < 19 ? "¡Buenas tardes" : "¡Buenas noches";

  return (
    <ScrollView style={estilos.contenedor} showsVerticalScrollIndicator={false}>
      {/* Saludo */}
      <View style={estilos.cabecera}>
        <Text style={estilos.saludo}>{saludo}, {nombreUsuario.split(" ")[0]}! 👋</Text>
        <Text style={estilos.subSaludo}>¿Qué necesitas hoy?</Text>
      </View>

      {/* Banner principal */}
      <View style={estilos.banner}>
        <Text style={estilos.bannerIcono}>🚐</Text>
        <Text style={estilos.bannerTitulo}>Transportes Araucanía</Text>
        <Text style={estilos.bannerSub}>Traslados al Aeropuerto de Temuco (ZCO)</Text>
      </View>

      {/* Accesos rápidos */}
      <Text style={estilos.seccionTitulo}>Accesos rápidos</Text>
      <View style={estilos.grilla}>
        {ACCESOS_RAPIDOS.map((item) => (
          <TouchableOpacity
            key={item.destino}
            style={estilos.tarjeta}
            onPress={() => navigation.navigate(item.destino)}
            activeOpacity={0.8}
          >
            <Text style={estilos.tarjetaIcono}>{item.icono}</Text>
            <Text style={estilos.tarjetaTitulo}>{item.titulo}</Text>
            <Text style={estilos.tarjetaDesc}>{item.descripcion}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Información de contacto */}
      <View style={estilos.infoContacto}>
        <Text style={estilos.infoTitulo}>¿Necesitas ayuda?</Text>
        <Text style={estilos.infoTexto}>📞 Contáctanos por WhatsApp para reservas especiales o grupos grandes.</Text>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: 16,
  },
  cabecera: {
    marginTop: 8,
    marginBottom: 20,
  },
  saludo: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORES.texto,
  },
  subSaludo: {
    fontSize: 14,
    color: COLORES.textoSecundario,
    marginTop: 4,
  },
  banner: {
    backgroundColor: COLORES.primario,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  bannerIcono: {
    fontSize: 40,
    marginBottom: 8,
  },
  bannerTitulo: {
    color: COLORES.blanco,
    fontSize: 20,
    fontWeight: "700",
  },
  bannerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  seccionTitulo: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORES.texto,
    marginBottom: 12,
  },
  grilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  tarjeta: {
    backgroundColor: COLORES.blanco,
    borderRadius: 14,
    padding: 16,
    width: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 3,
  },
  tarjetaIcono: {
    fontSize: 28,
    marginBottom: 8,
  },
  tarjetaTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORES.texto,
    marginBottom: 4,
  },
  tarjetaDesc: {
    fontSize: 12,
    color: COLORES.textoSecundario,
  },
  infoContacto: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: COLORES.primario,
  },
  infoTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORES.texto,
    marginBottom: 6,
  },
  infoTexto: {
    fontSize: 13,
    color: COLORES.textoSecundario,
    lineHeight: 20,
  },
});
