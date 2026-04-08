---
name: optimizador-seo
description: "Skill para auditar, planificar y ejecutar mejoras SEO en Transportes Araucanía. Usar cuando: se necesite mejorar el ranking de palabras clave, optimizar meta tags, agregar schema.org, enriquecer textos del landing con keywords de transfer/aeropuerto/araucanía, revisar la calidad del anuncio en Google Ads (Quality Score) o identificar gaps de keywords."
---

# Skill: Optimizador SEO — Transportes Araucanía

## Propósito

Guía completa para auditar y ejecutar mejoras de SEO orgánico y SEM (Google Ads) en el sitio de Transportes Araucanía. Incluye mapa de palabras clave, estrategia de contenido, mejoras técnicas y pautas de Quality Score para Google Ads.

---

## Arquitectura de Archivos SEO

| Archivo | Rol SEO |
|---------|---------|
| `index.html` | Meta tags principales, title, description, OG, schema.org, canonical |
| `src/pages/LandingTraslados.jsx` | Landing de Google Ads — relevancia de anuncio + contenido |
| `src/components/HeroExpress.jsx` | H1 principal del sitio, copy de captura |
| `src/data/destinos.jsx` | Textos de destinos — oportunidad de keywords long-tail |
| `src/components/Servicios.jsx` | Sección de servicios — keywords secundarias |
| `src/components/Footer.jsx` | Footer con keywords de ubicación |
| `public/_redirects` | Configuración de rutas (Netlify/Render) |

---

## Mapa de Palabras Clave Prioritarias

### 🔴 Keywords Primarias (mayor volumen, mayor intención de compra)

| Keyword | Intención | Prioridad |
|---------|-----------|-----------|
| `transfer aeropuerto araucanía` | Transaccional | ⭐⭐⭐⭐⭐ |
| `transfer aeropuerto temuco` | Transaccional | ⭐⭐⭐⭐⭐ |

| `transfer pucón` | Transaccional | ⭐⭐⭐⭐ |
| `transfer villarrica` | Transaccional | ⭐⭐⭐⭐ |
| `traslado privado temuco` | Transaccional | ⭐⭐⭐⭐ |
| `traslado aeropuerto temuco` | Transaccional | ⭐⭐⭐⭐⭐ |

### 🟠 Keywords Secundarias (volumen medio, alta conversión)

| Keyword | Intención | Prioridad |
|---------|-----------|-----------|
| `taxi privado aeropuerto temuco` | Transaccional | ⭐⭐⭐⭐ |
| `shuttle aeropuerto temuco` | Transaccional | ⭐⭐⭐ |
| `minibus araucanía` | Transaccional | ⭐⭐⭐ |
| `transporte privado pucón` | Transaccional | ⭐⭐⭐ |
| `traslado villarrica temuco` | Transaccional | ⭐⭐⭐ |
| `traslado privado villarrica` | Transaccional | ⭐⭐⭐ |
| `transfer lican ray` | Transaccional | ⭐⭐⭐ |
| `transfer malalcahuello` | Transaccional | ⭐⭐⭐ |
| `transfer coñaripe` | Transaccional | ⭐⭐ |
| `transfer curarrehue` | Transaccional | ⭐⭐ |
| `taxi aeropuerto araucanía` | Transaccional | ⭐⭐⭐ |
| `traslados araucanía` | Informacional/Trans | ⭐⭐⭐ |
| `transportes araucaria` | Navegacional | ⭐⭐⭐⭐ |

### 🟡 Long-tail Keywords (menor volumen, muy alta conversión)

| Keyword | Intención |
|---------|-----------|
| `transfer aeropuerto temuco a pucón` | Transaccional |
| `cuánto cuesta taxi aeropuerto temuco pucón` | Informacional |
| `transfer aeropuerto temuco villarrica precio` | Transaccional |
| `transporte privado aeropuerto la araucanía` | Transaccional |
| `traslado privado aeropuerto ZCO temuco` | Transaccional |
| `van privada aeropuerto temuco` | Transaccional |
| `auto privado desde aeropuerto araucanía` | Transaccional |
| `transfer para grupos desde aeropuerto temuco` | Transaccional |
| `reservation transfer pucon airport` | Transaccional (turismo internacional) |

---

## Estado Actual vs. Ideal (Gaps a Corregir)

### ⚠️ Principio: no usar "ZCO" en textos visibles

