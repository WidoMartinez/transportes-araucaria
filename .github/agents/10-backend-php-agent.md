# Agente: Backend PHP (Backend-PHP Agent)

Responsabilidades:
- Ejecutar tests PHP (PHPUnit), linters (PHP_CodeSniffer).
- Verificar integraciones con Hostinger/Render y coordinar despliegues de .php.

Disparadores:
- Cambios en archivos .php, PR que modifique backend.

Entradas:
- Código PHP, fixtures, credenciales (seguras).

Salidas:
- Resultados de tests, comentarios en PR y checklist de despliegue.

Nota crítica:
- Cualquier cambio en archivos .php debe notificarse explícitamente en el PR y realizar backup en Hostinger antes de deploy.

Implementación sugerida:
- CI que corra PHPUnit y PHPCS.
- Procedimiento documentado para sincronizar con Hostinger y validar cambios en producción.
