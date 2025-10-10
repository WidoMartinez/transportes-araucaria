package cl.transportesaraucaria.reservas.repository;

import cl.transportesaraucaria.reservas.model.entity.CodigoDescuento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CodigoDescuentoRepository extends JpaRepository<CodigoDescuento, String> {
    
    List<CodigoDescuento> findByActivoTrueOrderByFechaCreacionDesc();
    
    @Query("SELECT c FROM CodigoDescuento c WHERE c.codigo = :codigo AND c.activo = true " +
           "AND c.usosActuales < c.limiteUsos AND c.fechaVencimiento > :hoy")
    Optional<CodigoDescuento> findValidoByCodigo(@Param("codigo") String codigo, @Param("hoy") LocalDate hoy);
    
    @Query("SELECT c FROM CodigoDescuento c WHERE c.activo = true " +
           "AND c.fechaVencimiento > :hoy " +
           "AND (c.destinosAplicables IS EMPTY OR :destino MEMBER OF c.destinosAplicables) " +
           "AND c.montoMinimo <= :monto")
    List<CodigoDescuento> findAplicablesParaReserva(@Param("destino") String destino, 
                                                    @Param("monto") java.math.BigDecimal monto,
                                                    @Param("hoy") LocalDate hoy);
    
    @Query("SELECT c FROM CodigoDescuento c WHERE c.activo = true " +
           "AND c.fechaVencimiento > :hoy " +
           "AND c.codigo = :codigo " +
           "AND (c.destinosAplicables IS EMPTY OR :destino MEMBER OF c.destinosAplicables) " +
           "AND c.montoMinimo <= :monto")
    Optional<CodigoDescuento> findValidoParaReserva(@Param("codigo") String codigo,
                                                    @Param("destino") String destino,
                                                    @Param("monto") java.math.BigDecimal monto,
                                                    @Param("hoy") LocalDate hoy);
    
    @Query("SELECT c FROM CodigoDescuento c WHERE c.activo = true " +
           "AND c.fechaVencimiento BETWEEN :desde AND :hasta " +
           "ORDER BY c.fechaCreacion DESC")
    List<CodigoDescuento> findVigentesEnPeriodo(@Param("desde") LocalDate desde, 
                                                @Param("hasta") LocalDate hasta);
    
    @Query("SELECT c FROM CodigoDescuento c WHERE c.activo = true " +
           "AND c.usosActuales >= c.limiteUsos")
    List<CodigoDescuento> findAgotados();
    
    @Query("SELECT c FROM CodigoDescuento c WHERE c.activo = true " +
           "AND c.fechaVencimiento < :hoy")
    List<CodigoDescuento> findVencidos(@Param("hoy") LocalDate hoy);
    
    @Query("SELECT c FROM CodigoDescuento c WHERE " +
           "(LOWER(c.codigo) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "LOWER(c.descripcion) LIKE LOWER(CONCAT('%', :termino, '%'))) " +
           "ORDER BY c.fechaCreacion DESC")
    List<CodigoDescuento> buscarPorTermino(@Param("termino") String termino);
    
    @Query("SELECT COUNT(c) FROM CodigoDescuento c WHERE c.activo = true " +
           "AND c.fechaVencimiento > :hoy")
    Long contarActivos(@Param("hoy") LocalDate hoy);
    
    @Query("SELECT c FROM CodigoDescuento c WHERE c.activo = true " +
           "AND c.creadoPor = :creadoPor " +
           "ORDER BY c.fechaCreacion DESC")
    List<CodigoDescuento> findByCreadoPor(@Param("creadoPor") String creadoPor);
}