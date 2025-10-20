package pe.edu.vallegrande.ms_water_quality.infrastructure.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyRecordResponse {

    private String id;
    private String organizationId;
    private String recordCode;
    private String testingPointId;

    private LocalDateTime recordDate;
    private Double Level;
    private boolean acceptable;
    private boolean actionRequired;

    private String recordedByUserId;
    private String observations;
    private LocalDateTime nextDate;
    private String recordType; // agregar si aún no está

    private LocalDateTime createdAt;
}
