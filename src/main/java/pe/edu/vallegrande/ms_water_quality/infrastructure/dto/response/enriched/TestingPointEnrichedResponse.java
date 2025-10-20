package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response.enriched;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pe.edu.vallegrande.ms_water_quality.domain.models.TestingPoint;
import pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto.ExternalOrganization;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestingPointEnrichedResponse {

    private String id;
    private String pointCode;
    private String pointName;
    private String pointType;
    private String zoneId;
    private String locationDescription;
    private String street;
    private TestingPoint.Coordinates coordinates;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private ExternalOrganization organizationId;
}
