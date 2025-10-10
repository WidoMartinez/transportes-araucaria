package cl.transportesaraucaria.reservas.model.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class Reserva {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false, length = 100)
    private String nombre;
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    @Column(nullable = false, length = 100)
    private String email;
    
    @NotBlank(message = "El teléfono es obligatorio")
    @Pattern(regexp = "^\\+56\\s?9\\s?\\d{4}\\s?\\d{4}$", 
             message = "El formato del teléfono debe ser +56 9 XXXX XXXX")
    @Column(nullable = false, length = 20)
    private String telefono;
    
    @NotBlank(message = "El origen es obligatorio")
    @Column(nullable = false, length = 100)
    private String origen;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destino_id", nullable = false)
    private Destino destino;
    
    @NotNull(message = "La fecha es obligatoria")
    @Column(nullable = false)
    private LocalDate fecha;
    
    @NotNull(message = "La hora es obligatoria")
    @Column(nullable = false)
    private LocalTime hora;
    
    @Min(value = 1, message = "Debe haber al menos 1 pasajero")
    @Max(value = 8, message = "Máximo 8 pasajeros")
    @Column(nullable = false)
    private Integer pasajeros;
    
    @Column(name = "ida_vuelta")
    private Boolean idaVuelta = false;
    
    @Column(name = "fecha_regreso")
    private LocalDate fechaRegreso;
    
    @Column(name = "hora_regreso")
    private LocalTime horaRegreso;
    
    @Column(name = "numero_vuelo", length = 20)
    private String numeroVuelo;
    
    @Column(name = "hotel", length = 200)
    private String hotel;
    
    @Column(name = "silla_infantil", length = 50)
    private String sillaInfantil;
    
    @Column(name = "equipaje_especial", length = 500)
    private String equipajeEspecial;
    
    @Column(name = "precio_base", precision = 10, scale = 2)
    private BigDecimal precioBase;
    
    @Column(name = "descuento_online", precision = 10, scale = 2)
    private BigDecimal descuentoOnline;
    
    @Column(name = "descuento_round_trip", precision = 10, scale = 2)
    private BigDecimal descuentoRoundTrip;
    
    @Column(name = "descuento_promocion", precision = 10, scale = 2)
    private BigDecimal descuentoPromocion;
    
    @Column(name = "descuento_codigo", precision = 10, scale = 2)
    private BigDecimal descuentoCodigo;
    
    @Column(name = "total_con_descuento", precision = 10, scale = 2)
    private BigDecimal totalConDescuento;
    
    @Column(name = "abono", precision = 10, scale = 2)
    private BigDecimal abono;
    
    @Column(name = "saldo_pendiente", precision = 10, scale = 2)
    private BigDecimal saldoPendiente;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoReserva estado = EstadoReserva.PENDIENTE;
    
    @Column(name = "codigo_descuento", length = 50)
    private String codigoDescuento;
    
    @Column(name = "observaciones", length = 1000)
    private String observaciones;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<Pago> pagos;
    
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
    
    public enum EstadoReserva {
        PENDIENTE,
        CONFIRMADA,
        PAGADA,
        CANCELADA,
        COMPLETADA
    }
}