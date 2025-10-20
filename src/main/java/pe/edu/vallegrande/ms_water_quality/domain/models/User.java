package pe.edu.vallegrande.ms_water_quality.domain.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {
    @Id
    private String userId;
    private String name;
    private String email;
    private String password;
    private String status = "ACTIVE";
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
}