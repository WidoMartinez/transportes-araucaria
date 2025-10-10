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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class FlowIntegration {
    
    private final RestTemplate restTemplate;
    
    @Value("${flow.api-key}")
    private String apiKey;
    
    @Value("${flow.secret-key}")
    private String secretKey;
    
    @Value("${flow.api-url}")
    private String apiUrl;
    
    @Value("${app.frontend-url}")
    private String frontendUrl;
    
    @Value("${app.backend-url}")
    private String backendUrl;
    
    public String crearPago(Reserva reserva, Pago pago) {
        try {
            log.info("Creando pago Flow para reserva: {}", reserva.getId());
            
            String url = apiUrl + "/payment/create";
            
            Map<String, String> params = new TreeMap<>();
            params.put("apiKey", apiKey);
            params.put("commerceOrder", "ORDEN-" + pago.getIdTransaccion());
            params.put("subject", "Traslado " + reserva.getOrigen() + " - " + reserva.getDestino().getNombre());
            params.put("currency", "CLP");
            params.put("amount", pago.getMonto().toString());
            params.put("email", reserva.getEmail());
            params.put("urlConfirmation", backendUrl + "/api/pagos/webhook/flow");
            params.put("urlReturn", frontendUrl + "/pago-exitoso");
            
            // Generar firma
            String signature = generarFirma(params);
            params.put("s", signature);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            // Convertir parámetros a form data
            StringBuilder formData = new StringBuilder();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (formData.length() > 0) {
                    formData.append("&");
                }
                formData.append(entry.getKey()).append("=").append(entry.getValue());
            }
            
            HttpEntity<String> request = new HttpEntity<>(formData.toString(), headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                String paymentUrl = (String) responseBody.get("url");
                String token = (String) responseBody.get("token");
                
                if (paymentUrl != null && token != null) {
                    String redirectUrl = paymentUrl + "?token=" + token;
                    log.info("Pago Flow creado exitosamente: {}", redirectUrl);
                    return redirectUrl;
                } else {
                    throw new RuntimeException("No se recibieron URL y token en la respuesta de Flow");
                }
            } else {
                throw new RuntimeException("Error en la respuesta de Flow: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Error creando pago Flow: {}", e.getMessage(), e);
            throw new RuntimeException("Error integrando con Flow: " + e.getMessage());
        }
    }
    
    public Map<String, Object> obtenerEstadoPago(String token) {
        try {
            log.info("Consultando estado de pago Flow: {}", token);
            
            String url = apiUrl + "/payment/getStatus";
            
            Map<String, String> params = new TreeMap<>();
            params.put("apiKey", apiKey);
            params.put("token", token);
            
            // Generar firma
            String signature = generarFirma(params);
            params.put("s", signature);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            
            // Convertir parámetros a form data
            StringBuilder formData = new StringBuilder();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (formData.length() > 0) {
                    formData.append("&");
                }
                formData.append(entry.getKey()).append("=").append(entry.getValue());
            }
            
            HttpEntity<String> request = new HttpEntity<>(formData.toString(), headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            } else {
                throw new RuntimeException("Error consultando pago en Flow: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("Error consultando estado de pago Flow: {}", e.getMessage(), e);
            throw new RuntimeException("Error consultando pago en Flow: " + e.getMessage());
        }
    }
    
    private String generarFirma(Map<String, String> params) {
        try {
            StringBuilder toSign = new StringBuilder();
            for (Map.Entry<String, String> entry : params.entrySet()) {
                toSign.append(entry.getKey()).append(entry.getValue());
            }
            
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(secretKeySpec);
            
            byte[] signature = mac.doFinal(toSign.toString().getBytes(StandardCharsets.UTF_8));
            return bytesToHex(signature);
            
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("Error generando firma Flow: {}", e.getMessage());
            throw new RuntimeException("Error generando firma: " + e.getMessage());
        }
    }
    
    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}