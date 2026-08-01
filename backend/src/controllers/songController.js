import { pool } from '../config/db.js';

/**
 * GET /api/cancion-hoy?categoria=rock&fecha=YYYY-MM-DD
 * Obtiene la canción asignada a la fecha y categoría especificada
 */
export const getCancionHoy = async (req, res) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const categoria = (req.query.categoria || 'general').toLowerCase();

    const query = `
      SELECT 
        c.id, 
        c.titulo AS "title", 
        c.artista AS "artist", 
        c.album, 
        c.anio AS "year",
        c.portada_url AS "coverUrl", 
        c.audio_url AS "audioUrl", 
        c.genero AS "genre",
        c.start_time::float AS "startTime",
        cd.fecha AS "date",
        cd.categoria AS "category"
      FROM cancion_diaria cd
      JOIN canciones c ON cd.cancion_id = c.id
      WHERE cd.fecha = $1 AND LOWER(cd.categoria) = $2;
    `;

    const result = await pool.query(query, [fecha, categoria]);

    if (result.rows.length > 0) {
      return res.json({
        success: true,
        source: 'daily_schedule',
        data: result.rows[0]
      });
    }

    // Fallback: si no hay canción diaria para hoy en esta categoría, traer una canción de ese género
    const fallbackQuery = `
      SELECT id, titulo AS "title", artista AS "artist", album, anio AS "year", portada_url AS "coverUrl", audio_url AS "audioUrl", genero AS "genre", start_time::float AS "startTime"
      FROM canciones
      WHERE LOWER(genero) = $1 OR $1 = 'general'
      ORDER BY id LIMIT 1;
    `;
    const fallbackResult = await pool.query(fallbackQuery, [categoria]);

    if (fallbackResult.rows.length > 0) {
      return res.json({
        success: true,
        source: 'fallback',
        data: {
          ...fallbackResult.rows[0],
          date: fecha,
          category: categoria
        }
      });
    }

    return res.status(404).json({
      success: false,
      message: `No hay canciones disponibles para la categoría '${categoria}'.`
    });

  } catch (error) {
    console.error('Error en getCancionHoy:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};

/**
 * GET /api/canciones?genero=rock
 * Obtiene el catálogo de canciones (opcionalmente filtrado por género)
 */
export const getCancionesCatalog = async (req, res) => {
  try {
    const genero = req.query.genero ? req.query.genero.toLowerCase() : null;

    let query = `
      SELECT 
        id, 
        titulo AS "title", 
        artista AS "artist", 
        album, 
        anio AS "year",
        portada_url AS "coverUrl", 
        audio_url AS "audioUrl", 
        genero AS "genre",
        start_time::float AS "startTime"
      FROM canciones
    `;

    const params = [];
    if (genero) {
      query += ` WHERE LOWER(genero) = $1`;
      params.push(genero);
    }

    query += ` ORDER BY titulo ASC;`;

    const { rows } = await pool.query(query, params);

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Error en getCancionesCatalog:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar catálogo.'
    });
  }
};

/**
 * POST /api/canciones
 * Agrega una canción al catálogo con género
 */
export const createCancion = async (req, res) => {
  const { title, artist, album, year, coverUrl, audioUrl, genre = 'general', startTime = 0.0 } = req.body;

  if (!title || !artist || !coverUrl || !audioUrl) {
    return res.status(400).json({
      success: false,
      message: 'Los campos title, artist, coverUrl y audioUrl son obligatorios.'
    });
  }

  try {
    const query = `
      INSERT INTO canciones (titulo, artista, album, anio, portada_url, audio_url, genero, start_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, titulo AS "title", artista AS "artist", album, anio AS "year", portada_url AS "coverUrl", audio_url AS "audioUrl", genero AS "genre", start_time::float AS "startTime";
    `;

    const { rows } = await pool.query(query, [title, artist, album, year, coverUrl, audioUrl, genre, startTime]);

    return res.status(201).json({
      success: true,
      message: 'Canción creada exitosamente.',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en createCancion:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al crear canción.'
    });
  }
};

/**
 * POST /api/cancion-diaria
 * Asigna una canción a una fecha y categoría
 */
export const setCancionDiaria = async (req, res) => {
  const { fecha, cancionId, categoria = 'general' } = req.body;

  if (!fecha || !cancionId) {
    return res.status(400).json({
      success: false,
      message: 'La fecha (YYYY-MM-DD) y cancionId son obligatorios.'
    });
  }

  try {
    const query = `
      INSERT INTO cancion_diaria (fecha, categoria, cancion_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (fecha, categoria) 
      DO UPDATE SET cancion_id = EXCLUDED.cancion_id
      RETURNING id, fecha, categoria, cancion_id AS "cancionId";
    `;

    const { rows } = await pool.query(query, [fecha, categoria, cancionId]);

    return res.json({
      success: true,
      message: 'Canción diaria asignada correctamente.',
      data: rows[0]
    });
  } catch (error) {
    console.error('Error en setCancionDiaria:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al asignar canción diaria.'
    });
  }
};
