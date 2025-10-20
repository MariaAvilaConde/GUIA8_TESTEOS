package pe.edu.vallegrande.ms_water_quality.application.services;

import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.DailyRecordCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.DailyRecordEnrichedResponse;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface DailyRecordService {
    Flux<DailyRecordEnrichedResponse> getAll();

    Mono<DailyRecordEnrichedResponse> getById(String id);

    Mono<DailyRecordEnrichedResponse> save(DailyRecordCreateRequest request);

    Mono<DailyRecordEnrichedResponse> update(String id, DailyRecordCreateRequest request);

    Mono<Void> delete(String id);

    Mono<Void> deletePhysically(String id);

    Mono<DailyRecordEnrichedResponse> restore(String id);
    
    // Organization-based methods
    Flux<DailyRecordEnrichedResponse> getAllByOrganization(String organizationId);
    Mono<DailyRecordEnrichedResponse> getByIdAndOrganization(String id, String organizationId);
}