
import { Op } from "sequelize";
import Vehiculo from "../models/Vehiculo.js";
import Destino from "../models/Destino.js";

const seedCapacityUpdate = async () => {
    console.log("🔄 Ejecutando seed de capacidad (Van y Destinos)...");
    try {
        // 1. Asegurar Vehículo Van con capacidad 7
        const van = await Vehiculo.findOne({ where: { tipo: 'van', capacidad: { [Op.gte]: 7 } } });
        if (!van) {
            // Buscar si existe alguna van y actualizarla, o crear una nueva
            const existingVan = await Vehiculo.findOne({ where: { tipo: 'van' } });
            if (existingVan) {
                await existingVan.update({ capacidad: 7 });
                console.log("✅ Vehículo Van existente actualizado a capacidad 7");
            } else {
                await Vehiculo.create({
                    patente: 'VAN-SEED',
                    tipo: 'van',
                    marca: 'Mercedes',
                    modelo: 'Vito',
                    anio: 2024,
                    capacidad: 7,
                    estado: 'disponible',
                    observaciones: 'Vehículo creado automáticamente por migración para soporte de 7 pasajeros'
                });
                console.log("✅ Vehículo Van creado con capacidad 7");
            }
        } else {
            console.log("✅ Vehículo Van con capacidad suficiente ya existe.");
        }

        // 2. Asegurar Destinos con maxPasajeros 7
        // Actualizamos todos los destinos activos para permitir hasta 7 pasajeros si tienen menos
        const destinosActualizados = await Destino.update(
            { maxPasajeros: 7 },
            { where: { maxPasajeros: { [Op.lt]: 7 } } }
        );

        if (destinosActualizados[0] > 0) {
            console.log(`✅ ${destinosActualizados[0]} destinos actualizados a maxPasajeros: 7`);
        } else {
            console.log("✅ Todos los destinos ya tienen capacidad suficiente.");
        }

    } catch (error) {
        console.error("❌ Error en seed de capacidad:", error);
    }
};

export default seedCapacityUpdate;
