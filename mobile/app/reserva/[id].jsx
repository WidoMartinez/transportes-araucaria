import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerReserva } from '../../services/api';

/**
 * Pantalla de detalle de una reserva específica.
 * Accesible desde la lista de reservas o mediante enlace directo.
 */
export default function DetalleReservaScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [reserva, setReserva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      cargarReserva();
    }
  }, [id]);

  // Carga el detalle de la reserva desde el backend
  const cargarReserva = async () => {
    try {
      setCargando(true);
      setError(null);
      const datos = await obtenerReserva(id);
      setReserva(datos);
    } catch (err) {
      setError('No se pudo cargar el detalle de la reserva.');
      console.error('[DetalleReservaScreen] Error:', err);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#1a56db" />
      </View>
    );
  }

  if (error || !reserva) {
    return (
      <View style={styles.centrado}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.textoError}>{error || 'Reserva no encontrada'}</Text>
        <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
          <Text style={styles.botonVolverTexto}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cabecera de la reserva */}
        <View style={styles.cabecera}>
          <Text style={styles.idReserva}>Reserva #{reserva.id}</Text>
          <View style={styles.badgeEstado}>
            <Text style={styles.textoEstado}>{reserva.estado}</Text>
          </View>
        </View>

        {/* Datos del viaje */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Información del viaje</Text>
          <ItemDetalle icono="location-outline" etiqueta="Origen" valor={reserva.origen} />
          <ItemDetalle icono="navigate-outline" etiqueta="Destino" valor={reserva.destino} />
          <ItemDetalle icono="calendar-outline" etiqueta="Fecha" valor={reserva.fecha_viaje} />
          <ItemDetalle icono="time-outline" etiqueta="Hora" valor={reserva.hora_viaje} />
          <ItemDetalle icono="people-outline" etiqueta="Pasajeros" valor={String(reserva.pasajeros)} />
        </View>

        {/* Datos del pasajero */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Datos del pasajero</Text>
          <ItemDetalle icono="person-outline" etiqueta="Nombre" valor={reserva.nombre_pasajero} />
          <ItemDetalle icono="call-outline" etiqueta="Teléfono" valor={reserva.telefono} />
          <ItemDetalle icono="mail-outline" etiqueta="Email" valor={reserva.email} />
        </View>

        {/* Información de pago */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Pago</Text>
          <ItemDetalle
            icono="cash-outline"
            etiqueta="Total"
            valor={`$${Number(reserva.monto_total || 0).toLocaleString('es-CL')}`}
          />
          <ItemDetalle icono="card-outline" etiqueta="Estado pago" valor={reserva.estado_pago} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Componente auxiliar para mostrar un item de detalle con icono, etiqueta y valor.
 */
function ItemDetalle({ icono, etiqueta, valor }) {
  return (
    <View style={styles.itemDetalle}>
      <Ionicons name={icono} size={18} color="#1a56db" />
      <View style={styles.itemDetalleTexto}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        <Text style={styles.valor}>{valor || '-'}</Text>
      </View>
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
    gap: 16,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  textoError: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idReserva: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  badgeEstado: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  textoEstado: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tarjeta: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  itemDetalle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  itemDetalleTexto: {
    flex: 1,
  },
  etiqueta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  valor: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  botonVolver: {
    backgroundColor: '#1a56db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  botonVolverTexto: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
