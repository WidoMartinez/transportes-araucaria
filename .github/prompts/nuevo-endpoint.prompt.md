---
mode: 'agent'
description: 'Genera un nuevo endpoint Express completo siguiendo la arquitectura exacta del proyecto. Úsalo cuando necesites crear una nueva ruta en el backend de Render.'
---

# Generador de Endpoint Express — Transportes Araucanía

## Contexto del proyecto

- **Servidor principal**: `backend/server-db.js`
- **Rutas agrupadas**: `backend/routes/`
- **Endpoints individuales**: `backend/endpoints/`
- **Modelos Sequelize**: `backend/models/`
- **Middleware de autenticación**: `backend/middleware/auth.js`
- **Autenticación**: JWT con `verifyToken` (middleware ya existente)

---

## Instrucciones para completar este prompt

Responde estas preguntas para generar el endpoint:

1. **¿Qué hace este endpoint?** (descripción breve en español)
2. **¿Cuál es el método HTTP?** (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
3. **¿Cuál es la ruta?** (ej: `/api/reservas/:id/asignar`)
4. **¿Requiere autenticación?** (sí = solo admin | no = público)
5. **¿Qué modelos de BD usa?** (ej: `Reserva`, `Conductor`, `Vehiculo`)
6. **¿Qué datos recibe?** (body, params, query)
7. **¿Qué datos retorna?**

---

## Plantilla base del endpoint

Una vez recibidas las respuestas, generar usando EXACTAMENTE este patrón del proyecto:

```javascript
// Endpoint: [descripción en español]
// Ruta: [MÉTODO] /api/[ruta]
// Auth: [requerida/pública]

router.METHOD('/ruta', verifyToken, async (req, res) => {
  try {
    // Extraer y validar parámetros de entrada
    const { campo1, campo2 } = req.body; // o req.params / req.query

    // Validación de campos requeridos
    if (!campo1 || !campo2) {
      return res.status(400).json({
        success: false,
        message: 'Los campos campo1 y campo2 son requeridos',
      });
    }

    // Lógica principal con Sequelize
    const resultado = await Modelo.findOne({
      where: { id: campo1 },
    });

    if (!resultado) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado',
      });
    }

    // Respuesta exitosa
    return res.json({
      success: true,
      data: resultado,
      message: 'Operación realizada correctamente',
    });

  } catch (error) {
    // Registro del error para diagnóstico en Render
    console.error('[ERROR] [descripción endpoint]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
    });
  }
});
```

---

## Reglas de generación

### Seguridad (OWASP)
- Siempre validar inputs antes de usar en queries.
- Nunca pasar directamente `req.body` a un método `.create()` o `.update()` — usar destructuring explícito.
- Rutas con datos sensibles siempre con `verifyToken`.
- IDs de URL nunca concatenar en SQL raw — siempre usar Sequelize.

### Estructura de respuesta estándar
```javascript
// Éxito
{ success: true, data: {...}, message: 'Texto descriptivo' }

// Error de validación
{ success: false, message: 'Campo X es requerido' } // 400

// No encontrado
{ success: false, message: 'Reserva no encontrada' } // 404

// Error de servidor
{ success: false, message: 'Error interno del servidor' } // 500
```

### Registro del endpoint en el router
Después de generar el endpoint, indicar dónde registrarlo:
```javascript
// En backend/routes/[archivo-ruta].js o backend/server-db.js
app.use('/api/[prefijo]', require('./routes/[archivo]'));
```

---

## Ejemplo de uso

> "Necesito un endpoint POST /api/reservas/:id/cancelar que requiere auth, recibe `motivo` en el body, actualiza el estado de la reserva a CANCELADA y retorna la reserva actualizada."

El agente generará el archivo completo listo para pegar en el proyecto.
