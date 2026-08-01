import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Configuración del Pool de PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/en_una_nota_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Inicialización y migración automática de tablas en PostgreSQL
 */
export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Migrando y verificando la base de datos en PostgreSQL...');

    // 1. Tabla 'canciones' con columna 'genero'
    await client.query(`
      CREATE TABLE IF NOT EXISTS canciones (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        artista VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        anio VARCHAR(10),
        portada_url TEXT NOT NULL,
        audio_url TEXT NOT NULL,
        genero VARCHAR(100) DEFAULT 'general',
        start_time NUMERIC(5, 2) DEFAULT 0.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migración: asegurar que exista la columna 'genero' en tablas existentes
    await client.query(`
      ALTER TABLE canciones ADD COLUMN IF NOT EXISTS genero VARCHAR(100) DEFAULT 'general';
    `);

    // 2. Tabla 'cancion_diaria' con soporte para 'categoria' y restricción UNIQUE (fecha, categoria)
    await client.query(`
      CREATE TABLE IF NOT EXISTS cancion_diaria (
        id SERIAL PRIMARY KEY,
        fecha DATE NOT NULL,
        categoria VARCHAR(100) NOT NULL DEFAULT 'general',
        cancion_id INTEGER NOT NULL REFERENCES canciones(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migración: asegurar que exista la columna 'categoria'
    await client.query(`
      ALTER TABLE cancion_diaria ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'general';
    `);

    // Actualizar la restricción UNIQUE para que sea la combinación de (fecha, categoria)
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'cancion_diaria_fecha_key'
        ) THEN
          ALTER TABLE cancion_diaria DROP CONSTRAINT cancion_diaria_fecha_key;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'cancion_diaria_fecha_categoria_key'
        ) THEN
          ALTER TABLE cancion_diaria ADD CONSTRAINT cancion_diaria_fecha_categoria_key UNIQUE (fecha, categoria);
        END IF;
      END $$;
    `);

    console.log('✅ Tablas e índices actualizados correctamente (genero, cancion_diaria(fecha, categoria)).');
  } catch (error) {
    console.error('❌ Error al migrar la Base de Datos:', error.message);
  } finally {
    client.release();
  }
};
