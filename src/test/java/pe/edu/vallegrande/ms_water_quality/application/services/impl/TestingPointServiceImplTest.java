package pe.edu.vallegrande.ms_water_quality.application.services.impl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalOrganization;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request.TestingPointCreateRequest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.TestingPointResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched.TestingPointEnrichedResponse;
import pe.edu.vallegrande.ms_water_quality.infrastructure.exception.CustomException;
import pe.edu.vallegrande.ms_water_quality.infrastructure.repository.TestingPointRepository;
import pe.edu.vallegrande.ms_water_quality.infrastructure.service.ExternalServiceClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TestingPointServiceImplTest {

    @Mock
    private TestingPointRepository testingPointRepository;

    @Mock
    private ExternalServiceClient externalServiceClient;

    @InjectMocks
    private TestingPointServiceImpl testingPointService;

    private TestingPoint testingPoint;
    private TestingPointCreateRequest createRequest;
    private ExternalOrganization externalOrganization;

    @BeforeEach
    void setUp() {
        // Setup testing point
        testingPoint = new TestingPoint();
        testingPoint.setId("tp123");
        testingPoint.setOrganizationId("6896b2ecf3e398570ffd99d3"); // Mismo ID que retorna getCurrentUserOrganizationId
        testingPoint.setPointCode("PM001");
        testingPoint.setPointName("Punto Test");
        testingPoint.setPointType("DOMICILIO");
        testingPoint.setZoneId("zone1");
        testingPoint.setLocationDescription("Descripción test");
        testingPoint.setStreet("Calle Principal");
        testingPoint.setCoordinates(new TestingPoint.Coordinates(-12.0464, -77.0428));
        testingPoint.setStatus("ACTIVE");
        testingPoint.setCreatedAt(LocalDateTime.now());
        testingPoint.setUpdatedAt(LocalDateTime.now());

        // Setup create request
        createRequest = new TestingPointCreateRequest();
        createRequest.setOrganizationId("6896b2ecf3e398570ffd99d3");
        createRequest.setPointCode("PM002");
        createRequest.setPointName("Nuevo Punto");
        createRequest.setPointType("DOMICILIO");
        createRequest.setZoneId("zone1");
        createRequest.setLocationDescription("Nueva descripción");
        createRequest.setStreet("Calle Nueva");
        createRequest.setCoordinates(new TestingPointCreateRequest.Coordinates(-12.0464, -77.0428));

        // Setup external organization
        externalOrganization = createExternalOrganization("6896b2ecf3e398570ffd99d3", "Organización Test");
    }

    // Helper method para crear ExternalOrganization
    private ExternalOrganization createExternalOrganization(String id, String name) {
        ExternalOrganization org = new ExternalOrganization();
        org.setOrganizationId(id);
        org.setOrganizationName(name);
        org.setOrganizationCode("ORG-" + id);
        org.setStatus("ACTIVE");
        org.setAddress("Dirección Test");
        org.setPhone("123456789");
        org.setLegalRepresentative("Representante Test");
        return org;
    }

    @Test
    void testGetAll_ShouldReturnAllTestingPoints() {
        when(testingPointRepository.findByOrganizationId(anyString()))
                .thenReturn(Flux.just(testingPoint));
        when(externalServiceClient.getOrganizationById(anyString()))
                .thenReturn(Mono.just(externalOrganization));

        StepVerifier.create(testingPointService.getAll())
                .assertNext(response -> {
                    assertThat(response.getId()).isEqualTo("tp123");
                    assertThat(response.getPointCode()).isEqualTo("PM001");
                    assertThat(response.getOrganizationId()).isNotNull();
                    assertThat(response.getOrganizationId().getOrganizationName()).isEqualTo("Organización Test");
                })
                .verifyComplete();

        verify(testingPointRepository).findByOrganizationId(anyString());
        verify(externalServiceClient).getOrganizationById(anyString());
    }

    @Test
    void testGetAllActive_ShouldReturnOnlyActivePoints() {
        when(testingPointRepository.findByOrganizationIdAndStatus(anyString(), eq("ACTIVE")))
                .thenReturn(Flux.just(testingPoint));
        when(externalServiceClient.getOrganizationById(anyString()))
                .thenReturn(Mono.just(externalOrganization));

        StepVerifier.create(testingPointService.getAllActive())
                .assertNext(response -> {
                    assertThat(response.getStatus()).isEqualTo("ACTIVE");
                    assertThat(response.getPointCode()).isEqualTo("PM001");
                })
                .verifyComplete();

        verify(testingPointRepository).findByOrganizationIdAndStatus(anyString(), eq("ACTIVE"));
    }

    @Test
    void testGetAllInactive_ShouldReturnOnlyInactivePoints() {
        testingPoint.setStatus("INACTIVE");
        when(testingPointRepository.findByOrganizationIdAndStatus(anyString(), eq("INACTIVE")))
                .thenReturn(Flux.just(testingPoint));
        when(externalServiceClient.getOrganizationById(anyString()))
                .thenReturn(Mono.just(externalOrganization));

        StepVerifier.create(testingPointService.getAllInactive())
                .assertNext(response -> {
                    assertThat(response.getStatus()).isEqualTo("INACTIVE");
                })
                .verifyComplete();

        verify(testingPointRepository).findByOrganizationIdAndStatus(anyString(), eq("INACTIVE"));
    }

    @Test
    void testGetById_ShouldReturnTestingPointWhenExists() {
        // El testingPoint debe tener el mismo organizationId que getCurrentUserOrganizationId retorna
        testingPoint.setOrganizationId("6896b2ecf3e398570ffd99d3");
        
        when(testingPointRepository.findById("tp123"))
                .thenReturn(Mono.just(testingPoint));
        when(externalServiceClient.getOrganizationById(anyString()))
                .thenReturn(Mono.just(externalOrganization));

        StepVerifier.create(testingPointService.getById("tp123"))
                .assertNext(response -> {
                    assertThat(response.getId()).isEqualTo("tp123");
                    assertThat(response.getPointCode()).isEqualTo("PM001");
                })
                .verifyComplete();

        verify(testingPointRepository).findById("tp123");
    }

    @Test
    void testGetById_ShouldThrowExceptionWhenNotFound() {
        when(testingPointRepository.findById("invalid"))
                .thenReturn(Mono.empty());

        StepVerifier.create(testingPointService.getById("invalid"))
                .expectError(CustomException.class)
                .verify();

        verify(testingPointRepository).findById("invalid");
    }

    @Test
    void testSave_WithProvidedPointCode_ShouldCreateTestingPoint() {
        TestingPoint savedPoint = new TestingPoint();
        savedPoint.setId("tp124");
        savedPoint.setOrganizationId(createRequest.getOrganizationId());
        savedPoint.setPointCode(createRequest.getPointCode());
        savedPoint.setPointName(createRequest.getPointName());
        savedPoint.setPointType(createRequest.getPointType());
        savedPoint.setStatus("ACTIVE");
        savedPoint.setCreatedAt(LocalDateTime.now());

        when(testingPointRepository.save(any(TestingPoint.class)))
                .thenReturn(Mono.just(savedPoint));

        StepVerifier.create(testingPointService.save(createRequest))
                .assertNext(response -> {
                    assertThat(response.getId()).isEqualTo("tp124");
                    assertThat(response.getPointCode()).isEqualTo("PM002");
                    assertThat(response.getStatus()).isEqualTo("ACTIVE");
                })
                .verifyComplete();

        verify(testingPointRepository).save(any(TestingPoint.class));
    }

    @Test
    void testSave_WithoutPointCode_ShouldGenerateCode() {
        createRequest.setPointCode(null); // No code provided
        createRequest.setPointType("RESERVORIO");

        TestingPoint existingPoint = new TestingPoint();
        existingPoint.setPointCode("PR002");

        TestingPoint savedPoint = new TestingPoint();
        savedPoint.setId("tp125");
        savedPoint.setPointCode("PR003");
        savedPoint.setPointName(createRequest.getPointName());
        savedPoint.setStatus("ACTIVE");
        savedPoint.setCreatedAt(LocalDateTime.now());

        when(testingPointRepository.findAll())
                .thenReturn(Flux.just(existingPoint));
        when(testingPointRepository.save(any(TestingPoint.class)))
                .thenReturn(Mono.just(savedPoint));

        StepVerifier.create(testingPointService.save(createRequest))
                .assertNext(response -> {
                    assertThat(response.getPointCode()).isEqualTo("PR003");
                    assertThat(response.getStatus()).isEqualTo("ACTIVE");
                })
                .verifyComplete();

        verify(testingPointRepository).findAll();
        verify(testingPointRepository).save(any(TestingPoint.class));
    }

    @Test
    void testUpdate_ShouldUpdateExistingTestingPoint() {
        TestingPoint updatedPoint = new TestingPoint();
        updatedPoint.setId("tp123");
        updatedPoint.setPointName("Punto Actualizado");
        updatedPoint.setStatus("ACTIVE");

        when(testingPointRepository.findById("tp123"))
                .thenReturn(Mono.just(testingPoint));
        when(testingPointRepository.save(any(TestingPoint.class)))
                .thenReturn(Mono.just(testingPoint));

        StepVerifier.create(testingPointService.update("tp123", updatedPoint))
                .assertNext(response -> {
                    assertThat(response.getId()).isEqualTo("tp123");
                })
                .verifyComplete();

        verify(testingPointRepository).findById("tp123");
        verify(testingPointRepository).save(any(TestingPoint.class));
    }

    @Test
    void testUpdate_ShouldThrowExceptionWhenNotFound() {
        when(testingPointRepository.findById("invalid"))
                .thenReturn(Mono.empty());

        StepVerifier.create(testingPointService.update("invalid", testingPoint))
                .expectError(CustomException.class)
                .verify();

        verify(testingPointRepository).findById("invalid");
        verify(testingPointRepository, never()).save(any(TestingPoint.class));
    }

    @Test
    void testDelete_ShouldDeleteTestingPoint() {
        when(testingPointRepository.deleteById("tp123"))
                .thenReturn(Mono.empty());

        StepVerifier.create(testingPointService.delete("tp123"))
                .verifyComplete();

        verify(testingPointRepository).deleteById("tp123");
    }

    @Test
    void testActivate_ShouldChangeStatusToActive() {
        testingPoint.setStatus("INACTIVE");

        when(testingPointRepository.findById("tp123"))
                .thenReturn(Mono.just(testingPoint));
        when(testingPointRepository.save(any(TestingPoint.class)))
                .thenAnswer(invocation -> {
                    TestingPoint saved = invocation.getArgument(0);
                    saved.setStatus("ACTIVE");
                    return Mono.just(saved);
                });
        when(externalServiceClient.getOrganizationById(anyString()))
                .thenReturn(Mono.just(externalOrganization));

        StepVerifier.create(testingPointService.activate("tp123"))
                .assertNext(response -> {
                    assertThat(response.getStatus()).isEqualTo("ACTIVE");
                })
                .verifyComplete();

        verify(testingPointRepository).findById("tp123");
        verify(testingPointRepository).save(any(TestingPoint.class));
    }

    @Test
    void testDeactivate_ShouldChangeStatusToInactive() {
        when(testingPointRepository.findById("tp123"))
                .thenReturn(Mono.just(testingPoint));
        when(testingPointRepository.save(any(TestingPoint.class)))
                .thenAnswer(invocation -> {
                    TestingPoint saved = invocation.getArgument(0);
                    saved.setStatus("INACTIVE");
                    return Mono.just(saved);
                });
        when(externalServiceClient.getOrganizationById(anyString()))
                .thenReturn(Mono.just(externalOrganization));

        StepVerifier.create(testingPointService.deactivate("tp123"))
                .assertNext(response -> {
                    assertThat(response.getStatus()).isEqualTo("INACTIVE");
                })
                .verifyComplete();

        verify(testingPointRepository).findById("tp123");
        verify(testingPointRepository).save(any(TestingPoint.class));
    }

    @Test
    void testGetAllByOrganization_ShouldReturnTestingPointsByOrganization() {
        when(testingPointRepository.findByOrganizationId("6896b2ecf3e398570ffd99d3"))
                .thenReturn(Flux.just(testingPoint));
        when(externalServiceClient.getOrganizationById("6896b2ecf3e398570ffd99d3"))
                .thenReturn(Mono.just(externalOrganization));

        StepVerifier.create(testingPointService.getAllByOrganization("6896b2ecf3e398570ffd99d3"))
                .assertNext(response -> {
                    assertThat(response.getOrganizationId()).isNotNull();
                    assertThat(response.getOrganizationId().getOrganizationId()).isEqualTo("6896b2ecf3e398570ffd99d3");
                })
                .verifyComplete();

        verify(testingPointRepository).findByOrganizationId("6896b2ecf3e398570ffd99d3");
    }

    @Test
    void testGeneratePointCode_ForReservorio_ShouldGeneratePRCode() {
        createRequest.setPointCode(null);
        createRequest.setPointType("RESERVORIO");

        when(testingPointRepository.findAll()).thenReturn(Flux.empty());
        when(testingPointRepository.save(any(TestingPoint.class)))
                .thenAnswer(invocation -> {
                    TestingPoint saved = invocation.getArgument(0);
                    saved.setId("tp126");
                    return Mono.just(saved);
                });

        StepVerifier.create(testingPointService.save(createRequest))
                .assertNext(response -> {
                    assertThat(response.getPointCode()).isEqualTo("PR001");
                })
                .verifyComplete();
    }

    @Test
    void testGeneratePointCode_ForRedDistribucion_ShouldGeneratePDCode() {
        createRequest.setPointCode(null);
        createRequest.setPointType("RED_DISTRIBUCION");

        when(testingPointRepository.findAll()).thenReturn(Flux.empty());
        when(testingPointRepository.save(any(TestingPoint.class)))
                .thenAnswer(invocation -> {
                    TestingPoint saved = invocation.getArgument(0);
                    saved.setId("tp127");
                    return Mono.just(saved);
                });

        StepVerifier.create(testingPointService.save(createRequest))
                .assertNext(response -> {
                    assertThat(response.getPointCode()).isEqualTo("PD001");
                })
                .verifyComplete();
    }

    @Test
    void testGeneratePointCode_ForDomicilio_ShouldGeneratePMCode() {
        createRequest.setPointCode(null);
        createRequest.setPointType("DOMICILIO");

        when(testingPointRepository.findAll()).thenReturn(Flux.empty());
        when(testingPointRepository.save(any(TestingPoint.class)))
                .thenAnswer(invocation -> {
                    TestingPoint saved = invocation.getArgument(0);
                    saved.setId("tp128");
                    return Mono.just(saved);
                });

        StepVerifier.create(testingPointService.save(createRequest))
                .assertNext(response -> {
                    assertThat(response.getPointCode()).isEqualTo("PM001");
                })
                .verifyComplete();
    }

    @Test
    void testEnrichTestingPoint_WithNoOrganization_ShouldReturnNullOrganization() {
        // El testingPoint debe tener el mismo organizationId que getCurrentUserOrganizationId retorna
        testingPoint.setOrganizationId("6896b2ecf3e398570ffd99d3");
        
        when(externalServiceClient.getOrganizationById(anyString()))
                .thenReturn(Mono.empty());
        when(testingPointRepository.findById("tp123"))
                .thenReturn(Mono.just(testingPoint));

        StepVerifier.create(testingPointService.getById("tp123"))
                .assertNext(response -> {
                    assertThat(response.getId()).isEqualTo("tp123");
                    assertThat(response.getOrganizationId()).isNull();
                })
                .verifyComplete();
    }
}