package cl.transportesaraucaria.reservas.repository;

import cl.transportesaraucaria.reservas.model.entity.Pago;
import cl.transportesaraucaria.reservas.model.entity.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {
    
    List<Pago> findByReservaOrderByFechaCreacionDesc(Reserva reserva);
    
    List<Pago> findByEstadoOrderByFechaCreacionDesc(Pago.EstadoPago estado);
    
    @Query("SELECT p FROM Pago p WHERE p.reserva = :reserva AND p.estado = :estado")
    List<Pago> findByReservaAndEstado(@Param("reserva") Reserva reserva, 
                                      @Param("estado") Pago.EstadoPago estado);
    
    @Query("SELECT p FROM Pago p WHERE p.gatewayPago = :gateway AND p.idTransaccion = :idTransaccion")
    Optional<Pago> findByGatewayAndIdTransaccion(@Param("gateway") String gateway, 
                                                 @Param("idTransaccion") String idTransaccion);
    
    @Query("SELECT p FROM Pago p WHERE p.estado = :estado AND p.fechaCreacion >= :desde " +
           "ORDER BY p.fechaCreacion DESC")
    List<Pago> findByEstadoYFechaCreacionDesde(@Param("estado") Pago.EstadoPago estado,
                                              @Param("desde") LocalDateTime desde);
    
    @Query("SELECT SUM(p.monto) FROM Pago p WHERE p.reserva = :reserva AND p.estado = :estado")
    java.math.BigDecimal sumarMontoPorReservaYEstado(@Param("reserva") Reserva reserva,
                                                    @Param("estado") Pago.EstadoPago estado);
    
    @Query("SELECT COUNT(p) FROM Pago p WHERE p.estado = :estado AND p.fechaCreacion >= :desde")
    Long contarPorEstadoYFechaCreacionDesde(@Param("estado") Pago.EstadoPago estado,
                                           @Param("desde") LocalDateTime desde);
    
    @Query("SELECT p FROM Pago p WHERE p.gatewayPago = :gateway " +
           "AND p.fechaCreacion BETWEEN :desde AND :hasta " +
           "ORDER BY p.fechaCreacion DESC")
    List<Pago> findByGatewayYPeriodo(@Param("gateway") String gateway,
                                    @Param("desde") LocalDateTime desde,
                                    @Param("hasta") LocalDateTime hasta);
    
    @Query("SELECT p FROM Pago p WHERE p.reserva.email = :email " +
           "ORDER BY p.fechaCreacion DESC")
    List<Pago> findByEmailReserva(@Param("email") String email);
    
    @Query("SELECT p FROM Pago p WHERE p.urlPago IS NOT NULL " +
           "AND p.estado = 'PENDIENTE' " +
           "AND p.fechaCreacion < :limite")
    List<Pago> findPagosPendientesExpirados(@Param("limite") LocalDateTime limite);
}