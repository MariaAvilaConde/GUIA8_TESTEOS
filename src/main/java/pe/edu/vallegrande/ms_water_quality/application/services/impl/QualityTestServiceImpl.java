package pe.edu.vallegrande.ms_water_quality.application.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.ms_water_quality.application.services.QualityTestService;
import pe.edu.vallegrande.ms_water_quality.domain.models.QualityTest;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalOrganization;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalUser;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.QualityTestCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.QualityTestEnrichedResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.exception.CustomException;
import pe.edu.vallegrande.ms_water_quality.infrastructure.repository.QualityTestRepository;
import pe.edu.vallegrande.ms_water_quality.infrastructure.repository.TestingPointRepository;
import pe.edu.vallegrande.ms_water_quality.infrastructure.service.ExternalServiceClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class QualityTestServiceImpl implements QualityTestService {

    private final QualityTestRepository qualityTestRepository;
    private final ExternalServiceClient externalServiceClient;
    private final TestingPointRepository testingPointRepository;

    /** GET /api/admin/quality/tests */
    @Override
    public Flux<QualityTestEnrichedResponse> getAll() {
        return getCurrentUserOrganizationId()
            .flatMapMany(orgId -> getAllByOrganization(orgId));
    }

    /** GET /api/admin/quality/tests/{id} */
    @Override
    public Mono<QualityTestEnrichedResponse> getById(String id) {
        return getCurrentUserOrganizationId()
            .flatMap(orgId -> getByIdAndOrganization(id, orgId));
    }

    /** POST /api/admin/quality/tests */
    @Override
    public Mono<QualityTestEnrichedResponse> save(QualityTestCreateRequest request) {
        return generateNextCode().flatMap(generatedCode -> {
            QualityTest qualityTest = new QualityTest();

            qualityTest.setOrganizationId(request.getOrganizationId());  // Using helper method
            qualityTest.setTestCode(generatedCode); 
            
            // Handle null testingPointId
            List<String> testingPointIds = request.getTestingPointId() != null ? request.getTestingPointId() : List.of();
            qualityTest.setTestingPointId(testingPointIds);
            
            qualityTest.setTestDate(request.getTestDate());
            qualityTest.setTestType(request.getTestType());
            qualityTest.setTestedByUserId(request.getTestedByUserId());  // Using helper method
            qualityTest.setWeatherConditions(request.getWeatherConditions());
            qualityTest.setWaterTemperature(request.getWaterTemperature());
            qualityTest.setGeneralObservations(request.getGeneralObservations());
            qualityTest.setStatus("COMPLETED");
            qualityTest.setCreatedAt(LocalDateTime.now());
            qualityTest.setDeletedAt(null);

            // Handle null results
            List<QualityTest.TestResult> results = request.getResults() != null ? 
                request.getResults().stream()
                    .map(item -> {
                        QualityTest.TestResult result = new QualityTest.TestResult();
                        result.setParameterId(item.getParameterId());
                        result.setParameterCode(item.getParameterCode());
                        result.setMeasuredValue(item.getMeasuredValue());
                        result.setUnit(item.getUnit());
                        result.setStatus(item.getStatus());
                        result.setObservations(item.getObservations());
                        return result;
                    })
                    .collect(Collectors.toList()) : List.of();

            qualityTest.setResults(results);

            return qualityTestRepository.save(qualityTest).flatMap(this::enrichQualityTest);
        });
    }

    /** PUT /api/admin/quality/tests/{id} */
    @Override
    public Mono<QualityTestEnrichedResponse> update(String id, QualityTestCreateRequest request) {
        return qualityTestRepository.findById(id)
                .switchIfEmpty(Mono.error(new CustomException(
                        HttpStatus.NOT_FOUND.value(),
                        "Quality test not found",
                        "No quality test found with id " + id)))
                .flatMap(existing -> generateNextCode().flatMap(generatedCode -> {
                    existing.setOrganizationId(request.getOrganizationId());  // Using helper method
                    existing.setTestingPointId(request.getTestingPointId());
                    existing.setTestDate(request.getTestDate());
                    existing.setTestType(request.getTestType());
                    existing.setTestedByUserId(request.getTestedByUserId());  // Using helper method
                    existing.setWeatherConditions(request.getWeatherConditions());
                    existing.setWaterTemperature(request.getWaterTemperature());
                    existing.setGeneralObservations(request.getGeneralObservations());
                    existing.setStatus(request.getStatus());
                    existing.setTestCode(generatedCode);

                    List<QualityTest.TestResult> results = request.getResults().stream()
                            .map(item -> new QualityTest.TestResult(
                                    item.getParameterId(),
                                    item.getParameterCode(),
                                    item.getMeasuredValue(),
                                    item.getUnit(),
                                    item.getStatus(),
                                    item.getObservations()))
                            .collect(Collectors.toList());

                    existing.setResults(results);

                    return qualityTestRepository.save(existing);
                }))
                .flatMap(this::enrichQualityTest);
    }

    /** DELETE /api/admin/quality/tests/{id} → Lógico */
    @Override
    public Mono<Void> delete(String id) {
        return qualityTestRepository.findById(id)
                .switchIfEmpty(Mono.error(new CustomException(
                        HttpStatus.NOT_FOUND.value(),
                        "Quality test not found",
                        "No quality test found with id " + id)))
                .flatMap(test -> {
                    test.setDeletedAt(LocalDateTime.now());
                    return qualityTestRepository.save(test);
                })
                .then();
    }

    /** DELETE /api/admin/quality/tests/{id}/hard → Físico */
    @Override
    public Mono<Void> deletePhysically(String id) {
        return qualityTestRepository.findById(id)
                .switchIfEmpty(Mono.error(new CustomException(
                        HttpStatus.NOT_FOUND.value(),
                        "Quality test not found",
                        "No quality test found with id " + id)))
                .flatMap(qualityTestRepository::delete);
    }

    /** PATCH /api/admin/quality/tests/{id}/restore */
    @Override
    public Mono<QualityTestEnrichedResponse> restore(String id) {
        return qualityTestRepository.findById(id)
                .switchIfEmpty(Mono.error(new CustomException(
                        HttpStatus.NOT_FOUND.value(),
                        "Quality test not found",
                        "No quality test found with id " + id)))
                .flatMap(test -> {
                    test.setDeletedAt(null);
                    return qualityTestRepository.save(test);
                })
                .flatMap(this::enrichQualityTest);
    }

    // Organization-based methods implementation
    @Override
    public Flux<QualityTestEnrichedResponse> getAllByOrganization(String organizationId) {
        return qualityTestRepository.findAllByOrganizationId(organizationId).flatMap(this::enrichQualityTest);
    }

    @Override
    public Mono<QualityTestEnrichedResponse> getByIdAndOrganization(String id, String organizationId) {
        return qualityTestRepository.findById(id)
                .filter(test -> test.getOrganizationId().equals(organizationId))
                .flatMap(this::enrichQualityTest)
                .switchIfEmpty(Mono.error(CustomException.notFound("QualityTest", id)));
    }

 private Mono<QualityTestEnrichedResponse> enrichQualityTest(QualityTest test) {
    // Obtener organización y usuario
    Mono<ExternalUser> userMono = externalServiceClient.getAdminsByOrganization(test.getOrganizationId())
            .filter(user -> user.getId() != null && user.getId().equals(test.getTestedByUserId()))
            .next()
            .defaultIfEmpty(new ExternalUser());

    // Evitar error si getTestingPoints() es null
    List<String> testingPointId = test.getTestingPointId() != null
            ? test.getTestingPointId()
            : List.of();

    // Obtener los TestingPoints asociados (solo si hay IDs)
    Flux<TestingPoint> testingPointsFlux = Flux.fromIterable(testingPointId)
            .flatMap(id -> testingPointRepository.findById(id)
                    .onErrorResume(e -> Mono.empty()) // evita romper si un ID no existe
            );

    // Combinar usuario y puntos de prueba
    return Mono.zip(
            userMono,
            testingPointsFlux.collectList()
    ).map(tuple -> {
        ExternalUser user = tuple.getT1();
        List<TestingPoint> testingPoint = tuple.getT2();

        return QualityTestEnrichedResponse.builder()
                .id(test.getId())
                .testCode(test.getTestCode())
                .testingPointId(testingPoint)
                .testDate(test.getTestDate())
                .testType(test.getTestType())
                .weatherConditions(test.getWeatherConditions())
                .waterTemperature(test.getWaterTemperature())
                .generalObservations(test.getGeneralObservations())
                .status(test.getStatus())
                .results(test.getResults())
                .createdAt(test.getCreatedAt())
                .organization(user.getOrganization())
                .testedByUser(user)
                .build();
    });
}

    /** Código incremental tipo ANL### */
    private Mono<String> generateNextCode() {
        return qualityTestRepository.findAll()
                .filter(t -> t.getTestCode() != null && t.getTestCode().startsWith("ANL"))
                .sort((t1, t2) -> t2.getTestCode().compareTo(t1.getTestCode()))
                .next()
                .map(last -> {
                    try {
                        int number = Integer.parseInt(last.getTestCode().replace("ANL", ""));
                        return String.format("ANL%03d", number + 1);
                    } catch (Exception e) {
                        return "ANL001";
                    }
                })
                .defaultIfEmpty("ANL001");
    }
    
    // Method to get the current user's organization ID
    private Mono<String> getCurrentUserOrganizationId() {
        // For now, we'll return a placeholder. In a real implementation, you would extract
        // the organization ID from the JWT token or user details
        return Mono.just("6896b2ecf3e398570ffd99d3"); // Placeholder - replace with actual logic
    }
}