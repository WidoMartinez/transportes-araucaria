-- =====================================================
-- Script de Migración: Tablas de Autenticación Admin
-- Transportes Araucaria
-- =====================================================

-- Tabla de usuarios administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre de usuario único para login',
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email del administrador',
  password VARCHAR(255) NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
  nombre VARCHAR(100) NOT NULL COMMENT 'Nombre completo del administrador',
  rol ENUM('superadmin', 'admin', 'operador') DEFAULT 'admin' NOT NULL COMMENT 'Rol: superadmin (acceso completo), admin (gestión), operador (solo lectura)',
  activo BOOLEAN DEFAULT TRUE NOT NULL COMMENT 'Indica si el usuario está activo',
  ultimo_acceso DATETIME NULL COMMENT 'Fecha y hora del último acceso exitoso',
  intentos_fallidos INT DEFAULT 0 NOT NULL COMMENT 'Contador de intentos de login fallidos',
  bloqueado_hasta DATETIME NULL COMMENT 'Fecha hasta la cual el usuario está bloqueado',
  token_refresh VARCHAR(500) NULL COMMENT 'Token de actualización para renovar JWT',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de logs de auditoría administrativa
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT NULL COMMENT 'ID del usuario admin que realizó la acción',
  accion VARCHAR(100) NOT NULL COMMENT 'Tipo de acción realizada (login, logout, crear, editar, eliminar, etc.)',
  entidad VARCHAR(100) NULL COMMENT 'Entidad afectada (reserva, vehiculo, conductor, etc.)',
  entidad_id INT NULL COMMENT 'ID del registro afectado',
  detalles TEXT NULL COMMENT 'Detalles adicionales en formato JSON',
  ip VARCHAR(50) NULL COMMENT 'Dirección IP desde donde se realizó la acción',
  user_agent VARCHAR(500) NULL COMMENT 'User agent del navegador',
  resultado ENUM('exitoso', 'fallido', 'bloqueado') DEFAULT 'exitoso' NOT NULL COMMENT 'Resultado de la acción',
  createdAt DATETIME NOT NULL,
  INDEX idx_admin_user_id (admin_user_id),
  INDEX idx_accion (accion),
  INDEX idx_createdAt (createdAt),
  INDEX idx_resultado (resultado),
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear usuario administrador inicial
-- NOTA: La contraseña 'Admin123!' está hasheada con bcrypt
-- IMPORTANTE: Cambiar esta contraseña inmediatamente después del primer login
INSERT INTO admin_users (
  username,
  email,
  password,
  nombre,
  rol,
  activo,
  createdAt,
  updatedAt
) 
SELECT 
  'admin',
  'admin@transportesaraucaria.cl',
  '$2a$10$rHQGXnvP0J.6kCLvPZzTfOXl5H5kK5kJ5YKX5kJ5kJ5kJ5kJ5kJ5k', -- Hash temporal - usar script de migración JS para generar el correcto
  'Administrador Principal',
  'superadmin',
  TRUE,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE username = 'admin'
);

-- Verificar creación exitosa
SELECT 
  '✓ Tabla admin_users creada' as status,
  COUNT(*) as total_usuarios
FROM admin_users;

SELECT 
  '✓ Tabla admin_audit_logs creada' as status,
  COUNT(*) as total_logs
FROM admin_audit_logs;

-- =====================================================
-- IMPORTANTE: 
-- Este script crea las tablas básicas.
-- Para crear el usuario admin con la contraseña correcta,
-- ejecutar: node migrations/create-admin-tables.js
-- 
-- Credenciales iniciales:
-- Usuario: admin
-- Contraseña: Admin123!
-- 
-- ⚠️ CAMBIAR CONTRASEÑA INMEDIATAMENTE EN PRODUCCIÓN
-- =====================================================
