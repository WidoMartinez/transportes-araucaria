// Punto de entrada de la app móvil de Transportes Araucanía.
// Envuelve la aplicación con el proveedor de autenticación y el navegador principal.
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/contexts/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AuthProvider>
  );
}
