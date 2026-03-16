---
description: Build frontend y despliegue completo (dist + PHP) a Hostinger
---
// turbo-all
# Despliegue Completo a Hostinger

Este workflow automatiza la construcción del frontend y la subida de todos los archivos necesarios (estáticos y PHP) al servidor.

1. Construir la aplicación para producción.
// turbo
```bash
npm run build
```

2. Subir los archivos del frontend (`dist/`) al servidor.
// turbo
```bash
scp -P 65002 -r ./dist/* u419311572@82.112.246.242:/home/u419311572/domains/transportesaraucaria.cl/public_html/
```

3. Subir todos los archivos PHP a la raíz de `public_html/`.
// turbo
```bash
scp -P 65002 ./*.php u419311572@82.112.246.242:/home/u419311572/domains/transportesaraucaria.cl/public_html/
```

> [!IMPORTANT]
> Se te solicitará la contraseña de Hostinger (`TeamoGadiel7.`) para cada comando `scp`.

4. (Opcional) Verificación rápida.
Navega a [transportesaraucaria.cl](https://transportesaraucaria.cl) para confirmar los cambios.
