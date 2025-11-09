-- AVISO: Este archivo se debe ejecutar manualmente en phpMyAdmin de Hostinger
-- Script SQL para crear la tabla admin_users en la base de datos de Hostinger

-- Crear tabla admin_users
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL COMMENT 'Nombre de usuario único para login',
  `email` VARCHAR(255) NOT NULL COMMENT 'Email del administrador',
  `password` VARCHAR(255) NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
  `nombre` VARCHAR(100) NOT NULL COMMENT 'Nombre completo del administrador',
  `rol` ENUM('superadmin', 'admin', 'operador') NOT NULL DEFAULT 'admin' COMMENT 'Rol del usuario',
  `activo` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Indica si el usuario está activo',
  `ultimo_acceso` DATETIME NULL DEFAULT NULL COMMENT 'Fecha y hora del último acceso exitoso',
  `intentos_fallidos` INT(11) NOT NULL DEFAULT 0 COMMENT 'Contador de intentos de login fallidos',
  `bloqueado_hasta` DATETIME NULL DEFAULT NULL COMMENT 'Fecha hasta la cual el usuario está bloqueado',
  `token_refresh` VARCHAR(500) NULL DEFAULT NULL COMMENT 'Token de actualización para renovar JWT',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios administradores del sistema';

-- Insertar usuario administrador por defecto
-- Contraseña: admin123 (hasheada con bcrypt, cost 10)
INSERT INTO `admin_users` 
  (`username`, `email`, `password`, `nombre`, `rol`, `activo`) 
VALUES 
  ('admin', 'contacto@transportesaraucaria.cl', '$2b$10$rOvHPKZXg0q5Y5QqZYX5Xu7KzJ8Y5R5Z5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5u', 'Administrador Principal', 'superadmin', 1)
ON DUPLICATE KEY UPDATE 
  `email` = VALUES(`email`),
  `nombre` = VALUES(`nombre`),
  `rol` = VALUES(`rol`);

-- Nota: La contraseña hasheada anterior es un placeholder.
-- Después de ejecutar este script, deberás:
-- 1. Ir al backend en Render.com
-- 2. Usar el endpoint de registro o cambio de contraseña
-- 3. O actualizar manualmente con una contraseña hasheada válida usando bcrypt

-- Para generar una contraseña hasheada con bcrypt (costo 10):
-- Opción 1: Usar Node.js
-- const bcrypt = require('bcrypt');
-- bcrypt.hash('tu_contraseña', 10, (err, hash) => console.log(hash));

-- Opción 2: Usar herramienta online (ej: bcrypt-generator.com)
-- Luego actualizar con:
-- UPDATE admin_users SET password = 'TU_HASH_AQUI' WHERE username = 'admin';
