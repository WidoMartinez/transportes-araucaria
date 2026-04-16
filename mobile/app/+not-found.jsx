import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Pantalla 404 - Ruta no encontrada.
 * Se muestra cuando el usuario navega a una ruta que no existe.
 */
export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.contenedor}>
      <Ionicons name="compass-outline" size={80} color="#d1d5db" />
      <Text style={styles.codigo}>404</Text>
      <Text style={styles.titulo}>Página no encontrada</Text>
      <Text style={styles.descripcion}>
        La pantalla que buscas no existe o fue movida.
      </Text>
      <TouchableOpacity
        style={styles.boton}
        onPress={() => router.replace('/(tabs)/inicio')}
      >
        <Ionicons name="home-outline" size={18} color="#fff" />
        <Text style={styles.botonTexto}>Ir al inicio</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  codigo: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#e5e7eb',
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  descripcion: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  boton: {
    backgroundColor: '#1a56db',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  botonTexto: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
