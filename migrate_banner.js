import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

import ReservaModel from "./backend/models/Reserva.js";
const Reserva = ReservaModel(sequelize, Sequelize.DataTypes);

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log("Conectado a la BD.");

    // Buscar reservas antiguas de banner que son ida_vuelta verdadero y no están divididas
    const reservas = await Reserva.findAll({
      where: {
        source: 'banner_promocional',
        idaVuelta: true,
        tramoHijoId: null
      }
    });

    console.log(`Encontradas ${reservas.length} reservas para migrar.`);

    for (const reserva of reservas) {
      console.log(`Migrando reserva ID: ${reserva.id}...`);
      
      const precioTotal = Number(reserva.precio) || 0;
      const precioTramo = precioTotal / 2;
      
      // Crear reserva de VUELTA (Hijo)
      const reservaVuelta = await Reserva.create({
        codigoReserva: `${reserva.codigoReserva}-V`,
        clienteId: reserva.clienteId,
        nombre: reserva.nombre,
        email: reserva.email,
        telefono: reserva.telefono,
        origen: reserva.destino,
        destino: reserva.origen,
        fecha: reserva.fechaRegreso || reserva.fecha, // Si es que se guardó fechaRegreso, si no usará la misma (habría q ver)
        hora: reserva.horaRegreso || "00:00:00",
        idaVuelta: false,
        tipoTramo: "vuelta",
        tramoPadreId: reserva.id,
        pasajeros: reserva.pasajeros,
        precio: precioTramo,
        totalConDescuento: precioTramo,
        pagoMonto: (Number(reserva.pagoMonto) || 0) / 2,
        estado: reserva.estado,
        estadoPago: reserva.estadoPago,
        source: "banner_promocional",
        sillaInfantil: reserva.sillaInfantil,
        cantidadSillasInfantiles: reserva.cantidadSillasInfantiles,
        comentarios: reserva.comentarios
      });

      // Actualizar IDA
      await reserva.update({ 
        tramoHijoId: reservaVuelta.id,
        idaVuelta: false,
        tipoTramo: 'ida',
        precio: precioTramo,
        totalConDescuento: precioTramo,
        pagoMonto: (Number(reserva.pagoMonto) || 0) / 2,
        fechaRegreso: null,
        horaRegreso: null
      });

      console.log(`✅ Reserva ${reserva.id} migrada exitosamente. Tramo hijo creado con ID: ${reservaVuelta.id}`);
    }

    console.log("Migración completada.");
  } catch (err) {
    console.error("Error en migración:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
