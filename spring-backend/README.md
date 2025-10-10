# Transportes Araucaria - Backend Spring Boot

Backend desarrollado con Spring Boot para el sistema de reservas de Transportes Araucaria.

## 🚀 Características

- **Framework**: Spring Boot 3.2.0
- **Base de Datos**: MySQL con JPA/Hibernate
- **Seguridad**: Spring Security con CORS configurado
- **Validación**: Bean Validation (Jakarta)
- **Email**: Spring Mail con templates Thymeleaf
- **Pagos**: Integración con MercadoPago y Flow
- **Cache**: Spring Cache para optimización
- **Documentación**: API REST bien documentada

## 📋 Funcionalidades

### Gestión de Reservas
- ✅ Crear reservas con validación completa
- ✅ Calcular precios automáticamente con descuentos
- ✅ Validar disponibilidad en tiempo real
- ✅ Gestión de estados de reserva
- ✅ Búsqueda y filtrado de reservas

### Sistema de Precios
- ✅ Descuentos automáticos (online, ida y vuelta)
- ✅ Códigos de descuento personalizados
- ✅ Promociones por fecha, hora y destino
- ✅ Cálculo dinámico de precios

### Pagos
- ✅ Integración con MercadoPago
- ✅ Integración con Flow
- ✅ Webhooks para confirmación de pagos
- ✅ Gestión de abonos y pagos totales

### Administración
- ✅ CRUD completo para destinos
- ✅ Gestión de códigos de descuento
- ✅ Administración de promociones
- ✅ Dashboard con estadísticas

### Notificaciones
- ✅ Emails de confirmación de reserva
- ✅ Notificaciones de pago
- ✅ Templates HTML responsivos
- ✅ Recordatorios automáticos

## 🛠️ Tecnologías

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **Spring Security**
- **Spring Mail**
- **MySQL 8.0**
- **Thymeleaf**
- **Maven**
- **Lombok**

## 📦 Instalación

### Prerrequisitos
- Java 17 o superior
- Maven 3.6+
- MySQL 8.0+

### Configuración

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd spring-backend
```

2. **Configurar base de datos**
```sql
CREATE DATABASE transportes_araucaria;
CREATE USER 'araucaria_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON transportes_araucaria.* TO 'araucaria_user'@'localhost';
FLUSH PRIVILEGES;
```

3. **Configurar variables de entorno**
```bash
# Base de datos
export DB_USERNAME=araucaria_user
export DB_PASSWORD=password

# Email
export MAIL_USERNAME=tu-email@gmail.com
export MAIL_PASSWORD=tu-app-password

# MercadoPago
export MERCADOPAGO_ACCESS_TOKEN=tu-access-token

# Flow
export FLOW_API_KEY=tu-api-key
export FLOW_SECRET_KEY=tu-secret-key

# URLs
export FRONTEND_URL=http://localhost:3000
export BACKEND_URL=http://localhost:8080
```

4. **Ejecutar la aplicación**
```bash
mvn spring-boot:run
```

## 🔧 Configuración

### application.yml
```yaml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/transportes_araucaria
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
    
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false
```

## 📚 API Endpoints

### Reservas
- `POST /api/reservas` - Crear reserva
- `GET /api/reservas/{id}` - Obtener reserva
- `GET /api/reservas/email/{email}` - Reservas por email
- `GET /api/reservas/buscar` - Buscar reservas
- `PUT /api/reservas/{id}/estado` - Actualizar estado
- `PUT /api/reservas/{id}/cancelar` - Cancelar reserva

### Precios
- `GET /api/reservas/pricing` - Calcular precio
- `GET /api/reservas/destinos` - Obtener destinos
- `GET /api/reservas/promociones` - Obtener promociones
- `POST /api/reservas/validar-codigo` - Validar código descuento

### Pagos
- `POST /api/pagos` - Crear pago
- `POST /api/pagos/webhook/mercadopago` - Webhook MercadoPago
- `POST /api/pagos/webhook/flow` - Webhook Flow
- `GET /api/pagos/{pagoId}/estado` - Estado del pago

### Administración
- `GET /api/admin/destinos` - Listar destinos
- `POST /api/admin/destinos` - Crear destino
- `PUT /api/admin/destinos/{id}` - Actualizar destino
- `DELETE /api/admin/destinos/{id}` - Eliminar destino

## 🗄️ Modelo de Datos

### Entidades Principales
- **Reserva**: Información de la reserva del cliente
- **Destino**: Destinos disponibles con precios
- **Pago**: Registro de pagos procesados
- **CodigoDescuento**: Códigos de descuento personalizados
- **Promocion**: Promociones por fecha/hora/destino

### Relaciones
- Reserva → Destino (ManyToOne)
- Pago → Reserva (ManyToOne)
- Reserva → CodigoDescuento (String reference)

## 🔐 Seguridad

- CORS configurado para frontend
- Endpoints públicos para reservas y pagos
- Endpoints protegidos para administración
- Validación de datos de entrada
- Manejo de excepciones global

## 📧 Email Templates

Templates HTML responsivos ubicados en:
- `src/main/resources/templates/email/`
- Confirmación de reserva
- Confirmación de pago
- Notificaciones administrativas
- Recordatorios

## 🚀 Despliegue

### Docker
```dockerfile
FROM openjdk:17-jdk-slim
COPY target/reservas-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### Variables de Entorno de Producción
```bash
DB_USERNAME=prod_user
DB_PASSWORD=secure_password
MAIL_USERNAME=noreply@transportesaraucaria.cl
MERCADOPAGO_ACCESS_TOKEN=prod_token
FLOW_API_KEY=prod_api_key
FRONTEND_URL=https://www.transportesaraucaria.cl
BACKEND_URL=https://api.transportesaraucaria.cl
```

## 📊 Monitoreo

- Actuator endpoints habilitados
- Health checks
- Métricas de aplicación
- Logs estructurados

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico:
- Email: dev@transportesaraucaria.cl
- Documentación: [Wiki del proyecto]
- Issues: [GitHub Issues]

---

**Desarrollado con ❤️ para Transportes Araucaria**