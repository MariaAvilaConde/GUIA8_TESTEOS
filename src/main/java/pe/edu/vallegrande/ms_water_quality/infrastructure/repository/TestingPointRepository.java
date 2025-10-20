package pe.edu.vallegrande.ms_water_quality.infrastructure.repository;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;
import reactor.core.publisher.Flux;

@Repository
public interface TestingPointRepository extends ReactiveMongoRepository<TestingPoint, String> {
    Flux<TestingPoint> findByStatus(String status);
    Flux<TestingPoint> findByOrganizationId(String organizationId);
    Flux<TestingPoint> findByOrganizationIdAndStatus(String organizationId, String status);
}