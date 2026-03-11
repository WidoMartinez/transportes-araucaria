
### 5.18 Sistema de Banners Promocionales

**Actualizado: Febrero 2026**

El sistema de promociones permite crear ofertas atractivas con imágenes que se muestran en la página principal (`PromocionBanners.jsx`). Estas promociones generan reservas rápidas con flujos de pago simplificados.

#### Características Principales
1.  **Tipos de Viaje Específicos**:
    -   `Desde Aeropuerto`: Fija el origen en Aeropuerto La Araucanía.
    -   `Hacia Aeropuerto`: Fija el destino en Aeropuerto La Araucanía.
    -   `Ida y Vuelta`: Permite libre elección de ruta.

2.  **Restricciones de Pasajeros**:
    -   **Rango Configurable**: Se define un mínimo (`min_pasajeros`) y máximo (`max_pasajeros`) de pasajeros.
    -   **Selector Dinámico**: El cliente selecciona la cantidad exacta dentro del rango permitido al reservar (ej: de 2 a 4).

3.  **Restricciones Horarias**:
    -   **Ventana de Reserva**: Se pueden definir horas de inicio y fin (ej: solo válido de 10:00 a 14:00).
    -   **Filtrado Inteligente**: El modal de reserva oculta automáticamente las horas fuera del rango permitido.

4.  **Generación de Leads e Integración**:
    -   **Link Directo**: Cada promoción tiene un link único (`/?promo=ID`) para campañas de marketing (Google Ads, Facebook).
    -   **Conversiones**: Las reservas generadas se marcan con `source: "banner_promocional"` para tracking de efectividad.

5.  **Flujo Técnico**:
    -   **Modelo**: `PromocionBanner.js` (MySQL).
    -   **API**: `POST /api/promociones-banner/desde-promocion/:id` crea la reserva.
    -   **Frontend**: `ReservaRapidaModal.jsx` maneja la interfaz de usuario simplificada.
    -   **Panel Admin**: `GestionPromociones.jsx` permite crear, editar y activar/desactivar promociones.
