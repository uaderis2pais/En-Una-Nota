import { pool, initDatabase } from '../config/db.js';

// Helper para fecha local YYYY-MM-DD
const getLocalDateString = (addDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const GENRES = ['rock', 'cumbia', 'reggaeton', 'reggaeton_new', 'pop', 'trap'];

async function rescheduleWithExclusivityAndNoRepeats() {
  try {
    await initDatabase();

    console.log('\n🔒 Reprogramando Canciones Diarias con Restricción Anti-Repeticiones e Exclusividad Total...\n');

    // 1. Programar los 6 géneros para los próximos 30 días asegurando NINGUNA repetición de canción por categoría
    for (const genre of GENRES) {
      // Obtener todas las canciones del género ordenadas por reproducciones/popularidad
      const { rows: songs } = await pool.query(`
        SELECT id, titulo, artista FROM canciones WHERE LOWER(genero) = $1 ORDER BY reproducciones DESC;
      `, [genre]);

      if (songs.length === 0) continue;

      const usedSongIdsInGenre = new Set();

      for (let i = 0; i < 30; i++) {
        const fechaStr = getLocalDateString(i);

        // Buscar una canción del género que aún no se haya usado en los días previos
        const availableSong = songs.find(s => !usedSongIdsInGenre.has(s.id));

        if (availableSong) {
          usedSongIdsInGenre.add(availableSong.id);

          await pool.query(`
            INSERT INTO cancion_diaria (fecha, categoria, cancion_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (fecha, categoria) 
            DO UPDATE SET cancion_id = EXCLUDED.cancion_id;
          `, [fechaStr, genre, availableSong.id]);
        }
      }
      console.log(`✅ Categoría "${genre.toUpperCase()}": ${usedSongIdsInGenre.size} canciones únicas asignadas sin repeticiones.`);
    }

    // 2. Programar el Mix General (general) para los próximos 30 días
    // GARANTIZANDO:
    // A) Ninguna coincidencia el mismo día con las otras 6 categorías
    // B) Ninguna repetición de canción dentro del Mix General en días consecutivos
    const { rows: allSongs } = await pool.query(`
      SELECT id FROM canciones ORDER BY reproducciones DESC;
    `);

    const allSongIds = allSongs.map(s => s.id);
    const usedGeneralIds = new Set();

    console.log(`\n📅 Programando Mix General (${allSongIds.length} canciones en catálogo total)...`);

    for (let i = 0; i < 30; i++) {
      const fechaStr = getLocalDateString(i);

      // Canciones asignadas HOY en cualquier otra categoría
      const assignedRes = await pool.query(`
        SELECT cancion_id FROM cancion_diaria 
        WHERE fecha = $1 AND categoria != 'general';
      `, [fechaStr]);

      const assignedToday = new Set(assignedRes.rows.map(r => r.cancion_id));

      // Filtrar canciones disponibles: que NO estén hoy en otro género y de preferencia no repetidas en Mix General
      let candidate = allSongIds.find(id => !assignedToday.has(id) && !usedGeneralIds.has(id));

      // Si se agotan sin repetir, tomar una que no esté hoy en otro género
      if (!candidate) {
        candidate = allSongIds.find(id => !assignedToday.has(id));
      }

      if (candidate) {
        usedGeneralIds.add(candidate);

        await pool.query(`
          INSERT INTO cancion_diaria (fecha, categoria, cancion_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (fecha, categoria) 
          DO UPDATE SET cancion_id = EXCLUDED.cancion_id;
        `, [fechaStr, 'general', candidate]);
      }
    }

    console.log(`🎉 ¡Mix General Programado exitosamente con ${usedGeneralIds.size} canciones únicas!\n`);

  } catch (err) {
    console.error("❌ Error reprogramando canciones diarias:", err);
  } finally {
    await pool.end();
  }
}

rescheduleWithExclusivityAndNoRepeats();
