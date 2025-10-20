package pe.edu.vallegrande.ms_water_quality.infrastructure.client.dto;

import lombok.Data;
import java.util.List;

@Data
public class UserApiResponse {
    private boolean success;
    private String message;
    private List<ExternalUser> data;
}
