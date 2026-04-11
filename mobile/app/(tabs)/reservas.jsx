import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerReservas } from '../../services/api';

/**
 * Pantalla de listado de reservas del usuario.
 * Muestra las reservas activas e históricas consultando el backend.
 */
export default function ReservasScreen() {
  const router = useRouter();
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarReservas();
  }, []);

  // Carga la lista de reservas desde el backend
  const cargarReservas = async () => {
    try {
      setCargando(true);
      setError(null);
      const datos = await obtenerReservas();
      setReservas(datos);
    } catch (err) {
      setError('No se pudieron cargar las reservas. Intenta nuevamente.');
      console.error('[ReservasScreen] Error al cargar reservas:', err);
    } finally {
      setCargando(false);
    }
  };

  // Determina el color del estado de la reserva
  const colorEstado = (estado) => {
    const colores = {
      confirmada: '#10b981',
      pendiente: '#f59e0b',
      cancelada: '#ef4444',
      completada: '#6b7280',
    };
    return colores[estado] || '#6b7280';
  };

  // Renderiza cada item de la lista de reservas
  const renderReserva = ({ item }) => (
    <TouchableOpacity
      style={styles.tarjetaReserva}
      onPress={() => router.push(`/reserva/${item.id}`)}
    >
      <View style={styles.filaTarjeta}>
        <View>
          <Text style={styles.nombreReserva}>
            {item.nombre_pasajero || 'Sin nombre'}
          </Text>
          <Text style={styles.origenDestino}>
            {item.origen} → {item.destino}
          </Text>
          <Text style={styles.fechaReserva}>{item.fecha_viaje}</Text>
        </View>
        <View style={[styles.badgeEstado, { backgroundColor: colorEstado(item.estado) }]}>
          <Text style={styles.textoEstado}>{item.estado}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#1a56db" />
        <Text style={styles.textoCargando}>Cargando reservas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centrado}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.textoError}>{error}</Text>
        <TouchableOpacity style={styles.botonReintentar} onPress={cargarReservas}>
          <Text style={styles.botonReintentarTexto}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor} edges={['bottom']}>
      {reservas.length === 0 ? (
        <View style={styles.centrado}>
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text style={styles.textoVacio}>No tienes reservas aún</Text>
          <TouchableOpacity
            style={styles.botonNuevaReserva}
            onPress={() => router.push('/nueva-reserva')}
          >
            <Text style={styles.botonNuevaReservaTexto}>Crear primera reserva</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderReserva}
          contentContainerStyle={styles.lista}
          onRefresh={cargarReservas}
          refreshing={cargando}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  lista: {
    padding: 16,
    gap: 12,
  },
  tarjetaReserva: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filaTarjeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreReserva: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  origenDestino: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  fechaReserva: {
    fontSize: 12,
    color: '#9ca3af',
  },
  badgeEstado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  textoEstado: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  textoCargando: {
    fontSize: 14,
    color: '#6b7280',
  },
  textoError: {
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
  },
  textoVacio: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  botonReintentar: {
    backgroundColor: '#1a56db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  botonReintentarTexto: {
    color: '#ffffff',
    fontWeight: '600',
  },
  botonNuevaReserva: {
    backgroundColor: '#1a56db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  botonNuevaReservaTexto: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
