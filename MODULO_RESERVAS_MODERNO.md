# Módulo de Reservas Moderno

## 📱 Descripción

Este es un módulo de reservas completamente rediseñado con un enfoque moderno, minimalista y centrado en la experiencia del usuario. Ofrece un flujo de reserva mejorado con animaciones suaves, diseño limpio y proceso intuitivo paso a paso.

## ✨ Características Principales

### Diseño Moderno y Minimalista
- **Interfaz limpia**: Diseño simplificado que elimina distracciones y se enfoca en lo importante
- **Tipografía mejorada**: Uso de tamaños y pesos de fuente optimizados para mejor legibilidad
- **Espaciado generoso**: Mayor espacio en blanco para reducir la carga visual
- **Paleta de colores suave**: Gradientes sutiles y colores armoniosos

### Experiencia de Usuario (UX) Mejorada
- **Wizard paso a paso**: Proceso dividido en 3 pasos claros y concisos
  1. **Viaje**: Selección de origen, destino, fecha, hora, pasajeros y tipo de viaje
  2. **Contacto**: Datos personales y comentarios opcionales
  3. **Confirmar**: Revisión completa y confirmación de reserva

- **Indicadores visuales**: 
  - Barra de progreso con iconos que cambian de estado
  - Estados completados marcados con checkmark
  - Paso actual destacado en azul
  - Pasos completados en verde

- **Validaciones en tiempo real**:
  - Mensajes de error claros y específicos
  - Prevención de avance sin completar campos requeridos
  - Validación de formato de teléfono y email

- **Animaciones fluidas**:
  - Transiciones suaves entre pasos usando Framer Motion
  - Efectos de entrada y salida animados
  - Feedback visual inmediato en interacciones

### Responsive y Accesible
- **Diseño adaptativo**: Optimizado para móviles, tablets y desktop
- **Touch-friendly**: Botones y campos de tamaño adecuado para dispositivos táctiles
- **Accesibilidad**: Uso apropiado de labels, aria-labels y navegación por teclado

### Funcionalidades Avanzadas
- **Integración con códigos de descuento**: Módulo completo de códigos promocionales
- **Cálculo de precios en tiempo real**: Actualización automática según selecciones
- **Múltiples descuentos**: Visualización clara de descuentos acumulados
- **Resumen visual**: Presentación organizada de toda la información antes de confirmar

## 🚀 Cómo Acceder

El módulo de reservas moderno puede accederse de múltiples formas:

### Opción 1: URL con parámetro
```
https://www.transportesaraucania.cl/?reservas=moderno
```

### Opción 2: URL con parámetro view
```
https://www.transportesaraucania.cl/?view=moderno
```

### Opción 3: Hash en la URL
```
https://www.transportesaraucania.cl/#reservas-moderno
```

### Opción 4: Ruta directa
```
https://www.transportesaraucania.cl/reservas-moderno
```

## 🎨 Estructura Visual

### Paso 1: Información del Viaje
- **Origen** con icono de mapa azul
- **Destino** con icono de mapa verde
- **Fecha** con icono de calendario morado
- **Hora** con selector de tiempo cada 15 minutos
- **Pasajeros** con icono de usuarios índigo
- **Tipo de viaje** (ida, vuelta o ida y vuelta) con icono de coche

### Paso 2: Datos de Contacto
- **Nombre completo** con icono de usuario
- **Teléfono** con validación de formato chileno
- **Email** con validación de formato
- **Comentarios adicionales** (campo opcional)

### Paso 3: Confirmación
- **Resumen del viaje**: Tarjeta con gradiente azul mostrando todos los detalles
- **Datos de contacto**: Tarjeta con gradiente verde mostrando información personal
- **Código de descuento**: Módulo para aplicar/remover códigos promocionales
- **Detalle de precio**: Tarjeta con gradiente ámbar mostrando precio final y ahorros
- **Checkboxes de confirmación**: Verificación de datos antes de reservar
- **Botón de confirmación**: Grande, llamativo y con animación de loading

## 🎯 Elementos de UX Destacados

### Badges de Descuento
En la parte superior se muestran badges coloridos indicando:
- 💰 Descuento online (fondo azul)
- 🎉 Promociones activas (fondo verde esmeralda)
- 🔄 Descuento ida y vuelta (fondo morado)
- ✨ Descuentos especiales

### Iconografía Coherente
- Uso consistente de iconos de Lucide React
- Cada campo tiene su icono distintivo
- Los iconos tienen colores temáticos que ayudan a la identificación rápida

### Mensajes de Error Amigables
- Fondo rojo suave con borde rojo
- Icono de alerta circular
- Texto claro explicando qué se debe corregir

### Footer Informativo
- Indicador de seguridad 🔒
- Tiempo de respuesta ⚡
- Genera confianza sin ser intrusivo

## 💻 Tecnologías Utilizadas

- **React 19**: Framework principal
- **Framer Motion**: Animaciones y transiciones
- **Tailwind CSS**: Estilos utilitarios
- **Radix UI**: Componentes de UI accesibles
- **Lucide React**: Iconografía moderna
- **shadcn/ui**: Sistema de diseño base

## 🔄 Comparación con el Módulo Original

| Característica | Módulo Original | Módulo Moderno |
|---------------|-----------------|----------------|
| Pasos visibles | Todos a la vez | Uno a la vez (wizard) |
| Navegación | Scroll vertical | Navegación por pasos |
| Animaciones | Básicas | Avanzadas con Framer Motion |
| Diseño | Funcional | Minimalista y moderno |
| Validaciones | Al final | En tiempo real por paso |
| Mobile UX | Buena | Optimizada |
| Carga visual | Media-alta | Baja (minimalista) |

## 📱 Compatibilidad

- ✅ Chrome/Edge (últimas 2 versiones)
- ✅ Firefox (últimas 2 versiones)
- ✅ Safari (últimas 2 versiones)
- ✅ iOS Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## 🎯 Casos de Uso Ideal

Este módulo es ideal para:
- Usuarios que prefieren un proceso guiado paso a paso
- Dispositivos móviles donde el espacio es limitado
- Usuarios nuevos que necesitan orientación clara
- Situaciones donde se quiere reducir la sobrecarga cognitiva
- Procesos de conversión optimizados para marketing

## 🔧 Mantenimiento

El componente principal se encuentra en:
```
/src/components/ReservasModerno.jsx
```

La integración con el App principal está en:
```
/src/App.jsx
```

La función de resolución para detectar la vista moderna:
```javascript
resolveIsModernReservationView()
```

## 📞 Soporte

Para preguntas o sugerencias sobre el módulo de reservas moderno, contacta al equipo de desarrollo.

---

**Última actualización**: Enero 2025
**Versión**: 1.0.0