> El código IATA **ZCO** es conocido solo por viajeros frecuentes o personal de aerolíneas. El público general busca **"aeropuerto temuco"** o **"aeropuerto la araucanía"**. Usar ZCO en meta tags internos o schema.org es aceptable, pero **no debe aparecer como texto principal visible** (H1, H2, párrafos de hero).

### ❌ Problemas Detectados (abril 2026 — estado inicial)

1. **"transfer" ausente en meta keywords y textos principales** — término muy buscado en Chile, no aparece en el sitio.
2. **Meta description no incluía "transfer"** — penaliza relevancia del anuncio Google Ads.
3. **Schema.org incompleto** — solo había tags básicos OG, sin `LocalBusiness` ni `TravelAgency`.
4. **H1 en LandingTraslados** decía "Traslados Privados a cualquier destino" — no incluía "aeropuerto".
5. **H1 en HeroExpress** decía "Transporte Privado" — sin keyword "transfer".
6. **Destinos limitados a Pucón y Villarrica** — se sub-representaba la amplitud real de la oferta.

### ✅ Correcciones Implementadas (actualizar cuando se apliquen)

- [ ] Agregar "transfer" en title, description y H1
- [ ] Agregar "ZCO" y "Aeropuerto La Araucanía" en keywords visibles
- [ ] Agregar schema.org `TravelAgency` + `LocalBusiness`
- [ ] Mejorar H2 de LandingTraslados con keyword de aeropuerto
- [ ] Incluir keywords en botones/CTAs ("Transfer Aeropuerto" en vez de solo "Ir a Traslados")
- [ ] Optimizar alt text de imágenes hero

---

## Paso 1 — Meta Tags Óptimos para `index.html`

```html
<!-- Title: 55-60 caracteres -->
<title>Transfer Aeropuerto Araucanía | Traslados Privados Temuco, Pucón, Villarrica</title>

<!-- Description: 150-155 caracteres -->
<meta name="description"
  content="Transfer privado desde Aeropuerto La Araucanía (ZCO) a Temuco, Pucón y Villarrica. Reserva online, pago en cuotas, traslado seguro con conductor certificado." />

<!-- Keywords: incluir transfer, ZCO, destinos clave -->
<meta name="keywords"
  content="transfer aeropuerto araucanía, transfer ZCO, traslado privado temuco, transfer pucón, transfer villarrica, taxi aeropuerto temuco, traslado aeropuerto la araucanía, transportes araucaria, traslado privado araucanía" />

<!-- Canonical -->
<link rel="canonical" href="https://www.transportesaraucaria.cl" />
```

---

## Paso 2 — Schema.org para Rich Snippets

Colocar en `index.html` dentro del `<head>`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["TravelAgency", "LocalBusiness"],
  "name": "Transportes Araucaria",
  "description": "Servicio de transfer y traslados privados desde el Aeropuerto La Araucanía (ZCO) a Temuco, Pucón, Villarrica, Lican Ray y toda la región.",
  "url": "https://www.transportesaraucaria.cl",
  "telephone": "+56936643540",
  "priceRange": "$$",
  "servesCuisine": null,
  "image": "https://www.transportesaraucaria.cl/transfer-service.jpg",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "La Araucanía",
    "addressCountry": "CL"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -38.7359,
    "longitude": -72.5904
  },
  "areaServed": [
    {"@type": "City", "name": "Temuco"},
    {"@type": "City", "name": "Pucón"},
    {"@type": "City", "name": "Villarrica"},
    {"@type": "City", "name": "Lican Ray"},
    {"@type": "City", "name": "Coñaripe"},
    {"@type": "City", "name": "Malalcahuello"}
  ],
  "openingHours": "Mo-Su 00:00-23:59",
  "hasMap": "https://www.transportesaraucaria.cl",
  "sameAs": [],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+56936643540",
    "contactType": "customer service",
    "availableLanguage": "Spanish"
  },
  "makesOffer": [
    {
      "@type": "Offer",
      "name": "Transfer Aeropuerto La Araucanía a Temuco",
      "description": "Traslado privado desde/hacia Aeropuerto ZCO en vehículo exclusivo."
    },
    {
      "@type": "Offer",
      "name": "Transfer Aeropuerto Temuco a Pucón",
      "description": "Transfer desde Aeropuerto La Araucanía (ZCO) a Pucón. Distancia aprox. 105 km."
    },
    {
      "@type": "Offer",
      "name": "Transfer Aeropuerto Temuco a Villarrica",
      "description": "Transfer desde Aeropuerto ZCO a Villarrica. Distancia aprox. 87 km."
    }
  ]
}
</script>
```

---

## Paso 3 — Quality Score en Google Ads

El **Quality Score (QS)** de Google Ads se basa en 3 factores. Así se mejora cada uno:

### 3.1 Relevancia del Anuncio (Ad Relevance)

**Regla:** La keyword debe aparecer en el texto del anuncio Y en la URL del destino.

```
Keyword: "transfer aeropuerto araucanía"
↓
Título del anuncio: "Transfer Aeropuerto Araucanía | Privado y Puntual"
↓
URL visible: transportesaraucaria.cl/transfer-aeropuerto
↓
Landing page: debe tener H1 o H2 con "transfer aeropuerto araucanía"
```

### 3.2 Experiencia en la Página de Destino (Landing Page Experience)

- La landing debe cargar en < 3 segundos
- El texto visible debe incluir la keyword buscada en el H1 o primeros 100px
- Debe haber CTA claro y visible sin scroll (above the fold)
- El contenido debe ser relevante con la keyword (no solo en meta, también en texto visible)

**Mejoras concretas para `LandingTraslados.jsx`:**
```jsx
// H1 actual (bajo QS):
"Traslados Privados a cualquier destino"

