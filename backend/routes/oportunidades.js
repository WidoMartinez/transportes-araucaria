/* eslint-env node */
// backend/routes/oportunidades.js
// Endpoints para el sistema de oportunidades de traslado

import { Op } from "sequelize";
import { z } from "zod";
import Oportunidad from "../models/Oportunidad.js";
import SuscripcionOportunidad from "../models/SuscripcionOportunidad.js";
import Reserva from "../models/Reserva.js";
import Destino from "../models/Destino.js";
import Configuracion from "../models/Configuracion.js";
import ConfiguracionTarifaDinamica from "../models/ConfiguracionTarifaDinamica.js";
import Festivo from "../models/Festivo.js";
import sequelize from "../config/database.js";



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

/**
 * Calcula el precio base para oportunidades
 * NO incluye descuentos de ida/vuelta ni online, ni tarifas dinámicas
 * @param {string} nombreDestino - Nombre del destino
 * @param {string} vehiculo - Tipo de vehículo (Sedán/Van)
 * @param {number} pasajeros - Cantidad de pasajeros
 * @param {number} precioFallback - Precio de la reserva original para usar si el destino no existe
 * @returns {Promise<number>} Precio base (incluye recargos por pax)
 */
const calcularPrecioBaseOportunidad = async (nombreDestino, vehiculo = "Sedán", pasajeros = 1, precioFallback = 0) => {
try {
// 1. Obtener precio base del destino
let destinoInfo = await Destino.findOne({
where: { nombre: nombreDestino }
});

let precioBase = 0;
let porcentajeAdicional = 0;
let pasajerosAdicionales = 0;

if (destinoInfo) {
  // Lógica de elección de precio base según vehículo
  if (vehiculo === "Van" && destinoInfo.precioBaseVan) {
    precioBase = parseFloat(destinoInfo.precioBaseVan);
    porcentajeAdicional = parseFloat(destinoInfo.porcentajeAdicionalVan || 0);
    pasajerosAdicionales = Math.max(0, pasajeros - 5); // Recargo desde el 6to (más de 5)
  } else {
    precioBase = parseFloat(destinoInfo.precioIda);
    porcentajeAdicional = parseFloat(destinoInfo.porcentajeAdicionalAuto || 0);
    pasajerosAdicionales = Math.max(0, pasajeros - 3); // Recargo desde el 4to (más de 3)
  }
  
  // Aplicar recargo por pasajeros adicionales
  if (pasajerosAdicionales > 0 && porcentajeAdicional > 0) {
    const recargo = precioBase * porcentajeAdicional * pasajerosAdicionales;
    precioBase += recargo;
  }
} else {
  console.warn(`⚠️ Destino no encontrado: ${nombreDestino}. Usando precio de reserva original ($${precioFallback}) como base.`);
  precioBase = parseFloat(precioFallback);
}

if (precioBase <= 0) {
  return 0;
}

const precioFinal = Math.round(precioBase);

console.log(`💰 Precio oportunidad ${nombreDestino}: Base $${precioFinal} (${vehiculo}, ${pasajeros} pax) - Sin tarifa dinámica`);

return precioFinal;
} catch (error) {
console.error("Error calculando precio base oportunidad:", error);
return 0;
}
};


