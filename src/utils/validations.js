/**
 * Utilidades de validación para formularios
 * Centraliza todas las validaciones para mantener consistencia
 */

/**
 * Valida un número de teléfono chileno
 * @param {string} telefono - Número a validar
 * @returns {object} - { valido: boolean, mensaje: string }
 */
export const validarTelefono = (telefono) => {
	if (!telefono || !telefono.trim()) {
		return {
			valido: false,
			mensaje: "El teléfono es requerido",
		};
	}

	// Formato chileno: +56 9 XXXX XXXX o variaciones
	const regex = /^(\+?56)?(\s?9)\s?(\d{4})\s?(\d{4})$/;
	const valido = regex.test(telefono.trim());

	return {
		valido,
		mensaje: valido ? "" : "Formato esperado: +56 9 1234 5678",
	};
};

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {object} - { valido: boolean, mensaje: string }
 */
export const validarEmail = (email) => {
	if (!email || !email.trim()) {
		return {
			valido: false,
			mensaje: "El email es requerido",
		};
	}

	const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	const valido = regex.test(email.trim());

	return {
		valido,
		mensaje: valido
			? ""
			: "Ingresa un email válido (ej: nombre@email.com)",
	};
};

/**
 * Valida un nombre completo
 * @param {string} nombre - Nombre a validar
 * @returns {object} - { valido: boolean, mensaje: string }
 */
export const validarNombre = (nombre) => {
	if (!nombre || !nombre.trim()) {
		return {
			valido: false,
			mensaje: "El nombre es requerido",
		};
	}

	// Solo letras, espacios y caracteres acentuados
	const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
	if (!soloLetras.test(nombre)) {
		return {
			valido: false,
			mensaje: "El nombre solo debe contener letras y espacios",
		};
	}

	// Verificar que tenga al menos nombre y apellido
	const palabras = nombre.trim().split(/\s+/);
	if (palabras.length < 2) {
		return {
			valido: false,
			mensaje: "Por favor ingresa tu nombre y apellido completos",
		};
	}

	return {
		valido: true,
		mensaje: "",
	};
};

/**
 * Valida un RUT chileno
 * @param {string} rut - RUT a validar (puede tener puntos y guión)
 * @returns {object} - { valido: boolean, mensaje: string }
 */
export const validarRUT = (rut) => {
	if (!rut || !rut.trim()) {
		return {
			valido: false,
			mensaje: "El RUT es requerido",
		};
	}

	// Eliminar puntos y guión
	const rutLimpio = rut.replace(/[.-]/g, "");

	// Verificar formato básico
	if (!/^\d{7,8}[0-9K]$/i.test(rutLimpio)) {
		return {
			valido: false,
			mensaje: "Formato inválido. Usa: 12.345.678-9",
		};
	}

	// Calcular dígito verificador
	const cuerpo = rutLimpio.slice(0, -1);
	const dv = rutLimpio.slice(-1).toUpperCase();

	let suma = 0;
	let multiplo = 2;

	for (let i = cuerpo.length - 1; i >= 0; i--) {
		suma += parseInt(cuerpo[i]) * multiplo;
		multiplo = multiplo === 7 ? 2 : multiplo + 1;
	}

	const dvEsperado = 11 - (suma % 11);
	const dvCalculado =
		dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : String(dvEsperado);

	const valido = dv === dvCalculado;

	return {
		valido,
		mensaje: valido ? "" : "RUT inválido. Verifica los dígitos.",
	};
};

/**
 * Formatea un número de teléfono chileno
 * @param {string} value - Número sin formato
 * @returns {string} - Número formateado +56 9 1234 5678
 */
export const formatearTelefono = (value) => {
	if (!value) return "";

	// Eliminar todo excepto números
	const numbers = value.replace(/\D/g, "");

	// Formato: +56 9 1234 5678
	if (numbers.startsWith("569")) {
		const rest = numbers.slice(3);
		return `+56 9 ${rest.slice(0, 4)} ${rest.slice(4, 8)}`.trim();
	} else if (numbers.startsWith("56")) {
		const rest = numbers.slice(2);
		return `+56 ${rest.slice(0, 1)} ${rest.slice(1, 5)} ${rest.slice(5, 9)}`.trim();
	} else if (numbers.startsWith("9") && numbers.length >= 9) {
		const rest = numbers.slice(1);
		return `+56 9 ${rest.slice(0, 4)} ${rest.slice(4, 8)}`.trim();
	}

	return value;
};

