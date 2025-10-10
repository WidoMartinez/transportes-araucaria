package cl.transportesaraucaria.reservas.controller;

import cl.transportesaraucaria.reservas.dto.PaymentRequest;
import cl.transportesaraucaria.reservas.dto.PaymentResponse;
import cl.transportesaraucaria.reservas.service.PaymentService;
import cl.transportesaraucaria.reservas.exception.PaymentException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/pagos")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PaymentController {
    
    private final PaymentService paymentService;
    
    @PostMapping
    public ResponseEntity<PaymentResponse> crearPago(@Valid @RequestBody PaymentRequest request) {
        try {
            log.info("Creando pago para reserva: {}", request.getReservaId());
            PaymentResponse response = paymentService.crearPago(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (PaymentException e) {
            log.error("Error creando pago: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error interno creando pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/webhook/mercadopago")
    public ResponseEntity<String> webhookMercadoPago(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String id,
            @RequestBody(required = false) String body) {
        try {
            log.info("Webhook MercadoPago recibido - Topic: {}, ID: {}", topic, id);
            
            // Procesar webhook según el tipo de notificación
            if ("payment".equals(topic) && id != null) {
                paymentService.procesarWebhookMercadoPago(id, "approved"); // Simplificado para demo
            }
            
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error procesando webhook MercadoPago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ERROR");
        }
    }
    
    @PostMapping("/webhook/flow")
    public ResponseEntity<String> webhookFlow(
            @RequestParam(required = false) String token,
            @RequestParam(required = false) String status) {
        try {
            log.info("Webhook Flow recibido - Token: {}, Status: {}", token, status);
            
            if (token != null) {
                paymentService.procesarWebhookFlow(token, status != null ? status : "paid");
            }
            
            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            log.error("Error procesando webhook Flow: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("ERROR");
        }
    }
    
    @GetMapping("/{pagoId}/estado")
    public ResponseEntity<String> obtenerEstadoPago(@PathVariable Long pagoId) {
        try {
            // Implementar lógica para obtener estado del pago
            return ResponseEntity.ok("PENDIENTE");
        } catch (Exception e) {
            log.error("Error obteniendo estado del pago: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}