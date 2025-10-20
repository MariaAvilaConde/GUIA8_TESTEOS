package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalOrganization;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalUser;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyRecordEnrichedResponse {

    private String id;
    private String recordCode;
    private List<TestingPoint> testingPoints;  // Lista completa de TestingPoints
    private LocalDateTime recordDate;
    private Double level;
    private boolean acceptable;
    private boolean actionRequired;
    private String observations;
    private Double amount;
    private String recordType;
    private LocalDateTime createdAt;

    private ExternalOrganization organization;
    private ExternalUser recordedByUser;
}
