import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Color principal de la marca Transportes Araucaria
const COLOR_PRINCIPAL = '#1a56db';
const COLOR_INACTIVO = '#9ca3af';

/**
 * Layout de navegación por pestañas (tabs) de la aplicación.
 * Define las pantallas principales accesibles desde la barra inferior.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLOR_PRINCIPAL,
        tabBarInactiveTintColor: COLOR_INACTIVO,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: COLOR_PRINCIPAL,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Pantalla de inicio */}
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
          headerTitle: 'Transportes Araucaria',
        }}
      />

      {/* Pantalla de reservas */}
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          headerTitle: 'Mis Reservas',
        }}
      />

      {/* Pantalla de perfil */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          headerTitle: 'Mi Perfil',
        }}
      />
    </Tabs>
  );
}
