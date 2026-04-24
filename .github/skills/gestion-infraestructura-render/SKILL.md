---
name: gestion-infraestructura-render
description: Usar cuando haya que diagnosticar, auditar o consultar servicios, logs, metricas, deploys, bases de datos o variables de entorno en Render.com mediante el Render MCP Server oficial, manteniendo la arquitectura Hostinger + Render.com del proyecto.
---

# Gestion de Infraestructura en Render.com

Usa este skill cuando la tarea requiera interactuar con Render.com o preparar al agente para usar el MCP oficial de Render. El backend de este proyecto corre en Render.com; no propongas migrarlo ni reemplazar esta arquitectura sin aprobacion explicita.

## MCP oficial

- Endpoint alojado: `https://mcp.render.com/mcp`
- Configuracion Codex: `~/.codex/config.toml`

```toml
[mcp_servers.render]
url = "https://mcp.render.com/mcp"
http_headers = { Authorization = "Bearer <YOUR_API_KEY>" }
```

No escribas una API key real en el repositorio, en logs, en commits ni en respuestas. La API key debe vivir solo en la configuracion local del usuario o en el mecanismo seguro que corresponda.

## Flujo obligatorio

1. Confirmar que la tarea realmente requiere Render MCP. Para revisar codigo local, endpoints o configuracion versionada, inspecciona primero el repo.
2. Antes de operar en Render, pedir o confirmar el workspace activo con una instruccion del tipo: `Set my Render workspace to <NOMBRE_WORKSPACE>`.
3. Priorizar acciones de solo lectura: listar servicios, leer logs, revisar deploys, consultar metricas y ejecutar SQL `SELECT`.
4. Para cambios de variables de entorno, explicar impacto y pedir confirmacion explicita antes de ejecutar. Es la unica modificacion sobre recursos existentes soportada por el MCP oficial.
5. Nunca modificar secretos para "probar". Si hace falta validar una variable, comprobar presencia/nombre, no valor.
6. Registrar en la respuesta que datos vinieron de Render MCP y cuales son inferencias desde el codigo local.

## Acciones utiles

- Workspaces: listar workspaces, seleccionar workspace actual, consultar detalles.
- Servicios: crear Web Services, Static Sites, Cron Jobs, Render Postgres y Render Key Value; listar servicios; ver detalles; actualizar variables de entorno.
- Deploys: listar historial y ver detalles de un deploy especifico.
- Logs: consultar logs por filtros y listar valores de etiquetas de logs.
- Metricas: CPU, memoria, instancias, conexiones de datastore, respuestas HTTP, latencia HTTP si el plan lo soporta, ancho de banda saliente.
- Render Postgres: crear DB, listar DBs, ver detalles y ejecutar SQL de solo lectura.
- Render Key Value: crear instancia, listar instancias y ver detalles.

## Limites y seguridad

- Las API keys de Render son de alcance amplio: pueden acceder a todos los workspaces y servicios disponibles para la cuenta.
- Render intenta minimizar exposicion de datos sensibles, pero no garantiza que nunca aparezcan secretos en el contexto del agente.
- El MCP no soporta todos los tipos ni opciones de recursos.
- No permite eliminar recursos existentes.
- No permite modificar recursos existentes salvo variables de entorno de un servicio.
- No permite disparar deploys, cambiar scaling ni otros controles operativos avanzados.
- Para borrados, escalamiento, rollbacks, deploy manual o configuraciones no soportadas, indicar que debe usarse el Dashboard de Render o la API REST con autorizacion explicita.

## Consultas SQL

Las consultas SQL via MCP deben ser de solo lectura:

```sql
SELECT estadoPago, COUNT(*) AS total
FROM reservas
GROUP BY estadoPago;
```

No ejecutar `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, migraciones ni scripts de correccion de datos desde este skill salvo que el usuario lo solicite explicitamente y exista un plan de respaldo claro. Para este repo, las correcciones de datos productivos deben tratarse como operacion de alto riesgo.

## Prompts recomendados

- `Set my Render workspace to <workspace>`
- `Lista los servicios del workspace actual y marca cual parece ser el backend de transportes-araucaria.`
- `Muestra los logs error-level del backend en los ultimos 30 minutos.`
- `Revisa el ultimo deploy del backend y resume si fallo el build o el runtime.`
- `Consulta metricas de CPU y memoria del backend durante la ultima hora.`
- `Ejecuta un SELECT de conteo por estadoPago para diagnosticar reservas pendientes.`

## Integracion con este proyecto

- Backend principal: Node.js + Express en Render.com.
- Frontend productivo: Hostinger.
- No automatizar despliegues a Hostinger desde este skill.
- Para bugs de pagos, revisar logs de Render junto con `backend/server-db.js`, `FlowReturn.jsx`, `MercadoPagoReturn.jsx` y `App.jsx`.
- Para problemas de variables de entorno, contrastar con `DOCUMENTACION_MAESTRA.md`, `GUIA_SOLUCION_PROBLEMAS.md` y las reglas de PHPMailer / pasarelas antes de proponer cambios.
