# 📊 Diagrama de Flujo del Sistema de Remarketing

## Flujo Completo: Usuario → Lead → Reserva

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USUARIO ENTRA AL SITIO                          │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Usuario navega por el sitio │
              │  - Ve destinos               │
              │  - Lee información           │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Empieza a llenar formulario │
              │  - Nombre: "Juan"            │
              │  - Email: "juan@example.com" │
              └──────────────┬───────────────┘
                             │
                    ⏱️ Espera 3 segundos
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    🎯 CAPTURA AUTOMÁTICA DE LEAD                       │
│                                                                        │
│  Hook useLeadCapture detecta datos:                                   │
│  ✅ Email: juan@example.com                                           │
│  ✅ Nombre: Juan                                                      │
│  ✅ Destino seleccionado                                              │
│  ✅ Tiempo en sitio: 45 segundos                                      │
│  ✅ Dispositivo: Mobile                                               │
│  ✅ UTM Source: google_ads                                            │
│                                                                        │
│  POST /capturar-lead → Backend guarda en tabla 'leads'                │
│  Estado inicial: "nuevo", convertido: false                           │
└────────────────────┬───────────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────────┐   ┌─────────────────────┐
│ ESCENARIO A:      │   │ ESCENARIO B:        │
│ Usuario abandona  │   │ Usuario continúa    │
└─────────┬─────────┘   └──────────┬──────────┘
          │                        │
          │                        ▼
          │             ┌──────────────────────┐
          │             │ Completa formulario  │
          │             │ y hace reserva       │
          │             └──────────┬───────────┘
          │                        │
          │                        ▼
          │             ┌──────────────────────────────────┐
          │             │ POST /enviar-reserva-express     │
          │             │                                  │
          │             │ 1. Crea reserva en tabla         │
          │             │ 2. Busca lead por email/teléfono │
          │             │ 3. Marca lead como convertido    │
          │             │ 4. Asocia reserva_id             │
          │             └──────────┬───────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────────────────────────────────┐
│           TABLA 'leads' EN BASE DE DATOS        │
│                                                 │
│  Lead A (No convertido):                        │
│  ├─ email: juan@example.com                     │
│  ├─ convertido: false ❌                        │
│  ├─ estado_remarketing: "nuevo"                 │
│  ├─ intentos_contacto: 0                        │
│  ├─ tiempo_en_sitio: 45s                        │
│  └─ paso_alcanzado: "formulario_inicial"        │
│                                                 │
│  Lead B (Convertido):                           │
│  ├─ email: maria@example.com                    │
│  ├─ convertido: true ✅                         │
│  ├─ reserva_id: 123                             │
│  ├─ estado_remarketing: "convertido"            │
│  └─ tiempo_en_sitio: 180s                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
      ┌───────────────────────┐
      │   PANEL DE ADMIN      │
      │   ?panel=leads        │
      └───────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌───────────────────┐
│ FILTRAR       │   │ CONTACTAR LEAD    │
│ - No convert. │   │                   │
│ - Nuevos      │   │ 1. Llamar/Email   │
│ - Por fecha   │   │ 2. Registrar nota │
└───────┬───────┘   │ 3. Cambiar estado │
        │           └─────────┬─────────┘
        │                     │
        ▼                     ▼
┌───────────────────────────────────────┐
│     PUT /api/leads/:id/contactar      │
│                                       │
│  Lead actualizado:                    │
│  ├─ intentos_contacto: 1              │
│  ├─ ultimo_contacto: 2025-10-11       │
│  ├─ estado_remarketing: "contactado"  │
│  └─ notas: "Llamé, muy interesado"    │
└───────────────────────────────────────┘
```

## Estados del Lead

```
┌──────────┐
│  nuevo   │  ← Lead recién capturado
└────┬─────┘
     │
     ▼
┌─────────────┐
│ contactado  │  ← Intentaste contactar
└────┬────────┘
     │
     ├─────┐
     │     │
     ▼     ▼
┌───────────┐  ┌────────────────┐
│interesado │  │ no_interesado  │
└────┬──────┘  └────────────────┘
     │
     ▼
┌────────────┐
│ convertido │  ← Completó reserva
└────────────┘
```

## Flujo de Captura Técnico

```
Frontend (React)
├─ Usuario escribe en formulario
│  └─ useLeadCapture hook escucha cambios
│     └─ Debounce de 3 segundos
│        └─ Detecta email/teléfono
│           └─ Recolecta datos:
│              ├─ Datos del formulario
│              ├─ Device detection
│              ├─ Browser info
│              ├─ UTM params
│              └─ Tiempo en sitio
│
└─ fetch('POST /capturar-lead', datos)
   │
   ▼
Backend (Node.js + Sequelize)
├─ Recibe datos del lead
│  └─ Lead.findOrCreate({ email, telefono })
│     ├─ Si existe → Actualiza con nuevos datos
│     └─ Si no existe → Crea nuevo lead
│        └─ Guarda en MySQL
│           └─ Retorna { success: true, leadId }
│
└─ Frontend recibe confirmación
   └─ console.log('Lead capturado')
