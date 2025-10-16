# Diagramas del Sistema de Códigos de Pago

## 🔄 Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE CÓDIGOS DE PAGO                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ ADMINISTRADOR│         │   CLIENTE    │         │    SISTEMA   │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │ 1. Crea código         │                        │
       │    A-TCO-25            │                        │
       ├────────────────────────┼───────────────────────►│
       │                        │                        │
       │ 2. Envía por WhatsApp  │                        │
       ├───────────────────────►│                        │
       │                        │                        │
       │                        │ 3. Ingresa código      │
       │                        │    en web              │
       │                        ├───────────────────────►│
       │                        │                        │
       │                        │ 4. Valida código       │
       │                        │◄───────────────────────┤
       │                        │                        │
       │                        │ 5. Muestra resumen     │
       │                        │◄───────────────────────┤
       │                        │                        │
       │                        │ 6. Completa datos      │
       │                        ├───────────────────────►│
       │                        │                        │
       │                        │ 7. Selecciona pago     │
       │                        ├───────────────────────►│
       │                        │                        │
       │                        │ 8. Crea reserva        │
       │                        │◄───────────────────────┤
       │                        │                        │
       │                        │ 9. Marca código usado  │
       │                        │◄───────────────────────┤
       │                        │                        │
       │                        │ 10. Redirige a pago    │
       │                        │◄───────────────────────┤
       │                        │                        │
       │ 11. Ve reserva         │                        │
       │    asociada            │                        │
       │◄────────────────────────────────────────────────┤
       │                        │                        │
```

## 🏗️ Arquitectura del Sistema

```
┌───────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                          │
│                                                                    │
│  ┌────────────────────┐            ┌─────────────────────┐       │
│  │  PagarConCodigo    │            │ AdminCodigosPago    │       │
│  │  (Cliente)         │            │ (Administrador)     │       │
│  │                    │            │                     │       │
│  │ • Validar código   │            │ • Crear códigos     │       │
│  │ • Mostrar resumen  │            │ • Listar códigos    │       │
│  │ • Completar datos  │            │ • Ver detalles      │       │
│  │ • Pagar            │            │ • Eliminar códigos  │       │
│  └────────┬───────────┘            └──────────┬──────────┘       │
│           │                                    │                  │
└───────────┼────────────────────────────────────┼──────────────────┘
            │                                    │
            │ HTTP/REST                          │ HTTP/REST (Auth)
            │                                    │
┌───────────▼────────────────────────────────────▼──────────────────┐
│                       BACKEND (Node.js + Express)                 │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    API Endpoints                          │    │
│  │                                                           │    │
│  │  POST   /api/codigos-pago          (Crear)        [Auth] │    │
│  │  GET    /api/codigos-pago/:codigo  (Validar)     [Public]│    │
│  │  PUT    /api/codigos-pago/:codigo/usar (Usar)    [System]│    │
│  │  GET    /api/codigos-pago          (Listar)      [Auth]  │    │
│  │  PUT    /api/codigos-pago/:codigo  (Actualizar)  [Auth]  │    │
│  │  DELETE /api/codigos-pago/:codigo  (Eliminar)    [Auth]  │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                           │
│  ┌────────────────────▼─────────────────────────────────────┐    │
│  │               Modelo CodigoPago (Sequelize)              │    │
│  └────────────────────┬─────────────────────────────────────┘    │
│                       │                                           │
└───────────────────────┼───────────────────────────────────────────┘
                        │
                        │ SQL
                        │
┌───────────────────────▼───────────────────────────────────────────┐
│                     BASE DE DATOS (MySQL)                          │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   Tabla: codigos_pago                     │    │
│  │                                                           │    │
│  │  • codigo (UNIQUE)                                       │    │
│  │  • origen, destino                                       │    │
│  │  • monto                                                 │    │
│  │  • estado (activo, usado, vencido, cancelado)           │    │
│  │  • usos_maximos, usos_actuales                          │    │
│  │  • reserva_id (FK a tabla reservas)                     │    │
│  │  • fecha_vencimiento                                     │    │
│  │  • email_cliente                                         │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## 🔐 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────────┐
│                   ENDPOINTS POR NIVEL DE ACCESO              │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   PÚBLICO    │  • GET /api/codigos-pago/:codigo (Validar)
│              │    → No requiere auth
│  Cliente Web │    → Cualquiera puede validar un código
└──────────────┘

┌──────────────┐
│   SISTEMA    │  • PUT /api/codigos-pago/:codigo/usar
│              │    → Llamado interno después de crear reserva
│   Interno    │    → No requiere auth externa
└──────────────┘

