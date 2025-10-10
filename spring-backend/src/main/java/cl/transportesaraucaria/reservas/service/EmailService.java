package cl.transportesaraucaria.reservas.service;

import cl.transportesaraucaria.reservas.model.entity.Reserva;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    @Value("${app.email.from}")
    private String fromEmail;
    
    @Value("${app.email.admin}")
    private String adminEmail;
    
    @Value("${app.frontend-url}")
    private String frontendUrl;
    
    public void enviarConfirmacionReserva(Reserva reserva) throws MessagingException {
        log.info("Enviando email de confirmación para reserva: {}", reserva.getId());
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(reserva.getEmail());
        helper.setSubject("Confirmación de Reserva - Transportes Araucaria");
        
        // Preparar contexto para el template
        Context context = new Context(Locale.forLanguageTag("es-CL"));
        context.setVariable("reserva", reserva);
        context.setVariable("frontendUrl", frontendUrl);
        context.setVariable("formatoFecha", DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-CL")));
        context.setVariable("formatoHora", DateTimeFormatter.ofPattern("HH:mm"));
        context.setVariable("formatoMoneda", java.text.NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-CL")));
        
        String htmlContent = templateEngine.process("confirmacion-reserva", context);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
        log.info("Email de confirmación enviado exitosamente para reserva: {}", reserva.getId());
    }
    
    public void enviarNotificacionPago(Reserva reserva, String tipoPago, BigDecimal monto) throws MessagingException {
        log.info("Enviando notificación de pago para reserva: {}", reserva.getId());
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(reserva.getEmail());
        helper.setSubject("Confirmación de Pago - Transportes Araucaria");
        
        Context context = new Context(Locale.forLanguageTag("es-CL"));
        context.setVariable("reserva", reserva);
        context.setVariable("tipoPago", tipoPago);
        context.setVariable("monto", monto);
        context.setVariable("frontendUrl", frontendUrl);
        context.setVariable("formatoMoneda", java.text.NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-CL")));
        
        String htmlContent = templateEngine.process("confirmacion-pago", context);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
        log.info("Notificación de pago enviada exitosamente para reserva: {}", reserva.getId());
    }
    
    public void enviarNotificacionAdmin(Reserva reserva, String tipoNotificacion) throws MessagingException {
        log.info("Enviando notificación a admin para reserva: {}", reserva.getId());
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(adminEmail);
        helper.setSubject("Notificación Admin - " + tipoNotificacion + " - Reserva " + reserva.getId());
        
        Context context = new Context(Locale.forLanguageTag("es-CL"));
        context.setVariable("reserva", reserva);
        context.setVariable("tipoNotificacion", tipoNotificacion);
        context.setVariable("frontendUrl", frontendUrl);
        context.setVariable("formatoFecha", DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-CL")));
        context.setVariable("formatoHora", DateTimeFormatter.ofPattern("HH:mm"));
        context.setVariable("formatoMoneda", java.text.NumberFormat.getCurrencyInstance(Locale.forLanguageTag("es-CL")));
        
        String htmlContent = templateEngine.process("notificacion-admin", context);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
        log.info("Notificación admin enviada exitosamente para reserva: {}", reserva.getId());
    }
    
    public void enviarRecordatorioReserva(Reserva reserva) throws MessagingException {
        log.info("Enviando recordatorio para reserva: {}", reserva.getId());
        
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        helper.setFrom(fromEmail);
        helper.setTo(reserva.getEmail());
        helper.setSubject("Recordatorio de Reserva - Transportes Araucaria");
        
        Context context = new Context(Locale.forLanguageTag("es-CL"));
        context.setVariable("reserva", reserva);
        context.setVariable("frontendUrl", frontendUrl);
        context.setVariable("formatoFecha", DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy", Locale.forLanguageTag("es-CL")));
        context.setVariable("formatoHora", DateTimeFormatter.ofPattern("HH:mm"));
        
        String htmlContent = templateEngine.process("recordatorio-reserva", context);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
        log.info("Recordatorio enviado exitosamente para reserva: {}", reserva.getId());
    }
}