```

## Arquitectura de Datos

```
┌───────────────────────────────────────────────────────┐
│                   BASE DE DATOS                       │
├───────────────────────────────────────────────────────┤
│                                                       │
│  TABLA: leads (Nueva)                                │
│  ┌─────────────────────────────────────┐             │
│  │ id (PK)                             │             │
│  │ email                    (indexed)  │             │
│  │ telefono                 (indexed)  │             │
│  │ nombre, origen, destino             │             │
│  │ fecha, pasajeros                    │             │
│  │ ultima_pagina, tiempo_en_sitio      │             │
│  │ paso_alcanzado                      │             │
│  │ dispositivo, navegador, so          │             │
│  │ utm_source, utm_medium, utm_campaign│             │
│  │ convertido               (indexed)  │             │
│  │ reserva_id (FK → reservas.id)       │             │
│  │ estado_remarketing       (indexed)  │             │
│  │ intentos_contacto                   │             │
│  │ notas                               │             │
│  │ created_at, updated_at   (indexed)  │             │
│  └─────────────────────────────────────┘             │
│                    │                                  │
│                    │ (FK)                             │
│                    ▼                                  │
│  TABLA: reservas (Existente)                         │
│  ┌─────────────────────────────────────┐             │
│  │ id (PK)                             │             │
│  │ email, telefono, nombre             │             │
│  │ origen, destino, fecha              │             │
│  │ precio, vehiculo                    │             │
│  │ estado, estado_pago                 │             │
│  │ source                              │             │
│  │ created_at, updated_at              │             │
│  └─────────────────────────────────────┘             │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## Ciclo de Vida de un Lead

```
DÍA 1
09:30 - Usuario visita sitio desde Google Ads
09:32 - Empieza a llenar formulario
09:33 - 🎯 Lead capturado automáticamente
        Estado: "nuevo", convertido: false

DÍA 1
14:00 - Admin revisa panel de leads
14:05 - Llama al usuario
14:10 - Marca como "contactado"
        Notas: "Llamé, preguntó por descuentos"
        intentos_contacto: 1

DÍA 2
10:00 - Admin envía email con oferta
10:15 - Marca como "interesado"
        Notas: "Envié oferta especial 15% desc"
        intentos_contacto: 2

DÍA 3
16:00 - Usuario regresa y completa reserva
16:01 - 🎉 Sistema marca lead como "convertido"
        convertido: true
        reserva_id: 456
        estado_remarketing: "convertido"
```

## Integración con Herramientas Externas

```
┌─────────────────┐
│  TABLA: leads   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────────────────┐  ┌──────────────────┐
│   Google Ads        │  │  Email Marketing │
│   ──────────        │  │  ───────────     │
│                     │  │                  │
│ 1. Exporta emails   │  │ 1. Exporta lista │
│    convertido=false │  │    no convertidos│
│ 2. Crea audiencia   │  │ 2. Crea campaña  │
│ 3. Retargeting ads  │  │ 3. Envío masivo  │
└─────────────────────┘  └──────────────────┘
```

## Métricas y Análisis

```
┌───────────────────────────────────────────────┐
│         DASHBOARD DE MÉTRICAS                 │
├───────────────────────────────────────────────┤
│                                               │
│  CONVERSIÓN                                   │
│  ├─ Total leads: 250                          │
│  ├─ Convertidos: 75 (30%)                     │
│  └─ No convertidos: 175 (70%)                 │
│                                               │
│  ESTADO REMARKETING                           │
│  ├─ Nuevos: 45 🔥 OPORTUNIDAD                │
│  ├─ Contactados: 82                           │
│  ├─ Interesados: 33                           │
│  ├─ No interesados: 15                        │
│  └─ Convertidos: 75                           │
│                                               │
│  POR FUENTE                                   │
│  ├─ Google Ads: 120 leads → 42 conv (35%)    │
│  ├─ Facebook: 65 leads → 18 conv (28%)       │
│  ├─ Directo: 45 leads → 12 conv (27%)        │
│  └─ Orgánico: 20 leads → 3 conv (15%)        │
│                                               │
│  POR DISPOSITIVO                              │
│  ├─ Mobile: 150 leads → 38 conv (25%)        │
│  ├─ Desktop: 85 leads → 32 conv (38%)        │
│  └─ Tablet: 15 leads → 5 conv (33%)          │
│                                               │
│  ABANDONO POR PASO                            │
│  ├─ Formulario inicial: 35%                   │
│  ├─ Cotización: 45% 🔥 PROBLEMA              │
│  ├─ Detalles: 15%                            │
│  └─ Pago: 5%                                 │
└───────────────────────────────────────────────┘
```

## Conclusión

Este sistema permite:
1. ✅ **Captura**: 100% de usuarios que interactúan
2. ✅ **Seguimiento**: Gestión completa de cada lead
3. ✅ **Análisis**: Métricas detalladas de conversión
4. ✅ **Automatización**: Conversión lead → reserva automática
5. ✅ **Remarketing**: Datos completos para campañas efectivas

**Resultado**: Más conversiones, mejor ROI en marketing, decisiones basadas en datos reales.
