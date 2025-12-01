# Archivos PHP - Hostinger

> ⚠️ **IMPORTANTE**: Estos archivos se despliegan manualmente en Hostinger. No se despliegan automáticamente desde este repositorio.

## Descripción

Esta carpeta contiene los archivos PHP que se ejecutan en el servidor de Hostinger. Estos archivos manejan:

- Sistema de reservas
- Notificaciones por correo electrónico (PHPMailer)
- Configuración del sistema

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `config_reservas.php` | Configuración general del sistema de reservas |
| `enviar_asignacion_reserva.php` | Envío de notificaciones de asignación |
| `enviar_confirmacion_pago.php` | Confirmación de pagos por email |
| `enviar_correo_completo.php` | Envío de correos completos |
| `enviar_correo_mejorado.php` | Sistema mejorado de correos |
| `enviar_notificacion_productos.php` | Notificaciones de productos |
| `migrar_reservas.php` | Script de migración de reservas |
| `reservas_manager.php` | Gestor principal de reservas |
| `test_sistema.php` | Pruebas del sistema |

## Despliegue

Para desplegar cambios en estos archivos:

1. Realizar los cambios necesarios en el archivo
2. Subir manualmente el archivo al servidor de Hostinger via FTP o el administrador de archivos
3. Verificar que el archivo funciona correctamente en producción

## Notas

- El sistema de correos usa **PHPMailer** - No cambiar a otras librerías sin autorización
- Estos archivos funcionan en conjunto con el frontend React que también está alojado en Hostinger
- El backend Node.js está en **Render.com** (carpeta `/backend`)
