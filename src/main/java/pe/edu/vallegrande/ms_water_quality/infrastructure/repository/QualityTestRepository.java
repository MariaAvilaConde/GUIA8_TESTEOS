package pe.edu.vallegrande.ms_water_quality.infrastructure.repository;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.ms_water_quality.domain.models.QualityTest;
import reactor.core.publisher.Flux;

@Repository
public interface QualityTestRepository extends ReactiveMongoRepository<QualityTest, String> {

    // Obtener todas las pruebas por organización
    Flux<QualityTest> findAllByOrganizationId(String organizationId);

    // Obtener pruebas por tipo (RUTINARIO, ESPECIAL, etc.)
    Flux<QualityTest> findAllByTestType(String testType);

    // Obtener pruebas por estado (COMPLETED, etc.)
    Flux<QualityTest> findAllByStatus(String status);
    
    // Organization-based methods
    Flux<QualityTest> findByOrganizationIdAndStatus(String organizationId, String status);
}