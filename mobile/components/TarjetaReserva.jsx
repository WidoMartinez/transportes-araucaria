import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente de tarjeta de reserva reutilizable.
 * Muestra el resumen de una reserva con estado visual.
 *
 * @param {Object} props
 * @param {Object} props.reserva - Datos de la reserva
 * @param {Function} props.onPress - Callback al presionar la tarjeta
 */
export default function TarjetaReserva({ reserva, onPress }) {
  // Mapeo de colores según el estado de la reserva
  const colorEstado = {
    confirmada: '#10b981',
    pendiente: '#f59e0b',
    cancelada: '#ef4444',
    completada: '#6b7280',
  };

  const color = colorEstado[reserva?.estado] || '#6b7280';

  return (
    <TouchableOpacity style={styles.tarjeta} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.fila}>
        {/* Icono y datos del viaje */}
        <View style={styles.icono}>
          <Ionicons name="car-outline" size={24} color="#1a56db" />
        </View>

        <View style={styles.info}>
          <Text style={styles.nombre} numberOfLines={1}>
            {reserva?.nombre_pasajero || 'Sin nombre'}
          </Text>
          <Text style={styles.ruta} numberOfLines={1}>
            {reserva?.origen} → {reserva?.destino}
          </Text>
          <Text style={styles.fecha}>{reserva?.fecha_viaje}</Text>
        </View>

        {/* Badge de estado */}
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeTexto}>{reserva?.estado}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  ruta: {
    fontSize: 13,
    color: '#6b7280',
  },
  fecha: {
    fontSize: 12,
    color: '#9ca3af',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
});
