package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyRecordCreateRequest {

    // Changed field names to match the request format you're using
    private String organization;  // Changed from organizationId
    private String recordCode; // Puede ser opcional si se genera automáticamente
    private List<String> testingPoints;  // Changed from testingPointIds
    private LocalDateTime recordDate;
    private Double level;
    private boolean acceptable;
    private boolean actionRequired;
    private String recordedByUser;  // Changed from recordedByUserId
    private String observations;
    private Double amount;
    private String recordType; // "CLORO" o "SULFATO"
    
    // Helper methods to maintain compatibility with existing code
    public String getOrganizationId() {
        return this.organization;
    }
    
    public void setOrganizationId(String organizationId) {
        this.organization = organizationId;
    }
    
    public String getRecordedByUserId() {
        return this.recordedByUser;
    }
    
    public void setRecordedByUserId(String recordedByUserId) {
        this.recordedByUser = recordedByUserId;
    }
    
    // Helper method for testingPointIds
    public List<String> getTestingPointIds() {
        return this.testingPoints;
    }
    
    public void setTestingPointIds(List<String> testingPointIds) {
        this.testingPoints = testingPointIds;
    }
}