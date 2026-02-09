/* eslint-env node */
// backend/routes/oportunidades.js
// Endpoints para el sistema de oportunidades de traslado

import { Op } from "sequelize";
import { z } from "zod";
import Oportunidad from "../models/Oportunidad.js";
import SuscripcionOportunidad from "../models/SuscripcionOportunidad.js";
import Reserva from "../models/Reserva.js";

// Schema de validación para suscripciones
const suscripcionSchema = z.object({
  email: z.string().email("Email inválido"),
  nombre: z.string().optional(),
  rutas: z.array(
    z.object({
      origen: z.string().min(1, "Origen requerido"),
      destino: z.string().min(1, "Destino requerido"),
    })
  ).min(1, "Debe seleccionar al menos una ruta"),
  descuentoMinimo: z.number().int().min(30).max(70).optional(),
});

// Función auxiliar para generar código de oportunidad único
const generarCodigoOportunidad = async () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  
  // Generar código único con timestamp y random base36
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  const codigo = `OP-${year}${month}${day}-${timestamp}${random}`;
  
  // Verificar que no exista (por seguridad extra)
  const existe = await Oportunidad.findOne({ where: { codigo } });
  if (existe) {
    // Recursión en caso extremo de colisión
    return generarCodigoOportunidad();
  }
  
  return codigo;
};

// Función auxiliar para calcular precio con descuento
const calcularPrecioConDescuento = (precioOriginal, porcentajeDescuento) => {
return precioOriginal * (1 - porcentajeDescuento / 100);
};

// Función para detectar y generar oportunidades desde reservas confirmadas
export const detectarYGenerarOportunidades = async (reserva) => {
try {
const oportunidadesGeneradas = [];

// 1. RETORNO VACÍO: crear oportunidad de destino → origen
if (reserva.estado === "confirmada" || reserva.estado === "completada") {
const existeRetorno = await Oportunidad.findOne({
where: {
reservaRelacionadaId: reserva.id,
tipo: "retorno_vacio",
estado: ["disponible", "reservada"],
},
});

if (!existeRetorno) {
// Calcular hora aproximada: hora de llegada + 30 minutos
let horaAproximada = null;
if (reserva.hora) {
const [horas, minutos] = reserva.hora.split(":");
const fechaHora = new Date();
fechaHora.setHours(parseInt(horas), parseInt(minutos) + 30);
horaAproximada = `${String(fechaHora.getHours()).padStart(2, "0")}:${String(fechaHora.getMinutes()).padStart(2, "0")}`;
}

// Calcular validez: hasta 2 horas antes del viaje
const validoHasta = new Date(reserva.fecha);
if (horaAproximada) {
const [h, m] = horaAproximada.split(":");
validoHasta.setHours(parseInt(h) - 2, parseInt(m));
} else {
validoHasta.setHours(validoHasta.getHours() - 2);
}

// Solo crear si es futuro
if (validoHasta > new Date()) {
const descuento = 50; // 50% descuento por retorno vacío
const oportunidadRetorno = await Oportunidad.create({
codigo: generarCodigoOportunidad(),
tipo: "retorno_vacio",
origen: reserva.destino,
destino: reserva.origen,
fecha: reserva.fecha,
horaAproximada,
descuento,
precioOriginal: parseFloat(reserva.precio),
precioFinal: calcularPrecioConDescuento(parseFloat(reserva.precio), descuento),
vehiculo: reserva.vehiculo,
capacidad: `${reserva.pasajeros} pasajeros`,
reservaRelacionadaId: reserva.id,
estado: "disponible",
validoHasta,
motivoDescuento: `Retorno disponible después de dejar cliente en ${reserva.destino}`,
});
oportunidadesGeneradas.push(oportunidadRetorno);
}
}
}

// 2. IDA VACÍA: si el origen NO es la base (Temuco), crear oportunidad base → origen
const BASE = "Temuco"; // Base de operaciones
if (
(reserva.estado === "confirmada" || reserva.estado === "completada") &&
reserva.origen !== BASE
) {
const existeIda = await Oportunidad.findOne({
where: {
reservaRelacionadaId: reserva.id,
tipo: "ida_vacia",
estado: ["disponible", "reservada"],
},
});

if (!existeIda) {
// Calcular hora aproximada: hora de recogida - 2 horas
let horaAproximada = null;
if (reserva.hora) {
const [horas, minutos] = reserva.hora.split(":");
const fechaHora = new Date();
fechaHora.setHours(parseInt(horas) - 2, parseInt(minutos));
horaAproximada = `${String(fechaHora.getHours()).padStart(2, "0")}:${String(fechaHora.getMinutes()).padStart(2, "0")}`;
}

// Calcular validez: hasta 3 horas antes del viaje
const validoHasta = new Date(reserva.fecha);
if (reserva.hora) {
const [h, m] = reserva.hora.split(":");
validoHasta.setHours(parseInt(h) - 3, parseInt(m));
} else {
validoHasta.setHours(validoHasta.getHours() - 3);
}

// Solo crear si es futuro
if (validoHasta > new Date()) {
const descuento = 50; // 50% descuento por ida vacía
const oportunidadIda = await Oportunidad.create({
codigo: generarCodigoOportunidad(),
tipo: "ida_vacia",
origen: BASE,
destino: reserva.origen,
fecha: reserva.fecha,
horaAproximada,
descuento,
precioOriginal: parseFloat(reserva.precio),
precioFinal: calcularPrecioConDescuento(parseFloat(reserva.precio), descuento),
vehiculo: reserva.vehiculo,
capacidad: `${reserva.pasajeros} pasajeros`,
reservaRelacionadaId: reserva.id,
estado: "disponible",
validoHasta,
motivoDescuento: `Vehículo disponible antes de recoger cliente en ${reserva.origen}`,
});
oportunidadesGeneradas.push(oportunidadIda);
}
}
}

return oportunidadesGeneradas;
} catch (error) {
console.error("Error detectando oportunidades:", error);
return [];
}
};

