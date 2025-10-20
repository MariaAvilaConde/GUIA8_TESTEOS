package pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto;

import lombok.Data;

@Data
public class ExternalZone {
    private String zoneCode;
    private String zoneId;
    private String status;
    private String zoneName;
    private String description;
}
