/**
 * reset-db.js
 * Borra y recrea las tablas canciones y cancion_diaria desde cero.
 * Las sugerencias se preservan (no se borran).
 * Uso: node src/seeds/reset-db.js
 */
import { pool, initDatabase } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('\n🗑️  Borrando datos de canciones y programación diaria...');

    // Borrar en orden correcto por restricción de FK
    await client.query(`DELETE FROM cancion_diaria;`);
    console.log('  ✅ cancion_diaria → vaciada');

    await client.query(`DELETE FROM canciones;`);
    console.log('  ✅ canciones → vaciada');

    // Resetear las secuencias de IDs para que empiecen desde 1
    await client.query(`ALTER SEQUENCE canciones_id_seq RESTART WITH 1;`);
    await client.query(`ALTER SEQUENCE cancion_diaria_id_seq RESTART WITH 1;`);
    console.log('  ✅ Secuencias de IDs reseteadas a 1');

    console.log('\n✅ Reset completo. Las sugerencias de usuarios se preservaron.\n');
  } catch (err) {
    console.error('❌ Error durante el reset:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