┌──────────────┐
│    ADMIN     │  • POST   /api/codigos-pago (Crear)
│              │  • GET    /api/codigos-pago (Listar)
│   Bearer     │  • PUT    /api/codigos-pago/:codigo (Actualizar)
│    Token     │  • DELETE /api/codigos-pago/:codigo (Eliminar)
│              │    
│              │    → Requiere: Authorization: Bearer [TOKEN]
└──────────────┘
```

## 📊 Estados de un Código

```
┌──────────────────────────────────────────────────────────────────┐
│                      CICLO DE VIDA DEL CÓDIGO                     │
└──────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │ CREADO  │
    └────┬────┘
         │
         ▼
    ┌─────────┐
    │ ACTIVO  │ ◄──────────────────────┐
    └────┬────┘                        │
         │                             │
         │  Cliente valida y paga      │  Admin puede
         │                             │  cancelar
         ▼                             │
    ┌─────────┐                        │
    │  USADO  │                   ┌────┴─────┐
    └─────────┘                   │CANCELADO │
                                  └──────────┘
         │
         │  Pasa fecha límite
         │
         ▼
    ┌─────────┐
    │ VENCIDO │
    └─────────┘


Estados:
• ACTIVO     → Listo para usar
• USADO      → Ya fue utilizado
• VENCIDO    → Pasó la fecha límite
• CANCELADO  → Cancelado por admin
```

## 💾 Modelo de Datos Relacional

```
┌────────────────────────────────────────────────────────────────┐
│                  RELACIÓN CON OTRAS TABLAS                      │
└────────────────────────────────────────────────────────────────┘

┌──────────────────┐             ┌──────────────────┐
│  codigos_pago    │             │    reservas      │
│                  │             │                  │
│ • id (PK)        │             │ • id (PK)        │
│ • codigo UNIQUE  │             │ • codigoReserva  │
│ • origen         │             │ • nombre         │
│ • destino        │             │ • email          │
│ • monto          │             │ • origen         │
│ • estado         │    1:1      │ • destino        │
│ • reserva_id (FK)├────────────►│ • fecha          │
│ • email_cliente  │             │ • precio         │
│ • fecha_uso      │             │ • estadoPago     │
│ • usos_actuales  │             │ • ...            │
│ • usos_maximos   │             │                  │
└──────────────────┘             └──────────────────┘

Relación:
• Un código puede tener una reserva asociada (1:1)
• Una reserva puede tener un código de pago usado (0:1)
• Campo: codigos_pago.reserva_id → reservas.id
```

## 🎨 Interfaz de Usuario

```
┌────────────────────────────────────────────────────────────────┐
│           PÁGINA PÚBLICA: /#pagar-codigo                        │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   Pagar con Código                            │
│                                                               │
│  Ingresa el código que recibiste por WhatsApp               │
│                                                               │
│  ┌─────────────────────────────┐  ┌────────────┐            │
│  │  Código de Pago             │  │  Validar   │            │
│  │  [A-TCO-25_____________]    │  └────────────┘            │
│  └─────────────────────────────┘                             │
│                                                               │
│  ⓘ Ejemplo: A-TCO-25, P-VLL-30                              │
│                                                               │
└──────────────────────────────────────────────────────────────┘

        ▼ (Después de validar)

┌──────────────────────────────────────────────────────────────┐
│  ✅ Código Validado: A-TCO-25                                │
│                                                               │
│  📍 Origen:    Aeropuerto Temuco                             │
│  🎯 Destino:   Temuco Centro                                 │
│  🚐 Vehículo:  Sedan                                         │
│  👥 Pasajeros: 2                                             │
│  💰 Total:     $25.000                                       │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Completa tus datos                                          │
│                                                               │
│  Nombre completo *     [_________________________]           │
│  Email *               [_________________________]           │
│  Teléfono *            [_________________________]           │
│  Número de vuelo       [_________________________]           │
│  Hotel                 [_________________________]           │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Método de pago                                              │
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │  [Flow Logo] │      │   [MP Logo]  │                     │
│  │              │      │              │                     │
│  │     Flow     │      │ Mercado Pago │                     │
│  └──────────────┘      └──────────────┘                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────┐
│      PANEL ADMIN: /#admin?panel=codigos-pago                   │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Códigos de Pago                          [+ Nuevo Código]   │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Código    │ Ruta              │ Monto    │ Estado │ ... │ │
│  ├───────────┼───────────────────┼──────────┼────────┼─────┤ │
│  │ A-TCO-25  │ Aeropuerto →      │ $25.000  │ Activo │  🗑  │ │
│  │           │ Temuco            │          │        │     │ │
│  ├───────────┼───────────────────┼──────────┼────────┼─────┤ │
│  │ P-VLL-35  │ Pucón →           │ $35.000  │ Usado  │     │ │
│  │           │ Villarrica        │          │ (1/1)  │     │ │
│  ├───────────┼───────────────────┼──────────┼────────┼─────┤ │
│  │ A-M-45    │ Aeropuerto →      │ $45.000  │Vencido │  🗑  │ │
│  │           │ Malalcahuello     │          │        │     │ │
│  └───────────┴───────────────────┴──────────┴────────┴─────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## 📱 Flujo en WhatsApp

