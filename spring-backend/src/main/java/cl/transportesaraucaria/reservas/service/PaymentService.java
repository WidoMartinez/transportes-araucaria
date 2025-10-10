package cl.transportesaraucaria.reservas.service;

import cl.transportesaraucaria.reservas.model.entity.Reserva;
import cl.transportesaraucaria.reservas.model.entity.Pago;
import cl.transportesaraucaria.reservas.repository.ReservaRepository;
import cl.transportesaraucaria.reservas.repository.PagoRepository;
import cl.transportesaraucaria.reservas.dto.PaymentRequest;
import cl.transportesaraucaria.reservas.dto.PaymentResponse;
import cl.transportesaraucaria.reservas.exception.PaymentException;
import cl.transportesaraucaria.reservas.integration.MercadoPagoIntegration;
import cl.transportesaraucaria.reservas.integration.FlowIntegration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentService {
    
    private final ReservaRepository reservaRepository;
    private final PagoRepository pagoRepository;
    private final MercadoPagoIntegration mercadoPagoIntegration;
    private final FlowIntegration flowIntegration;
    private final EmailService emailService;
    
    @Value("${app.frontend-url}")
    private String frontendUrl;
    
    public PaymentResponse crearPago(PaymentRequest request) {
        log.info("Creando pago para reserva: {}, tipo: {}, gateway: {}", 
                request.getReservaId(), request.getTipoPago(), request.getGateway());
        
        // Buscar reserva
        Reserva reserva = reservaRepository.findById(request.getReservaId())
                .orElseThrow(() -> new PaymentException("Reserva no encontrada con ID: " + request.getReservaId()));
        
        // Validar estado de la reserva
        if (reserva.getEstado() != Reserva.EstadoReserva.CONFIRMADA) {
            throw new PaymentException("La reserva debe estar confirmada para procesar el pago");
        }
        
        // Calcular monto según tipo de pago
        BigDecimal monto = calcularMontoPago(reserva, request.getTipoPago());
        
        // Crear registro de pago
        Pago pago = new Pago();
        pago.setReserva(reserva);
        pago.setMonto(monto);
        pago.setTipoPago(request.getTipoPago());
        pago.setGatewayPago(request.getGateway());
        pago.setIdTransaccion(UUID.randomUUID().toString());
        
        pago = pagoRepository.save(pago);
        
        // Crear pago en el gateway correspondiente
        String urlPago;
        try {
            switch (request.getGateway().toLowerCase()) {
                case "mercadopago":
                    urlPago = mercadoPagoIntegration.crearPreferencia(reserva, pago);
                    break;
                case "flow":
                    urlPago = flowIntegration.crearPago(reserva, pago);
                    break;
                default:
                    throw new PaymentException("Gateway de pago no soportado: " + request.getGateway());
            }
            
            // Actualizar pago con URL
            pago.setUrlPago(urlPago);
            pagoRepository.save(pago);
            
            log.info("Pago creado exitosamente con ID: {}, URL: {}", pago.getId(), urlPago);
            
            return PaymentResponse.builder()
                    .pagoId(pago.getId())
                    .urlPago(urlPago)
                    .monto(monto)
                    .tipoPago(request.getTipoPago())
                    .gateway(request.getGateway())
                    .build();
            
        } catch (Exception e) {
            log.error("Error creando pago en gateway {}: {}", request.getGateway(), e.getMessage());
            throw new PaymentException("Error procesando pago: " + e.getMessage());
        }
    }
    
    public void procesarWebhookMercadoPago(String paymentId, String status) {
        log.info("Procesando webhook MercadoPago - Payment ID: {}, Status: {}", paymentId, status);
        
        try {
            // Buscar pago por ID de transacción
            Pago pago = pagoRepository.findByGatewayAndIdTransaccion("mercadopago", paymentId)
                    .orElseThrow(() -> new PaymentException("Pago no encontrado con ID: " + paymentId));
            
            // Actualizar estado del pago
            Pago.EstadoPago nuevoEstado = mapMercadoPagoStatus(status);
            pago.setEstado(nuevoEstado);
            
            if (nuevoEstado == Pago.EstadoPago.APROBADO) {
                pago.setFechaPago(LocalDateTime.now());
                
                // Actualizar estado de la reserva
                Reserva reserva = pago.getReserva();
                reserva.setEstado(Reserva.EstadoReserva.PAGADA);
                reservaRepository.save(reserva);
                
                // Enviar notificación de pago
                try {
                    emailService.enviarNotificacionPago(reserva, 
                            pago.getTipoPago().toString(), pago.getMonto());
                } catch (Exception e) {
                    log.error("Error enviando notificación de pago: {}", e.getMessage());
                }
            }
            
            pagoRepository.save(pago);
            log.info("Webhook MercadoPago procesado exitosamente para pago: {}", pago.getId());
            
        } catch (Exception e) {
            log.error("Error procesando webhook MercadoPago: {}", e.getMessage());
            throw new PaymentException("Error procesando webhook: " + e.getMessage());
        }
    }
    
    public void procesarWebhookFlow(String token, String status) {
        log.info("Procesando webhook Flow - Token: {}, Status: {}", token, status);
        
        try {
            // Buscar pago por token
            Pago pago = pagoRepository.findByGatewayAndIdTransaccion("flow", token)
                    .orElseThrow(() -> new PaymentException("Pago no encontrado con token: " + token));
            
            // Actualizar estado del pago
            Pago.EstadoPago nuevoEstado = mapFlowStatus(status);
            pago.setEstado(nuevoEstado);
            
            if (nuevoEstado == Pago.EstadoPago.APROBADO) {
                pago.setFechaPago(LocalDateTime.now());
                
                // Actualizar estado de la reserva
                Reserva reserva = pago.getReserva();
                reserva.setEstado(Reserva.EstadoReserva.PAGADA);
                reservaRepository.save(reserva);
                
                // Enviar notificación de pago
                try {
                    emailService.enviarNotificacionPago(reserva, 
                            pago.getTipoPago().toString(), pago.getMonto());
                } catch (Exception e) {
                    log.error("Error enviando notificación de pago: {}", e.getMessage());
                }
            }
            
            pagoRepository.save(pago);
            log.info("Webhook Flow procesado exitosamente para pago: {}", pago.getId());
            
        } catch (Exception e) {
            log.error("Error procesando webhook Flow: {}", e.getMessage());
            throw new PaymentException("Error procesando webhook: " + e.getMessage());
        }
    }
    
    private BigDecimal calcularMontoPago(Reserva reserva, Pago.TipoPago tipoPago) {
        return switch (tipoPago) {
            case ABONO -> reserva.getAbono();
            case TOTAL -> reserva.getTotalConDescuento();
        };
    }
    
    private Pago.EstadoPago mapMercadoPagoStatus(String status) {
        return switch (status.toLowerCase()) {
            case "approved" -> Pago.EstadoPago.APROBADO;
            case "rejected" -> Pago.EstadoPago.RECHAZADO;
            case "cancelled" -> Pago.EstadoPago.CANCELADO;
            default -> Pago.EstadoPago.PENDIENTE;
        };
    }
    
    private Pago.EstadoPago mapFlowStatus(String status) {
        return switch (status.toLowerCase()) {
            case "paid" -> Pago.EstadoPago.APROBADO;
            case "rejected" -> Pago.EstadoPago.RECHAZADO;
            case "cancelled" -> Pago.EstadoPago.CANCELADO;
            default -> Pago.EstadoPago.PENDIENTE;
        };
    }
}