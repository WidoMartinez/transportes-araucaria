import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Modelo para oportunidades de traslado (retornos e idas vacías)
const Oportunidad = sequelize.define(
"Oportunidad",
{
id: {
type: DataTypes.INTEGER,
primaryKey: true,
autoIncrement: true,
},
codigo: {
type: DataTypes.STRING(50),
allowNull: false,
unique: true,
comment: "Código único de oportunidad (formato: OP-YYYYMMDD-XXX)",
},
tipo: {
type: DataTypes.ENUM("retorno_vacio", "ida_vacia"),
allowNull: false,
comment: "Tipo de oportunidad: retorno vacío o ida vacía",
},
origen: {
type: DataTypes.STRING(255),
allowNull: false,
comment: "Origen del traslado",
},
destino: {
type: DataTypes.STRING(255),
allowNull: false,
comment: "Destino del traslado",
},
fecha: {
type: DataTypes.DATEONLY,
allowNull: false,
comment: "Fecha del traslado",
},
horaAproximada: {
type: DataTypes.TIME,
allowNull: true,
field: "hora_aproximada",
comment: "Hora aproximada del traslado",
},
descuento: {
type: DataTypes.INTEGER,
allowNull: false,
comment: "Porcentaje de descuento (0-100)",
},
precioOriginal: {
type: DataTypes.DECIMAL(10, 2),
allowNull: false,
field: "precio_original",
comment: "Precio original sin descuento",
},
precioFinal: {
type: DataTypes.DECIMAL(10, 2),
allowNull: false,
field: "precio_final",
comment: "Precio final con descuento",
},
vehiculo: {
type: DataTypes.STRING(255),
allowNull: true,
comment: "Tipo de vehículo",
},
capacidad: {
type: DataTypes.STRING(100),
allowNull: true,
comment: "Capacidad del vehículo (ej: 6 pasajeros)",
},
reservaRelacionadaId: {
type: DataTypes.INTEGER,
allowNull: true,
field: "reserva_relacionada_id",
comment: "ID de la reserva que generó esta oportunidad",
},
estado: {
type: DataTypes.ENUM("disponible", "reservada", "expirada"),
defaultValue: "disponible",
comment: "Estado actual de la oportunidad",
},
validoHasta: {
type: DataTypes.DATE,
allowNull: true,
field: "valido_hasta",
comment: "Fecha/hora límite para reservar esta oportunidad",
},
reservaAprovechadaId: {
type: DataTypes.INTEGER,
allowNull: true,
field: "reserva_aprovechada_id",
comment: "ID de la reserva que aprovechó esta oportunidad",
},
motivoDescuento: {
type: DataTypes.TEXT,
allowNull: true,
field: "motivo_descuento",
comment: "Explicación del motivo del descuento",
},
},
{
tableName: "oportunidades",
timestamps: true,
createdAt: "created_at",
updatedAt: "updated_at",
indexes: [
{ fields: ["codigo"] },
{ fields: ["fecha", "estado"] },
{ fields: ["origen", "destino"] },
{ fields: ["estado"] },
{ fields: ["tipo"] },
{ fields: ["valido_hasta"] },
],
}
);

export default Oportunidad;
