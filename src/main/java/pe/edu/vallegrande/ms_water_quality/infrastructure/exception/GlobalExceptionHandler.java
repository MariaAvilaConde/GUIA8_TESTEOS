package pe.edu.vallegrande.ms_water_quality.infrastructure.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.ErrorMessage;
import pe.edu.vallegrande.ms_water_quality.infrastructure.dto.ResponseDto;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ResponseDto<Object>> handleCustomException(CustomException ex) {
        ErrorMessage error = ex.getErrorMessage();
        ResponseDto<Object> response = new ResponseDto<>(false, null, error);
        return ResponseEntity.status(error.getErrorCode()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDto<Object>> handleGenericException(Exception ex) {
        int statusCode = (ex instanceof RuntimeException) ? 500 : 400;

        ErrorMessage error = new ErrorMessage(
                statusCode,
                "Error interno del servidor",
                ex.getMessage()
        );
        ResponseDto<Object> response = new ResponseDto<>(false, null, error);
        return ResponseEntity.status(statusCode).body(response);
    }

}