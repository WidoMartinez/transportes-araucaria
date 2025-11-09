// Script para generar hash de contraseña con bcrypt
// AVISO: Este archivo debe ejecutarse en el servidor de Render.com o localmente con Node.js

import bcrypt from 'bcryptjs';

const password = 'admin123'; // Cambia esta contraseña por la que desees
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error al generar hash:', err);
    process.exit(1);
  }
  
  console.log('\n=== HASH GENERADO ===');
  console.log('Contraseña original:', password);
  console.log('Hash bcrypt:', hash);
  console.log('\nUsa este SQL en phpMyAdmin de Hostinger:');
  console.log(`UPDATE admin_users SET password = '${hash}' WHERE username = 'admin';\n`);
});
