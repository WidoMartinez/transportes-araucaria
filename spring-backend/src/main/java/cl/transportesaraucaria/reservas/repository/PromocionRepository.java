package cl.transportesaraucaria.reservas.repository;

import cl.transportesaraucaria.reservas.model.entity.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface PromocionRepository extends JpaRepository<Promocion, Long> {
    
    @Query("SELECT p FROM Promocion p WHERE p.activo = true " +
           "AND p.fechaInicio <= :hoy AND p.fechaFin >= :hoy " +
           "ORDER BY p.descuentoPorcentaje DESC")
    List<Promocion> findActivas(@Param("hoy") LocalDate hoy);
    
    @Query("SELECT p FROM Promocion p WHERE p.activo = true " +
           "AND p.fechaInicio <= :hoy AND p.fechaFin >= :hoy " +
           "AND (:destino MEMBER OF p.destinos OR p.destinos IS EMPTY) " +
           "AND (:dia MEMBER OF p.dias OR p.dias IS EMPTY) " +
           "AND (:hora >= p.horaInicio OR p.horaInicio IS NULL) " +
           "AND (:hora <= p.horaFin OR p.horaFin IS NULL) " +
           "ORDER BY p.descuentoPorcentaje DESC")
    List<Promocion> findAplicablesParaReserva(@Param("destino") String destino,
                                              @Param("dia") Promocion.DiaSemana dia,
                                              @Param("hora") LocalTime hora,
                                              @Param("hoy") LocalDate hoy);
    
    @Query("SELECT p FROM Promocion p WHERE p.activo = true " +
           "AND p.fechaInicio <= :hoy AND p.fechaFin >= :hoy " +
           "AND p.destinos IS NOT EMPTY " +
           "AND :destino MEMBER OF p.destinos " +
           "ORDER BY p.descuentoPorcentaje DESC")
    List<Promocion> findPorDestino(@Param("destino") String destino, @Param("hoy") LocalDate hoy);
    
    @Query("SELECT p FROM Promocion p WHERE p.activo = true " +
           "AND p.fechaInicio <= :hoy AND p.fechaFin >= :hoy " +
           "AND p.dias IS NOT EMPTY " +
           "AND :dia MEMBER OF p.dias " +
           "ORDER BY p.descuentoPorcentaje DESC")
    List<Promocion> findPorDia(@Param("dia") Promocion.DiaSemana dia, @Param("hoy") LocalDate hoy);
    
    @Query("SELECT p FROM Promocion p WHERE p.activo = true " +
           "AND p.fechaInicio <= :hoy AND p.fechaFin >= :hoy " +
           "AND p.horaInicio IS NOT NULL AND p.horaFin IS NOT NULL " +
           "AND :hora >= p.horaInicio AND :hora <= p.horaFin " +
           "ORDER BY p.descuentoPorcentaje DESC")
    List<Promocion> findPorHorario(@Param("hora") LocalTime hora, @Param("hoy") LocalDate hoy);
    
    @Query("SELECT p FROM Promocion p WHERE p.activo = true " +
           "AND p.fechaInicio BETWEEN :desde AND :hasta " +
           "ORDER BY p.fechaInicio DESC")
    List<Promocion> findEnPeriodo(@Param("desde") LocalDate desde, @Param("hasta") LocalDate hasta);
    
    @Query("SELECT p FROM Promocion p WHERE p.activo = true " +
           "AND p.fechaFin < :hoy")
    List<Promocion> findVencidas(@Param("hoy") LocalDate hoy);
    
    @Query("SELECT p FROM Promocion p WHERE " +
           "LOWER(p.descripcion) LIKE LOWER(CONCAT('%', :termino, '%')) " +
           "ORDER BY p.fechaCreacion DESC")
    List<Promocion> buscarPorTermino(@Param("termino") String termino);
    
    @Query("SELECT COUNT(p) FROM Promocion p WHERE p.activo = true " +
           "AND p.fechaInicio <= :hoy AND p.fechaFin >= :hoy")
    Long contarActivas(@Param("hoy") LocalDate hoy);
}