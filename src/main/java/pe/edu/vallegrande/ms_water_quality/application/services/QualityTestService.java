package pe.edu.vallegrande.ms_water_quality.application.services;

import pe.edu.vallegrande.ms_water_quality.domain.models.QualityTest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.QualityTestCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.QualityTestEnrichedResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface QualityTestService {
    Flux<QualityTestEnrichedResponse> getAll();

    Mono<QualityTestEnrichedResponse> getById(String id);

    Mono<QualityTestEnrichedResponse> save(QualityTestCreateRequest request);

    Mono<QualityTestEnrichedResponse> update(String id, QualityTestCreateRequest request);

    Mono<Void> delete(String id);

    Mono<Void> deletePhysically(String id);

    Mono<QualityTestEnrichedResponse> restore(String id);
    
    // Organization-based methods
    Flux<QualityTestEnrichedResponse> getAllByOrganization(String organizationId);
    Mono<QualityTestEnrichedResponse> getByIdAndOrganization(String id, String organizationId);
}