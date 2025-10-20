package pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto;

import lombok.Data;

@Data
public class ExternalStreet {
    private String status;
    private String streetCode;
    private String streetId;
    private String streetType;
    private String streetName;
}
