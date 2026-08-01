import { pool } from '../config/db.js';

/**
 * GET /api/cancion-hoy
 * Obtiene la canción asignada para la fecha actual (o la especificada por query ?fecha=YYYY-MM-DD)
 */
export const getCancionHoy = async (req, res) => {
  try {
    // Fecha en formato YYYY-MM-DD (recibida o fecha actual en UTC/local)
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];

    const query = `
      SELECT 
        c.id, 
        c.titulo AS "title", 
        c.artista AS "artist", 
        c.album, 
        c.anio AS "year",
        c.portada_url AS "coverUrl", 
        c.audio_url AS "audioUrl", 
        c.start_time::float AS "startTime",
        cd.fecha AS "date"
      FROM cancion_diaria cd
      JOIN canciones c ON cd.cancion_id = c.id
      WHERE cd.fecha = $1;
    `;

    const result = await pool.query(query, [fecha]);

    // Si existe una canción asignada para hoy
    if (result.rows.length > 0) {
      return res.json({
        success: true,
        source: 'daily_schedule',
        data: result.rows[0]
      });
    }

    // Fallback inteligente: si no hay canción asignada para la fecha exacta, tomar una canción rotativa del catálogo
    const fallbackQuery = `SELECT id, titulo AS "title", artista AS "artist", album, anio AS "year", portada_url AS "coverUrl", audio_url AS "audioUrl", start_time::float AS "startTime" FROM canciones ORDER BY id LIMIT 1;`;
    const fallbackResult = await pool.query(fallbackQuery);

    if (fallbackResult.rows.length > 0) {
      return res.json({
        success: true,
        source: 'fallback',
        data: {
          ...fallbackResult.rows[0],
          date: fecha
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: 'No se encontraron canciones en el catálogo. Ejecuta el script de seed.'
    });

  } catch (error) {
    console.error('Error en getCancionHoy:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al consultar la canción del día.'
    });
  }
};

/**
 * GET /api/canciones
 * Obtiene la lista completa de canciones del catálogo (útil para el autocompletado del buscador)
 */
export const getCancionesCatalog = async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        titulo AS "title", 
        artista AS "artist", 
        album, 
        anio AS "year",
        portada_url AS "coverUrl", 
        audio_url AS "audioUrl", 
        start_time::float AS "startTime"
      FROM canciones 
      ORDER BY titulo ASC;
    `;
    const { rows } = await pool.query(query);

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error en getCancionesCatalog:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al consultar el catálogo de canciones.'
    });
  }
};

/**
 * POST /api/canciones
 * Agrega una nueva canción al catálogo
 */
export const createCancion = async (req, res) => {
  const { title, artist, album, year, coverUrl, audioUrl, startTime = 0.0 } = req.body;

  if (!title || !artist || !coverUrl || !audioUrl) {
    return res.status(400).json({
      success: false,
      message: 'Los campos title, artist, coverUrl y audioUrl son obligatorios.'
    });
  }

  try {
    const query = `
      INSERT INTO canciones (titulo, artista, album, anio, portada_url, audio_url, start_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, titulo AS "title", artista AS "artist", album, anio AS "year", portada_url AS "coverUrl", audio_url AS "audioUrl", start_time::float AS "startTime";
    `;

    const { rows } = await pool.query(query, [title, artist, album, year, coverUrl, audioUrl, startTime]);

    return res.status(201).json({
      success: true,
      message: 'Canción agregada exitosamente.',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en createCancion:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al crear la canción.'
    });
  }
};

/**
 * POST /api/cancion-diaria
 * Asigna una canción a una fecha específica
 */
export const setCancionDiaria = async (req, res) => {
  const { fecha, cancionId } = req.body;

  if (!fecha || !cancionId) {
    return res.status(400).json({
      success: false,
      message: 'La fecha (YYYY-MM-DD) y cancionId son obligatorios.'
    });
  }

  try {
    const query = `
      INSERT INTO cancion_diaria (fecha, cancion_id)
      VALUES ($1, $2)
      ON CONFLICT (fecha) 
      DO UPDATE SET cancion_id = EXCLUDED.cancion_id
      RETURNING id, fecha, cancion_id AS "cancionId";
    `;

    const { rows } = await pool.query(query, [fecha, cancionId]);

    return res.json({
      success: true,
      message: 'Canción diaria asignada correctamente.',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en setCancionDiaria:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al asignar la canción diaria.'
    });
  }
};
