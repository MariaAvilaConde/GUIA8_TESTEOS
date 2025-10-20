package pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto;

import lombok.Data;
import java.util.List;

@Data
public class ExternalUser {
    private String id;
    private String userCode;
    private String firstName;
    private String lastName;
    private String documentType;
    private String documentNumber;
    private String email;
    private String phone;
    private String address;
    private List<String> roles;
    private String status;
    private String createdAt;
    private String updatedAt;
    private ExternalOrganization organization;
    private ExternalZone zone;
    private ExternalStreet street;
}