// Función para marcar oportunidades expiradas
export const marcarOportunidadesExpiradas = async () => {
try {
const ahora = new Date();
const [actualizadas] = await Oportunidad.update(
{ estado: "expirada" },
{
where: {
estado: "disponible",
validoHasta: { [Op.lt]: ahora },
},
}
);
if (actualizadas > 0) {
console.log(`✅ ${actualizadas} oportunidades marcadas como expiradas`);
}
return actualizadas;
} catch (error) {
console.error("Error marcando oportunidades expiradas:", error);
return 0;
}
};

// Configurar rutas
export const setupOportunidadesRoutes = (app, authAdmin) => {
// GET /api/oportunidades - Listar oportunidades disponibles
app.get("/api/oportunidades", async (req, res) => {
try {
// Primero marcar las expiradas
await marcarOportunidadesExpiradas();

const { origen, destino, fecha } = req.query;

const where = {
estado: "disponible",
validoHasta: { [Op.gt]: new Date() },
};

if (origen) where.origen = origen;
if (destino) where.destino = destino;
if (fecha) where.fecha = fecha;

const oportunidades = await Oportunidad.findAll({
where,
order: [["fecha", "ASC"], ["horaAproximada", "ASC"]],
include: [
{
model: Reserva,
as: "reservaRelacionada",
attributes: ["id", "codigoReserva"],
},
],
});

res.json({
success: true,
oportunidades: oportunidades.map((op) => ({
id: op.codigo,
tipo: op.tipo,
origen: op.origen,
destino: op.destino,
fecha: op.fecha,
horaAproximada: op.horaAproximada,
descuento: op.descuento,
precioOriginal: parseFloat(op.precioOriginal),
precioFinal: parseFloat(op.precioFinal),
vehiculo: op.vehiculo,
capacidad: op.capacidad,
relacionadaCon: op.reservaRelacionada?.codigoReserva || `ID-${op.reservaRelacionadaId}`,
motivoDescuento: op.motivoDescuento,
estado: op.estado,
validoHasta: op.validoHasta,
})),
});
} catch (error) {
console.error("Error listando oportunidades:", error);
res.status(500).json({
success: false,
error: "Error al cargar oportunidades",
});
}
});

// POST /api/oportunidades/suscribir - Suscribirse a alertas
app.post("/api/oportunidades/suscribir", async (req, res) => {
try {
// Validar entrada con zod
const validacion = suscripcionSchema.safeParse(req.body);

if (!validacion.success) {
return res.status(400).json({
success: false,
error: "Datos inválidos",
detalles: validacion.error.errors,
});
}

const { email, nombre, rutas, descuentoMinimo } = validacion.data;

// Verificar si ya existe suscripción
let suscripcion = await SuscripcionOportunidad.findOne({
where: { email },
});

if (suscripcion) {
// Actualizar suscripción existente
await suscripcion.update({
nombre,
rutas, // Sequelize maneja automáticamente DataTypes.JSON
descuentoMinimo: descuentoMinimo || 40,
activa: true,
});
} else {
// Crear nueva suscripción
suscripcion = await SuscripcionOportunidad.create({
email,
nombre,
rutas, // Sequelize maneja automáticamente DataTypes.JSON
descuentoMinimo: descuentoMinimo || 40,
activa: true,
});
}

res.json({
success: true,
message: "Suscripción creada exitosamente",
suscripcion: {
email: suscripcion.email,
nombre: suscripcion.nombre,
rutas: suscripcion.rutas, // Ya es un objeto JS
descuentoMinimo: suscripcion.descuentoMinimo,
},
});
} catch (error) {
console.error("Error creando suscripción:", error);
res.status(500).json({
success: false,
error: "Error al crear suscripción",
});
}
});

// GET /api/oportunidades/generar - Generar oportunidades desde reservas (Admin)
app.get("/api/oportunidades/generar", authAdmin, async (req, res) => {
try {
// Buscar todas las reservas confirmadas futuras
const reservas = await Reserva.findAll({
where: {
estado: ["confirmada", "completada"],
fecha: { [Op.gte]: new Date() },
},
order: [["fecha", "ASC"]],
});

let totalGeneradas = 0;
const resultados = [];

for (const reserva of reservas) {
const oportunidades = await detectarYGenerarOportunidades(reserva);
totalGeneradas += oportunidades.length;
if (oportunidades.length > 0) {
resultados.push({
reserva: reserva.codigoReserva,
oportunidades: oportunidades.map((op) => op.codigo),
});
}
}

res.json({
success: true,
message: `${totalGeneradas} oportunidades generadas`,
totalGeneradas,
detalles: resultados,
});
} catch (error) {
console.error("Error generando oportunidades:", error);
res.status(500).json({
success: false,
error: "Error al generar oportunidades",
});
}
});

// GET /api/oportunidades/admin - Lista completa para admin
app.get("/api/oportunidades/admin", authAdmin, async (req, res) => {
try {
const oportunidades = await Oportunidad.findAll({
order: [["created_at", "DESC"]],
include: [
{
model: Reserva,
as: "reservaRelacionada",
attributes: ["id", "codigoReserva", "nombre", "email"],
},
{
model: Reserva,
as: "reservaAprovechada",
attributes: ["id", "codigoReserva", "nombre", "email"],
},
],
});

res.json({
success: true,
oportunidades,
});
} catch (error) {
console.error("Error listando oportunidades admin:", error);
res.status(500).json({
success: false,
error: "Error al cargar oportunidades",
});
}
});

// PUT /api/oportunidades/:codigo/estado - Actualizar estado (Admin)
app.put("/api/oportunidades/:codigo/estado", authAdmin, async (req, res) => {
try {
const { codigo } = req.params;
const { estado } = req.body;

if (!["disponible", "reservada", "expirada"].includes(estado)) {
return res.status(400).json({
success: false,
error: "Estado inválido",
});
}

const oportunidad = await Oportunidad.findOne({ where: { codigo } });
if (!oportunidad) {
return res.status(404).json({
success: false,
error: "Oportunidad no encontrada",
});
}

await oportunidad.update({ estado });

res.json({
success: true,
message: "Estado actualizado",
oportunidad,
});
} catch (error) {
console.error("Error actualizando estado:", error);
res.status(500).json({
success: false,
error: "Error al actualizar estado",
});
}
});

// DELETE /api/oportunidades/:codigo - Eliminar oportunidad (Admin)
app.delete("/api/oportunidades/:codigo", authAdmin, async (req, res) => {
try {
const { codigo } = req.params;

const oportunidad = await Oportunidad.findOne({ where: { codigo } });
if (!oportunidad) {
return res.status(404).json({
success: false,
error: "Oportunidad no encontrada",
});
}

await oportunidad.destroy();

res.json({
success: true,
message: "Oportunidad eliminada",
});
} catch (error) {
console.error("Error eliminando oportunidad:", error);
res.status(500).json({
success: false,
error: "Error al eliminar oportunidad",
});
}
});

// GET /api/oportunidades/estadisticas - Estadísticas (Admin)
app.get("/api/oportunidades/estadisticas", authAdmin, async (req, res) => {
try {
const ahora = new Date();
const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

const totalGeneradas = await Oportunidad.count({
where: {
created_at: { [Op.gte]: inicioMes },
},
});

const totalAprovechadas = await Oportunidad.count({
where: {
estado: "reservada",
created_at: { [Op.gte]: inicioMes },
},
});

const totalDisponibles = await Oportunidad.count({
where: {
estado: "disponible",
validoHasta: { [Op.gt]: ahora },
},
});

const totalExpiradas = await Oportunidad.count({
where: {
estado: "expirada",
created_at: { [Op.gte]: inicioMes },
},
});

const porcentajeAprovechamiento =
totalGeneradas > 0
? ((totalAprovechadas / totalGeneradas) * 100).toFixed(2)
: 0;

// Calcular ingresos recuperados
const oportunidadesAprovechadas = await Oportunidad.findAll({
where: {
estado: "reservada",
created_at: { [Op.gte]: inicioMes },
},
});

const ingresosRecuperados = oportunidadesAprovechadas.reduce(
(sum, op) => sum + parseFloat(op.precioFinal),
0
);

res.json({
success: true,
estadisticas: {
totalGeneradas,
totalAprovechadas,
totalDisponibles,
totalExpiradas,
porcentajeAprovechamiento: parseFloat(porcentajeAprovechamiento),
ingresosRecuperados: parseFloat(ingresosRecuperados.toFixed(2)),
},
});
} catch (error) {
console.error("Error obteniendo estadísticas:", error);
res.status(500).json({
success: false,
error: "Error al obtener estadísticas",
});
}
});
};

export default setupOportunidadesRoutes;
