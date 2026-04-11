# App Móvil — Transportes Araucanía

Aplicación móvil desarrollada con **Expo** y **React Native** para Android e iOS.

## 🚀 Inicio rápido

```bash
# 1. Instalar dependencias
cd mobile
npm install

# 2. Iniciar el servidor de desarrollo
npm start

# 3. Ejecutar en Android
npm run android

# 4. Ejecutar en iOS (macOS requerido)
npm run ios
```

## 📁 Estructura del proyecto

```
mobile/
├── App.js                    # Punto de entrada principal
├── app.json                  # Configuración de Expo
├── assets/                   # Imágenes, íconos y splash
├── src/
│   ├── components/           # Componentes reutilizables
│   │   ├── BotonPrimario.js
│   │   ├── CargandoIndicador.js
│   │   └── TarjetaReserva.js
│   ├── contexts/             # Contextos de React
│   │   └── AuthContext.js    # Autenticación y sesión
│   ├── hooks/                # Hooks personalizados
│   │   └── useReservas.js
│   ├── lib/                  # Configuración y utilidades
│   │   ├── config.js         # URL del backend, colores
│   │   └── storage.js        # Wrapper de AsyncStorage
│   ├── navigation/           # Navegación de la app
│   │   ├── AppNavigator.js   # Navegador raíz
│   │   └── TabNavigator.js   # Navegador de tabs
│   ├── screens/              # Pantallas de la app
│   │   ├── HomeScreen.js     # Pantalla de inicio
│   │   ├── LoginScreen.js    # Inicio de sesión
│   │   ├── ReservasScreen.js # Lista de reservas
│   │   ├── NuevaReservaScreen.js # Crear nueva reserva
│   │   ├── PagosScreen.js    # Historial de pagos
│   │   ├── MapaScreen.js     # Destinos disponibles
│   │   └── PerfilScreen.js   # Perfil de usuario
│   └── services/             # Capa de servicios API
│       ├── api.js            # Cliente Axios configurado
│       ├── authService.js    # Autenticación
│       ├── reservasService.js # Reservas
│       └── destinosService.js # Destinos y precios
```

## 🔌 Conexión con el Backend

El backend se aloja en **Render.com**. La URL se configura mediante la variable de entorno `EXPO_PUBLIC_BACKEND_URL` o por defecto apunta a:

```
https://transportes-araucaria.onrender.com
```

Para desarrollo local, crea un archivo `.env.local` en esta carpeta:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8080
```

## 📡 Endpoints del backend utilizados

| Módulo       | Método | Endpoint                                | Descripción                    |
|--------------|--------|-----------------------------------------|-------------------------------|
| Auth         | POST   | `/api/auth/login`                       | Inicio de sesión               |
| Auth         | POST   | `/api/auth/logout`                      | Cierre de sesión               |
| Auth         | GET    | `/api/auth/verify`                      | Verificar sesión activa        |
| Reservas     | POST   | `/enviar-reserva`                       | Crear nueva reserva            |
| Reservas     | GET    | `/api/reservas/mis-reservas`            | Reservas del usuario           |
| Disponibilidad | POST | `/api/disponibilidad/verificar`         | Verificar disponibilidad       |
| Destinos     | GET    | `/api/destinos`                         | Lista de destinos              |
| Precios      | GET    | `/pricing`                              | Tarifas por tipo de vehículo   |

## 📱 Fases de implementación

- [x] **Fase 1**: Estructura del proyecto y configuración base
- [x] **Fase 2**: Autenticación y gestión de sesión
- [x] **Fase 3**: Pantalla de Inicio (Home)
- [x] **Fase 4**: Módulo de Reservas (lista y creación)
- [x] **Fase 5**: Módulo de Pagos (historial)
- [x] **Fase 6**: Módulo de Destinos
- [x] **Fase 7**: Perfil de usuario
- [ ] **Fase 8**: Notificaciones push (expo-notifications)
- [ ] **Fase 9**: Integración con mapa interactivo (react-native-maps)
- [ ] **Fase 10**: Publicación en App Store y Google Play

## 🛠️ Tecnologías

- **Expo SDK 54** — Framework de desarrollo móvil
- **React Native 0.81** — Base de la aplicación
- **React Navigation 6** — Sistema de navegación
- **Axios** — Cliente HTTP para el backend
- **AsyncStorage** — Persistencia de datos locales

## 📝 Notas importantes

- El backend de pagos se mantiene en **Render.com** (no modificar).
- Las notificaciones por correo usan **PHPMailer** en **Hostinger** (sin cambios).
- Los archivos PHP del frontend están en **Hostinger** (despliegue manual).
