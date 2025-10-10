package cl.transportesaraucaria.reservas.service;

import cl.transportesaraucaria.reservas.model.entity.Reserva;
import cl.transportesaraucaria.reservas.model.entity.Destino;
import cl.transportesaraucaria.reservas.model.entity.CodigoDescuento;
import cl.transportesaraucaria.reservas.repository.ReservaRepository;
import cl.transportesaraucaria.reservas.repository.DestinoRepository;
import cl.transportesaraucaria.reservas.repository.CodigoDescuentoRepository;
import cl.transportesaraucaria.reservas.dto.ReservaRequest;
import cl.transportesaraucaria.reservas.dto.ReservaResponse;
import cl.transportesaraucaria.reservas.exception.ReservaException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReservaService {
    
    private final ReservaRepository reservaRepository;
    private final DestinoRepository destinoRepository;
    private final CodigoDescuentoRepository codigoDescuentoRepository;
    private final PricingService pricingService;
    private final EmailService emailService;
    
    public ReservaResponse crearReserva(ReservaRequest request) {
        log.info("Creando nueva reserva para: {} - {}", request.getNombre(), request.getEmail());
        
        // Validar destino
        Destino destino = destinoRepository.findByNombreAndActivoTrue(request.getDestino())
                .orElseThrow(() -> new ReservaException("Destino no encontrado: " + request.getDestino()));
        
        // Validar disponibilidad
        validarDisponibilidad(destino, request.getFecha(), request.getHora());
        
        // Calcular precios
        PricingService.PrecioCalculado precio = pricingService.calcularPrecio(
                request.getDestino(), 
                request.getPasajeros(), 
                request.getIdaVuelta(),
                request.getCodigoDescuento()
        );
        
        // Crear reserva
        Reserva reserva = new Reserva();
        reserva.setNombre(request.getNombre());
        reserva.setEmail(request.getEmail());
        reserva.setTelefono(request.getTelefono());
        reserva.setOrigen(request.getOrigen());
        reserva.setDestino(destino);
        reserva.setFecha(request.getFecha());
        reserva.setHora(request.getHora());
        reserva.setPasajeros(request.getPasajeros());
        reserva.setIdaVuelta(request.getIdaVuelta());
        reserva.setFechaRegreso(request.getFechaRegreso());
        reserva.setHoraRegreso(request.getHoraRegreso());
        reserva.setNumeroVuelo(request.getNumeroVuelo());
        reserva.setHotel(request.getHotel());
        reserva.setSillaInfantil(request.getSillaInfantil());
        reserva.setEquipajeEspecial(request.getEquipajeEspecial());
        reserva.setCodigoDescuento(request.getCodigoDescuento());
        
        // Asignar precios
        reserva.setPrecioBase(precio.getPrecioBase());
        reserva.setDescuentoOnline(precio.getDescuentoOnline());
        reserva.setDescuentoRoundTrip(precio.getDescuentoRoundTrip());
        reserva.setDescuentoPromocion(precio.getDescuentoPromocion());
        reserva.setDescuentoCodigo(precio.getDescuentoCodigo());
        reserva.setTotalConDescuento(precio.getTotalConDescuento());
        reserva.setAbono(precio.getAbono());
        reserva.setSaldoPendiente(precio.getSaldoPendiente());
        
        // Guardar reserva
        reserva = reservaRepository.save(reserva);
        
        // Registrar uso del código de descuento si aplica
        if (request.getCodigoDescuento() != null && !request.getCodigoDescuento().trim().isEmpty()) {
            registrarUsoCodigoDescuento(request.getCodigoDescuento(), request.getEmail());
        }
        
        // Enviar email de confirmación
        try {
            emailService.enviarConfirmacionReserva(reserva);
        } catch (Exception e) {
            log.error("Error enviando email de confirmación para reserva {}: {}", reserva.getId(), e.getMessage());
        }
        
        log.info("Reserva creada exitosamente con ID: {}", reserva.getId());
        return mapToResponse(reserva);
    }
    
    @Transactional(readOnly = true)
    public ReservaResponse obtenerReserva(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ReservaException("Reserva no encontrada con ID: " + id));
        return mapToResponse(reserva);
    }
    
    @Transactional(readOnly = true)
    public List<ReservaResponse> obtenerReservasPorEmail(String email) {
        List<Reserva> reservas = reservaRepository.findByEmailOrderByFechaCreacionDesc(email);
        return reservas.stream().map(this::mapToResponse).toList();
    }
    
    @Transactional(readOnly = true)
    public Page<ReservaResponse> buscarReservas(String termino, Pageable pageable) {
        Page<Reserva> reservas = reservaRepository.buscarPorTermino(termino, pageable);
        return reservas.map(this::mapToResponse);
    }
    
    public ReservaResponse actualizarEstadoReserva(Long id, Reserva.EstadoReserva nuevoEstado) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ReservaException("Reserva no encontrada con ID: " + id));
        
        reserva.setEstado(nuevoEstado);
        reserva = reservaRepository.save(reserva);
        
        log.info("Estado de reserva {} actualizado a: {}", id, nuevoEstado);
        return mapToResponse(reserva);
    }
    
    public void cancelarReserva(Long id, String motivo) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ReservaException("Reserva no encontrada con ID: " + id));
        
        if (reserva.getEstado() == Reserva.EstadoReserva.CANCELADA) {
            throw new ReservaException("La reserva ya está cancelada");
        }
        
        reserva.setEstado(Reserva.EstadoReserva.CANCELADA);
        reserva.setObservaciones(motivo);
        reservaRepository.save(reserva);
        
        log.info("Reserva {} cancelada. Motivo: {}", id, motivo);
    }
    
    private void validarDisponibilidad(Destino destino, LocalDate fecha, LocalTime hora) {
        // Verificar si hay reservas conflictivas
        List<Reserva> reservasConflictivas = reservaRepository.findReservasConflictivas(
                destino, fecha, hora);
        
        if (!reservasConflictivas.isEmpty()) {
            throw new ReservaException("No hay disponibilidad para la fecha y hora seleccionadas");
        }
        
        // Verificar fecha no sea en el pasado
        if (fecha.isBefore(LocalDate.now())) {
            throw new ReservaException("No se pueden hacer reservas para fechas pasadas");
        }
        
        // Verificar horario de reserva (mínimo 2 horas de anticipación)
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime fechaHoraReserva = LocalDateTime.of(fecha, hora);
        
        if (fechaHoraReserva.isBefore(ahora.plusHours(2))) {
            throw new ReservaException("Las reservas deben hacerse con al menos 2 horas de anticipación");
        }
    }
    
    private void registrarUsoCodigoDescuento(String codigo, String usuarioId) {
        Optional<CodigoDescuento> codigoOpt = codigoDescuentoRepository.findById(codigo);
        if (codigoOpt.isPresent()) {
            CodigoDescuento codigoDescuento = codigoOpt.get();
            codigoDescuento.setUsosActuales(codigoDescuento.getUsosActuales() + 1);
            
            if (codigoDescuento.getUsuariosQueUsaron() == null) {
                codigoDescuento.setUsuariosQueUsaron(List.of(usuarioId));
            } else {
                codigoDescuento.getUsuariosQueUsaron().add(usuarioId);
            }
            
            codigoDescuentoRepository.save(codigoDescuento);
            log.info("Uso del código {} registrado para usuario {}", codigo, usuarioId);
        }
    }
    
    private ReservaResponse mapToResponse(Reserva reserva) {
        return ReservaResponse.builder()
                .id(reserva.getId())
                .nombre(reserva.getNombre())
                .email(reserva.getEmail())
                .telefono(reserva.getTelefono())
                .origen(reserva.getOrigen())
                .destino(reserva.getDestino().getNombre())
                .fecha(reserva.getFecha())
                .hora(reserva.getHora())
                .pasajeros(reserva.getPasajeros())
                .idaVuelta(reserva.getIdaVuelta())
                .fechaRegreso(reserva.getFechaRegreso())
                .horaRegreso(reserva.getHoraRegreso())
                .numeroVuelo(reserva.getNumeroVuelo())
                .hotel(reserva.getHotel())
                .sillaInfantil(reserva.getSillaInfantil())
                .equipajeEspecial(reserva.getEquipajeEspecial())
                .precioBase(reserva.getPrecioBase())
                .descuentoOnline(reserva.getDescuentoOnline())
                .descuentoRoundTrip(reserva.getDescuentoRoundTrip())
                .descuentoPromocion(reserva.getDescuentoPromocion())
                .descuentoCodigo(reserva.getDescuentoCodigo())
                .totalConDescuento(reserva.getTotalConDescuento())
                .abono(reserva.getAbono())
                .saldoPendiente(reserva.getSaldoPendiente())
                .estado(reserva.getEstado())
                .codigoDescuento(reserva.getCodigoDescuento())
                .observaciones(reserva.getObservaciones())
                .fechaCreacion(reserva.getFechaCreacion())
                .fechaActualizacion(reserva.getFechaActualizacion())
                .build();
    }
}