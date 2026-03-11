---
description: Desplegar el build local a Hostinger
---
// turbo-all
# Despliegue del Frontend (React/Vite) a Hostinger

Este workflow automatiza la construcción local de la aplicación y su posterior subida al hosting compartido de Hostinger vía SSH/SCP.

1. Construir la aplicación para producción de forma local.
// turbo
```bash
npm run build
```

2. Subir los archivos generados en la carpeta `dist/` al servidor de Hostinger.
// turbo
```bash
scp -P 65002 -r ./dist/* u419311572@82.112.246.242:/home/u419311572/domains/transportesaraucaria.cl/public_html/
```

> [!NOTE]
> La terminal te pedirá la contraseña del usuario de Hostinger (`TeamoGadiel7.`) para realizar la transferencia.

3. (Opcional) Subir scripts PHP directamente si han habido cambios en el backend de correos. Si no has modificado archivos `.php`, puedes omitir este paso.
```bash
scp -P 65002 ./*.php u419311572@82.112.246.242:/home/u419311572/domains/transportesaraucaria.cl/public_html/
```
