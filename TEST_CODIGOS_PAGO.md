# Plan de Pruebas - Sistema de Códigos de Pago

## ✅ Checklist de Pruebas

### Backend

#### Migración de Base de Datos
- [ ] La tabla `codigos_pago` se crea correctamente al iniciar el servidor
- [ ] Todos los índices se crean correctamente
- [ ] No hay errores en los logs de migración

#### Endpoints - Códigos de Pago

**POST /api/codigos-pago (Crear)**
- [ ] Crear código con todos los campos requeridos
- [ ] Validar que no se pueden crear códigos duplicados
- [ ] Validar campos requeridos (codigo, origen, destino, monto)
- [ ] Verificar que requiere autenticación admin

**GET /api/codigos-pago/:codigo (Validar)**
- [ ] Validar código activo devuelve datos correctos
- [ ] Código no existente devuelve 404
- [ ] Código usado devuelve error apropiado
- [ ] Código vencido devuelve error apropiado
- [ ] No requiere autenticación (público)

**PUT /api/codigos-pago/:codigo/usar (Marcar como usado)**
- [ ] Marca código como usado correctamente
- [ ] Incrementa contador de usos
- [ ] Actualiza estado a "usado" cuando alcanza máximo
- [ ] Guarda reservaId y emailCliente
- [ ] Registra fechaUso

**GET /api/codigos-pago (Listar)**
- [ ] Lista todos los códigos
- [ ] Filtra por estado correctamente
- [ ] Paginación funciona
- [ ] Requiere autenticación admin

**PUT /api/codigos-pago/:codigo (Actualizar)**
- [ ] Actualiza campos permitidos
- [ ] No permite cambiar el código mismo
- [ ] Requiere autenticación admin

**DELETE /api/codigos-pago/:codigo (Eliminar)**
- [ ] Elimina código correctamente
- [ ] Requiere autenticación admin

#### Integración con Reservas
- [ ] Al crear reserva con codigoPago, se marca como usado
- [ ] Se asocia reservaId correctamente
- [ ] Se guarda emailCliente
- [ ] No falla la reserva si código no existe

### Frontend

#### Componente PagarConCodigo

**Paso 1: Validación**
- [ ] Input de código acepta texto
- [ ] Botón "Validar" funciona
- [ ] Muestra loading durante validación
- [ ] Muestra errores correctamente
- [ ] Pasa al paso 2 con código válido

**Paso 2: Resumen y Datos**
- [ ] Muestra resumen correcto del servicio
- [ ] Muestra todos los campos del código
- [ ] Formulario de datos personales valida correctamente
- [ ] Validación de email funciona
- [ ] No permite continuar sin datos completos

**Paso 3: Pago**
- [ ] Muestra opciones de Flow y MercadoPago
- [ ] Crea reserva antes de redirigir
- [ ] Redirige a gateway correcto
- [ ] Maneja errores de creación de reserva
- [ ] Maneja errores de creación de pago

#### Componente AdminCodigosPago

**Listado**
- [ ] Muestra tabla de códigos correctamente
- [ ] Badges de estado se muestran correctos
- [ ] Formato de montos correcto (CLP)
- [ ] Formato de fechas correcto

**Crear Código**
- [ ] Modal se abre correctamente
- [ ] Todos los campos se muestran
- [ ] Validaciones funcionan
- [ ] Código se crea correctamente
- [ ] Lista se actualiza después de crear

**Eliminar Código**
- [ ] Confirma antes de eliminar
- [ ] Elimina código correctamente
- [ ] No permite eliminar códigos usados
- [ ] Lista se actualiza después de eliminar

#### Navegación
- [ ] /#pagar-codigo carga componente correcto
- [ ] /#admin?panel=codigos-pago carga panel admin
- [ ] Cambios de hash actualizan vista

### Integración Completa

#### Flujo Completo (Happy Path)
1. [ ] Admin crea código A-TEST-10 por $10.000
2. [ ] Cliente visita /#pagar-codigo
3. [ ] Cliente ingresa código A-TEST-10
4. [ ] Sistema valida y muestra resumen
5. [ ] Cliente completa datos personales
6. [ ] Cliente selecciona método de pago
7. [ ] Sistema crea reserva
8. [ ] Código se marca como usado
9. [ ] Cliente es redirigido a gateway

#### Casos de Error

