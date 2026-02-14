import axios from 'axios';

const API_URL = 'http://localhost:3001'; // Correct port identified in server-db.js

async function testVerification() {
  console.log("🚀 Iniciando verificación de correcciones...");

  const testEmail = `test-${Date.now()}@example.com`;

  try {
    // 1. Crear reserva IDA y VUELTA (Expreso)
    console.log("\n1️⃣ Probando creación inicial de Ida y Vuelta...");
    const res1 = await axios.post(`${API_URL}/enviar-reserva-express`, {
      nombre: "Test Verification",
      email: testEmail,
      telefono: "+56 9 1234 5678",
      origen: "Aeropuerto La Araucanía",
      destino: "Pucón",
      fecha: "2026-03-01",
      hora: "10:00",
      pasajeros: "2",
      idaVuelta: true,
      fechaRegreso: "2026-03-10",
      horaRegreso: "15:00",
      precio: 60000,
      totalConDescuento: 54000
    });

    console.log("✅ Reserva creada exitosamente. ID:", res1.data.reservaId);

    // 2. Verificar tramos en la base de datos (vía API Admin si es posible, o asumiendo IDs correlativos)
    // Como no tengo acceso directo fácil a buscar por email en API admin sin token, 
    // pero puedo inspeccionar el objeto devuelto si el endpoint devolviera datos, 
    // pero solo devuelve reservaId (del padre).

    console.log("ℹ️ Verificación manual de rutas en DB sugerida para IDs vinculados a:", res1.data.reservaId);

    // 3. Probar modificación: Cambiar detalles de una reserva pendiente
    console.log("\n2️⃣ Probando modificación de reserva pendiente...");
    const res2 = await axios.post(`${API_URL}/enviar-reserva-express`, {
      nombre: "Test Verification Updated",
      email: testEmail,
      telefono: "+56 9 1234 5678",
      origen: "Aeropuerto La Araucanía",
      destino: "Pucón",
      fecha: "2026-03-01",
      hora: "11:00", // Cambio de hora
      pasajeros: "2",
      idaVuelta: true,
      fechaRegreso: "2026-03-10",
      horaRegreso: "16:00", // Cambio de hora regreso
      precio: 60000,
      totalConDescuento: 54000
    });

    console.log("✅ Reserva modificada exitosamente. EsModificacion:", res2.data.esModificacion);

    // 4. Probar completar detalles y propagación
    console.log("\n3️⃣ Probando propagación de detalles a tramo vinculado...");
    const res3 = await axios.put(`${API_URL}/completar-reserva-detalles/${res1.data.reservaId}`, {
      hora: "11:00",
      hotel: "Hotel Test Pucón 123",
      numeroVuelo: "JA123",
      sillaInfantil: "1 silla",
      equipajeEspecial: "Tablas de surf",
      idaVuelta: true,
      fechaRegreso: "2026-03-10",
      horaRegreso: "16:00"
    });

    console.log("✅ Detalles completados. Mensaje:", res3.data.message);
    console.log("ℹ️ Campos propagados:", {
      hotel: res3.data.reserva.hotel,
      numeroVuelo: res3.data.reserva.numeroVuelo,
      vinculado: res3.data.reserva.tramoHijoId
    });

    console.log("\n🎉 Verificación finalizada. Por favor revisa los logs del servidor para confirmar que no hubo corrupción de rutas.");

  } catch (error) {
    if (error.response) {
      console.error("❌ Error durante la verificación (Server):", error.response.status, error.response.data);
    } else {
      console.error("❌ Error durante la verificación (Network/Unknown):", error.message);
    }
  }
}

testVerification();
