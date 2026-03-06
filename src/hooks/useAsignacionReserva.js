import { useState, useEffect, useCallback } from "react";

export function useAsignacionReserva({
	selectedReserva,
	setSelectedReserva,
	fetchReservas,
	vehiculos,
	conductores,
	fetchVehiculos,
	fetchConductores,
	accessToken,
	apiUrl,
	authenticatedFetch,
	showDetailDialog
}) {
	const [showAsignarDialog, setShowAsignarDialog] = useState(false);
	const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState("");
	const [conductorSeleccionado, setConductorSeleccionado] = useState("");
	const [loadingAsignacion, setLoadingAsignacion] = useState(false);
	
	const [enviarNotificacion, setEnviarNotificacion] = useState(true);
	const [enviarNotificacionConductor, setEnviarNotificacionConductor] = useState(true);
	const [enviarActualizacionConductor, setEnviarActualizacionConductor] = useState(false);
	
	const [assignedPatente, setAssignedPatente] = useState("");
	const [assignedConductorNombre, setAssignedConductorNombre] = useState("");
	const [assignedVehiculoId, setAssignedVehiculoId] = useState(null);
	const [assignedConductorId, setAssignedConductorId] = useState(null);
	
	const [reservaVuelta, setReservaVuelta] = useState(null);
	const [asignarAmbas, setAsignarAmbas] = useState(true);
	const [vueltaVehiculoSeleccionado, setVueltaVehiculoSeleccionado] = useState("");
	const [vueltaConductorSeleccionado, setVueltaConductorSeleccionado] = useState("");
	
	const [historialAsignaciones, setHistorialAsignaciones] = useState([]);
	const [loadingHistorial, setLoadingHistorial] = useState(false);

	const getConductorFromObs = (obs) => {
		if (!obs) return "";
		const m = obs.match(/Conductor asignado:\s*([^\n\r(]+)/i);
		return m ? m[1].trim() : "";
	};

	const handleAsignar = useCallback(async (reserva) => {
		setSelectedReserva(reserva);
		
		setAssignedPatente("");
		setAssignedVehiculoId(null);
		setAssignedConductorNombre("");
		setAssignedConductorId(null);

		let reservaVueltaData = null;
		if (reserva.tramoHijoId) {
			try {
				const response = await authenticatedFetch(`/api/reservas/${reserva.tramoHijoId}`);
				if (response.ok) {
					reservaVueltaData = await response.json();
					setReservaVuelta(reservaVueltaData);
					
					const mismoConductor = reserva.conductorId && reserva.conductorId === reservaVueltaData.conductorId;
					const mismoVehiculo = reserva.vehiculoId && reserva.vehiculoId === reservaVueltaData.vehiculoId;
					setAsignarAmbas(mismoConductor && mismoVehiculo);
				}
			} catch (error) {
				console.error("Error cargando reserva de vuelta:", error);
				setReservaVuelta(null);
			}
		} else if (reserva.tramoPadreId) {
			try {
				const responseIda = await authenticatedFetch(`/api/reservas/${reserva.tramoPadreId}`);
				if (responseIda.ok) {
					const reservaIdaData = await responseIda.json();
					setSelectedReserva(reservaIdaData);
					reservaVueltaData = reserva;
					setReservaVuelta(reservaVueltaData);
					
					const mismoConductor = reservaIdaData.conductorId && reservaIdaData.conductorId === reserva.conductorId;
					const mismoVehiculo = reservaIdaData.vehiculoId && reservaIdaData.vehiculoId === reserva.vehiculoId;
					setAsignarAmbas(mismoConductor && mismoVehiculo);

					let preVehIda = "";
					if (vehiculos.length > 0 && reservaIdaData.vehiculoId) {
						const foundIda = vehiculos.find(v => v.id === reservaIdaData.vehiculoId);
						if (foundIda) {
							preVehIda = foundIda.id.toString();
							setAssignedVehiculoId(foundIda.id);
						}
					}
					setVehiculoSeleccionado(preVehIda);

					let preConIda = "none";
					if (conductores.length > 0 && reservaIdaData.conductorId) {
						const foundConIda = conductores.find(c => c.id === reservaIdaData.conductorId);
						if (foundConIda) {
							preConIda = foundConIda.id.toString();
							setAssignedConductorId(foundConIda.id);
						}
					}
					setConductorSeleccionado(preConIda);

					let preVehVuelta = "";
					if (vehiculos.length > 0 && reserva.vehiculoId) {
						const foundVuelta = vehiculos.find(v => v.id === reserva.vehiculoId);
						if (foundVuelta) preVehVuelta = foundVuelta.id.toString();
					}
					setVueltaVehiculoSeleccionado(preVehVuelta);

					let preConVuelta = "none";
					if (conductores.length > 0 && reserva.conductorId) {
						const foundConVuelta = conductores.find(c => c.id === reserva.conductorId);
						if (foundConVuelta) preConVuelta = foundConVuelta.id.toString();
					}
					setVueltaConductorSeleccionado(preConVuelta);

					setEnviarNotificacion(true);
					setEnviarNotificacionConductor(true);
					setShowAsignarDialog(true);
					if (vehiculos.length === 0 && fetchVehiculos) fetchVehiculos();
					if (conductores.length === 0 && fetchConductores) fetchConductores();
					return;
				}
			} catch (error) {
				console.error("Error cargando reserva de ida vinculada:", error);
				setReservaVuelta(null);
			}
		} else {
			setReservaVuelta(null);
		}
		
		const vehiculoStr = (reserva.vehiculo || "").trim();
		let pat = "";
		const matchNew = vehiculoStr.match(/\(patente\s+([^)]+)\)/i);
		if (matchNew) {
			pat = matchNew[1].toUpperCase();
		} else {
			pat = vehiculoStr.split(" ").pop().toUpperCase();
		}
		setAssignedPatente(pat || "");
		
		const nombreCon = getConductorFromObs(reserva.observaciones);
		setAssignedConductorNombre(nombreCon);
		
		let preVeh = "";
		if (vehiculos.length > 0 && pat) {
			const found = vehiculos.find((v) => (v.patente || "").toUpperCase() === pat);
			if (found) {
				preVeh = found.id.toString();
				setAssignedVehiculoId(found.id);
			}
		}
		if (!preVeh && vehiculos.length > 0 && reserva.vehiculoId) {
			const foundById = vehiculos.find(v => v.id === reserva.vehiculoId);
			if (foundById) {
				preVeh = foundById.id.toString();
				setAssignedVehiculoId(foundById.id);
			}
		}

		let preCon = "none";
		if (conductores.length > 0 && nombreCon) {
			const foundC = conductores.find((c) => (c.nombre || "").toLowerCase() === nombreCon.toLowerCase());
			if (foundC) {
				preCon = foundC.id.toString();
				setAssignedConductorId(foundC.id);
			}
		}
		if (preCon === "none" && conductores.length > 0 && reserva.conductorId) {
			const foundCById = conductores.find(c => c.id === reserva.conductorId);
			if (foundCById) {
				preCon = foundCById.id.toString();
				setAssignedConductorId(foundCById.id);
			}
		}
		
		setVehiculoSeleccionado(preVeh);
		setConductorSeleccionado(preCon);
		
		if (reservaVueltaData) {
			let preVehVuelta = "";
			if (vehiculos.length > 0 && reservaVueltaData.vehiculoId) {
				const foundVuelta = vehiculos.find(v => v.id === reservaVueltaData.vehiculoId);
				if (foundVuelta) preVehVuelta = foundVuelta.id.toString();
			}
			setVueltaVehiculoSeleccionado(preVehVuelta);
			
			let preConVuelta = "none";
			if (conductores.length > 0 && reservaVueltaData.conductorId) {
				const foundConVuelta = conductores.find(c => c.id === reservaVueltaData.conductorId);
				if (foundConVuelta) preConVuelta = foundConVuelta.id.toString();
			}
			setVueltaConductorSeleccionado(preConVuelta);
		}
		
		setEnviarNotificacion(true);
		setEnviarNotificacionConductor(true);
		setShowAsignarDialog(true);
		
		if (vehiculos.length === 0 && fetchVehiculos) fetchVehiculos();
		if (conductores.length === 0 && fetchConductores) fetchConductores();
	}, [
		vehiculos,
		conductores,
		fetchVehiculos,
		fetchConductores,
		setSelectedReserva,
		authenticatedFetch
	]);

	useEffect(() => {
		if (!showAsignarDialog) return;
		if (!vehiculoSeleccionado && assignedPatente && vehiculos.length > 0) {
			const found = vehiculos.find((v) => (v.patente || "").toUpperCase() === assignedPatente);
			if (found) {
				setVehiculoSeleccionado(found.id.toString());
				setAssignedVehiculoId(found.id);
			}
		}
		if (!conductorSeleccionado && assignedConductorNombre && conductores.length > 0) {
			const foundC = conductores.find((c) => (c.nombre || "").toLowerCase() === assignedConductorNombre.toLowerCase());
			if (foundC) {
				setConductorSeleccionado(foundC.id.toString());
				setAssignedConductorId(foundC.id);
			}
		}
	}, [
		showAsignarDialog,
		vehiculos,
		conductores,
		assignedPatente,
		assignedConductorNombre,
		vehiculoSeleccionado,
		conductorSeleccionado
	]);

	const handleGuardarAsignacion = async () => {
		if (!vehiculoSeleccionado) {
			alert("Debe seleccionar al menos un vehículo para la IDA");
			return;
		}
		
		if (reservaVuelta && !asignarAmbas && !vueltaVehiculoSeleccionado) {
			alert("Debe seleccionar un vehículo para la VUELTA");
			return;
		}

		setLoadingAsignacion(true);
		try {
			const responseIda = await fetch(
				`${apiUrl}/api/reservas/${selectedReserva.id}/asignar`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify({
						vehiculoId: parseInt(vehiculoSeleccionado),
						conductorId: conductorSeleccionado && conductorSeleccionado !== "none" ? parseInt(conductorSeleccionado) : null,
						sendEmail: Boolean(enviarNotificacion),
						sendEmailDriver: Boolean(enviarNotificacionConductor),
					}),
				}
			);
			
			if (!responseIda.ok) {
				const data = await responseIda.json();
				throw new Error(data.error || "Error al asignar vehículo/conductor a la IDA");
			}
			
			if (reservaVuelta) {
				const vueltaVehiculo = asignarAmbas ? vehiculoSeleccionado : vueltaVehiculoSeleccionado;
				const vueltaConductor = asignarAmbas ? conductorSeleccionado : vueltaConductorSeleccionado;
				
				const responseVuelta = await fetch(
					`${apiUrl}/api/reservas/${reservaVuelta.id}/asignar`,
					{
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${accessToken}`,
						},
						body: JSON.stringify({
							vehiculoId: parseInt(vueltaVehiculo),
							conductorId: vueltaConductor && vueltaConductor !== "none" ? parseInt(vueltaConductor) : null,
							sendEmail: Boolean(enviarNotificacion),
							sendEmailDriver: Boolean(enviarNotificacionConductor),
						}),
					}
				);
				
				if (!responseVuelta.ok) {
					const data = await responseVuelta.json();
					throw new Error(data.error || "Error al asignar vehículo/conductor a la VUELTA");
				}
			}

			await fetchReservas();
			setShowAsignarDialog(false);
			
			const mensaje = reservaVuelta
				? "Vehículo y conductor asignados correctamente para IDA y VUELTA"
				: "Vehículo y conductor asignados correctamente";
			alert(mensaje);
			
			if (showDetailDialog && selectedReserva?.id) {
				setLoadingHistorial(true);
				try {
					const resp = await fetch(`${apiUrl}/api/reservas/${selectedReserva.id}/asignaciones`, {
						headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
					});
					if (resp.ok) {
						const data = await resp.json();
						setHistorialAsignaciones(Array.isArray(data.historial) ? data.historial : []);
					}
				} catch {
					// noop
				}
				setLoadingHistorial(false);
			}
		} catch (error) {
			console.error("Error asignando vehículo/conductor:", error);
			alert("Error al asignar vehículo/conductor");
		} finally {
			setLoadingAsignacion(false);
		}
	};

	return {
		showAsignarDialog,
		setShowAsignarDialog,
		vehiculoSeleccionado,
		setVehiculoSeleccionado,
		conductorSeleccionado,
		setConductorSeleccionado,
		loadingAsignacion,
		enviarNotificacion,
		setEnviarNotificacion,
		enviarNotificacionConductor,
		setEnviarNotificacionConductor,
		enviarActualizacionConductor,
		setEnviarActualizacionConductor,
		assignedPatente,
		assignedConductorNombre,
		assignedVehiculoId,
		assignedConductorId,
		reservaVuelta,
		asignarAmbas,
		setAsignarAmbas,
		vueltaVehiculoSeleccionado,
		setVueltaVehiculoSeleccionado,
		vueltaConductorSeleccionado,
		setVueltaConductorSeleccionado,
		historialAsignaciones,
		setHistorialAsignaciones,
		loadingHistorial,
		setLoadingHistorial,
		handleAsignar,
		handleGuardarAsignacion,
		getConductorFromObs
	};
}
