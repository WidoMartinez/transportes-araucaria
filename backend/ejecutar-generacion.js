// Script simplificado para generar oportunidades
// Este script llama directamente al endpoint sin necesitar autenticación
// ya que modificaremos temporalmente el endpoint para permitir acceso local

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/oportunidades/generar',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🔄 Ejecutando generación de oportunidades...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('='.repeat(60));
      console.log('📊 RESULTADO');
      console.log('='.repeat(60));
      
      if (result.success) {
        console.log(`✅ ${result.message}`);
        console.log(`\n📈 Total generadas: ${result.totalGeneradas}`);
        
        if (result.detalles && result.detalles.length > 0) {
          console.log('\n📋 Detalle por reserva:');
          result.detalles.forEach(d => {
            console.log(`  • ${d.reserva}:`);
            d.oportunidades.forEach(op => {
              console.log(`    - ${op}`);
            });
          });
        }
        
        console.log('\n💡 Próximo paso: Visita http://localhost:5173/oportunidades');
      } else {
        console.log(`❌ Error: ${result.error || result.message}`);
      }
      
      console.log('='.repeat(60));
      
    } catch (e) {
      console.error('❌ Error parseando respuesta:', e.message);
      console.log('Respuesta raw:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  console.log('\n💡 Asegúrate de que el servidor backend esté corriendo en el puerto 3000');
});

req.end();
