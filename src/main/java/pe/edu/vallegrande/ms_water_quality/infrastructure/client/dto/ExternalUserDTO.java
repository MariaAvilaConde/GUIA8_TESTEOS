package pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto;

import lombok.Data;

@Data
public class ExternalUserDTO {
    private String id;
    private String name;
    private String email;
    private String role;
}
