package cl.transportesaraucaria.reservas.controller;

import cl.transportesaraucaria.reservas.dto.ReservaRequest;
import cl.transportesaraucaria.reservas.dto.ReservaResponse;
import cl.transportesaraucaria.reservas.model.entity.Reserva;
import cl.transportesaraucaria.reservas.service.ReservaService;
import cl.transportesaraucaria.reservas.service.PricingService;
import cl.transportesaraucaria.reservas.exception.ReservaException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservas")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ReservaController {
    
    private final ReservaService reservaService;
    private final PricingService pricingService;
    
    @PostMapping
    public ResponseEntity<ReservaResponse> crearReserva(@Valid @RequestBody ReservaRequest request) {
        try {
            log.info("Creando nueva reserva para: {}", request.getEmail());
            ReservaResponse response = reservaService.crearReserva(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (ReservaException e) {
            log.error("Error creando reserva: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error interno creando reserva: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ReservaResponse> obtenerReserva(@PathVariable Long id) {
        try {
            ReservaResponse response = reservaService.obtenerReserva(id);
            return ResponseEntity.ok(response);
        } catch (ReservaException e) {
            log.error("Reserva no encontrada: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error obteniendo reserva: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/email/{email}")
    public ResponseEntity<List<ReservaResponse>> obtenerReservasPorEmail(@PathVariable String email) {
        try {
            List<ReservaResponse> reservas = reservaService.obtenerReservasPorEmail(email);
            return ResponseEntity.ok(reservas);
        } catch (Exception e) {
            log.error("Error obteniendo reservas por email: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/buscar")
    public ResponseEntity<Page<ReservaResponse>> buscarReservas(
            @RequestParam String termino,
            Pageable pageable) {
        try {
            Page<ReservaResponse> reservas = reservaService.buscarReservas(termino, pageable);
            return ResponseEntity.ok(reservas);
        } catch (Exception e) {
            log.error("Error buscando reservas: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{id}/estado")
    public ResponseEntity<ReservaResponse> actualizarEstadoReserva(
            @PathVariable Long id,
            @RequestParam Reserva.EstadoReserva estado) {
        try {
            ReservaResponse response = reservaService.actualizarEstadoReserva(id, estado);
            return ResponseEntity.ok(response);
        } catch (ReservaException e) {
            log.error("Error actualizando estado de reserva: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error interno actualizando estado: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<Void> cancelarReserva(
            @PathVariable Long id,
            @RequestParam(required = false) String motivo) {
        try {
            reservaService.cancelarReserva(id, motivo);
            return ResponseEntity.ok().build();
        } catch (ReservaException e) {
            log.error("Error cancelando reserva: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error interno cancelando reserva: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/pricing")
    public ResponseEntity<PricingService.PrecioCalculado> calcularPrecio(
            @RequestParam String destino,
            @RequestParam Integer pasajeros,
            @RequestParam(defaultValue = "false") Boolean idaVuelta,
            @RequestParam(required = false) String codigoDescuento) {
        try {
            PricingService.PrecioCalculado precio = pricingService.calcularPrecio(
                    destino, pasajeros, idaVuelta, codigoDescuento);
            return ResponseEntity.ok(precio);
        } catch (Exception e) {
            log.error("Error calculando precio: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/destinos")
    public ResponseEntity<List<cl.transportesaraucaria.reservas.model.entity.Destino>> obtenerDestinos() {
        try {
            List<cl.transportesaraucaria.reservas.model.entity.Destino> destinos = pricingService.obtenerDestinosActivos();
            return ResponseEntity.ok(destinos);
        } catch (Exception e) {
            log.error("Error obteniendo destinos: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/promociones")
    public ResponseEntity<List<cl.transportesaraucaria.reservas.model.entity.Promocion>> obtenerPromociones() {
        try {
            List<cl.transportesaraucaria.reservas.model.entity.Promocion> promociones = pricingService.obtenerPromocionesActivas();
            return ResponseEntity.ok(promociones);
        } catch (Exception e) {
            log.error("Error obteniendo promociones: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/validar-codigo")
    public ResponseEntity<Boolean> validarCodigoDescuento(
            @RequestParam String codigo,
            @RequestParam String destino,
            @RequestParam java.math.BigDecimal monto) {
        try {
            boolean valido = pricingService.validarCodigoDescuento(codigo, destino, monto);
            return ResponseEntity.ok(valido);
        } catch (Exception e) {
            log.error("Error validando código de descuento: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}