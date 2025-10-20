package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QualityTestCreateRequest {

    // Changed field names to match the request format you're using
    private String organization;  // Changed from organizationId
    private String testCode;
    private List<String> testingPointId;
    private LocalDateTime testDate;
    private String testType;
    private String testedByUser;  // Changed from testedByUserId
    private String weatherConditions;
    private Double waterTemperature;
    private String generalObservations;
    private String status;
    private List<TestResult> results;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestResult {
        private String parameterId;
        private String parameterCode;
        private Double measuredValue;
        private String unit;
        private String status; // ACCEPTABLE, WARNING, CRITICAL
        private String observations;
    }
    
    // Helper methods to maintain compatibility with existing code
    public String getOrganizationId() {
        return this.organization;
    }
    
    public void setOrganizationId(String organizationId) {
        this.organization = organizationId;
    }
    
    public String getTestedByUserId() {
        return this.testedByUser;
    }
    
    public void setTestedByUserId(String testedByUserId) {
        this.testedByUser = testedByUserId;
    }
}