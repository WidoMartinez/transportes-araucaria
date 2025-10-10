package cl.transportesaraucaria.reservas.service;

import cl.transportesaraucaria.reservas.model.entity.Destino;
import cl.transportesaraucaria.reservas.model.entity.Promocion;
import cl.transportesaraucaria.reservas.model.entity.CodigoDescuento;
import cl.transportesaraucaria.reservas.repository.DestinoRepository;
import cl.transportesaraucaria.reservas.repository.PromocionRepository;
import cl.transportesaraucaria.reservas.repository.CodigoDescuentoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PricingService {
    
    private final DestinoRepository destinoRepository;
    private final PromocionRepository promocionRepository;
    private final CodigoDescuentoRepository codigoDescuentoRepository;
    
    private static final BigDecimal DESCUENTO_ONLINE_BASE = new BigDecimal("5.00");
    private static final BigDecimal DESCUENTO_ROUND_TRIP = new BigDecimal("10.00");
    
    @Cacheable("pricing")
    public PrecioCalculado calcularPrecio(String destinoNombre, Integer pasajeros, 
                                         Boolean idaVuelta, String codigoDescuento) {
        log.debug("Calculando precio para destino: {}, pasajeros: {}, idaVuelta: {}, codigo: {}", 
                 destinoNombre, pasajeros, idaVuelta, codigoDescuento);
        
        // Buscar destino
        Optional<Destino> destinoOpt = destinoRepository.findByNombreAndActivoTrue(destinoNombre);
        if (destinoOpt.isEmpty()) {
            throw new IllegalArgumentException("Destino no encontrado: " + destinoNombre);
        }
        
        Destino destino = destinoOpt.get();
        BigDecimal precioBase = destino.getPrecioBase();
        
        // Calcular descuentos
        BigDecimal descuentoOnline = calcularDescuentoOnline(precioBase);
        BigDecimal descuentoRoundTrip = idaVuelta ? calcularDescuentoRoundTrip(precioBase) : BigDecimal.ZERO;
        BigDecimal descuentoPromocion = calcularDescuentoPromocion(destinoNombre, LocalDate.now(), LocalTime.now());
        BigDecimal descuentoCodigo = BigDecimal.ZERO;
        
        // Validar código de descuento si se proporciona
        if (codigoDescuento != null && !codigoDescuento.trim().isEmpty()) {
            descuentoCodigo = validarYCaluclarDescuentoCodigo(codigoDescuento, destinoNombre, precioBase);
        }
        
        // Calcular totales
        BigDecimal totalDescuentos = descuentoOnline.add(descuentoRoundTrip)
                                                   .add(descuentoPromocion)
                                                   .add(descuentoCodigo);
        
        BigDecimal totalConDescuento = precioBase.subtract(totalDescuentos);
        BigDecimal abono = totalConDescuento.multiply(new BigDecimal("0.40"));
        BigDecimal saldoPendiente = totalConDescuento.subtract(abono);
        
        return PrecioCalculado.builder()
                .precioBase(precioBase)
                .descuentoOnline(descuentoOnline)
                .descuentoRoundTrip(descuentoRoundTrip)
                .descuentoPromocion(descuentoPromocion)
                .descuentoCodigo(descuentoCodigo)
                .totalConDescuento(totalConDescuento)
                .abono(abono)
                .saldoPendiente(saldoPendiente)
                .vehiculoSugerido(destino.getVehiculoSugerido())
                .build();
    }
    
    private BigDecimal calcularDescuentoOnline(BigDecimal precioBase) {
        return precioBase.multiply(DESCUENTO_ONLINE_BASE.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
    }
    
    private BigDecimal calcularDescuentoRoundTrip(BigDecimal precioBase) {
        return precioBase.multiply(DESCUENTO_ROUND_TRIP.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
    }
    
    private BigDecimal calcularDescuentoPromocion(String destino, LocalDate fecha, LocalTime hora) {
        DayOfWeek diaSemana = fecha.getDayOfWeek();
        Promocion.DiaSemana dia = Promocion.DiaSemana.values()[diaSemana.getValue() - 1];
        
        List<Promocion> promociones = promocionRepository.findAplicablesParaReserva(destino, dia, hora, fecha);
        
        if (promociones.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        // Tomar la promoción con mayor descuento
        Promocion mejorPromocion = promociones.get(0);
        return mejorPromocion.getDescuentoPorcentaje();
    }
    
    private BigDecimal validarYCaluclarDescuentoCodigo(String codigo, String destino, BigDecimal monto) {
        LocalDate hoy = LocalDate.now();
        Optional<CodigoDescuento> codigoOpt = codigoDescuentoRepository.findValidoParaReserva(codigo, destino, monto, hoy);
        
        if (codigoOpt.isEmpty()) {
            throw new IllegalArgumentException("Código de descuento no válido o no aplicable");
        }
        
        CodigoDescuento codigoDescuento = codigoOpt.get();
        
        if (codigoDescuento.getTipoDescuento() == CodigoDescuento.TipoDescuento.PORCENTAJE) {
            return monto.multiply(codigoDescuento.getValorDescuento().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        } else {
            return codigoDescuento.getValorDescuento();
        }
    }
    
    @Cacheable("destinations")
    public List<Destino> obtenerDestinosActivos() {
        return destinoRepository.findByActivoTrueOrderByNombre();
    }
    
    public List<Promocion> obtenerPromocionesActivas() {
        return promocionRepository.findActivas(LocalDate.now());
    }
    
    public boolean validarCodigoDescuento(String codigo, String destino, BigDecimal monto) {
        try {
            validarYCaluclarDescuentoCodigo(codigo, destino, monto);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    @lombok.Data
    @lombok.Builder
    public static class PrecioCalculado {
        private BigDecimal precioBase;
        private BigDecimal descuentoOnline;
        private BigDecimal descuentoRoundTrip;
        private BigDecimal descuentoPromocion;
        private BigDecimal descuentoCodigo;
        private BigDecimal totalConDescuento;
        private BigDecimal abono;
        private BigDecimal saldoPendiente;
        private String vehiculoSugerido;
    }
}