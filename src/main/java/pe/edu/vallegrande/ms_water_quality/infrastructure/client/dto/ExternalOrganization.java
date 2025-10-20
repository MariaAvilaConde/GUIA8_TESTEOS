package pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ExternalOrganization {
    private String organizationName;
    private String organizationCode;
    private String organizationId;
    private String status;
    private String address;
    private String phone;
    private String legalRepresentative;
}
