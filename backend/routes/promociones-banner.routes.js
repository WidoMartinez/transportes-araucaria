/* eslint-env node */
/* global process */
import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import PromocionBanner from "../models/PromocionBanner.js";
import Reserva from "../models/Reserva.js";
import Cliente from "../models/Cliente.js";
import { authJWT } from "../middleware/authJWT.js";
import { apiLimiter } from "../middleware/rateLimiter.js";
import { Op } from "sequelize";

const router = express.Router();

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar carpeta de uploads
const uploadDir = path.join(__dirname, "../../public/banners");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para upload de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "banner-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB máximo
  fileFilter: fileFilter,
});

// Middleware para manejar errores de Multer y devolver JSON
const handleMulterError = (err, req, res, next) => {
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: "La imagen es demasiado grande. El límite máximo es 20MB.",
    });
  }
  if (err && err.name === "MulterError") {
    return res.status(400).json({ error: `Error al subir imagen: ${err.message}` });
  }
  next(err);
};

// GET /api/promociones-banner/activas - Obtener promociones activas (público)
router.get("/activas", async (req, res) => {
  try {
    const optionsHoy = { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' };
    const hoyChile = new Intl.DateTimeFormat('fr-CA', optionsHoy).format(new Date()); 

    const promociones = await PromocionBanner.findAll({
      where: {
        [Op.and]: [
          { activo: true },
          {
            [Op.or]: [
              // Sin fechas de vigencia: se muestran siempre (si activo=true)
              {
                fecha_inicio: null,
                fecha_fin: null,
              },
              // Dentro del rango de vigencia
              {
                [Op.and]: [
                  {
                    [Op.or]: [
                      { fecha_inicio: null },
                      { fecha_inicio: { [Op.lte]: hoyChile } },
                    ],
                  },
                  {
                    [Op.or]: [{ fecha_fin: null }, { fecha_fin: { [Op.gte]: hoyChile } }],
                  },
                ],
              },
            ],
          },
        ],
      },
      order: [["orden", "ASC"], ["created_at", "DESC"]],
    });

    res.json(promociones);
  } catch (error) {
    console.error("Error al obtener promociones activas:", error);
    res.status(500).json({ error: "Error al obtener promociones" });
  }
});

// GET /api/promociones-banner - Obtener todas las promociones (admin)
router.get("/", apiLimiter, authJWT, async (req, res) => {
  try {
    const promociones = await PromocionBanner.findAll({
      order: [["orden", "ASC"], ["created_at", "DESC"]],
    });

    res.json(promociones);
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    res.status(500).json({ error: "Error al obtener promociones" });
  }
});

// GET /api/promociones-banner/:id - Obtener una promoción por ID (admin)
router.get("/:id", apiLimiter, authJWT, async (req, res) => {
  try {
    const promocion = await PromocionBanner.findByPk(req.params.id);

    if (!promocion) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }

    res.json(promocion);
  } catch (error) {
    console.error("Error al obtener promoción:", error);
    res.status(500).json({ error: "Error al obtener promoción" });
  }
});

// POST /api/promociones-banner - Crear promoción con imagen (admin)
router.post("/", apiLimiter, authJWT, upload.single("imagen"), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "La imagen es requerida" });
    }

    const {
      nombre,
      precio,
      tipo_viaje,
      destino,
      origen,
      max_pasajeros,
      min_pasajeros,
      activo,
      orden,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      posicion_imagen,
      permite_sillas,
      max_sillas,
      valor_silla,
      anticipacion_minima,
    } = req.body;

    // Validaciones básicas
    if (!nombre || !precio || !tipo_viaje || !destino) {
      // Eliminar archivo subido si la validación falla
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "Faltan campos requeridos: nombre, precio, tipo_viaje, destino",
      });
    }

    // Construir URL relativa de la imagen
    const imagen_url = `/banners/${req.file.filename}`;

    const promocion = await PromocionBanner.create({
      nombre,
      imagen_url,
      precio: parseFloat(precio),
      tipo_viaje,
      destino,
      origen: origen || "Temuco",
      max_pasajeros: max_pasajeros ? parseInt(max_pasajeros) : 3,
      min_pasajeros: min_pasajeros ? parseInt(min_pasajeros) : 1,
      activo: activo === "true" || activo === true,
      orden: orden ? parseInt(orden) : 0,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      hora_inicio: hora_inicio || null,
      hora_fin: hora_fin || null,
      posicion_imagen: posicion_imagen || "center",
      permite_sillas: permite_sillas === "true" || permite_sillas === true,
      max_sillas: max_sillas ? parseInt(max_sillas) : 0,
      valor_silla: valor_silla ? parseInt(valor_silla) : 0,
      anticipacion_minima: anticipacion_minima ? parseInt(anticipacion_minima) : 3,
    });

    res.status(201).json(promocion);
  } catch (error) {
    console.error("Error al crear promoción:", error);
    // Intentar eliminar archivo subido si hubo error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error al eliminar archivo:", e);
      }
    }
    res.status(500).json({ error: "Error al crear promoción" });
  }
});

