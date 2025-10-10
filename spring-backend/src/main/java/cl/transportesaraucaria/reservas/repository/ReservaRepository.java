package cl.transportesaraucaria.reservas.repository;

import cl.transportesaraucaria.reservas.model.entity.Reserva;
import cl.transportesaraucaria.reservas.model.entity.Destino;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    
    List<Reserva> findByEmailOrderByFechaCreacionDesc(String email);
    
    List<Reserva> findByTelefonoOrderByFechaCreacionDesc(String telefono);
    
    List<Reserva> findByDestinoAndFechaAndEstadoIn(Destino destino, LocalDate fecha, List<Reserva.EstadoReserva> estados);
    
    @Query("SELECT r FROM Reserva r WHERE r.fecha BETWEEN :fechaInicio AND :fechaFin " +
           "AND r.estado IN :estados ORDER BY r.fecha, r.hora")
    List<Reserva> findByFechaBetweenAndEstadoIn(@Param("fechaInicio") LocalDate fechaInicio,
                                                @Param("fechaFin") LocalDate fechaFin,
                                                @Param("estados") List<Reserva.EstadoReserva> estados);
    
    @Query("SELECT r FROM Reserva r WHERE r.destino = :destino AND r.fecha = :fecha " +
           "AND r.hora = :hora AND r.estado IN ('CONFIRMADA', 'PAGADA')")
    List<Reserva> findReservasConflictivas(@Param("destino") Destino destino,
                                          @Param("fecha") LocalDate fecha,
                                          @Param("hora") java.time.LocalTime hora);
    
    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.destino = :destino AND r.fecha = :fecha " +
           "AND r.estado IN ('CONFIRMADA', 'PAGADA')")
    Long contarReservasPorDestinoYFecha(@Param("destino") Destino destino, @Param("fecha") LocalDate fecha);
    
    @Query("SELECT r FROM Reserva r WHERE r.estado = :estado AND r.fechaCreacion >= :desde " +
           "ORDER BY r.fechaCreacion DESC")
    List<Reserva> findByEstadoYFechaCreacionDesde(@Param("estado") Reserva.EstadoReserva estado,
                                                 @Param("desde") LocalDateTime desde);
    
    Page<Reserva> findByEstadoOrderByFechaCreacionDesc(Reserva.EstadoReserva estado, Pageable pageable);
    
    @Query("SELECT r FROM Reserva r WHERE " +
           "(LOWER(r.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "LOWER(r.email) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "r.telefono LIKE CONCAT('%', :termino, '%')) " +
           "ORDER BY r.fechaCreacion DESC")
    Page<Reserva> buscarPorTermino(@Param("termino") String termino, Pageable pageable);
    
    @Query("SELECT r FROM Reserva r WHERE r.codigoDescuento = :codigo " +
           "AND r.estado IN ('CONFIRMADA', 'PAGADA')")
    List<Reserva> findByCodigoDescuentoYEstadoActivo(@Param("codigo") String codigo);
    
    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.fecha BETWEEN :fechaInicio AND :fechaFin " +
           "AND r.estado = :estado")
    Long contarReservasPorPeriodoYEstado(@Param("fechaInicio") LocalDate fechaInicio,
                                        @Param("fechaFin") LocalDate fechaFin,
                                        @Param("estado") Reserva.EstadoReserva estado);
}