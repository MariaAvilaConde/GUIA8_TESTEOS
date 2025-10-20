package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pe.edu.vallegrande.ms_water_quality.domain.models.QualityTest;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalOrganization;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalUser;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityTestEnrichedResponse {

    private String id;
    private String testCode;
    private List<TestingPoint> testingPointId;  // Lista completa de TestingPoints
    private LocalDateTime testDate;
    private String testType;
    private String weatherConditions;
    private Double waterTemperature;
    private String generalObservations;
    private String status;
    private List<QualityTest.TestResult> results;
    private LocalDateTime createdAt;

    private ExternalOrganization organization;
    private ExternalUser testedByUser;

}