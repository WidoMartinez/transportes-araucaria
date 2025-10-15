import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Reserva = sequelize.define(
	"Reserva",
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		codigoReserva: {
			type: DataTypes.STRING(50),
			allowNull: true,
			unique: true,
			field: 'codigo_reserva',
			comment: "Código único de reserva legible (formato: RES-YYYYMMDD-XXXX)",
		},
		clienteId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'cliente_id', // Mapear a snake_case en la base de datos
			comment: "ID del cliente asociado (si existe)",
		},
		rut: {
			type: DataTypes.STRING(20),
			allowNull: true,
			comment: "RUT del cliente (formato: 12345678-9)",
		},
		nombre: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		telefono: {
			type: DataTypes.STRING(50),
			allowNull: false,
		},
		origen: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		destino: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		fecha: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		hora: {
			type: DataTypes.TIME,
			allowNull: true,
			defaultValue: "08:00",
		},
		pasajeros: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 1,
		},
		precio: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
			defaultValue: 0,
		},
		vehiculoId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'vehiculo_id',
			comment: "ID del vehículo asignado",
			references: {
				model: 'vehiculos',
				key: 'id'
			}
		},
		conductorId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: 'conductor_id',
			comment: "ID del conductor asignado",
			references: {
				model: 'conductores',
				key: 'id'
			}
		},
		vehiculo: {
			type: DataTypes.STRING(100),
			allowNull: true,
			comment: "Campo de texto legado para vehículo (mantener por compatibilidad)",
		},
		numeroVuelo: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		hotel: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		equipajeEspecial: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		sillaInfantil: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		idaVuelta: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		fechaRegreso: {
			type: DataTypes.DATEONLY,
			allowNull: true,
		},
		horaRegreso: {
			type: DataTypes.TIME,
			allowNull: true,
		},
		abonoSugerido: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		saldoPendiente: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		descuentoBase: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		descuentoPromocion: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		descuentoRoundTrip: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		descuentoOnline: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
		},
		totalConDescuento: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: false,
		},
		mensaje: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		source: {
			type: DataTypes.STRING(100),
			allowNull: true,
			defaultValue: "web",
		},
		estado: {
			type: DataTypes.ENUM(
				"pendiente",
				"pendiente_detalles",
				"confirmada",
				"cancelada",
				"completada"
			),
			defaultValue: "pendiente",
		},
		// Campo virtual calculado: true si tiene detalles completos del viaje
		detallesCompletos: {
			type: DataTypes.VIRTUAL,
			get() {
				// Una reserva tiene detalles completos si tiene al menos el número de vuelo o hotel
				const tieneNumeroVuelo = this.getDataValue("numeroVuelo") && 
					this.getDataValue("numeroVuelo").trim() !== "";
				const tieneHotel = this.getDataValue("hotel") && 
					this.getDataValue("hotel").trim() !== "";
				return tieneNumeroVuelo || tieneHotel;
			},
		},
		ipAddress: {
			type: DataTypes.STRING(45),
			allowNull: true,
		},
		userAgent: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		codigoDescuento: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		metodoPago: {
			type: DataTypes.STRING(50),
			allowNull: true,
		},
		estadoPago: {
			type: DataTypes.ENUM("pendiente", "pagado", "fallido", "reembolsado"),
			defaultValue: "pendiente",
		},
		referenciaPago: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
	},
	{
		tableName: "reservas",
		timestamps: true,
		indexes: [
			{ fields: ["email"] },
			{ fields: ["fecha"] },
			{ fields: ["estado"] },
			{ fields: ["created_at"] },
			{ fields: ["cliente_id"] }, // Usar el nombre real de la columna en la BD
			{ fields: ["rut"] },
			{ fields: ["vehiculo_id"] }, // Índice para FK de vehículo
			{ fields: ["conductor_id"] }, // Índice para FK de conductor
			{ fields: ["codigo_reserva"], unique: true }, // Índice único para código de reserva
		],
	}
);

export default Reserva;
