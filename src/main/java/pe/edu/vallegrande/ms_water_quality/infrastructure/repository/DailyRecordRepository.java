package pe.edu.vallegrande.ms_water_quality.infrastructure.repository;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import pe.edu.vallegrande.ms_water_quality.domain.models.DailyRecord;
import reactor.core.publisher.Flux;

@Repository
public interface DailyRecordRepository extends ReactiveMongoRepository<DailyRecord, String> {

    Flux<DailyRecord> findAllByOrganizationId(String organizationId);

    Flux<DailyRecord> findByRecordTypeOrderByRecordCodeDesc(String recordType);
    
    // Organization-based methods
    Flux<DailyRecord> findByOrganizationIdAndRecordType(String organizationId, String recordType);
}