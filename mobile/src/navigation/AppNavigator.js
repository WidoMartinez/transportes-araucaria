// Navegador principal de la app.
// Decide si mostrar la pantalla de login o el TabNavigator
// según el estado de autenticación del usuario.
import React from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
import LoginScreen from "../screens/LoginScreen";
import TabNavigator from "./TabNavigator";
import NuevaReservaScreen from "../screens/NuevaReservaScreen";
import CargandoIndicador from "../components/CargandoIndicador";
import { COLORES } from "../lib/config";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { autenticado, cargando } = useAuth();

  // Muestra spinner mientras verifica la sesión guardada
  if (cargando) {
    return <CargandoIndicador mensaje="Iniciando aplicación..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORES.primario },
          headerTintColor: COLORES.blanco,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        {!autenticado ? (
          // Pantallas públicas (sin sesión)
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Pantallas privadas (con sesión)
          <>
            <Stack.Screen
              name="Main"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="NuevaReserva"
              component={NuevaReservaScreen}
              options={{ headerTitle: "Nueva Reserva", presentation: "modal" }}
            />
            <Stack.Screen
              name="DetalleReserva"
              component={DetalleReservaPlaceholder}
              options={{ headerTitle: "Detalle de Reserva" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Placeholder para pantalla de detalle (será implementada en próxima fase)
function DetalleReservaPlaceholder({ route }) {
  const { reserva } = route.params || {};
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: COLORES.fondo }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: COLORES.texto, marginBottom: 12 }}>
        {reserva?.codigoReserva || "Reserva"}
      </Text>
      <Text style={{ color: COLORES.textoSecundario }}>
        Próximamente: Vista detallada de la reserva con estado en tiempo real.
      </Text>
    </View>
  );
}