// PUT /api/promociones-banner/:id - Actualizar promoción (admin)
router.put("/:id", apiLimiter, authJWT, upload.single("imagen"), handleMulterError, async (req, res) => {
  try {
    const promocion = await PromocionBanner.findByPk(req.params.id);

    if (!promocion) {
      // Eliminar archivo subido si existe
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: "Promoción no encontrada" });
    }

    const {
      nombre,
      precio,
      tipo_viaje,
      destino,
      origen,
      max_pasajeros,
      min_pasajeros,
      activo,
      orden,
      fecha_inicio,
      fecha_fin,
      hora_inicio,
      hora_fin,
      posicion_imagen,
      permite_sillas,
      max_sillas,
      valor_silla,
      anticipacion_minima,
    } = req.body;

    // Preparar datos de actualización
    const updateData = {};

    if (nombre !== undefined) updateData.nombre = nombre;
    if (precio !== undefined) updateData.precio = parseFloat(precio);
    if (tipo_viaje !== undefined) updateData.tipo_viaje = tipo_viaje;
    if (destino !== undefined) updateData.destino = destino;
    if (origen !== undefined) updateData.origen = origen;
    if (max_pasajeros !== undefined)
      updateData.max_pasajeros = parseInt(max_pasajeros);
    if (min_pasajeros !== undefined)
      updateData.min_pasajeros = parseInt(min_pasajeros);
    if (activo !== undefined)
      updateData.activo = activo === "true" || activo === true;
    if (orden !== undefined) updateData.orden = parseInt(orden);
    if (fecha_inicio !== undefined)
      updateData.fecha_inicio = fecha_inicio || null;
    if (fecha_fin !== undefined) updateData.fecha_fin = fecha_fin || null;
    if (hora_inicio !== undefined)
      updateData.hora_inicio = hora_inicio || null;
    if (hora_fin !== undefined)
      updateData.hora_fin = hora_fin || null;
    if (posicion_imagen !== undefined)
      updateData.posicion_imagen = posicion_imagen || "center";
    if (permite_sillas !== undefined)
      updateData.permite_sillas = permite_sillas === "true" || permite_sillas === true;
    if (max_sillas !== undefined)
      updateData.max_sillas = max_sillas ? parseInt(max_sillas) : 0;
    if (valor_silla !== undefined)
      updateData.valor_silla = valor_silla ? parseInt(valor_silla) : 0;
    if (anticipacion_minima !== undefined)
      updateData.anticipacion_minima = anticipacion_minima ? parseInt(anticipacion_minima) : 3;

    // Si hay nueva imagen, actualizar URL y eliminar imagen anterior
    if (req.file) {
      // Eliminar imagen anterior si existe
      if (promocion.imagen_url) {
        const oldImagePath = path.join(
          __dirname,
          "../../public",
          promocion.imagen_url
        );
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
          } catch (e) {
            console.error("Error al eliminar imagen anterior:", e);
          }
        }
      }
      updateData.imagen_url = `/banners/${req.file.filename}`;
    }

    await promocion.update(updateData);

    res.json(promocion);
  } catch (error) {
    console.error("Error al actualizar promoción:", error);
    // Intentar eliminar archivo subido si hubo error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Error al eliminar archivo:", e);
      }
    }
    res.status(500).json({ error: "Error al actualizar promoción" });
  }
});

// DELETE /api/promociones-banner/:id - Eliminar promoción (admin)
router.delete("/:id", apiLimiter, authJWT, async (req, res) => {
  try {
    const promocion = await PromocionBanner.findByPk(req.params.id);

    if (!promocion) {
      return res.status(404).json({ error: "Promoción no encontrada" });
    }

    // Eliminar imagen del disco
    if (promocion.imagen_url) {
      const imagePath = path.join(
        __dirname,
        "../../public",
        promocion.imagen_url
      );
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (e) {
          console.error("Error al eliminar imagen:", e);
        }
      }
    }

    await promocion.destroy();

    res.json({ message: "Promoción eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar promoción:", error);
    res.status(500).json({ error: "Error al eliminar promoción" });
  }
});

