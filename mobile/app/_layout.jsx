import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Mantener la pantalla de splash visible mientras se cargan los recursos
SplashScreen.preventAutoHideAsync();

/**
 * Layout raíz de la aplicación móvil Transportes Araucaria.
 * Configura el stack principal de navegación con Expo Router.
 */
export default function RootLayout() {
  useEffect(() => {
    // Ocultar la pantalla de splash cuando la app está lista
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        {/* Tabs principales de la app */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Pantalla de detalle de reserva */}
        <Stack.Screen
          name="reserva/[id]"
          options={{
            title: 'Detalle de Reserva',
            headerStyle: { backgroundColor: '#1a56db' },
            headerTintColor: '#fff',
          }}
        />
        {/* Pantalla de nueva reserva */}
        <Stack.Screen
          name="nueva-reserva"
          options={{
            title: 'Nueva Reserva',
            headerStyle: { backgroundColor: '#1a56db' },
            headerTintColor: '#fff',
          }}
        />
        {/* Pantalla 404 */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
