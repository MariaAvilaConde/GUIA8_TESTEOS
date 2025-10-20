package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestingPointResponse {

    private String id;
    private String organizationId;

    private String pointCode;
    private String pointName;
    private String pointType;

    private String zoneId;
    private String locationDescription;
    private String street; // Calle para puntos de tipo DOMICILIO/SUMINISTRO

    private Coordinates coordinates;

    private String status;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Coordinates {
        private Double latitude;
        private Double longitude;
    }
}
