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
import java.util.List;

@Entity
@Table(name = "codigos_descuento")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class CodigoDescuento {
    
    @Id
    @NotBlank(message = "El código es obligatorio")
    @Column(nullable = false, unique = true, length = 50)
    private String codigo;
    
    @NotBlank(message = "La descripción es obligatoria")
    @Column(nullable = false, length = 200)
    private String descripcion;
    
    @NotNull(message = "El tipo de descuento es obligatorio")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDescuento tipoDescuento;
    
    @NotNull(message = "El valor del descuento es obligatorio")
    @Positive(message = "El valor debe ser positivo")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valorDescuento;
    
    @NotNull(message = "El monto mínimo es obligatorio")
    @Positive(message = "El monto mínimo debe ser positivo")
    @Column(name = "monto_minimo", nullable = false, precision = 10, scale = 2)
    private BigDecimal montoMinimo;
    
    @NotNull(message = "La fecha de vencimiento es obligatoria")
    @Future(message = "La fecha de vencimiento debe ser futura")
    @Column(name = "fecha_vencimiento", nullable = false)
    private LocalDate fechaVencimiento;
    
    @Min(value = 1, message = "El límite de usos debe ser al menos 1")
    @Column(name = "limite_usos", nullable = false)
    private Integer limiteUsos = 1;
    
    @Column(name = "usos_actuales", nullable = false)
    private Integer usosActuales = 0;
    
    @ElementCollection
    @CollectionTable(name = "codigo_destinos_aplicables", joinColumns = @JoinColumn(name = "codigo"))
    @Column(name = "destino")
    private List<String> destinosAplicables;
    
    @Column(nullable = false)
    private Boolean activo = true;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    @Column(name = "creado_por", length = 100)
    private String creadoPor;
    
    @ElementCollection
    @CollectionTable(name = "codigo_usuarios_usaron", joinColumns = @JoinColumn(name = "codigo"))
    @Column(name = "usuario_id")
    private List<String> usuariosQueUsaron;
    
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
    
    public enum TipoDescuento {
        PORCENTAJE,
        MONTO_FIJO
    }
    
    public boolean isValido() {
        return activo && 
               usosActuales < limiteUsos && 
               LocalDate.now().isBefore(fechaVencimiento);
    }
    
    public boolean puedeUsar(String usuarioId) {
        if (usuariosQueUsaron == null) {
            return true;
        }
        return !usuariosQueUsaron.contains(usuarioId);
    }
}