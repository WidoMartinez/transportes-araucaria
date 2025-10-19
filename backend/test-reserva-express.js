import fetch from "node-fetch";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

const pruebas = async () => {
	const payloadConHora = {
		nombre: "Test User",
		email: "test@example.com",
		telefono: "555-1234",
		origen: "A",
		destino: "B",
		fecha: "2025-10-20",
		hora: "8:00",
		pasajeros: 1,
		totalConDescuento: 100,
		source: "test",
	};

	const payloadSinHora = {
		nombre: "Test User 2",
		email: "test2@example.com",
		telefono: "555-5678",
		origen: "A",
		destino: "B",
		fecha: "2025-10-20",
		pasajeros: 2,
		totalConDescuento: 150,
		source: "test",
	};

	console.log("POST con hora...");
	const r1 = await fetch(`${backendUrl}/enviar-reserva-express`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payloadConHora),
	});
	const j1 = await r1.json();
	console.log("Respuesta con hora:", j1);

	console.log("POST sin hora...");
	const r2 = await fetch(`${backendUrl}/enviar-reserva-express`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payloadSinHora),
	});
	const j2 = await r2.json();
	console.log("Respuesta sin hora:", j2);
};

pruebas().catch((e) => console.error(e));
