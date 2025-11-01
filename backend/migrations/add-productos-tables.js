/* eslint-env node */
/* global process */
/**
 * Migración: Agregar tablas de productos y productos_reserva
 * Permite a los pasajeros agregar productos a reservas activas y confirmadas
 */
import sequelize from "../config/database.js";

const addProductosTables = async () => {
	try {
		console.log("🔄 Iniciando migración: agregar tablas de productos...");

		// Crear tabla productos
		await sequelize.query(`
			CREATE TABLE IF NOT EXISTS productos (
				id INT AUTO_INCREMENT PRIMARY KEY,
				nombre VARCHAR(255) NOT NULL COMMENT 'Nombre del producto',
				descripcion TEXT COMMENT 'Descripción detallada del producto',
				categoria VARCHAR(100) NOT NULL DEFAULT 'general' COMMENT 'Categoría del producto',
				precio DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Precio en CLP',
				disponible BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Disponibilidad del producto',
				stock INT NULL COMMENT 'Stock disponible (null = sin control)',
				imagen_url VARCHAR(500) NULL COMMENT 'URL de imagen del producto',
				orden INT DEFAULT 0 COMMENT 'Orden de visualización',
				disponible_en_ruta JSON NULL COMMENT 'Destinos donde está disponible',
				disponible_en_vehiculo JSON NULL COMMENT 'Tipos de vehículo donde está disponible',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				INDEX idx_categoria (categoria),
				INDEX idx_disponible (disponible),
				INDEX idx_orden (orden)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
			COMMENT='Catálogo de productos disponibles para agregar a reservas';
		`);

		console.log("✅ Tabla 'productos' creada correctamente");

		// Crear tabla productos_reserva (relación muchos a muchos)
		await sequelize.query(`
			CREATE TABLE IF NOT EXISTS productos_reserva (
				id INT AUTO_INCREMENT PRIMARY KEY,
				reserva_id INT NOT NULL COMMENT 'ID de la reserva',
				producto_id INT NOT NULL COMMENT 'ID del producto',
				cantidad INT NOT NULL DEFAULT 1 COMMENT 'Cantidad de unidades',
				precio_unitario DECIMAL(10,2) NOT NULL COMMENT 'Precio unitario al agregar',
				subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Subtotal calculado',
				notas TEXT NULL COMMENT 'Notas especiales del producto',
				estado_entrega ENUM('pendiente', 'preparado', 'entregado', 'cancelado') 
					DEFAULT 'pendiente' COMMENT 'Estado de entrega',
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
				INDEX idx_reserva_id (reserva_id),
				INDEX idx_producto_id (producto_id),
				INDEX idx_estado_entrega (estado_entrega),
				FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
				FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
			COMMENT='Productos agregados a cada reserva';
		`);

		console.log("✅ Tabla 'productos_reserva' creada correctamente");

		// Agregar índice único en nombre para evitar duplicados
		await sequelize.query(`
			ALTER TABLE productos ADD UNIQUE INDEX idx_nombre_unique (nombre);
		`).catch(() => {
			// Ignorar si el índice ya existe
			console.log("⚠️ Índice único en productos.nombre ya existe, continuando...");
		});

		console.log("✅ Índice único en productos.nombre verificado");

		// Insertar productos de ejemplo solo si no existen
		// Usar INSERT IGNORE para evitar duplicados si la migración se ejecuta múltiples veces
		await sequelize.query(`
			INSERT IGNORE INTO productos (nombre, descripcion, categoria, precio, disponible, orden)
			VALUES 
				('Agua Mineral 500ml', 'Agua mineral natural embotellada', 'bebidas', 1500, TRUE, 1),
				('Jugo Natural 300ml', 'Jugo de frutas naturales', 'bebidas', 2500, TRUE, 2),
				('Café Premium', 'Café americano o expreso', 'bebidas', 2000, TRUE, 3),
				('Snack Mix', 'Mix de frutos secos y cereales', 'snacks', 2000, TRUE, 4),
				('Chocolate', 'Barra de chocolate premium', 'snacks', 1800, TRUE, 5),
				('Galletas', 'Paquete de galletas variadas', 'snacks', 1500, TRUE, 6),
				('Cargador USB', 'Cargador portátil USB', 'accesorios', 8000, TRUE, 7),
				('Almohada de viaje', 'Almohada ergonómica para cuello', 'accesorios', 12000, TRUE, 8),
				('Manta de viaje', 'Manta suave y compacta', 'accesorios', 15000, TRUE, 9),
				('Antiparras de sol', 'Lentes de sol polarizados', 'accesorios', 10000, TRUE, 10);
		`);

		console.log("✅ Productos de ejemplo insertados");
		console.log("✅ Migración completada exitosamente");

		return true;
	} catch (error) {
		console.error("❌ Error en migración de productos:", error);
		throw error;
	}
};

export default addProductosTables;
