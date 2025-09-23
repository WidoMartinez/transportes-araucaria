import dayjs from "dayjs";
import Booking from "../models/Booking.js";
import logger from "../utils/logger.js";

const VEHICLE_CAPACITY_MAP = {
        sedan: 4,
        suv: 6,
        van: 10,
        minibus: 19,
        bus: 40,
};

const normalizeVehicleType = (type) =>
        typeof type === "string" ? type.trim().toLowerCase() : undefined;

const resolveVehicleCapacity = (trip = {}, passengerCount = 0) => {
        const normalizedType = normalizeVehicleType(trip.vehicleType);
        if (trip.vehicleCapacity) {
                return Number(trip.vehicleCapacity);
        }

        if (normalizedType && VEHICLE_CAPACITY_MAP[normalizedType]) {
                return VEHICLE_CAPACITY_MAP[normalizedType];
        }

        const fallback = Number(process.env.DEFAULT_VEHICLE_CAPACITY || 4);
        return Math.max(fallback, passengerCount);
};

const getPassengerCount = (payload = {}) => {
        if (typeof payload.requestedPassengers === "number") {
                return payload.requestedPassengers;
        }

        if (Array.isArray(payload.passengers) && payload.passengers.length > 0) {
                return payload.passengers.length;
        }

        if (payload.trip?.passengerCount) {
                return Number(payload.trip.passengerCount);
        }

        return 1;
};

const getOperatingHours = () => {
        const start = Number(process.env.OPERATING_HOUR_START || 5);
        const end = Number(process.env.OPERATING_HOUR_END || 23);
        return { start, end };
};

const isWithinOperatingWindow = (departure) => {
        const { start, end } = getOperatingHours();
        const hour = departure.hour() + departure.minute() / 60;
        return hour >= start && hour <= end;
};

export const checkAvailability = async (payload, options = {}) => {
        const trip = payload?.trip;
        if (!trip?.departure || !trip?.vehicleType) {
                throw new Error(
                        "Los datos del viaje deben incluir fecha de salida y tipo de vehículo"
                );
        }

        const departure = dayjs(trip.departure);
        if (!departure.isValid()) {
                throw new Error("La fecha de salida proporcionada no es válida");
        }

        const passengerCount = getPassengerCount(payload);
        const capacity = resolveVehicleCapacity(trip, passengerCount);
        if (passengerCount > capacity) {
                return {
                        available: false,
                        reason: "La cantidad de pasajeros supera la capacidad del vehículo",
                        details: {
                                passengerCount,
                                capacity,
                        },
                };
        }

        if (!isWithinOperatingWindow(departure)) {
                const { start, end } = getOperatingHours();
                return {
                        available: false,
                        reason: `El horario solicitado está fuera de la ventana operativa (${start}:00 - ${end}:00)`,
                        details: {
                                requestedDeparture: departure.toISOString(),
                        },
                };
        }

        const bufferMinutes = Number(process.env.BOOKING_TIME_BUFFER_MINUTES || 90);
        const startWindow = departure.subtract(bufferMinutes, "minute");
        const endWindow = departure.add(bufferMinutes, "minute");

        const query = {
                "trip.vehicleType": trip.vehicleType,
                "trip.departure": {
                        $gte: startWindow.toDate(),
                        $lte: endWindow.toDate(),
                },
                lifecycleStatus: { $ne: "cancelled" },
        };

        const ignoreBookingId = options.ignoreBookingId || payload.ignoreBookingId;
        if (ignoreBookingId) {
                query._id = { $ne: ignoreBookingId };
        }

        const overlapping = await Booking.find(query).lean();
        const seatsInUse = overlapping.reduce((acc, current) => {
                if (Array.isArray(current.passengers) && current.passengers.length > 0) {
                        return acc + current.passengers.length;
                }
                if (current.trip?.passengerCount) {
                        return acc + Number(current.trip.passengerCount);
                }
                return acc + 1;
        }, 0);

        if (seatsInUse + passengerCount > capacity) {
                return {
                        available: false,
                        reason: "El vehículo seleccionado no tiene disponibilidad para la franja horaria",
                        details: {
                                seatsInUse,
                                passengerCount,
                                capacity,
                                conflictingBookings: overlapping.map((booking) => ({
                                        id: booking._id,
                                        reference: booking.reference,
                                        departure: booking.trip?.departure,
                                })),
                        },
                };
        }

        logger.debug(
                {
                        capacity,
                        seatsInUse,
                        passengerCount,
                        vehicleType: trip.vehicleType,
                        departure: departure.toISOString(),
                },
                "Disponibilidad validada para el viaje"
        );

        return {
                available: true,
                details: {
                        capacity,
                        seatsInUse,
                        passengerCount,
                        operatingWindow: {
                                start: startWindow.toISOString(),
                                end: endWindow.toISOString(),
                                bufferMinutes,
                        },
                },
        };
};

export default checkAvailability;