// POST /api/reservas/desde-promocion - Crear reserva desde promoción banner
router.post("/desde-promocion/:id", apiLimiter, async (req, res) => {
  try {
    const promocionId = req.params.id;
    const { nombre, email, telefono, fecha_ida, hora_ida, fecha_vuelta, hora_vuelta, sillaInfantil, cantidadSillasInfantiles } = req.body;

    // Validar campos requeridos
    if (!nombre || !email || !telefono || !fecha_ida || !hora_ida) {
      return res.status(400).json({
        error: "Faltan campos requeridos: nombre, email, telefono, fecha_ida, hora_ida",
      });
    }

    // Obtener promoción
    const promocion = await PromocionBanner.findByPk(promocionId);

    if (!promocion || !promocion.activo) {
      return res.status(404).json({ error: "Promoción no encontrada o inactiva" });
    }

    // Validar vigencia
    const optionsHoy = { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' };
    const hoyChile = new Intl.DateTimeFormat('fr-CA', optionsHoy).format(new Date()); 

    if (promocion.fecha_inicio && promocion.fecha_inicio > hoyChile) {
      return res.status(400).json({ error: "Promoción aún no vigente" });
    }
    if (promocion.fecha_fin && promocion.fecha_fin < hoyChile) {
      return res.status(400).json({ error: "Promoción expirada" });
    }

    // Validar fecha/hora vuelta si es ida_vuelta
    if (promocion.tipo_viaje === "ida_vuelta" && (!fecha_vuelta || !hora_vuelta)) {
      return res.status(400).json({
        error: "Para viajes de ida y vuelta, fecha_vuelta y hora_vuelta son requeridos",
      });
    }

    // Para 'solo_ida', el cliente puede elegir el sentido; invertir origen/destino si se indica
    const origenFinal = req.body.origen_elegido || promocion.origen;
    const destinoFinal = req.body.destino_elegido || promocion.destino;

    // Validar anticipación mínima
    const anticipacionMinima = promocion.anticipacion_minima || 3;
    
    // Obtener "ahora" en Chile para comparaciones matemáticas
    const ahoraChile = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
    
    // Convertir fecha_ida + hora_ida a Date object (sin Z, Node lo interpreta como local/server-time)
    const fechaHoraReserva = new Date(`${fecha_ida}T${hora_ida}:00`);
    
    // Calcular diferencia en horas
    const diffHoras = (fechaHoraReserva - ahoraChile) / (1000 * 60 * 60);

    // Solo validar anticipación si la reserva es para hoy (en Chile)
    if (diffHoras < anticipacionMinima && fecha_ida === hoyChile) {
        return res.status(400).json({
            error: `La reserva debe realizarse con al menos ${anticipacionMinima} horas de anticipación.`,
        });
    }

    // Calcular precio total incluyendo sillas
    let precioTotal = parseFloat(promocion.precio);
    let cantidadSillas = 0;
    
    if (promocion.permite_sillas && sillaInfantil) {
        cantidadSillas = cantidadSillasInfantiles ? parseInt(cantidadSillasInfantiles) : 1;
        // Validar máximo sillas
        if (cantidadSillas > (promocion.max_sillas || 0)) {
            cantidadSillas = promocion.max_sillas || 0;
        }
        
        const valorSilla = promocion.valor_silla || 0;
        precioTotal += (valorSilla * cantidadSillas);
    } else {
        // Asegurar que si no permite o no selecciona, sean 0
        cantidadSillas = 0; 
    }

    // Crear o buscar cliente
    let cliente = await Cliente.findOne({ where: { email } });

    if (!cliente) {
      cliente = await Cliente.create({
        nombre,
        email,
        telefono,
      });
    } else {
      // Actualizar datos del cliente
      await cliente.update({
        nombre,
        telefono,
      });
    }

    // Generar código de reserva único
    const codigoReserva = `PR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Crear reserva
    const reserva = await Reserva.create({
      codigoReserva: codigoReserva,
      clienteId: cliente.id,
      nombre,
      email,
      telefono,
      origen: origenFinal,
      destino: destinoFinal,
      fecha: fecha_ida,
      hora: hora_ida,
      fechaRegreso: fecha_vuelta || null,
      horaRegreso: hora_vuelta || null,
      idaVuelta: promocion.tipo_viaje === "ida_vuelta",
      pasajeros: req.body.cantidad_pasajeros ? parseInt(req.body.cantidad_pasajeros) : 1,
      precio: precioTotal, // Usar precio calculado con sillas
      totalConDescuento: precioTotal, // Usar precio calculado con sillas
      estado: "pendiente",
      source: "banner_promocional", // Identificar origen para conversiones de Google Ads
      sillaInfantil: cantidadSillas > 0,
      cantidadSillasInfantiles: cantidadSillas,
      comentarios: cantidadSillas > 0 ? `Incluye ${cantidadSillas} silla(s) infantil(es)` : null
    });

    res.status(201).json({
      message: "Reserva creada exitosamente",
      reserva: {
        id: reserva.id,
        codigo_reserva: reserva.codigoReserva,
        precio_total: parseFloat(reserva.precio),
      },
    });
  } catch (error) {
    console.error("Error al crear reserva desde promoción:", error);
    res.status(500).json({ 
      error: "Error al crear reserva", 
      details: error.message,
      sql: error.sql || null 
    });
  }
});

export default router;
