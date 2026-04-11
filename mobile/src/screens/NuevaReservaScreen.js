// Pantalla para crear una nueva reserva de traslado.
// Formulario completo con validación y conexión al backend.
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useReservas } from "../hooks/useReservas";
import { obtenerDestinos } from "../services/destinosService";
import BotonPrimario from "../components/BotonPrimario";
import CargandoIndicador from "../components/CargandoIndicador";
import { COLORES } from "../lib/config";

export default function NuevaReservaScreen({ navigation }) {
  const { crearReserva, verificarDisponibilidad } = useReservas();

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [pasajeros, setPasajeros] = useState("1");
  const [cargando, setCargando] = useState(false);
  const [destinos, setDestinos] = useState([]);
  const [cargandoDestinos, setCargandoDestinos] = useState(true);

  // Cargar destinos disponibles al montar la pantalla
  useEffect(() => {
    async function cargarDestinos() {
      try {
        const lista = await obtenerDestinos();
        setDestinos(lista);
      } catch (error) {
        console.error("[NuevaReserva] Error cargando destinos:", error);
      } finally {
        setCargandoDestinos(false);
      }
    }
    cargarDestinos();
  }, []);

  function validarCampos() {
    if (!nombre.trim()) return "El nombre es obligatorio.";
    if (!email.trim() || !email.includes("@")) return "Ingresa un email válido.";
    if (!telefono.trim()) return "El teléfono es obligatorio.";
    if (!origen.trim()) return "El origen es obligatorio.";
    if (!destino.trim()) return "El destino es obligatorio.";
    // Validar formato de fecha YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha.trim())) {
      return "La fecha debe tener el formato YYYY-MM-DD (ej: 2025-06-15).";
    }
    // Validar formato de hora HH:MM
    if (!/^\d{2}:\d{2}$/.test(hora.trim())) {
      return "La hora debe tener el formato HH:MM (ej: 10:30).";
    }
    const numPasajeros = parseInt(pasajeros, 10);
    if (isNaN(numPasajeros) || numPasajeros < 1 || numPasajeros > 10) {
      return "El número de pasajeros debe ser entre 1 y 10.";
    }
    return null;
  }

  async function handleEnviar() {
    const error = validarCampos();
    if (error) {
      Alert.alert("Datos incompletos", error);
      return;
    }

    setCargando(true);
    try {
      // Verificar disponibilidad antes de crear la reserva
      const disponibilidad = await verificarDisponibilidad({
        fecha,
        hora,
        origen,
        destino,
        pasajeros: parseInt(pasajeros, 10),
      });

      if (!disponibilidad?.disponible) {
        Alert.alert(
          "Sin disponibilidad",
          "No hay vehículos disponibles para los parámetros seleccionados. Intenta con otro horario."
        );
        setCargando(false);
        return;
      }

      // Crear la reserva
      const resultado = await crearReserva({
        nombre: nombre.trim(),
        email: email.trim(),
        telefono: telefono.trim(),
        origen: origen.trim(),
        destino: destino.trim(),
        fecha,
        hora,
        pasajeros: parseInt(pasajeros, 10),
      });

      Alert.alert(
        "¡Reserva creada! 🎉",
        `Tu reserva fue registrada con éxito.\nCódigo: ${resultado.codigoReserva || "—"}`,
        [
          {
            text: "Ver mis reservas",
            onPress: () => navigation.navigate("Reservas"),
          },
        ]
      );
    } catch (err) {
      const mensaje = err?.message || "Error al crear la reserva.";
      Alert.alert("Error", mensaje);
    } finally {
      setCargando(false);
    }
  }

  if (cargandoDestinos) {
    return <CargandoIndicador mensaje="Cargando destinos..." />;
  }

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Nueva Reserva de Traslado</Text>
      <Text style={estilos.subtitulo}>Completa los datos para tu traslado</Text>

      {/* Datos personales */}
      <Text style={estilos.seccion}>Datos personales</Text>
      <Campo label="Nombre completo" value={nombre} onChangeText={setNombre} placeholder="Juan Pérez" />
      <Campo label="Email" value={email} onChangeText={setEmail} placeholder="juan@correo.cl" keyboardType="email-address" autoCapitalize="none" />
      <Campo label="Teléfono" value={telefono} onChangeText={setTelefono} placeholder="+56 9 1234 5678" keyboardType="phone-pad" />

      {/* Datos del traslado */}
      <Text style={estilos.seccion}>Datos del traslado</Text>
      <Campo label="Origen" value={origen} onChangeText={setOrigen} placeholder="Temuco centro" />
      <Campo label="Destino" value={destino} onChangeText={setDestino} placeholder="Aeropuerto ZCO" />
      <Campo label="Fecha (YYYY-MM-DD)" value={fecha} onChangeText={setFecha} placeholder="2025-06-15" keyboardType="numeric" />
      <Campo label="Hora (HH:MM)" value={hora} onChangeText={setHora} placeholder="10:30" keyboardType="numeric" />
      <Campo
        label="Número de pasajeros"
        value={pasajeros}
        onChangeText={setPasajeros}
        placeholder="1"
        keyboardType="numeric"
      />

      {/* Botón de envío */}
      <BotonPrimario
        titulo="Solicitar Reserva"
        onPress={handleEnviar}
        cargando={cargando}
        estiloExtra={estilos.boton}
      />

      {/* Nota informativa */}
      <Text style={estilos.nota}>
        📧 Recibirás una confirmación por correo electrónico una vez procesada la reserva.
      </Text>
    </ScrollView>
  );
}

// Componente auxiliar de campo de texto
function Campo({ label, ...props }) {
  return (
    <View style={estilos.campoContenedor}>
      <Text style={estilos.etiqueta}>{label}</Text>
      <TextInput style={estilos.input} placeholderTextColor={COLORES.textoSecundario} {...props} />
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
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORES.texto,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: COLORES.textoSecundario,
    marginBottom: 20,
  },
  seccion: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORES.primario,
    marginTop: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 4,
  },
  campoContenedor: {
    marginBottom: 12,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORES.texto,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORES.blanco,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 15,
    color: COLORES.texto,
  },
  boton: {
    marginTop: 24,
    marginBottom: 12,
  },
  nota: {
    fontSize: 13,
    color: COLORES.textoSecundario,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },
});
