package cl.transportesaraucaria.reservas.config;

import cl.transportesaraucaria.reservas.exception.ReservaException;
import cl.transportesaraucaria.reservas.exception.PaymentException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ReservaException.class)
    public ResponseEntity<Map<String, String>> handleReservaException(ReservaException e) {
        log.error("ReservaException: {}", e.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Reserva Error");
        error.put("message", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(PaymentException.class)
    public ResponseEntity<Map<String, String>> handlePaymentException(PaymentException e) {
        log.error("PaymentException: {}", e.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Payment Error");
        error.put("message", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException e) {
        log.error("ValidationException: {}", e.getMessage());
        Map<String, Object> error = new HashMap<>();
        Map<String, String> fieldErrors = new HashMap<>();
        
        e.getBindingResult().getAllErrors().forEach((errorItem) -> {
            String fieldName = ((FieldError) errorItem).getField();
            String errorMessage = errorItem.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        error.put("error", "Validation Error");
        error.put("message", "Error de validación en los datos enviados");
        error.put("fieldErrors", fieldErrors);
        
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        log.error("IllegalArgumentException: {}", e.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("error", "Invalid Argument");
        error.put("message", e.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception e) {
        log.error("Unexpected error: {}", e.getMessage(), e);
        Map<String, String> error = new HashMap<>();
        error.put("error", "Internal Server Error");
        error.put("message", "Ha ocurrido un error interno del servidor");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}