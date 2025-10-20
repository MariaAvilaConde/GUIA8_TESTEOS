package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestingPointCreateRequest {

    private String organizationId;
    private String pointCode;
    private String pointName;
    private String pointType; // RESERVORIO, RED_DISTRIBUCION, DOMICILIO
    private String zoneId;
    private String locationDescription;
    private String street; // Calle para puntos de tipo DOMICILIO/SUMINISTRO
    private Coordinates coordinates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Coordinates {
        private double latitude;
        private double longitude;
    }
}