**Código Inválido**
- [ ] Cliente ingresa código inexistente
- [ ] Sistema muestra error apropiado
- [ ] Cliente puede intentar de nuevo

**Código Ya Usado**
- [ ] Cliente intenta usar código usado
- [ ] Sistema muestra error apropiado
- [ ] Sugiere contactar soporte

**Código Vencido**
- [ ] Cliente intenta usar código vencido
- [ ] Sistema detecta vencimiento
- [ ] Actualiza estado a "vencido"
- [ ] Muestra mensaje apropiado

**Error en Pago**
- [ ] Falla creación de reserva
- [ ] Código NO se marca como usado
- [ ] Cliente recibe mensaje de error
- [ ] Cliente puede intentar de nuevo

**Error en Gateway**
- [ ] Falla creación de pago en gateway
- [ ] Reserva se crea igual
- [ ] Cliente recibe instrucciones alternativas

### Seguridad

- [ ] Endpoints admin requieren token
- [ ] Token inseguro por defecto es rechazado
- [ ] Validación de códigos es pública (sin auth)
- [ ] No se pueden crear códigos duplicados
- [ ] SQL injection no es posible
- [ ] XSS no es posible en frontend

### Performance

- [ ] Validación de código es rápida (<500ms)
- [ ] Creación de código es rápida (<500ms)
- [ ] Lista de códigos carga rápido (<1s)
- [ ] No hay memory leaks
- [ ] Paginación funciona para muchos códigos

### Documentación

- [ ] README actualizado con nueva funcionalidad
- [ ] SISTEMA_CODIGOS_PAGO.md está completo
- [ ] GUIA_USUARIO_CODIGOS_PAGO.md está completo
- [ ] Ejemplos de API son correctos
- [ ] Diagramas son claros

## 🧪 Pruebas Manuales Sugeridas

### 1. Crear Código de Prueba

**cURL:**
```bash
curl -X POST http://localhost:3001/api/codigos-pago \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin-secret-token" \
  -d '{
    "codigo": "TEST-001",
    "origen": "Aeropuerto Temuco",
    "destino": "Temuco Centro",
    "monto": 10000,
    "descripcion": "Código de prueba",
    "vehiculo": "Sedan",
    "pasajeros": 2
  }'
```

**Resultado esperado:**
```json
{
  "success": true,
  "codigoPago": {
    "id": 1,
    "codigo": "TEST-001",
    "estado": "activo",
    ...
  }
}
```

### 2. Validar Código

**cURL:**
```bash
curl http://localhost:3001/api/codigos-pago/TEST-001
```

**Resultado esperado:**
```json
{
  "success": true,
  "codigoPago": {
    "codigo": "TEST-001",
    "origen": "Aeropuerto Temuco",
    "destino": "Temuco Centro",
    "monto": "10000.00",
    "estado": "activo",
    ...
  }
}
```

### 3. Flujo Frontend

1. Abrir http://localhost:5173/#pagar-codigo
2. Ingresar código: TEST-001
3. Click en "Validar"
4. Verificar que aparece resumen correcto
5. Completar datos:
   - Nombre: Test User
   - Email: test@test.com
   - Teléfono: +56912345678
6. Seleccionar Flow o MercadoPago
7. Verificar redirección

### 4. Verificar en Admin

1. Abrir http://localhost:5173/#admin?panel=codigos-pago
2. Verificar que TEST-001 aparece como "usado"
3. Verificar que tiene reservaId asociado

### 5. Intentar Reusar Código

1. Intentar validar TEST-001 nuevamente
2. Verificar error: "El código está usado"
3. Verificar que no permite continuar

## 🐛 Reportar Problemas

Si encuentras algún problema durante las pruebas:

1. Captura el error completo (mensaje, stack trace)
2. Documenta los pasos para reproducir
3. Incluye:
   - URL donde ocurrió
   - Request/Response si aplica
   - Browser/SO
   - Logs del backend si aplica
4. Abre un issue o comenta en el PR

## ✅ Criterios de Aceptación

El sistema está listo para producción cuando:

- [ ] Todas las pruebas backend pasan
- [ ] Todas las pruebas frontend pasan
- [ ] Flujo completo funciona end-to-end
- [ ] No hay errores de lint críticos
- [ ] Build se completa sin errores
- [ ] Documentación está completa
- [ ] Al menos 2 personas han probado el flujo

---

**Fecha de creación:** 16 de octubre de 2025  
**Autor:** Sistema  
**PR:** #[número]
