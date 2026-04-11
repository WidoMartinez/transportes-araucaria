# 📱 Transportes Araucaria — App Móvil

Aplicación móvil oficial de **Transportes Araucaria**, construida con [Expo](https://expo.dev/) (React Native). Permite a los usuarios reservar traslados desde el Aeropuerto de La Araucanía directamente desde su teléfono.

---

## 🛠️ Tecnologías

| Tecnología | Versión | Propósito |
|---|---|---|
| Expo SDK | ~52.0.0 | Framework principal |
| Expo Router | ~4.0.0 | Navegación basada en archivos |
| React Native | 0.76.x | UI nativa |
| React | 18.3.x | Librería UI |
| @expo/vector-icons | ^14.0.0 | Íconos (Ionicons) |
| react-native-reanimated | ~3.16.1 | Animaciones fluidas |

---

## 📂 Estructura de carpetas

```
mobile/
├── app/                        # Rutas de la app (Expo Router, file-based routing)
│   ├── _layout.jsx             # Layout raíz con navegación global
│   ├── +not-found.jsx          # Pantalla 404
│   ├── nueva-reserva.jsx       # Formulario de nueva reserva
│   ├── (tabs)/                 # Grupo de tabs principales
│   │   ├── _layout.jsx         # Configuración de la barra de tabs
│   │   ├── inicio.jsx          # Pantalla de inicio / home
│   │   ├── reservas.jsx        # Listado de reservas
│   │   └── perfil.jsx          # Perfil del usuario
│   └── reserva/
│       └── [id].jsx            # Detalle de una reserva (ruta dinámica)
├── components/                 # Componentes reutilizables
│   ├── TarjetaReserva.jsx      # Tarjeta resumen de reserva
│   ├── EstadoVacio.jsx         # Pantalla de lista vacía
│   └── CargandoIndicador.jsx   # Spinner de carga
├── services/
│   └── api.js                  # Cliente HTTP para el backend (Render.com)
├── assets/                     # Imágenes, íconos y fuentes
├── .env.example                # Variables de entorno de ejemplo
├── app.json                    # Configuración de Expo
├── babel.config.js             # Configuración de Babel
├── metro.config.js             # Configuración del bundler Metro
└── package.json                # Dependencias del proyecto móvil
```

---

## 🚀 Inicio rápido

### Requisitos previos

- **Node.js** ≥ 18
- **npm** o **pnpm**
- **Expo CLI** (`npm install -g expo-cli`)
- **Expo Go** en tu dispositivo Android/iOS (para pruebas rápidas)
- Alternativamente: **Android Studio** o **Xcode** para emuladores

### 1. Instalar dependencias

```bash
cd mobile
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y ajusta la URL del backend:

```bash
cp .env.example .env
```

Para desarrollo local (si tienes el backend corriendo en tu máquina):
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
```

Para conectar al backend de producción (Render.com):
```
EXPO_PUBLIC_BACKEND_URL=https://transportes-araucaria.onrender.com
```

### 3. Iniciar en modo desarrollo

```bash
# Inicia el servidor de desarrollo
npm start

# Para Android directamente
npm run android

# Para iOS directamente
npm run ios

# Para web (navegador)
npm run web
```

---

## 📱 Navegación

La app usa **Expo Router** con enrutamiento basado en archivos, similar a Next.js.

### Rutas principales

| Ruta | Pantalla | Descripción |
|---|---|---|
| `/(tabs)/inicio` | Inicio | Home de bienvenida con accesos rápidos |
| `/(tabs)/reservas` | Reservas | Listado de reservas del usuario |
| `/(tabs)/perfil` | Perfil | Datos y configuración del usuario |
| `/nueva-reserva` | Nueva Reserva | Formulario para crear una reserva |
| `/reserva/[id]` | Detalle | Detalle de una reserva específica |

---

## 🔌 API / Backend

El servicio `services/api.js` centraliza todas las llamadas al backend:

```js
import { obtenerReservas, crearReserva } from '../services/api';

// Listar reservas
const reservas = await obtenerReservas();

// Crear reserva
const nueva = await crearReserva({ nombre_pasajero: 'Juan', ... });
```

El backend está alojado en **Render.com**. La URL base se configura con la variable de entorno `EXPO_PUBLIC_BACKEND_URL`.

---

## 🧪 Pruebas en dispositivo físico

1. Instala **Expo Go** desde App Store o Google Play.
2. Ejecuta `npm start` en la terminal.
3. Escanea el QR con la cámara del teléfono (iOS) o con la app Expo Go (Android).

---

## 🏗️ Build de producción

Para generar el APK / IPA de producción, se utiliza **EAS Build**:

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Configurar el proyecto en Expo
eas build:configure

# Build para Android
eas build --platform android

# Build para iOS
eas build --platform ios
```

> Requiere cuenta en [expo.dev](https://expo.dev) y configuración de credenciales.

---

## 📝 Convenciones del proyecto

- **Idioma**: Todo el código, comentarios y documentación en **español**.
- **Componentes**: PascalCase (`TarjetaReserva.jsx`).
- **Variables/funciones**: camelCase (`cargarReservas`).
- **Estilos**: Objetos `StyleSheet` al final de cada archivo.
- **Comentarios**: Descriptivos en español, explicando el "por qué".

---

## 🔗 Recursos relacionados

- [Documentación Maestra del proyecto](../DOCUMENTACION_MAESTRA.md)
- [Expo Router Docs](https://expo.github.io/router/)
- [React Native Docs](https://reactnative.dev/)
- [Backend en Render.com](https://transportes-araucaria.onrender.com)
