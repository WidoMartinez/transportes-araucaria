package cl.transportesaraucaria.reservas.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservaRequest {
    
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    @Size(max = 100, message = "El email no puede exceder 100 caracteres")
    private String email;
    
    @NotBlank(message = "El teléfono es obligatorio")
    @Pattern(regexp = "^\\+56\\s?9\\s?\\d{4}\\s?\\d{4}$", 
             message = "El formato del teléfono debe ser +56 9 XXXX XXXX")
    private String telefono;
    
    @NotBlank(message = "El origen es obligatorio")
    @Size(max = 100, message = "El origen no puede exceder 100 caracteres")
    private String origen;
    
    @NotBlank(message = "El destino es obligatorio")
    private String destino;
    
    @NotNull(message = "La fecha es obligatoria")
    @Future(message = "La fecha debe ser futura")
    private LocalDate fecha;
    
    @NotNull(message = "La hora es obligatoria")
    private LocalTime hora;
    
    @NotNull(message = "El número de pasajeros es obligatorio")
    @Min(value = 1, message = "Debe haber al menos 1 pasajero")
    @Max(value = 8, message = "Máximo 8 pasajeros")
    private Integer pasajeros;
    
    private Boolean idaVuelta = false;
    
    private LocalDate fechaRegreso;
    
    private LocalTime horaRegreso;
    
    @Size(max = 20, message = "El número de vuelo no puede exceder 20 caracteres")
    private String numeroVuelo;
    
    @Size(max = 200, message = "El hotel no puede exceder 200 caracteres")
    private String hotel;
    
    @Size(max = 50, message = "La silla infantil no puede exceder 50 caracteres")
    private String sillaInfantil;
    
    @Size(max = 500, message = "El equipaje especial no puede exceder 500 caracteres")
    private String equipajeEspecial;
    
    @Size(max = 50, message = "El código de descuento no puede exceder 50 caracteres")
    private String codigoDescuento;
}