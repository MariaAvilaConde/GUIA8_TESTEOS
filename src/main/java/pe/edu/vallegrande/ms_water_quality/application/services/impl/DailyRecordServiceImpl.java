package pe.edu.vallegrande.ms_water_quality.application.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.ms_water_quality.application.services.DailyRecordService;
import pe.edu.vallegrande.ms_water_quality.domain.models.DailyRecord;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalUser;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.DailyRecordCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.DailyRecordEnrichedResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.exception.CustomException;
import pe.edu.vallegrande.ms_water_quality.infrastructure.repository.DailyRecordRepository;
import pe.edu.vallegrande.ms_water_quality.infrastructure.repository.TestingPointRepository;
import pe.edu.vallegrande.ms_water_quality.infrastructure.service.ExternalServiceClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DailyRecordServiceImpl implements DailyRecordService {

    private final DailyRecordRepository dailyRecordRepository;
    private final TestingPointRepository testingPointRepository;
    private final ExternalServiceClient externalServiceClient;

    @Override
    public Flux<DailyRecordEnrichedResponse> getAll() {
        return getCurrentUserOrganizationId()
            .flatMapMany(orgId -> getAllByOrganization(orgId));
    }

    @Override
    public Mono<DailyRecordEnrichedResponse> getById(String id) {
        return getCurrentUserOrganizationId()
            .flatMap(orgId -> getByIdAndOrganization(id, orgId));
    }

    @Override
    public Mono<DailyRecordEnrichedResponse> save(DailyRecordCreateRequest request) {
        DailyRecord dailyRecord = new DailyRecord();
        dailyRecord.setOrganizationId(request.getOrganizationId());  // Using helper method
        
        // Generate record code if not provided
        if (request.getRecordCode() != null && !request.getRecordCode().trim().isEmpty()) {
            dailyRecord.setRecordCode(request.getRecordCode());
        } else {
            // Generate a unique record code based on record type and timestamp
            String prefix = "RC";
            if (request.getRecordType() != null) {
                switch (request.getRecordType().toUpperCase()) {
                    case "CLORO":
                        prefix = "CL";
                        break;
                    case "SULFATO":
                        prefix = "SU";
                        break;
                    default:
                        prefix = "RC";
                        break;
                }
            }
            String recordCode = prefix + System.currentTimeMillis() % 100000;
            dailyRecord.setRecordCode(recordCode);
        }
        
        // Handle null testingPoints
        List<String> testingPointIds = request.getTestingPointIds() != null ? request.getTestingPointIds() : List.of();  // Using helper method
        dailyRecord.setTestingPointIds(testingPointIds);
        
        dailyRecord.setRecordDate(request.getRecordDate());
        dailyRecord.setLevel(request.getLevel());
        dailyRecord.setAcceptable(request.isAcceptable());
        dailyRecord.setActionRequired(request.isActionRequired());
        dailyRecord.setRecordedByUserId(request.getRecordedByUserId());  // Using helper method
        dailyRecord.setObservations(request.getObservations());
        dailyRecord.setAmount(request.getAmount());
        dailyRecord.setRecordType(request.getRecordType());
        dailyRecord.setCreatedAt(LocalDateTime.now());
        return dailyRecordRepository.save(dailyRecord).flatMap(this::enrichDailyRecord);
    }

    @Override
    public Mono<DailyRecordEnrichedResponse> update(String id, DailyRecordCreateRequest request) {
        return dailyRecordRepository.findById(id)
                .switchIfEmpty(Mono.error(CustomException.notFound("DailyRecord", id)))
                .flatMap(record -> {
                    record.setOrganizationId(request.getOrganizationId());  // Using helper method
                    
                    // Handle null testingPoints
                    List<String> testingPointIds = request.getTestingPointIds() != null ? request.getTestingPointIds() : List.of();  // Using helper method
                    record.setTestingPointIds(testingPointIds);
                    
                    record.setRecordCode(request.getRecordCode());
                    record.setRecordDate(request.getRecordDate());
                    record.setLevel(request.getLevel());
                    record.setAcceptable(request.isAcceptable());
                    record.setActionRequired(request.isActionRequired());
                    record.setRecordedByUserId(request.getRecordedByUserId());  // Using helper method
                    record.setObservations(request.getObservations());
                    record.setAmount(request.getAmount());
                    record.setRecordType(request.getRecordType());
                    return dailyRecordRepository.save(record);
                })
                .flatMap(this::enrichDailyRecord);
    }

    @Override
    public Mono<Void> delete(String id) {
        return dailyRecordRepository.findById(id)
                .switchIfEmpty(Mono.error(CustomException.notFound("DailyRecord", id)))
                .flatMap(record -> {
                    record.setDeletedAt(LocalDateTime.now());
                    return dailyRecordRepository.save(record);
                }).then();
    }

    @Override
    public Mono<Void> deletePhysically(String id) {
        return dailyRecordRepository.deleteById(id);
    }

    @Override
    public Mono<DailyRecordEnrichedResponse> restore(String id) {
        return dailyRecordRepository.findById(id)
                .switchIfEmpty(Mono.error(CustomException.notFound("DailyRecord", id)))
                .flatMap(record -> {
                    record.setDeletedAt(null);
                    return dailyRecordRepository.save(record);
                })
                .flatMap(this::enrichDailyRecord);
    }

    // Organization-based methods implementation
    @Override
    public Flux<DailyRecordEnrichedResponse> getAllByOrganization(String organizationId) {
        return dailyRecordRepository.findAllByOrganizationId(organizationId).flatMap(this::enrichDailyRecord);
    }

    @Override
    public Mono<DailyRecordEnrichedResponse> getByIdAndOrganization(String id, String organizationId) {
        return dailyRecordRepository.findById(id)
                .filter(record -> record.getOrganizationId().equals(organizationId))
                .flatMap(this::enrichDailyRecord)
                .switchIfEmpty(Mono.error(CustomException.notFound("DailyRecord", id)));
    }

    private Mono<DailyRecordEnrichedResponse> enrichDailyRecord(DailyRecord record) {
        // Obtener organización y usuario
        Mono<ExternalUser> userMono = externalServiceClient.getAdminsByOrganization(record.getOrganizationId())
                .filter(user -> user.getId() != null && user.getId().equals(record.getRecordedByUserId()))
                .next()
                .defaultIfEmpty(new ExternalUser());

        // Obtener los TestingPoints asociados - with null check
        List<String> testingPointIds = record.getTestingPointIds() != null ? record.getTestingPointIds() : List.of();
        Flux<TestingPoint> testingPointsFlux = Flux.fromIterable(testingPointIds)
                .flatMap(testingPointRepository::findById)
                .onErrorResume(e -> Mono.empty()); // Handle any errors gracefully

        return Mono.zip(
                userMono,
                testingPointsFlux.collectList()
        ).map(tuple -> {
            ExternalUser user = tuple.getT1();
            List<TestingPoint> testingPoints = tuple.getT2();
            
            return DailyRecordEnrichedResponse.builder()
                    .id(record.getId())
                    .recordCode(record.getRecordCode())
                    .testingPoints(testingPoints)  // Añadir lista de TestingPoints
                    .recordDate(record.getRecordDate())
                    .level(record.getLevel())
                    .acceptable(record.isAcceptable())
                    .actionRequired(record.isActionRequired())
                    .observations(record.getObservations())
                    .amount(record.getAmount())
                    .recordType(record.getRecordType())
                    .createdAt(record.getCreatedAt())
                    .recordedByUser(user)
                    .organization(user.getOrganization())
                    .build();
        });
    }
    
    // Method to get the current user's organization ID
    private Mono<String> getCurrentUserOrganizationId() {
        // For now, we'll return a placeholder. In a real implementation, you would extract
        // the organization ID from the JWT token or user details
        return Mono.just("6896b2ecf3e398570ffd99d3"); // Placeholder - replace with actual logic
    }
}