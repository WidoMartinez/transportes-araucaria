import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Componente de estado vacío reutilizable.
 * Se muestra cuando una lista no tiene elementos.
 *
 * @param {Object} props
 * @param {string} props.icono - Nombre del icono de Ionicons
 * @param {string} props.mensaje - Texto principal a mostrar
 * @param {string} [props.accionTexto] - Texto del botón de acción (opcional)
 * @param {Function} [props.onAccion] - Callback del botón de acción (opcional)
 */
export default function EstadoVacio({ icono, mensaje, accionTexto, onAccion }) {
  return (
    <View style={styles.contenedor}>
      <Ionicons name={icono || 'search-outline'} size={64} color="#e5e7eb" />
      <Text style={styles.mensaje}>{mensaje}</Text>
      {accionTexto && onAccion && (
        <TouchableOpacity style={styles.boton} onPress={onAccion}>
          <Text style={styles.botonTexto}>{accionTexto}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  mensaje: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  boton: {
    backgroundColor: '#1a56db',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  botonTexto: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
