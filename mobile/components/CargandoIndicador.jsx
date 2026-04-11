import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

/**
 * Componente de indicador de carga reutilizable.
 * Se muestra mientras se esperan datos del servidor.
 *
 * @param {Object} props
 * @param {string} [props.mensaje] - Texto opcional debajo del spinner
 */
export default function CargandoIndicador({ mensaje }) {
  return (
    <View style={styles.contenedor}>
      <ActivityIndicator size="large" color="#1a56db" />
      {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  mensaje: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
