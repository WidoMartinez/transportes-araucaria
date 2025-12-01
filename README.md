# Transportes Araucaria - Página Web

## Descripción
Página web profesional para Transportes Araucaria, empresa de transfer y autos especializada en traslados desde el Aeropuerto de La Araucanía hacia Temuco, Villarrica y Pucón. La página está diseñada específicamente para generar leads y captar clientes potenciales.

## Características Principales

### 🎯 Enfoque en Generación de Leads
- Formulario de reserva rápida en la sección hero
- Formulario de contacto detallado con validación
- Múltiples CTAs (Call-to-Action) estratégicamente ubicados
- Botón de WhatsApp prominente para contacto inmediato

### 🌟 Diseño Profesional
- Diseño moderno y atractivo con colores corporativos
- Totalmente responsivo (desktop, tablet, móvil)
- Imágenes de alta calidad de los destinos
- Animaciones suaves y transiciones

### 📱 Secciones Incluidas
1. **Header con navegación** - Logo, menú y contacto rápido
2. **Hero Section** - Título principal y formulario de reserva
3. **Servicios** - Transfer privado, compartido, 24/7, seguridad
4. **Destinos** - Temuco, Villarrica, Pucón con precios y tiempos
5. **Ventajas competitivas** - 6 razones para elegir la empresa
6. **Testimonios** - Reseñas de clientes satisfechos
7. **Formulario de contacto** - Captura completa de leads
8. **Footer** - Información adicional y enlaces

### 🎨 Paleta de Colores
- **Primario**: Azul corporativo (#1e40af) - Confianza y profesionalismo
- **Secundario**: Verde (#059669) - Naturaleza de La Araucanía  
- **Acento**: Naranja (#ea580c) - Energía y llamadas a la acción

## Tecnologías Utilizadas
- **React 18** - Framework de JavaScript
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **Shadcn/UI** - Componentes de interfaz de usuario
- **Lucide React** - Iconos modernos
- **JavaScript (JSX)** - Lenguaje de programación

## Instalación y Uso

### Prerrequisitos
- Node.js 18+ instalado
- npm o pnpm

### Comandos de Desarrollo
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de la construcción
npm run preview
```

### Estructura del Proyecto
```
transportes-araucaria/
├── backend/               # API y servidor Node.js (Render.com)
├── docs/                  # Documentación del proyecto
├── php/                   # Archivos PHP (despliegue manual en Hostinger)
├── public/                # Archivos estáticos
├── src/
│   ├── assets/            # Imágenes y recursos
│   ├── components/        # Componentes React
│   │   ├── admin/         # Componentes del panel de administración
│   │   └── ui/            # Componentes de UI (shadcn)
│   ├── contexts/          # Contextos de React
│   ├── data/              # Datos estáticos
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilidades
│   ├── App.jsx            # Componente principal
│   ├── App.css            # Estilos personalizados
│   └── main.jsx           # Punto de entrada
├── fletes/                # Página de fletes
├── AGENTS.MD              # Reglas para agentes de IA
├── package.json           # Dependencias del proyecto
└── README.md              # Este archivo
```

## Funcionalidades de Generación de Leads

### Formulario de Reserva Rápida (Hero)
- Selección de destino
- Fecha y hora del viaje
- Botón "Cotizar Ahora"

### Formulario de Contacto Completo
- Datos personales (nombre, teléfono, email)
- Detalles del viaje (origen, destino, fecha, hora, pasajeros)
- Mensaje adicional opcional
- Validación de campos requeridos

### CTAs Estratégicos
- Botón WhatsApp en header
- Botones "Reservar Transfer" en cada destino
- Botón "Enviar Solicitud" en formulario principal

## Optimizaciones Implementadas

### SEO y Performance
- Título descriptivo en HTML
- Estructura semántica correcta
- Imágenes optimizadas
- Carga rápida con Vite

### Experiencia de Usuario
- Navegación suave entre secciones
- Formularios intuitivos y validados
- Diseño mobile-first
- Hover effects y transiciones

### Conversión
- Múltiples puntos de contacto
- Información de precios visible
- Testimonios para generar confianza
- Proceso de cotización simplificado

## Personalización

### Cambiar Información de Contacto
Editar en `src/App.jsx`:
- Teléfono: Buscar `+56 9 8765 4321`
- Email: Buscar `contacto@transportesaraucaria.cl`
- Ubicación: Buscar `Temuco, Región de La Araucanía`

### Modificar Precios
En el array `destinos` dentro de `App.jsx`:
```javascript
const destinos = [
  {
    nombre: 'Temuco',
    precio: '$15.000', // Cambiar aquí
    // ...
  }
]
```

### Actualizar Imágenes
Reemplazar archivos en `src/assets/`:
- `hero-van.png` - Imagen principal del hero
- `temuco.jpg` - Imagen de Temuco
- `villarrica.jpg` - Imagen de Villarrica
- `pucon.jpg` - Imagen de Pucón

## Despliegue

### Opción 1: Netlify/Vercel
1. Ejecutar `npm run build`
2. Subir la carpeta `dist/` al servicio de hosting
3. Configurar dominio personalizado

### Opción 2: Servidor Web
1. Ejecutar `npm run build`
2. Copiar contenido de `dist/` al servidor web
3. Configurar servidor para SPA (Single Page Application)

## Soporte y Mantenimiento

### Actualizaciones Recomendadas
- Actualizar precios estacionalmente
- Agregar nuevos testimonios regularmente
- Revisar y actualizar información de contacto
- Optimizar imágenes periódicamente

### Métricas a Monitorear
- Conversiones de formularios
- Clics en botones CTA
- Tiempo en página
- Tasa de rebote
- Origen del tráfico

## Licencia
Este proyecto es una plantilla personalizada para Transportes Araucaria.

---

**Desarrollado con ❤️ para Transportes Araucaria**
*Tu mejor opción para traslados desde el Aeropuerto La Araucanía*

