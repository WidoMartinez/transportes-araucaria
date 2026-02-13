import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PromocionBanner = sequelize.define(
"PromocionBanner",
{
id: {
type: DataTypes.INTEGER,
primaryKey: true,
autoIncrement: true,
},
nombre: {
type: DataTypes.STRING(255),
allowNull: false,
comment: "Nombre de la promoción",
},
imagen_url: {
type: DataTypes.STRING(500),
allowNull: false,
comment: "URL de la imagen del banner",
},
precio: {
type: DataTypes.DECIMAL(10, 2),
allowNull: false,
comment: "Precio promocional",
},
tipo_viaje: {
type: DataTypes.ENUM("ida", "ida_vuelta"),
allowNull: false,
comment: "Tipo de viaje de la promoción",
},
destino: {
type: DataTypes.STRING(100),
allowNull: false,
comment: "Destino del viaje",
},
origen: {
type: DataTypes.STRING(100),
defaultValue: "Temuco",
comment: "Origen del viaje",
},
max_pasajeros: {
type: DataTypes.INTEGER,
defaultValue: 3,
comment: "Número máximo de pasajeros",
},
activo: {
type: DataTypes.BOOLEAN,
defaultValue: true,
comment: "Si la promoción está activa",
},
orden: {
type: DataTypes.INTEGER,
defaultValue: 0,
comment: "Orden de visualización",
},
fecha_inicio: {
type: DataTypes.DATEONLY,
allowNull: true,
comment: "Fecha de inicio de vigencia (opcional)",
},
fecha_fin: {
type: DataTypes.DATEONLY,
allowNull: true,
comment: "Fecha de fin de vigencia (opcional)",
},
posicion_imagen: {
type: DataTypes.STRING(50),
defaultValue: "center",
comment: "Posición de la imagen (object-position)",
},
},
{
tableName: "promociones_banner",
timestamps: true,
underscored: true,
createdAt: "created_at",
updatedAt: "updated_at",
}
);

export default PromocionBanner;
