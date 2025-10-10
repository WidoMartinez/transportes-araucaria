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
import java.util.List;

@Entity
@Table(name = "promociones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class Promocion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "La descripción es obligatoria")
    @Column(nullable = false, length = 200)
    private String descripcion;
    
    @NotNull(message = "El descuento es obligatorio")
    @Positive(message = "El descuento debe ser positivo")
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal descuentoPorcentaje;
    
    @NotNull(message = "La fecha de inicio es obligatoria")
    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;
    
    @NotNull(message = "La fecha de fin es obligatoria")
    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;
    
    @Column(name = "hora_inicio")
    private LocalTime horaInicio;
    
    @Column(name = "hora_fin")
    private LocalTime horaFin;
    
    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "promocion_dias", joinColumns = @JoinColumn(name = "promocion_id"))
    @Column(name = "dia_semana")
    private List<DiaSemana> dias;
    
    @ElementCollection
    @CollectionTable(name = "promocion_destinos", joinColumns = @JoinColumn(name = "promocion_id"))
    @Column(name = "destino")
    private List<String> destinos;
    
    @Column(name = "aplica_por_dias")
    private Boolean aplicaPorDias = false;
    
    @Column(name = "aplica_por_horario")
    private Boolean aplicaPorHorario = false;
    
    @Column(name = "aplica_por_destino")
    private Boolean aplicaPorDestino = false;
    
    @Column(nullable = false)
    private Boolean activo = true;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaActualizacion = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        fechaActualizacion = LocalDateTime.now();
    }
    
    public enum DiaSemana {
        LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO
    }
    
    public boolean isActiva() {
        LocalDate hoy = LocalDate.now();
        return activo && 
               !hoy.isBefore(fechaInicio) && 
               !hoy.isAfter(fechaFin);
    }
    
    public boolean aplicaPorDia(LocalDate fecha) {
        if (!aplicaPorDias || dias == null || dias.isEmpty()) {
            return true;
        }
        
        DiaSemana diaSemana = DiaSemana.values()[fecha.getDayOfWeek().getValue() - 1];
        return dias.contains(diaSemana);
    }
    
    public boolean aplicaPorHorario(LocalTime hora) {
        if (!aplicaPorHorario || horaInicio == null || horaFin == null) {
            return true;
        }
        
        return !hora.isBefore(horaInicio) && !hora.isAfter(horaFin);
    }
    
    public boolean aplicaPorDestino(String destino) {
        if (!aplicaPorDestino || destinos == null || destinos.isEmpty()) {
            return true;
        }
        
        return destinos.contains(destino);
    }
}