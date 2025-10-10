package cl.transportesaraucaria.reservas.dto;

import cl.transportesaraucaria.reservas.model.entity.Pago;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    
    @NotNull(message = "El ID de la reserva es obligatorio")
    private Long reservaId;
    
    @NotNull(message = "El tipo de pago es obligatorio")
    private Pago.TipoPago tipoPago;
    
    @NotBlank(message = "El gateway de pago es obligatorio")
    @Pattern(regexp = "^(mercadopago|flow)$", 
             message = "El gateway debe ser 'mercadopago' o 'flow'")
    private String gateway;
}