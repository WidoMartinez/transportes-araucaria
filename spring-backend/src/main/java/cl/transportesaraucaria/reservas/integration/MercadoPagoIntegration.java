package cl.transportesaraucaria.reservas.integration;

import cl.transportesaraucaria.reservas.model.entity.Reserva;
import cl.transportesaraucaria.reservas.model.entity.Pago;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoIntegration {
    
    private final RestTemplate restTemplate;
    
    @Value("${mercadopago.access-token}")
    private String accessToken;
    
    @Value("${app.frontend-url}")
    private String frontendUrl;
    
    @Value("${app.backend-url}")
    private String backendUrl;
    
    public String crearPreferencia(Reserva reserva, Pago pago) {
        try {
            log.info("Creando preferencia MercadoPago para reserva: {}", reserva.getId());
            
            String url = "https://api.mercadopago.com/checkout/preferences";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            
            Map<String, Object> preference = new HashMap<>();
            preference.put("items", new Object[]{
                Map.of(
                    "title", "Traslado " + reserva.getOrigen() + " - " + reserva.getDestino().getNombre(),
                    "description", "Reserva de traslado para " + reserva.getPasajeros() + " pasajero(s)",
                    "quantity", 1,
                    "unit_price", pago.getMonto().doubleValue(),
                    "currency_id", "CLP"
                )
            });
            
            preference.put("payer", Map.of(
                "email", reserva.getEmail(),
                "name", reserva.getNombre()
            ));
            
            preference.put("back_urls", Map.of(
                "success", frontendUrl + "/pago-exitoso",
                "failure", frontendUrl + "/pago-fallido",
                "pending", frontendUrl + "/pago-pendiente"
            ));
            
            preference.put("auto_return", "approved");
            preference.put("external_reference", pago.getIdTransaccion());
            preference.put("notification_url", backendUrl + "/api/pagos/webhook/mercadopago");
            
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("reserva_id", reserva.getId().toString());
            metadata.put("pago_id", pago.getId().toString());
            metadata.put("tipo_pago", pago.getTipoPago().toString());
            preference.put("metadata", metadata);
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(preference, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String initPoint = (String) responseBody.get("init_point");
                
                if (initPoint != null) {
                    log.info("Preferencia MercadoPago creada exitosamente: {}", initPoint);
                    return initPoint;
                } else {
                    throw new RuntimeException("No se recibió init_point en la respuesta de MercadoPago");
                }
            } else {
                throw new RuntimeException("Error en la respuesta de MercadoPago: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Error creando preferencia MercadoPago: {}", e.getMessage(), e);
            throw new RuntimeException("Error integrando con MercadoPago: " + e.getMessage());
        }
    }
    
    public Map<String, Object> obtenerEstadoPago(String paymentId) {
        try {
            log.info("Consultando estado de pago MercadoPago: {}", paymentId);
            
            String url = "https://api.mercadopago.com/v1/payments/" + paymentId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class, request);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Error consultando pago en MercadoPago: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Error consultando estado de pago MercadoPago: {}", e.getMessage(), e);
            throw new RuntimeException("Error consultando pago en MercadoPago: " + e.getMessage());
        }
    }
}