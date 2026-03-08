
const names = [
  "Emmanuel Morales Inzunza",
  "Lorena Gonzalez",
  "Alejandro gandarillas "
];

function simulate(nombre) {
  const userData = { email: "test@test.com", nombre, telefono: "123" };
  const json = JSON.stringify(userData);
  
  // Backend encoding
  const encoded = Buffer.from(json).toString('base64');
  console.log(`Original: "${nombre}"`);
  console.log(`Base64: ${encoded}`);
  
  // Frontend decoding simulation (using atob/decodeURIComponent/escape hack)
  try {
    const decodedFromUrl = decodeURIComponent(encoded); // Simulate URL param extraction
    const base64Decoded = Buffer.from(decodedFromUrl, 'base64').toString('binary'); // Simulate atob
    const utf8Decoded = decodeURIComponent(escape(base64Decoded));
    const result = JSON.parse(utf8Decoded);
    console.log(`Decoded: "${result.nombre}"`);
    console.log(`Success: ${result.nombre === nombre}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
  console.log('---');
}

names.forEach(simulate);

// Test with special character just in case
simulate("Lorena González");
