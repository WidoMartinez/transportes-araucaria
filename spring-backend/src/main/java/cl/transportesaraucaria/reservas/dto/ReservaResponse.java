package cl.transportesaraucaria.reservas.dto;

import cl.transportesaraucaria.reservas.model.entity.Reserva;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaResponse {
    
    private Long id;
    private String nombre;
    private String email;
    private String telefono;
    private String origen;
    private String destino;
    private LocalDate fecha;
    private LocalTime hora;
    private Integer pasajeros;
    private Boolean idaVuelta;
    private LocalDate fechaRegreso;
    private LocalTime horaRegreso;
    private String numeroVuelo;
    private String hotel;
    private String sillaInfantil;
    private String equipajeEspecial;
    private BigDecimal precioBase;
    private BigDecimal descuentoOnline;
    private BigDecimal descuentoRoundTrip;
    private BigDecimal descuentoPromocion;
    private BigDecimal descuentoCodigo;
    private BigDecimal totalConDescuento;
    private BigDecimal abono;
    private BigDecimal saldoPendiente;
    private Reserva.EstadoReserva estado;
    private String codigoDescuento;
    private String observaciones;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
}