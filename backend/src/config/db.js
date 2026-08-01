import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Configuración de la conexión a PostgreSQL mediante Pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/en_una_nota_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Inicialización automática de tablas en PostgreSQL
 */
export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Verificando y creando tablas en PostgreSQL...');

    // 1. Tabla 'canciones'
    await client.query(`
      CREATE TABLE IF NOT EXISTS canciones (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        artista VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        anio VARCHAR(10),
        portada_url TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        start_time NUMERIC(5, 2) DEFAULT 0.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabla 'cancion_diaria' (Relaciona una fecha específica DATE con una canción)
    await client.query(`
      CREATE TABLE IF NOT EXISTS cancion_diaria (
        id SERIAL PRIMARY KEY,
        fecha DATE UNIQUE NOT NULL,
        cancion_id INTEGER NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tablas inicializadas correctamente (canciones, cancion_diaria).');
  } catch (error) {
    console.error('❌ Error al inicializar tablas en la Base de Datos:', error.message);
  } finally {
    client.release();
  }
};