```
┌────────────────────────────────────────────────────────────────┐
│                  CONVERSACIÓN TÍPICA                            │
└────────────────────────────────────────────────────────────────┘

Cliente:
│ Hola, necesito un traslado del aeropuerto a Temuco
│ para el próximo viernes

Admin:
│ ¡Hola! Claro, te puedo ayudar. Son $25.000
│ 
│ Tu código de pago es: A-TCO-25
│ 
│ Para pagar:
│ 1. Visita: transportesaraucaria.cl/#pagar-codigo
│ 2. Ingresa tu código: A-TCO-25
│ 3. Completa tus datos
│ 4. Paga con Flow o Mercado Pago
│ 
│ ¿Alguna duda?

Cliente:
│ Perfecto, voy a pagar ahora

[Cliente visita la web y paga]

Sistema (automático):
│ ✅ Pago confirmado para código A-TCO-25
│ Reserva AR-20251016-0001 creada

Admin:
│ ¡Recibimos tu pago! Te escribimos pronto
│ para coordinar la hora exacta
```

## 🔄 Integración con Sistema Existente

```
┌────────────────────────────────────────────────────────────────┐
│            FLUJO INTEGRADO CON SISTEMA ACTUAL                   │
└────────────────────────────────────────────────────────────────┘

SISTEMA EXISTENTE                     NUEVO SISTEMA
                                          
┌──────────────────┐                 ┌──────────────────┐
│  Reserva Normal  │                 │  Reserva con     │
│                  │                 │  Código de Pago  │
│ • Cliente web    │                 │                  │
│ • Cotización     │                 │ • Código WhatsApp│
│ • Datos completos│                 │ • Pago directo   │
│ • Pago opcional  │                 │ • Datos mínimos  │
└────────┬─────────┘                 └────────┬─────────┘
         │                                    │
         │                                    │
         └────────────┬───────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Tabla: reservas      │
         │                        │
         │ • codigoReserva (AR-X) │
         │ • nombre               │
         │ • email                │
         │ • origen/destino       │
         │ • precio               │
         │ • estadoPago           │
         │ • ...                  │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │   Webhooks de Pago     │
         │   (Flow/MercadoPago)   │
         └────────┬───────────────┘
                  │
                  ▼
         ┌────────────────────────┐
         │  Email Confirmación    │
         │  (enviar_confirmacion  │
         │   _pago.php)           │
         └────────────────────────┘
```

## 🎯 Casos de Uso Principales

```
┌────────────────────────────────────────────────────────────────┐
│                     CASO 1: CLIENTE NUEVO                       │
└────────────────────────────────────────────────────────────────┘

1. Cliente contacta por WhatsApp
2. Admin cotiza: $25.000
3. Admin crea código: A-TCO-25
4. Admin envía código al cliente
5. Cliente paga en web con código
6. Sistema crea reserva automática
7. Cliente recibe confirmación
8. Admin coordina detalles finales

┌────────────────────────────────────────────────────────────────┐
│                 CASO 2: CLIENTE FRECUENTE                       │
└────────────────────────────────────────────────────────────────┘

1. Cliente pide "el de siempre"
2. Admin crea código pre-configurado
3. Cliente paga rápidamente
4. Todo automatizado

┌────────────────────────────────────────────────────────────────┐
│                 CASO 3: GRUPO DE CLIENTES                       │
└────────────────────────────────────────────────────────────────┘

1. Admin crea código con usos_maximos=5
2. Envía mismo código a 5 personas
3. Cada uno paga con el mismo código
4. Código se marca "usado" al llegar a 5
5. Admin ve las 5 reservas asociadas

┌────────────────────────────────────────────────────────────────┐
│                 CASO 4: CÓDIGO CON VENCIMIENTO                  │
└────────────────────────────────────────────────────────────────┘

1. Admin crea código válido por 24 horas
2. Cliente intenta usar después de 24h
3. Sistema detecta vencimiento
4. Cliente recibe error
5. Admin crea nuevo código si es necesario
```

---

**Nota:** Estos diagramas son representaciones visuales del sistema.  
Para detalles técnicos completos, ver `SISTEMA_CODIGOS_PAGO.md`
