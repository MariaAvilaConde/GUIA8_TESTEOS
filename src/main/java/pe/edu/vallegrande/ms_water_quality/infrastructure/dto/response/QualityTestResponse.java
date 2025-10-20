package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QualityTestResponse {

    private String id;
    private String organizationId;
    private String testCode;
    private List<String> testingPointId; // ← Fixed: changed from String to List<String>

    private LocalDateTime testDate;
    private String testType;
    private String testedByUserId;

    private String weatherConditions;
    private Double waterTemperature;
    private String generalObservations;
    private String status;

    private List<TestResultResponse> results;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestResultResponse {
        private String parameterId;
        private String parameterCode;
        private Double measuredValue;
        private String unit;
        private String status;
        private String observations;
    }
}