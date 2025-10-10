package cl.transportesaraucaria.reservas.dto;

import cl.transportesaraucaria.reservas.model.entity.Pago;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    
    private Long pagoId;
    private String urlPago;
    private BigDecimal monto;
    private Pago.TipoPago tipoPago;
    private String gateway;
}