// Función para detectar y generar oportunidades desde reservas confirmadas
export const detectarYGenerarOportunidades = async (reserva) => {
try {
const oportunidadesGeneradas = [];
const AEROPUERTO = "Aeropuerto La Araucanía";
const BASE_CIUDAD = "Temuco";

// REGLA DE NEGOCIO: Al menos uno debe ser el aeropuerto
if (reserva.origen !== AEROPUERTO && reserva.destino !== AEROPUERTO) {
  console.log(`🚫 Oportunidad omitida: Trayecto no incluye Aeropuerto (${reserva.origen} -> ${reserva.destino})`);
  return [];
}

// REGLA DE NEGOCIO: Excluir Temuco Ciudad <-> Aeropuerto
if (reserva.origen === BASE_CIUDAD || reserva.destino === BASE_CIUDAD) {
  console.log(`🚫 Oportunidad omitida: Trayecto Temuco <-> Aeropuerto (${reserva.origen} -> ${reserva.destino})`);
  return [];
}

// Obtener información del destino para usar duraciones configuradas
const lugarRemoto = reserva.origen === AEROPUERTO ? reserva.destino : reserva.origen;

const destinoInfo = await Destino.findOne({
where: { nombre: lugarRemoto }
});

// Obtener configuración de anticipación
const configOfertas = await Configuracion.getValorParseado("config_ofertas", {
  anticipacionRetorno: 2,
  anticipacionIda: 3
});

// PRIORIDAD: 
// 1. duracionMinutos explícita en la reserva (usuario 'Otro' o administrador)
// 2. duracionIdaMinutos configurada en el destino
// 3. 60 minutos (fallback)
const duracionViajeMinutos = reserva.duracionMinutos || destinoInfo?.duracionIdaMinutos || 60;

// Logs de depuración
console.log(`🔍 DEBUG Oportunidades - Reserva ${reserva.id}:`);
console.log(`  - Origen: ${reserva.origen}`);
console.log(`  - Destino: ${reserva.destino}`);
console.log(`  - Lugar Remoto: ${lugarRemoto}`);
console.log(`  - Duración usada: ${duracionViajeMinutos} min`);

// 1. RETORNO VACÍO: crear oportunidad de destino → origen
// REGLA DE NEGOCIO: Si el destino es el AEROPUERTO, el vehículo ya está en la base, no hay retorno.
if (
  (reserva.estado === "confirmada" || reserva.estado === "completada") &&
  reserva.destino !== AEROPUERTO
) {
  const existeRetorno = await Oportunidad.findOne({
    where: {
      reservaRelacionadaId: reserva.id,
      tipo: "retorno_vacio",
      estado: ["disponible", "reservada"],
    },
  });

if (!existeRetorno) {
// Calcular hora aproximada: hora de llegada al destino + 30 minutos
let horaAproximada = null;
if (reserva.hora) {
const [horas, minutos] = reserva.hora.split(":");
const horaSalida = new Date();
horaSalida.setHours(parseInt(horas), parseInt(minutos), 0, 0);
// Sumar duración del viaje + 30 min de buffer
const horaLlegada = new Date(horaSalida.getTime() + duracionViajeMinutos * 60000);
const horaDisponible = new Date(horaLlegada.getTime() + 30 * 60000);
horaAproximada = `${String(horaDisponible.getHours()).padStart(2, "0")}:${String(horaDisponible.getMinutes()).padStart(2, "0")}`;
}

// Calcular validez: hasta X horas antes del viaje (desde configuración)
let validoHasta = null;
const horasAnticipacionRetorno = configOfertas.anticipacionRetorno || 2;
if (horaAproximada) {
  const [h, m] = horaAproximada.split(":");
  validoHasta = new Date(`${reserva.fecha}T${h}:${m}:00-03:00`);
  validoHasta.setHours(validoHasta.getHours() - horasAnticipacionRetorno);
} else {
  validoHasta = new Date(`${reserva.fecha}T00:00:00-03:00`);
  validoHasta.setHours(validoHasta.getHours() - horasAnticipacionRetorno);
}

// Solo crear si es futuro
if (validoHasta > new Date()) {
const descuento = 50; // 50% descuento por retorno vacío
const vehiculoOportunidad = reserva.vehiculo || (reserva.pasajeros <= 3 ? "Sedán" : "Van");

// Calcular precio base (sin tarifa dinámica, solo base + recargos pax)
const precioSugerido = await calcularPrecioBaseOportunidad(
lugarRemoto,
vehiculoOportunidad,
reserva.pasajeros,
parseFloat(reserva.precio)
);

const oportunidadRetorno = await Oportunidad.create({
codigo: await generarCodigoOportunidad(),
tipo: "retorno_vacio",
origen: reserva.destino,
destino: reserva.origen,
fecha: reserva.fecha,
horaAproximada,
descuento,
precioOriginal: precioSugerido,
precioFinal: calcularPrecioConDescuento(precioSugerido, descuento),
vehiculo: vehiculoOportunidad,
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
// Nota: La base operativa para "Ida Vacia" es siempre el AEROPUERTO en este modelo
if (
(reserva.estado === "confirmada" || reserva.estado === "completada") &&
reserva.origen !== AEROPUERTO
) {
const existeIda = await Oportunidad.findOne({
where: {
reservaRelacionadaId: reserva.id,
tipo: "ida_vacia",
estado: ["disponible", "reservada"],
},
});

if (!existeIda) {
// Calcular hora aproximada: hora de recogida - duración del viaje - 30 min buffer
let horaAproximada = null;
if (reserva.hora) {
const [horas, minutos] = reserva.hora.split(":");
const horaRecogida = new Date();
horaRecogida.setHours(parseInt(horas), parseInt(minutos), 0, 0);
// Restar duración del viaje + 30 min de buffer
const horaSalidaNecesaria = new Date(horaRecogida.getTime() - duracionViajeMinutos * 60000 - 30 * 60000);
horaAproximada = `${String(horaSalidaNecesaria.getHours()).padStart(2, "0")}:${String(horaSalidaNecesaria.getMinutes()).padStart(2, "0")}`;
}

// Calcular validez: hasta X horas antes del viaje (desde configuración)
let validoHasta = null;
const horasAnticipacionIda = configOfertas.anticipacionIda || 3;
if (reserva.hora) {
  const [h, m] = reserva.hora.split(":");
  validoHasta = new Date(`${reserva.fecha}T${h}:${m}:00-03:00`);
  validoHasta.setHours(validoHasta.getHours() - horasAnticipacionIda);
} else {
  validoHasta = new Date(`${reserva.fecha}T00:00:00-03:00`);
  validoHasta.setHours(validoHasta.getHours() - horasAnticipacionIda);
}

// Solo crear si es futuro
if (validoHasta > new Date()) {
const descuento = 50; 
const vehiculoOportunidad = reserva.vehiculo || (reserva.pasajeros <= 3 ? "Sedán" : "Van");

// Calcular precio base (sin tarifa dinámica, solo base + recargos pax)
const precioSugerido = await calcularPrecioBaseOportunidad(
lugarRemoto,
vehiculoOportunidad,
reserva.pasajeros,
parseFloat(reserva.precio)
);

const oportunidadIda = await Oportunidad.create({
codigo: await generarCodigoOportunidad(),
tipo: "ida_vacia",
origen: AEROPUERTO,
destino: reserva.origen,
fecha: reserva.fecha,
horaAproximada,
descuento,
precioOriginal: precioSugerido,
precioFinal: calcularPrecioConDescuento(precioSugerido, descuento),
vehiculo: vehiculoOportunidad,
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

// GET /api/oportunidades/regenerar - TEMPORAL: Eliminar y regenerar todas las oportunidades (Admin)
app.get("/api/oportunidades/regenerar", authAdmin, async (req, res) => {
try {
// 1. Eliminar todas las oportunidades existentes
const eliminadas = await Oportunidad.destroy({
where: {},
});

console.log(`🗑️ Eliminadas ${eliminadas} oportunidades antiguas`);

// 2. Buscar todas las reservas confirmadas futuras
const reservas = await Reserva.findAll({
where: {
estado: ["confirmada", "completada"],
fecha: { [Op.gte]: new Date() },
},
order: [["fecha", "ASC"]],
});

let totalGeneradas = 0;
const resultados = [];

// 3. Regenerar oportunidades con cálculos actualizados
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
message: `Eliminadas ${eliminadas} oportunidades antiguas. Generadas ${totalGeneradas} nuevas oportunidades con cálculos actualizados.`,
eliminadas,
totalGeneradas,
detalles: resultados,
});
} catch (error) {
console.error("Error regenerando oportunidades:", error);
res.status(500).json({
success: false,
error: "Error al regenerar oportunidades",
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

// POST /api/oportunidades/reservar - Reserva directa y expedita
app.post("/api/oportunidades/reservar", async (req, res) => {
try {
  const { oportunidadId, nombre, email, telefono, pasajeros, direccion, horaSalida } = req.body;

  if (!oportunidadId || !nombre || !email || !telefono || !pasajeros || !direccion || !horaSalida) {
    return res.status(400).json({
      success: false,
      error: "Faltan datos requeridos para la reserva (incluyendo la hora de salida)",
    });
  }

  // 1. Buscar la oportunidad por código (que es lo que envía el frontend como oportunidadId)
  const oportunidad = await Oportunidad.findOne({ where: { codigo: oportunidadId } });

  if (!oportunidad) {
    return res.status(404).json({
      success: false,
      error: "La oportunidad no existe",
    });
  }

  // 2. Validar que esté disponible y no haya expirado
  if (oportunidad.estado !== "disponible") {
    return res.status(400).json({
      success: false,
      error: "La oportunidad ya no está disponible",
    });
  }

  // Validación de rango horario en el backend
  const timeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const horaBase = oportunidad.horaAproximada || "00:00";
  const timeMinutes = timeToMinutes(horaBase);
  
  let minMin, maxMin;
  if (oportunidad.tipo === "ida_vacia") {
    // Para ida: hasta 1 hora antes (adelanto)
    minMin = Math.max(0, timeMinutes - 60);
    maxMin = timeMinutes;
  } else {
    // Para retorno: hasta 1 hora después (retraso)
    minMin = timeMinutes;
    maxMin = timeMinutes + 60;
  }
  
  const currentMin = timeToMinutes(horaSalida);

  const formatTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  if (currentMin < minMin || currentMin > maxMin) {
    const minStr = formatTime(minMin);
    const maxStr = formatTime(maxMin);
    return res.status(400).json({
      success: false,
      error: `La hora de salida debe estar entre las ${minStr} y las ${maxStr}`,
    });
  }

  if (oportunidad.validoHasta && new Date(oportunidad.validoHasta) < new Date()) {
    return res.status(400).json({
      success: false,
      error: "La oportunidad ha expirado",
    });
  }

  // 3. Crear la reserva en una transacción para asegurar consistencia
  const result = await sequelize.transaction(async (t) => {
    // Generar código de reserva único (AR-YYYYMMDD-XXXX)
    const fechaActual = new Date();
    const prefix = `AR-${fechaActual.getFullYear()}${String(fechaActual.getMonth() + 1).padStart(2, '0')}${String(fechaActual.getDate()).padStart(2, '0')}`;
    const count = await Reserva.count({ where: { codigoReserva: { [Op.like]: `${prefix}%` } }, transaction: t });
    const codigoReserva = `${prefix}-${String(count + 1).padStart(4, '0')}`;

    const nuevaReserva = await Reserva.create({
      codigoReserva,
      nombre,
      email,
      telefono,
      origen: oportunidad.origen,
      destino: oportunidad.destino,
      // Dirección: basarse en el tipo de oportunidad para asignar correctamente.
      // retorno_vacio: el vehículo regresa desde el destino → el cliente se sube en el "origen" (dirección específica es de origen).
      // ida_vacia: el vehículo va hacia el destino del cliente → el cliente se baja en el "destino" (dirección específica es de destino).
      direccionOrigen: oportunidad.tipo === "retorno_vacio" ? direccion : (oportunidad.origen || ""),
      direccionDestino: oportunidad.tipo === "ida_vacia" ? direccion : (oportunidad.destino || ""),
      fecha: oportunidad.fecha,
      hora: horaSalida, // Usar la hora de salida solicitada por el cliente
      pasajeros: parseInt(pasajeros),
      precio: oportunidad.precioFinal,
      totalConDescuento: oportunidad.precioFinal,
      abonoSugerido: Math.round(oportunidad.precioFinal * 0.4),
      saldoPendiente: Math.round(oportunidad.precioFinal * 0.6),
      vehiculo: oportunidad.vehiculo,
      estado: "pendiente",
      estadoPago: "pendiente",
      metodoPago: "flow",
      source: "Oportunidad",
      observaciones: `Reserva expedita de oportunidad ${oportunidad.codigo}. Hora seleccionada: ${horaSalida}. Motivo: ${oportunidad.motivoDescuento}`,
    }, { transaction: t });

    // Actualizar la oportunidad
    await oportunidad.update({
      estado: "reservada",
      reservaAprovechadaId: nuevaReserva.id,
    }, { transaction: t });

    return {
      reservaId: nuevaReserva.id,
      codigoReserva: nuevaReserva.codigoReserva,
      precio: nuevaReserva.totalConDescuento,
      abono: nuevaReserva.abonoSugerido,
    };
  });

  res.json({
    success: true,
    ...result
  });
} catch (error) {
  console.error("Error reservando oportunidad:", error);
  res.status(500).json({
    success: false,
    error: "Error interno al procesar la reserva",
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