/**
 * Formatea un RUT chileno
 * @param {string} rut - RUT sin formato
 * @returns {string} - RUT formateado 12.345.678-9
 */
export const formatearRUT = (rut) => {
	if (!rut) return "";

	// Eliminar caracteres no válidos
	const limpio = rut.replace(/[^0-9K]/gi, "").toUpperCase();

	if (limpio.length <= 1) return limpio;

	const dv = limpio.slice(-1);
	const cuerpo = limpio.slice(0, -1);

	// Formatear con puntos: 12.345.678-9
	const formateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

	return `${formateado}-${dv}`;
};

/**
 * Valida una fecha de viaje
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {number} minHorasAnticipacion - Horas mínimas de anticipación requeridas
 * @returns {object} - { valido: boolean, mensaje: string }
 */
export const validarFecha = (fecha, minHorasAnticipacion = 0) => {
	if (!fecha) {
		return {
			valido: false,
			mensaje: "La fecha es requerida",
		};
	}

	const fechaSeleccionada = new Date(fecha);
	const ahora = new Date();

	// Verificar que sea una fecha válida
	if (isNaN(fechaSeleccionada.getTime())) {
		return {
			valido: false,
			mensaje: "Fecha inválida",
		};
	}

	// Verificar que no sea pasada
	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);

	if (fechaSeleccionada < hoy) {
		return {
			valido: false,
			mensaje: "La fecha no puede ser anterior a hoy",
		};
	}

	// Verificar anticipación mínima si se especifica
	if (minHorasAnticipacion > 0) {
		const horasDiferencia =
			(fechaSeleccionada - ahora) / (1000 * 60 * 60);
		if (horasDiferencia < minHorasAnticipacion) {
			return {
				valido: false,
				mensaje: `Se requiere al menos ${minHorasAnticipacion} horas de anticipación`,
			};
		}
	}

	return {
		valido: true,
		mensaje: "",
	};
};

/**
 * Valida que una fecha de regreso sea posterior a la fecha de ida
 * @param {string} fechaIda - Fecha de ida
 * @param {string} fechaRegreso - Fecha de regreso
 * @param {string} horaIda - Hora de ida (opcional)
 * @param {string} horaRegreso - Hora de regreso (opcional)
 * @returns {object} - { valido: boolean, mensaje: string }
 */
export const validarFechaRegreso = (
	fechaIda,
	fechaRegreso,
	horaIda,
	horaRegreso
) => {
	if (!fechaRegreso) {
		return {
			valido: false,
			mensaje: "La fecha de regreso es requerida",
		};
	}

	const ida = new Date(
		horaIda ? `${fechaIda}T${horaIda}` : `${fechaIda}T00:00`
	);
	const regreso = new Date(
		horaRegreso ? `${fechaRegreso}T${horaRegreso}` : `${fechaRegreso}T23:59`
	);

	if (isNaN(ida.getTime()) || isNaN(regreso.getTime())) {
		return {
			valido: false,
			mensaje: "Fechas inválidas",
		};
	}

	if (regreso <= ida) {
		return {
			valido: false,
			mensaje: "El regreso debe ser posterior a la ida",
		};
	}

	return {
		valido: true,
		mensaje: "",
	};
};

/**
 * Valida un número de pasajeros
 * @param {number} pasajeros - Cantidad de pasajeros
 * @param {number} max - Máximo permitido
 * @returns {object} - { valido: boolean, mensaje: string }
 */
export const validarPasajeros = (pasajeros, max = 10) => {
	const num = parseInt(pasajeros);

	if (isNaN(num) || num < 1) {
		return {
			valido: false,
			mensaje: "Debes especificar al menos 1 pasajero",
		};
	}

	if (num > max) {
		return {
			valido: false,
			mensaje: `Máximo ${max} pasajeros. Contáctanos para grupos más grandes.`,
		};
	}

	return {
		valido: true,
		mensaje: "",
	};
};

/**
 * Objeto con todos los validadores para fácil acceso
 */
export const validadores = {
	telefono: validarTelefono,
	email: validarEmail,
	nombre: validarNombre,
	rut: validarRUT,
	fecha: validarFecha,
	fechaRegreso: validarFechaRegreso,
	pasajeros: validarPasajeros,
};

/**
 * Objeto con todos los formateadores
 */
export const formateadores = {
	telefono: formatearTelefono,
	rut: formatearRUT,
};
