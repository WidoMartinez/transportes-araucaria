# Estándares de API y Convenciones de Desarrollo

Este documento define las reglas acordadas para prevenir errores de integración entre Frontend y Backend.

## 1. Convención de Respuestas API (JSON)

### Recursos Individuales (GET /api/recurso/:id)
**Regla:** El endpoint debe devolver el objeto del recurso **directamente**, sin envolverlo en propiedades como `success` o `data`, a menos que el frontend esté explícitamente diseñado para manejarlo.

**Correcto:**
```json
{
  "id": 1,
  "nombre": "Ejemplo",
  "estado": "activo"
}
```

**Incorrecto (a menos que se acuerde lo contrario):**
```json
{
  "success": true,
  "reserva": {
    "id": 1,
    "nombre": "Ejemplo"
  }
}
```

### Listas de Recursos (GET /api/recursos)
**Regla:** Pueden devolver un array directo o un objeto con metadatos de paginación.
*   **Preferencia:** Objeto con propiedad de colección pluralizada.
    ```json
    {
      "reservas": [...],
      "pagination": { ... }
    }
    ```

### Acciones / Mutaciones (POST, PUT, DELETE)
**Regla:** Estas respuestas **SÍ** deben incluir un indicador de éxito y mensaje opcional.
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... } // Objeto actualizado/creado
}
```

## 2. Protocolo de Verificación "Agente"

Antes de modificar un endpoint existente:
1.  **Rastrear el Consumidor:** Buscar en el código frontend (Ctrl+Shift+F) la ruta del endpoint (ej. `api/reservas/`).
2.  **Verificar el Contrato:** Chequear cómo procesa el frontend la respuesta (`response.json()`).
    *   ¿Hace `data.reserva`? -> El backend debe envolver.
    *   ¿Hace `setData(data)` directo? -> El backend NO debe envolver.
3.  **Consistencia:** Si se agrega un `include` (ej. Cliente), verificar que los nombres de los campos coincidan con lo que JSX intenta renderizar.
