package pe.edu.vallegrande.ms_water_quality.application.services.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Service;
import pe.edu.vallegrande.ms_water_quality.application.services.TestingPointService;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalOrganization;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalUser;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.TestingPointCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.TestingPointResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.TestingPointEnrichedResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.exception.CustomException;
import pe.edu.vallegrande.ms_water_quality.infrastructure.repository.TestingPointRepository;
import pe.edu.vallegrande.ms_water_quality.infrastructure.service.ExternalServiceClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TestingPointServiceImpl implements TestingPointService {

    private final TestingPointRepository testingPointRepository;
    private final ExternalServiceClient externalServiceClient;

    @Override
    public Flux<TestingPointEnrichedResponse> getAll() {
        return getCurrentUserOrganizationId()
            .flatMapMany(orgId -> getAllByOrganization(orgId));
    }

    @Override
    public Flux<TestingPointEnrichedResponse> getAllActive() {
        return getCurrentUserOrganizationId()
            .flatMapMany(orgId -> getAllActiveByOrganization(orgId));
    }

    @Override
    public Flux<TestingPointEnrichedResponse> getAllInactive() {
        return getCurrentUserOrganizationId()
            .flatMapMany(orgId -> getAllInactiveByOrganization(orgId));
    }

    @Override
    public Mono<TestingPointEnrichedResponse> getById(String id) {
        return getCurrentUserOrganizationId()
            .flatMap(orgId -> getByIdAndOrganization(id, orgId));
    }

    @Override
    public Mono<TestingPointResponse> save(TestingPointCreateRequest request) {
        TestingPoint testingPoint = new TestingPoint();
        // Mapping from request to model
        testingPoint.setOrganizationId(request.getOrganizationId());
        
        // Generate pointCode if not provided
        if (request.getPointCode() != null && !request.getPointCode().trim().isEmpty()) {
            testingPoint.setPointCode(request.getPointCode());
        } else {
            // Generate a sequential point code based on point type
            return generateNextPointCode(request.getPointType())
                .flatMap(pointCode -> {
                    testingPoint.setPointCode(pointCode);
                    
                    testingPoint.setPointName(request.getPointName());
                    testingPoint.setPointType(request.getPointType());
                    testingPoint.setZoneId(request.getZoneId());
                    testingPoint.setLocationDescription(request.getLocationDescription());
                    testingPoint.setStreet(request.getStreet());
                    testingPoint.setCoordinates(new TestingPoint.Coordinates(request.getCoordinates().getLatitude(), request.getCoordinates().getLongitude()));
                    testingPoint.setCreatedAt(LocalDateTime.now());
                    testingPoint.setUpdatedAt(LocalDateTime.now()); // Set updated at time
                    testingPoint.setStatus("ACTIVE"); // Ensure status is set

                    return testingPointRepository.save(testingPoint).map(saved -> {
                        TestingPointResponse response = new TestingPointResponse();
                        response.setId(saved.getId());
                        response.setOrganizationId(saved.getOrganizationId());
                        response.setPointCode(saved.getPointCode());
                        response.setPointName(saved.getPointName());
                        response.setPointType(saved.getPointType());
                        response.setZoneId(saved.getZoneId());
                        response.setLocationDescription(saved.getLocationDescription());
                        response.setStreet(saved.getStreet());
                        if (saved.getCoordinates() != null) {
                            response.setCoordinates(new pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.TestingPointResponse.Coordinates(
                                saved.getCoordinates().getLatitude(), 
                                saved.getCoordinates().getLongitude()
                            ));
                        }
                        response.setStatus(saved.getStatus());
                        response.setCreatedAt(saved.getCreatedAt());
                        return response;
                    });
                });
        }
        
        testingPoint.setPointName(request.getPointName());
        testingPoint.setPointType(request.getPointType());
        testingPoint.setZoneId(request.getZoneId());
        testingPoint.setLocationDescription(request.getLocationDescription());
        testingPoint.setStreet(request.getStreet());
        testingPoint.setCoordinates(new TestingPoint.Coordinates(request.getCoordinates().getLatitude(), request.getCoordinates().getLongitude()));
        testingPoint.setCreatedAt(LocalDateTime.now());
        testingPoint.setUpdatedAt(LocalDateTime.now()); // Set updated at time
        testingPoint.setStatus("ACTIVE"); // Ensure status is set

        return testingPointRepository.save(testingPoint).map(saved -> {
            TestingPointResponse response = new TestingPointResponse();
            response.setId(saved.getId());
            response.setOrganizationId(saved.getOrganizationId());
            response.setPointCode(saved.getPointCode());
            response.setPointName(saved.getPointName());
            response.setPointType(saved.getPointType());
            response.setZoneId(saved.getZoneId());
            response.setLocationDescription(saved.getLocationDescription());
            response.setStreet(saved.getStreet());
            if (saved.getCoordinates() != null) {
                response.setCoordinates(new pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.TestingPointResponse.Coordinates(
                    saved.getCoordinates().getLatitude(), 
                    saved.getCoordinates().getLongitude()
                ));
            }
            response.setStatus(saved.getStatus());
            response.setCreatedAt(saved.getCreatedAt());
            return response;
        });
    }

    @Override
    public Mono<TestingPoint> update(String id, TestingPoint point) {
        return testingPointRepository.findById(id)
                .switchIfEmpty(Mono.error(CustomException.notFound("TestingPoint", id)))
                .flatMap(existing -> {
                    // Update all fields
                    existing.setOrganizationId(point.getOrganizationId());
                    existing.setPointCode(point.getPointCode());
                    existing.setPointName(point.getPointName());
                    existing.setPointType(point.getPointType());
                    existing.setZoneId(point.getZoneId());
                    existing.setLocationDescription(point.getLocationDescription());
                    existing.setStreet(point.getStreet());
                    if (point.getCoordinates() != null) {
                        existing.setCoordinates(new TestingPoint.Coordinates(
                            point.getCoordinates().getLatitude(), 
                            point.getCoordinates().getLongitude()
                        ));
                    }
                    existing.setStatus(point.getStatus());
                    existing.setUpdatedAt(LocalDateTime.now()); // Update the updated_at timestamp
                    return testingPointRepository.save(existing);
                });
    }

    @Override
    public Mono<Void> delete(String id) {
        return testingPointRepository.deleteById(id);
    }

    @Override
    public Mono<TestingPointEnrichedResponse> activate(String id) {
        return testingPointRepository.findById(id)
                .switchIfEmpty(Mono.error(CustomException.notFound("TestingPoint", id)))
                .flatMap(point -> {
                    point.setStatus("ACTIVE");
                    return testingPointRepository.save(point);
                })
                .flatMap(this::enrichTestingPoint);
    }

    @Override
    public Mono<TestingPointEnrichedResponse> deactivate(String id) {
        return testingPointRepository.findById(id)
                .switchIfEmpty(Mono.error(CustomException.notFound("TestingPoint", id)))
                .flatMap(point -> {
                    point.setStatus("INACTIVE");
                    return testingPointRepository.save(point);
                })
                .flatMap(this::enrichTestingPoint);
    }

    // Organization-based methods implementation
    @Override
    public Flux<TestingPointEnrichedResponse> getAllByOrganization(String organizationId) {
        return testingPointRepository.findByOrganizationId(organizationId).flatMap(this::enrichTestingPoint);
    }

    @Override
    public Flux<TestingPointEnrichedResponse> getAllActiveByOrganization(String organizationId) {
        return testingPointRepository.findByOrganizationIdAndStatus(organizationId, "ACTIVE").flatMap(this::enrichTestingPoint);
    }

    @Override
    public Flux<TestingPointEnrichedResponse> getAllInactiveByOrganization(String organizationId) {
        return testingPointRepository.findByOrganizationIdAndStatus(organizationId, "INACTIVE").flatMap(this::enrichTestingPoint);
    }

    @Override
    public Mono<TestingPointEnrichedResponse> getByIdAndOrganization(String id, String organizationId) {
        return testingPointRepository.findById(id)
                .filter(point -> point.getOrganizationId().equals(organizationId))
                .flatMap(this::enrichTestingPoint)
                .switchIfEmpty(Mono.error(CustomException.notFound("TestingPoint", id)));
    }

    // Method to get the current user's organization ID
    private Mono<String> getCurrentUserOrganizationId() {
        // For now, we'll return a placeholder. In a real implementation, you would extract
        // the organization ID from the JWT token or user details
        return Mono.just("6896b2ecf3e398570ffd99d3"); // Placeholder - replace with actual logic
    }

   private Mono<TestingPointEnrichedResponse> enrichTestingPoint(TestingPoint point) {
    System.out.println("Enriching testing point: " + point.getId() + " with organization ID: " + point.getOrganizationId());
    
    // Call external service to get organization data
    Mono<ExternalOrganization> orgMono = externalServiceClient.getOrganizationById(point.getOrganizationId());

    // Combine the point with organization info
    return orgMono.map(org -> {
        if (org != null) {
            System.out.println("Organization data found for testing point: " + point.getId());
        } else {
            System.out.println("No organization data found for testing point: " + point.getId());
        }
        
        return TestingPointEnrichedResponse.builder()
            .id(point.getId())
            .pointCode(point.getPointCode())
            .pointName(point.getPointName())
            .pointType(point.getPointType())
            .zoneId(point.getZoneId())
            .locationDescription(point.getLocationDescription())
            .street(point.getStreet())
            .coordinates(point.getCoordinates())
            .status(point.getStatus())
            .createdAt(point.getCreatedAt())
            .updatedAt(point.getUpdatedAt())
            .organizationId(org) // Assign the organization object
            .build();
    }).switchIfEmpty(Mono.just(TestingPointEnrichedResponse.builder()
            .id(point.getId())
            .pointCode(point.getPointCode())
            .pointName(point.getPointName())
            .pointType(point.getPointType())
            .zoneId(point.getZoneId())
            .locationDescription(point.getLocationDescription())
            .street(point.getStreet())
            .coordinates(point.getCoordinates())
            .status(point.getStatus())
            .createdAt(point.getCreatedAt())
            .updatedAt(point.getUpdatedAt())
            .organizationId(null) // Set to null if no organization data
            .build()));
}

    /** Código incremental con formato específico: PM001, PD001, PR001 */
    private Mono<String> generateNextPointCode(String pointType) {
        String prefix = getPointCodePrefix(pointType);

        // Find the highest existing code for this prefix and increment
        return testingPointRepository.findAll()
                .filter(tp -> tp.getPointCode() != null && tp.getPointCode().startsWith(prefix))
                .sort((tp1, tp2) -> tp2.getPointCode().compareTo(tp1.getPointCode())) // Sort descending to get highest first
                .next()
                .map(last -> {
                    try {
                        // Extract the number part and increment
                        String lastCode = last.getPointCode();
                        String numberPart = lastCode.substring(2); // Remove prefix
                        int number = Integer.parseInt(numberPart);
                        return String.format("%s%03d", prefix, number + 1);
                    } catch (Exception e) {
                        // If parsing fails, start from 001
                        return String.format("%s%03d", prefix, 1);
                    }
                })
                .defaultIfEmpty(String.format("%s%03d", prefix, 1)); // If no existing codes, start from 001
    }
    
    /** Get the point code prefix based on point type */
    private String getPointCodePrefix(String pointType) {
        if (pointType != null) {
            switch (pointType.toUpperCase()) {
                case "RESERVORIO":
                    return "PR";
                case "RED_DISTRIBUCION":
                    return "PD";
                case "DOMICILIO":
                    return "PM";
                default:
                    return "PT";
            }
        }
        return "PT";
    }
}