// H1 mejorado (alto QS):
"Transfer Aeropuerto Araucanía — Traslados Privados"
// o bien:
"Transfer desde Aeropuerto La Araucanía (ZCO)"
```

### 3.3 CTR Esperado

- Usar extensiones de anuncio: ubicación, precio, llamada, sitelinks
- Los sitelinks sugeridos para el anuncio:
  - "Ver precios Pucón" → /traslados
  - "Transfer Temuco" → /
  - "Grupos y Vans" → /traslados
  - "Reservar ahora" → /

---

## Paso 4 — Estrategia de Contenido por Página

### 4.1 `index.html` + `HeroExpress.jsx` (Página Principal — más importante)

> **El H1 del sitio vive en `HeroExpress.jsx`**, no en la landing de traslados. Es la página de mayor tráfico y la que Google indexa con mayor peso.

**Keyword objetivo:** `transfer aeropuerto araucanía`, `traslados privados araucanía`

**H1 implementado en HeroExpress (estado 0 sin destino seleccionado):**
```
Transfer y Traslados Privados
```

**Subtitle del H1:**
```
Transfer aeropuerto · Pucón · Villarrica · Lican Ray · Malalcahuello y toda La Araucanía.
```

**Title de `index.html`:**
```
Transfer Aeropuerto La Araucanía | Traslados Privados a Toda la Región
```

### 4.2 `LandingTraslados.jsx` (Landing de Google Ads — apartado secundario)

> Esta página es un apartado específico para campañas de Google Ads. No es la página principal del sitio.

**Keyword objetivo:** `transfer aeropuerto araucanía`, `traslado privado temuco`

**H1 implementado:**
```
Transfer Aeropuerto
La Araucanía — Toda la Región
```

**Párrafo hero implementado:**
```
Transfer privado desde Aeropuerto La Araucanía a Temuco, Pucón, Villarrica, 
Lican Ray, Malalcahuello y cualquier destino del sur. Conductor certificado, 
vehículo exclusivo, pago online.
```

**Lista de tipos de traslado (keywords en bullets):**
```
✈️ Transfer Aeropuerto La Araucanía (ZCO)
🚐 Transfer Temuco ↔ Pucón
🏔️ Transfer Temuco ↔ Villarrica
🌊 Transfer hacia Lican Ray y Coñaripe
🌋 Transfer a Malalcahuello y Parque Nacional
🏙️ Transfer ejecutivo interciudades
🎉 Transfer para eventos y matrimonios
🏥 Traslados médicos y hospitalarios
```

### 4.3 Destinos (keywords long-tail)

Cada tarjeta de destino en `destinos.jsx` debería incluir en su `descripcion`:

```
Temuco: "Transfer desde ZCO a Temuco en 25 min. Capital de La Araucanía, centro comercial y acceso a todos los servicios."
Pucón: "Transfer aeropuerto a Pucón en 1h 30min. Turismo, termas y volcán Villarrica. Reserva tu traslado privado."
Villarrica: "Transfer desde Aeropuerto La Araucanía a Villarrica. Lago y volcán, a 87 km por ruta 199."
```

---

## Paso 5 — SEO Técnico

### 5.1 Verificar en cada deploy

- [ ] `<html lang="es-CL">` — ✅ ya existe
- [ ] `<link rel="canonical">` — ✅ ya existe para home
- [ ] Schema.org TravelAgency — ⚠️ pendiente
- [ ] Sitemap.xml — ⚠️ verificar si existe en `/public/`
- [ ] robots.txt — ⚠️ verificar
- [ ] Imágenes con `alt` descriptivo — ⚠️ pendiente en hero
- [ ] Core Web Vitals — monitorear en PageSpeed Insights

### 5.2 URLs Amigables Recomendadas

```
/ → Página principal (transfer aeropuerto araucanía)
/traslados → Landing Google Ads (transfer privado)
/transfer-aeropuerto-temuco → (futuro: landing específica por ruta)
/transfer-pucon → (futuro: landing específica Pucón)
/transfer-villarrica → (futuro: landing específica Villarrica)
```

### 5.3 Alt Text de Imágenes Clave

| Imagen | Alt text actual | Alt text recomendado |
|--------|-----------------|---------------------|
| `hero-van.png` | Sin alt o genérico | `"Van privada para transfer aeropuerto araucanía Temuco Pucón"` |
| `fondotraslados.png` | Sin alt | (imagen decorativa, alt vacío `""`) |
| `logo.png` | `"Transportes Araucaria"` | `"Transportes Araucaria - Transfer Aeropuerto Araucanía"` |

---

## Paso 6 — Grupo de Anuncios Recomendados en Google Ads

### Grupo 1: Transfer Aeropuerto (Captura directa)

**Keywords:**
```
[transfer aeropuerto araucanía]
[transfer aeropuerto temuco]
[transfer ZCO]
[taxi aeropuerto ZCO]
[shuttle aeropuerto temuco]
"transfer desde aeropuerto temuco"
"traslado aeropuerto la araucanía"
```

**Título 1:** Transfer Aeropuerto Araucanía
**Título 2:** Privado • Puntual • Online
**Título 3:** Pucón, Villarrica y Temuco
**Descripción 1:** Traslado privado desde el Aeropuerto ZCO. Conductor certificado, vehículo exclusivo. Reserva y paga online. 
**Descripción 2:** Auto o van para grupos. Nos adaptamos a tu horario de vuelo. ¡Reserva ahora con descuento!

### Grupo 2: Traslados por Destino

**Keywords:**
```
"transfer pucón aeropuerto"
"transfer villarrica aeropuerto"
"traslado privado pucón"
"taxi privado pucón aeropuerto"
"transfer temuco a pucón"
```

**Títulos:** Transfer Pucón desde Aeropuerto | Privado y Puntual | Reserva Online

### Grupo 3: Traslados Turísticos (Broad)

**Keywords:**
```
+transfer +araucanía
+traslado +privado +araucanía
+transporte +turístico +pucón
```

---

## Flujo de Trabajo del Skill

### 1. Auditoría 🔍
```
1. Leer index.html → revisar title, description, keywords, schema
2. Leer LandingTraslados.jsx → analizar H1, H2, textos visibles, CTAs
3. Ejecutar grep_search("transfer|ZCO|aeropuerto") en src/**/*.{jsx,html}
4. Comparar textos con el Mapa de Keywords de este skill
```

### 2. Implementación de Mejoras ✍️
```
1. Actualizar index.html (meta tags + schema.org)
2. Actualizar H1 y H2 de LandingTraslados.jsx
3. Actualizar lista TIPOS_TRASLADO con keywords de aeropuerto
4. Revisar alt text de imágenes en HeroExpress.jsx
5. Actualizar destinos.jsx con textos SEO por destino
```

### 3. Validación ✅
```
1. Contar menciones de keywords primarias en archivo modificado
2. Verificar que H1 incluya keyword principal
3. Verificar que schema.org sea JSON-LD válido
4. Sugerir prueba en https://search.google.com/test/rich-results
5. Sugerir prueba en https://pagespeed.web.dev/
```

---

## Notas Importantes

- **No hacer keyword stuffing**: máx. 2-3 menciones de la keyword primaria por sección.
- **El contenido debe ser natural**: Google penaliza texto artificialmente repetitivo.
- **PHP en Hostinger**: si se modifica algún archivo `.php` de SEO, recordar subirlo manualmente.
- **LandingTraslados.jsx es la landing de Google Ads**: es la página más crítica para el Quality Score.
- **Monitorear con Search Console**: revisar CTR, posición media y keywords de impresión.
