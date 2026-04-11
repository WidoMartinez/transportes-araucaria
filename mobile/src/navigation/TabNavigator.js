// Navegador de tabs principal de la app móvil de Transportes Araucanía.
// Contiene las cuatro secciones principales: Inicio, Reservas, Pagos, Destinos, Perfil.
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import ReservasScreen from "../screens/ReservasScreen";
import PagosScreen from "../screens/PagosScreen";
import MapaScreen from "../screens/MapaScreen";
import PerfilScreen from "../screens/PerfilScreen";
import { COLORES } from "../lib/config";

const Tab = createBottomTabNavigator();

// Íconos por tab usando emojis (sin dependencias externas)
const ICONOS = {
  Inicio: "🏠",
  Reservas: "🗓️",
  Pagos: "💳",
  Destinos: "🗺️",
  Perfil: "👤",
};

function TabIcono({ nombre, focused }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>
      {ICONOS[nombre]}
    </Text>
  );
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcono nombre={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: COLORES.primario,
        tabBarInactiveTintColor: COLORES.textoSecundario,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: COLORES.primario,
        },
        headerTintColor: COLORES.blanco,
        headerTitleStyle: {
          fontWeight: "700",
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{ headerTitle: "Transportes Araucanía" }}
      />
      <Tab.Screen
        name="Reservas"
        component={ReservasScreen}
        options={{ headerTitle: "Mis Reservas" }}
      />
      <Tab.Screen
        name="Pagos"
        component={PagosScreen}
        options={{ headerTitle: "Historial de Pagos" }}
      />
      <Tab.Screen
        name="Destinos"
        component={MapaScreen}
        options={{ headerTitle: "Destinos y Rutas" }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ headerTitle: "Mi Perfil" }}
      />
    </Tab.Navigator>
  );
}
