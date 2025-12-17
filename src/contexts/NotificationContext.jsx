import React, { createContext, useContext } from "react";
import { toast, Toaster } from "sonner";

/**
 * Contexto para sistema de notificaciones integradas
 * Proporciona feedback inmediato al usuario para todas las acciones
 */

const NotificationContext = createContext(null);

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error("useNotifications debe usarse dentro de NotificationProvider");
	}
	return context;
}

export function NotificationProvider({ children }) {
	// Notificaciones de éxito
	const success = (message, options = {}) => {
		toast.success(message, {
			duration: 3000,
			...options,
		});
	};

	// Notificaciones de error
	const error = (message, options = {}) => {
		toast.error(message, {
			duration: 4000,
			...options,
		});
	};

	// Notificaciones de información
	const info = (message, options = {}) => {
		toast.info(message, {
			duration: 3000,
			...options,
		});
	};

	// Notificaciones de advertencia
	const warning = (message, options = {}) => {
		toast.warning(message, {
			duration: 3500,
			...options,
		});
	};

	// Notificación de promesa (loading -> success/error)
	const promise = (promiseFn, messages = {}) => {
		return toast.promise(promiseFn, {
			loading: messages.loading || "Procesando...",
			success: messages.success || "¡Operación completada!",
			error: messages.error || "Error en la operación",
		});
	};

	// Notificación personalizada
	const custom = (component, options = {}) => {
		toast.custom(component, options);
	};

	const value = {
		success,
		error,
		info,
		warning,
		promise,
		custom,
	};

	return (
		<NotificationContext.Provider value={value}>
			<Toaster 
				position="top-right"
				expand={false}
				richColors
				closeButton
				toastOptions={{
					className: "font-sans",
				}}
			/>
			{children}
		</NotificationContext.Provider>
	);
}

// Helper hooks para operaciones comunes

export function useReservaNotifications() {
	const notifications = useNotifications();

	return {
		created: (codigoReserva) =>
			notifications.success(`Reserva ${codigoReserva} creada exitosamente`),
		
		updated: (codigoReserva) =>
			notifications.success(`Reserva ${codigoReserva} actualizada`),
		
		deleted: (codigoReserva) =>
			notifications.success(`Reserva ${codigoReserva} eliminada`),
		
		assigned: (codigoReserva) =>
			notifications.success(`Vehículo asignado a reserva ${codigoReserva}`),
		
		paid: (codigoReserva) =>
			notifications.success(`Pago registrado para reserva ${codigoReserva}`),
		
		stateChanged: (codigoReserva, newState) =>
			notifications.success(`Reserva ${codigoReserva} marcada como ${newState}`),
		
		error: (message) =>
			notifications.error(message || "Error al procesar la reserva"),
	};
}

export function useGastoNotifications() {
	const notifications = useNotifications();

	return {
		created: (tipo) =>
			notifications.success(`Gasto de ${tipo} registrado exitosamente`),
		
		updated: () =>
			notifications.success("Gasto actualizado"),
		
		deleted: () =>
			notifications.success("Gasto eliminado"),
		
		error: (message) =>
			notifications.error(message || "Error al procesar el gasto"),
	};
}

export default NotificationContext;
