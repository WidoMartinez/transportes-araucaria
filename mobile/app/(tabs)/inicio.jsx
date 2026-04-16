import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Número de WhatsApp de contacto de Transportes Araucaria
const WHATSAPP_NUMERO = '56912345678';

/**
 * Pantalla principal (Inicio) de la aplicación Transportes Araucaria.
 * Muestra el hero de bienvenida y acceso rápido a funciones principales.
 */
export default function InicioScreen() {
  const router = useRouter();

  // Abre WhatsApp con el número de soporte de Transportes Araucaria
  const handleWhatsApp = async () => {
    const url = `whatsapp://send?phone=${WHATSAPP_NUMERO}`;
    const soportado = await Linking.canOpenURL(url);
    if (soportado) {
      await Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp no disponible', 'Instala WhatsApp para usar esta función.');
    }
  };

  return (
    <SafeAreaView style={styles.contenedor} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Sección hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitulo}>Transportes Araucaria</Text>
          <Text style={styles.heroSubtitulo}>
            Traslados desde el Aeropuerto de La Araucanía
          </Text>
        </View>

        {/* Tarjeta de reserva rápida */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>¿A dónde vas?</Text>
          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={() => router.push('/nueva-reserva')}
          >
            <Ionicons name="airplane-outline" size={22} color="#fff" />
            <Text style={styles.botonTexto}>Reservar Traslado</Text>
          </TouchableOpacity>
        </View>

        {/* Accesos rápidos */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Accesos rápidos</Text>
          <View style={styles.gridAccesos}>
            <TouchableOpacity
              style={styles.tarjetaAcceso}
              onPress={() => router.push('/reservas')}
            >
              <Ionicons name="calendar-outline" size={30} color="#1a56db" />
              <Text style={styles.tarjetaAccesoTexto}>Mis Reservas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tarjetaAcceso}
              onPress={() => router.push('/perfil')}
            >
              <Ionicons name="person-outline" size={30} color="#1a56db" />
              <Text style={styles.tarjetaAccesoTexto}>Mi Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Información de contacto */}
        <View style={styles.seccionContacto}>
          <Text style={styles.seccionTitulo}>¿Necesitas ayuda?</Text>
          <TouchableOpacity style={styles.botonWhatsApp} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={22} color="#fff" />
            <Text style={styles.botonTexto}>Contactar por WhatsApp</Text>
          </TouchableOpacity>
        </View>
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
  hero: {
    backgroundColor: '#1a56db',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitulo: {
    fontSize: 14,
    color: '#bfdbfe',
    textAlign: 'center',
  },
  seccion: {
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  botonPrincipal: {
    backgroundColor: '#1a56db',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  botonTexto: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  gridAccesos: {
    flexDirection: 'row',
    gap: 12,
  },
  tarjetaAcceso: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tarjetaAccesoTexto: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  seccionContacto: {
    marginBottom: 20,
  },
  botonWhatsApp: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
