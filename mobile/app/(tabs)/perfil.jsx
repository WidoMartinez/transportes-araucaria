import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Pantalla de perfil del usuario.
 * Muestra información del usuario y opciones de cuenta.
 */
export default function PerfilScreen() {
  // Maneja el cierre de sesión del usuario
  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.contenedor} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar y nombre del usuario */}
        <View style={styles.seccionPerfil}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#ffffff" />
          </View>
          <Text style={styles.nombreUsuario}>Usuario</Text>
          <Text style={styles.emailUsuario}>usuario@example.com</Text>
        </View>

        {/* Opciones del menú */}
        <View style={styles.seccionMenu}>
          <Text style={styles.tituloSeccion}>Mi cuenta</Text>

          <TouchableOpacity style={styles.itemMenu}>
            <Ionicons name="person-outline" size={22} color="#1a56db" />
            <Text style={styles.textoItemMenu}>Datos personales</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemMenu}>
            <Ionicons name="calendar-outline" size={22} color="#1a56db" />
            <Text style={styles.textoItemMenu}>Historial de reservas</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemMenu}>
            <Ionicons name="notifications-outline" size={22} color="#1a56db" />
            <Text style={styles.textoItemMenu}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.seccionMenu}>
          <Text style={styles.tituloSeccion}>Soporte</Text>

          <TouchableOpacity style={styles.itemMenu}>
            <Ionicons name="help-circle-outline" size={22} color="#1a56db" />
            <Text style={styles.textoItemMenu}>Centro de ayuda</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.itemMenu}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text style={styles.textoItemMenu}>Contactar por WhatsApp</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity style={styles.botonCerrarSesion} onPress={handleCerrarSesion}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.textoCerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Versión de la app */}
        <Text style={styles.version}>Transportes Araucaria v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
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
  seccionPerfil: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1a56db',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  nombreUsuario: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  emailUsuario: {
    fontSize: 14,
    color: '#6b7280',
  },
  seccionMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tituloSeccion: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  textoItemMenu: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  textoCerrarSesion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#d1d5db',
  },
});
