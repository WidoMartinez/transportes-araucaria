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
			field: "codigo_reserva",
			comment: "Código único de reserva (formato: AR-YYYYMMDD-XXXX)",
		},
		clienteId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "cliente_id", // Mapear a snake_case en la base de datos
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
		direccionOrigen: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "direccion_origen",
			comment: "Dirección específica de origen",
		},
		direccionDestino: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "direccion_destino",
			comment: "Dirección específica de destino",
		},
		fecha: {
			type: DataTypes.DATEONLY,
			allowNull: false,
		},
		hora: {
			type: DataTypes.TIME,
			allowNull: true,
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
		vehiculo: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
		vehiculoId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "vehiculo_id",
			comment: "ID del vehículo asignado (FK)",
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
		abonoPagado: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
			field: "abono_pagado",
			comment: "TRUE cuando el abono sugerido fue pagado",
		},
		saldoPagado: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allowNull: false,
			field: "saldo_pagado",
			comment: "TRUE cuando el saldo restante fue pagado por completo",
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
				const tieneNumeroVuelo =
					this.getDataValue("numeroVuelo") &&
					this.getDataValue("numeroVuelo").trim() !== "";
				const tieneHotel =
					this.getDataValue("hotel") &&
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
		tipoPago: {
			type: DataTypes.STRING(20),
			allowNull: true,
			field: "tipo_pago",
			comment: "Tipo de pago registrado (abono, saldo, total)",
		},
		estadoPago: {
			type: DataTypes.ENUM(
				"pendiente",
				"aprobado",
				"parcial",
				"pagado",
				"fallido",
				"reembolsado"
			),
			defaultValue: "pendiente",
		},
		pagoId: {
			type: DataTypes.STRING(255),
			allowNull: true,
			field: "pago_id",
			comment: "ID de transacción del gateway de pago",
		},
		pagoGateway: {
			type: DataTypes.STRING(50),
			allowNull: true,
			field: "pago_gateway",
			comment: "Gateway de pago utilizado (flow, transferencia, efectivo, etc)",
		},
		pagoMonto: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			field: "pago_monto",
			comment: "Monto pagado en la transacción",
		},
		pagoFecha: {
			type: DataTypes.DATE,
			allowNull: true,
			field: "pago_fecha",
			comment: "Fecha y hora del pago confirmado",
		},
		referenciaPago: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		observaciones: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		// TEMPORAL: Comentado hasta deploy en Render
		// gastosCerrados: {
		// 	type: DataTypes.BOOLEAN,
		// 	defaultValue: false,
		// 	allowNull: false,
		// 	field: "gastos_cerrados",
		// 	comment: "Indica si el registro de gastos está cerrado para esta reserva",
		// },
		conductorId: {
			type: DataTypes.INTEGER,
			allowNull: true,
			field: "conductor_id",
			comment: "ID del conductor asignado (FK)",
		},
		ajusteTarifaDinamica: {
			type: DataTypes.DECIMAL(10, 2),
			allowNull: true,
			defaultValue: 0,
			field: "ajuste_tarifa_dinamica",
			comment: "Monto del ajuste de tarifa dinámica aplicado",
		},
		porcentajeTarifaDinamica: {
			type: DataTypes.DECIMAL(5, 2),
			allowNull: true,
			defaultValue: 0,
			field: "porcentaje_tarifa_dinamica",
			comment: "Porcentaje total de ajuste de tarifa dinámica aplicado",
		},
		detalleAjustesTarifa: {
			type: DataTypes.JSON,
			allowNull: true,
			field: "detalle_ajustes_tarifa",
			comment: "JSON con desglose de ajustes de tarifa dinámica aplicados",
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
			{ fields: ["clienteId"] },
			{ fields: ["rut"] },
			{ fields: ["codigo_reserva"], unique: true },
		],
	}
);

export default Reserva;
