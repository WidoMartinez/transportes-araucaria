package cl.transportesaraucaria.reservas.controller;

import cl.transportesaraucaria.reservas.model.entity.CodigoDescuento;
import cl.transportesaraucaria.reservas.model.entity.Destino;
import cl.transportesaraucaria.reservas.model.entity.Promocion;
import cl.transportesaraucaria.reservas.repository.CodigoDescuentoRepository;
import cl.transportesaraucaria.reservas.repository.DestinoRepository;
import cl.transportesaraucaria.reservas.repository.PromocionRepository;
import cl.transportesaraucaria.reservas.repository.ReservaRepository;
import cl.transportesaraucaria.reservas.dto.ReservaResponse;
import cl.transportesaraucaria.reservas.service.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminController {
    
    private final DestinoRepository destinoRepository;
    private final CodigoDescuentoRepository codigoDescuentoRepository;
    private final PromocionRepository promocionRepository;
    private final ReservaRepository reservaRepository;
    private final ReservaService reservaService;
    
    // === DESTINOS ===
    @GetMapping("/destinos")
    public ResponseEntity<List<Destino>> obtenerDestinos() {
        try {
            List<Destino> destinos = destinoRepository.findAll();
            return ResponseEntity.ok(destinos);
        } catch (Exception e) {
            log.error("Error obteniendo destinos: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/destinos")
    public ResponseEntity<Destino> crearDestino(@Valid @RequestBody Destino destino) {
        try {
            Destino nuevoDestino = destinoRepository.save(destino);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoDestino);
        } catch (Exception e) {
            log.error("Error creando destino: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/destinos/{id}")
    public ResponseEntity<Destino> actualizarDestino(@PathVariable Long id, @Valid @RequestBody Destino destino) {
        try {
            if (!destinoRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            destino.setId(id);
            Destino destinoActualizado = destinoRepository.save(destino);
            return ResponseEntity.ok(destinoActualizado);
        } catch (Exception e) {
            log.error("Error actualizando destino: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/destinos/{id}")
    public ResponseEntity<Void> eliminarDestino(@PathVariable Long id) {
        try {
            if (!destinoRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            destinoRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error eliminando destino: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // === CÓDIGOS DE DESCUENTO ===
    @GetMapping("/codigos")
    public ResponseEntity<List<CodigoDescuento>> obtenerCodigos() {
        try {
            List<CodigoDescuento> codigos = codigoDescuentoRepository.findAll();
            return ResponseEntity.ok(codigos);
        } catch (Exception e) {
            log.error("Error obteniendo códigos: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/codigos")
    public ResponseEntity<CodigoDescuento> crearCodigo(@Valid @RequestBody CodigoDescuento codigo) {
        try {
            CodigoDescuento nuevoCodigo = codigoDescuentoRepository.save(codigo);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoCodigo);
        } catch (Exception e) {
            log.error("Error creando código: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/codigos/{codigo}")
    public ResponseEntity<CodigoDescuento> actualizarCodigo(@PathVariable String codigo, @Valid @RequestBody CodigoDescuento codigoActualizado) {
        try {
            if (!codigoDescuentoRepository.existsById(codigo)) {
                return ResponseEntity.notFound().build();
            }
            codigoActualizado.setCodigo(codigo);
            CodigoDescuento resultado = codigoDescuentoRepository.save(codigoActualizado);
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            log.error("Error actualizando código: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/codigos/{codigo}")
    public ResponseEntity<Void> eliminarCodigo(@PathVariable String codigo) {
        try {
            if (!codigoDescuentoRepository.existsById(codigo)) {
                return ResponseEntity.notFound().build();
            }
            codigoDescuentoRepository.deleteById(codigo);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error eliminando código: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // === PROMOCIONES ===
    @GetMapping("/promociones")
    public ResponseEntity<List<Promocion>> obtenerPromociones() {
        try {
            List<Promocion> promociones = promocionRepository.findAll();
            return ResponseEntity.ok(promociones);
        } catch (Exception e) {
            log.error("Error obteniendo promociones: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/promociones")
    public ResponseEntity<Promocion> crearPromocion(@Valid @RequestBody Promocion promocion) {
        try {
            Promocion nuevaPromocion = promocionRepository.save(promocion);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaPromocion);
        } catch (Exception e) {
            log.error("Error creando promoción: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/promociones/{id}")
    public ResponseEntity<Promocion> actualizarPromocion(@PathVariable Long id, @Valid @RequestBody Promocion promocion) {
        try {
            if (!promocionRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            promocion.setId(id);
            Promocion promocionActualizada = promocionRepository.save(promocion);
            return ResponseEntity.ok(promocionActualizada);
        } catch (Exception e) {
            log.error("Error actualizando promoción: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/promociones/{id}")
    public ResponseEntity<Void> eliminarPromocion(@PathVariable Long id) {
        try {
            if (!promocionRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }
            promocionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error eliminando promoción: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // === RESERVAS ===
    @GetMapping("/reservas")
    public ResponseEntity<Page<ReservaResponse>> obtenerReservas(Pageable pageable) {
        try {
            Page<ReservaResponse> reservas = reservaService.buscarReservas("", pageable);
            return ResponseEntity.ok(reservas);
        } catch (Exception e) {
            log.error("Error obteniendo reservas: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/reservas/estadisticas")
    public ResponseEntity<Object> obtenerEstadisticas() {
        try {
            LocalDate hoy = LocalDate.now();
            LocalDate hace30Dias = hoy.minusDays(30);
            
            long totalReservas = reservaRepository.count();
            long reservasUltimos30Dias = reservaRepository.contarReservasPorPeriodoYEstado(
                    hace30Dias, hoy, cl.transportesaraucaria.reservas.model.entity.Reserva.EstadoReserva.CONFIRMADA);
            long reservasPagadas = reservaRepository.contarReservasPorPeriodoYEstado(
                    hace30Dias, hoy, cl.transportesaraucaria.reservas.model.entity.Reserva.EstadoReserva.PAGADA);
            
            return ResponseEntity.ok(java.util.Map.of(
                    "totalReservas", totalReservas,
                    "reservasUltimos30Dias", reservasUltimos30Dias,
                    "reservasPagadas", reservasPagadas
            ));
        } catch (Exception e) {
            log.error("Error obteniendo estadísticas: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}