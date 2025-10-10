package cl.transportesaraucaria.reservas.repository;

import cl.transportesaraucaria.reservas.model.entity.Destino;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DestinoRepository extends JpaRepository<Destino, Long> {
    
    List<Destino> findByActivoTrueOrderByNombre();
    
    Optional<Destino> findByNombreAndActivoTrue(String nombre);
    
    @Query("SELECT d FROM Destino d WHERE d.activo = true AND " +
           "(LOWER(d.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR " +
           "LOWER(d.descripcion) LIKE LOWER(CONCAT('%', :termino, '%')))")
    List<Destino> buscarPorTermino(@Param("termino") String termino);
    
    boolean existsByNombreAndIdNot(String nombre, Long id);
    
    @Query("SELECT COUNT(r) FROM Reserva r WHERE r.destino = :destino AND r.estado IN ('CONFIRMADA', 'PAGADA')")
    Long contarReservasActivasPorDestino(@Param("destino") Destino destino);
}