---
name: gestion-infraestructura-render
description: Capacidad para gestionar servicios, bases de datos y monitoreo en Render.com usando el Render MCP Server.
---

# 🚀 Gestión de Infraestructura en Render.com

Esta habilidad permite al agente interactuar con la plataforma Render para gestionar el ciclo de vida de las aplicaciones, bases de datos y monitorear la salud del sistema.

## 📋 Capacidades Disponibles

### 1. Gestión de Servicios
- **Listar Servicios**: Ver todos los servicios (Web Services, Static Sites, Cron Jobs).
- **Detalles de Servicio**: Consultar configuración, variables de entorno y estado.
- **Variables de Entorno**: Actualizar variables de entorno de forma segura.

### 2. Bases de Datos (Postgres)
- **Consultas SQL**: Ejecutar consultas de solo lectura para diagnóstico de datos.
- **Estado de DB**: Verificar conexiones activas y uso de recursos.
- **Listar Instancias**: Gestionar múltiples bases de datos.

### 3. Monitoreo y Troubleshooting
- **Logs en Tiempo Real**: Consultar logs de aplicación, construcción y peticiones.
- **Métricas**: Analizar uso de CPU, Memoria, ancho de banda y latencia HTTP.
- **Historial de Deploys**: Ver el estado de despliegues pasados y actuales.

## 🛠️ Comandos Comunes (Prompts)

- "Muestra el uso de CPU y memoria de los últimos 30 minutos para el servicio de backend."
- "Lista los últimos 50 logs de error del servicio web."
- "Ejecuta una consulta SQL para ver cuántas reservas hay en estado 'pendiente'."
- "Verifica si el último deploy del frontend fue exitoso."

## ⚠️ Reglas Críticas
- **Seguridad**: Nunca exponer el `RENDER_API_KEY` en logs o código.
- **Solo Lectura**: Las consultas SQL deben ser estrictamente de lectura (`SELECT`).
- **Workspace**: Siempre verificar que el workspace correcto esté seleccionado antes de operar.
