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

    // 1. Tabla 'canciones' con columnas 'genero', 'popularidad' y 'reproducciones'
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
        popularidad INTEGER DEFAULT 0,
        reproducciones BIGINT DEFAULT 0,
        start_time NUMERIC(5, 2) DEFAULT 0.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migraciones: asegurar que existan las columnas 'genero', 'popularidad' y 'reproducciones'
    await client.query(`
      ALTER TABLE canciones ADD COLUMN IF NOT EXISTS genero VARCHAR(100) DEFAULT 'general';
    `);

    await client.query(`
      ALTER TABLE canciones ADD COLUMN IF NOT EXISTS popularidad INTEGER DEFAULT 0;
    `);

    await client.query(`
      ALTER TABLE canciones ADD COLUMN IF NOT EXISTS reproducciones BIGINT DEFAULT 0;
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

    // 3. Tabla 'sugerencias' para canciones enviadas por los usuarios con reproducciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS sugerencias (
        id SERIAL PRIMARY KEY,
        spotify_url TEXT NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        artista VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        anio VARCHAR(10),
        portada_url TEXT,
        audio_url TEXT,
        genero VARCHAR(100) NOT NULL,
        reproducciones BIGINT DEFAULT 0,
        estado VARCHAR(20) DEFAULT 'pendiente',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migración para añadir reproducciones a sugerencias si no existía
    await client.query(`
      ALTER TABLE sugerencias ADD COLUMN IF NOT EXISTS reproducciones BIGINT DEFAULT 0;
    `);

    console.log('✅ Tablas e índices actualizados correctamente (canciones, cancion_diaria, sugerencias).');
  } catch (error) {
    console.error('❌ Error al migrar la Base de Datos:', error.message);
  } finally {
    client.release();
  }
};
