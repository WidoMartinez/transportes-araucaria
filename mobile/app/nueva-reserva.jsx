import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { crearReserva } from '../services/api';

/**
 * Pantalla de creación de nueva reserva.
 * Permite al usuario ingresar los datos del viaje y crear la reserva.
 */
export default function NuevaReservaScreen() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  // Estado del formulario
  const [formulario, setFormulario] = useState({
    nombre_pasajero: '',
    email: '',
    telefono: '',
    origen: '',
    destino: '',
    fecha_viaje: '',
    hora_viaje: '',
    pasajeros: '1',
  });

  // Actualiza un campo del formulario por su clave
  const actualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  };

  // Valida que los campos obligatorios estén completos
  const validarFormulario = () => {
    const camposObligatorios = [
      'nombre_pasajero',
      'email',
      'telefono',
      'origen',
      'destino',
      'fecha_viaje',
      'hora_viaje',
    ];

    for (const campo of camposObligatorios) {
      if (!formulario[campo]?.trim()) {
        Alert.alert('Datos incompletos', 'Por favor completa todos los campos obligatorios.');
        return false;
      }
    }
    return true;
  };

  // Envía el formulario para crear la reserva
  const handleEnviar = async () => {
    if (!validarFormulario()) return;

    try {
      setEnviando(true);
      await crearReserva({
        ...formulario,
        pasajeros: parseInt(formulario.pasajeros, 10) || 1,
      });

      Alert.alert(
        '¡Reserva creada!',
        'Tu reserva ha sido registrada exitosamente.',
        [{ text: 'Ver mis reservas', onPress: () => router.replace('/reservas') }]
      );
    } catch (error) {
      console.error('[NuevaReservaScreen] Error al crear reserva:', error);
      Alert.alert(
        'Error al crear reserva',
        error.message || 'No se pudo crear la reserva. Intenta nuevamente.'
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.contenedor} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Nueva Reserva</Text>
        <Text style={styles.subtitulo}>Completa los datos para reservar tu traslado</Text>

        {/* Datos del pasajero */}
        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Datos del pasajero</Text>

          <CampoTexto
            etiqueta="Nombre completo *"
            valor={formulario.nombre_pasajero}
            onChange={(v) => actualizarCampo('nombre_pasajero', v)}
            placeholder="Ej: Juan Pérez"
          />

          <CampoTexto
            etiqueta="Correo electrónico *"
            valor={formulario.email}
            onChange={(v) => actualizarCampo('email', v)}
            placeholder="correo@ejemplo.com"
            teclado="email-address"
            autoCapitalize="none"
          />

          <CampoTexto
            etiqueta="Teléfono *"
            valor={formulario.telefono}
            onChange={(v) => actualizarCampo('telefono', v)}
            placeholder="+56 9 1234 5678"
            teclado="phone-pad"
          />
        </View>

        {/* Datos del viaje */}
        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Datos del viaje</Text>

          <CampoTexto
            etiqueta="Origen *"
            valor={formulario.origen}
            onChange={(v) => actualizarCampo('origen', v)}
            placeholder="Ej: Aeropuerto La Araucanía"
          />

          <CampoTexto
            etiqueta="Destino *"
            valor={formulario.destino}
            onChange={(v) => actualizarCampo('destino', v)}
            placeholder="Ej: Temuco Centro"
          />

          <CampoTexto
            etiqueta="Fecha del viaje *"
            valor={formulario.fecha_viaje}
            onChange={(v) => actualizarCampo('fecha_viaje', v)}
            placeholder="YYYY-MM-DD"
            teclado="numeric"
          />

          <CampoTexto
            etiqueta="Hora del viaje *"
            valor={formulario.hora_viaje}
            onChange={(v) => actualizarCampo('hora_viaje', v)}
            placeholder="HH:MM"
            teclado="numeric"
          />

          <CampoTexto
            etiqueta="Número de pasajeros"
            valor={formulario.pasajeros}
            onChange={(v) => actualizarCampo('pasajeros', v)}
            placeholder="1"
            teclado="numeric"
          />
        </View>

        {/* Botón de envío */}
        <TouchableOpacity
          style={[styles.botonEnviar, enviando && styles.botonDeshabilitado]}
          onPress={handleEnviar}
          disabled={enviando}
        >
          {enviando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
              <Text style={styles.botonEnviarTexto}>Confirmar Reserva</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Componente auxiliar de campo de texto con etiqueta.
 */
function CampoTexto({ etiqueta, valor, onChange, placeholder, teclado, autoCapitalize }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta}</Text>
      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={teclado || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  seccion: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tituloSeccion: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  campo: {
    gap: 4,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fafafa',
  },
  botonEnviar: {
    backgroundColor: '#1a56db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  botonEnviarTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
