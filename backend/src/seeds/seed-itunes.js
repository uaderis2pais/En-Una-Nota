import { pool, initDatabase } from '../config/db.js';

// Configuración de búsquedas por categoría/género para el poblado masivo
const SEARCH_CONFIGS = [
  { search: 'Rock Nacional Argentino', genre: 'rock' },
  { search: 'Cumbia Villera', genre: 'cumbia' },
  { search: 'Reggaeton Old School', genre: 'reggaeton' },
  { search: 'Pop Latino Hits', genre: 'pop' },
  { search: 'Cuarteto Cordobes', genre: 'cuarteto' },
  { search: 'Trap Argentino', genre: 'trap' }
];

async function seedMassiveItunesCatalog() {
  try {
    // 1. Inicializar y migrar tablas en PostgreSQL
    await initDatabase();

    console.log('🚀 Iniciando sembrado masivo de canciones desde iTunes API...\n');

    let totalSongsAdded = 0;

    for (const config of SEARCH_CONFIGS) {
      console.log(`🔎 Buscando categoría "${config.genre.toUpperCase()}" (Búsqueda: "${config.search}")...`);

      const query = encodeURIComponent(config.search);
      const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=50&country=AR`;

      const response = await fetch(url);
      const data = await response.json();

      const cleanSongs = (data.results || []).filter(track => track.previewUrl);
      console.log(`  📦 Encontradas ${cleanSongs.length} canciones con preview de audio.`);

      let addedInGenre = 0;
      const genreSongIds = [];

      for (const track of cleanSongs) {
        const coverUrl = track.artworkUrl100 
          ? track.artworkUrl100.replace('100x100bb', '600x600bb') 
          : '';
        const year = track.releaseDate ? track.releaseDate.substring(0, 4) : '2000';

        // Insertar en la tabla 'canciones' asignando el género correspondiente
        const insertRes = await pool.query(`
          INSERT INTO canciones (titulo, artista, album, anio, portada_url, audio_url, genero)
          SELECT $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::text, $6::text, $7::varchar
          WHERE NOT EXISTS (
            SELECT 1 FROM canciones WHERE LOWER(titulo) = LOWER($1::varchar) AND LOWER(artista) = LOWER($2::varchar)
          )
          RETURNING id;
        `, [
          track.trackName, 
          track.artistName, 
          track.collectionName || 'Single', 
          year, 
          coverUrl, 
          track.previewUrl, 
          config.genre
        ]);

        if (insertRes.rows.length > 0) {
          addedInGenre++;
          genreSongIds.push(insertRes.rows[0].id);
        } else {
          // Si ya existía, obtener su ID para la programación diaria
          const existingRes = await pool.query(
            `SELECT id FROM canciones WHERE LOWER(titulo) = LOWER($1) AND LOWER(artista) = LOWER($2);`,
            [track.trackName, track.artistName]
          );
          if (existingRes.rows.length > 0) {
            genreSongIds.push(existingRes.rows[0].id);
          }
        }
      }

      totalSongsAdded += addedInGenre;
      console.log(`  ✅ ${addedInGenre} canciones nuevas insertadas para la categoría "${config.genre}".`);

      // 2. Programar canciones diarias para esta categoría en cancion_diaria (para hoy y los próximos días)
      const today = new Date();
      for (let i = 0; i < Math.min(genreSongIds.length, 30); i++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() + i);
        const fechaStr = dateObj.toISOString().split('T')[0];
        const cancionId = genreSongIds[i];

        await pool.query(`
          INSERT INTO cancion_diaria (fecha, categoria, cancion_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (fecha, categoria) 
          DO UPDATE SET cancion_id = EXCLUDED.cancion_id;
        `, [fechaStr, config.genre, cancionId]);
      }

      console.log(`  📅 Canciones diarias programadas para categoría "${config.genre}".\n`);
    }

    console.log(`🎉 ¡Poblado masivo completado con éxito!`);
    console.log(`📊 Total de nuevas canciones registradas en la Base de Datos: ${totalSongsAdded}`);

  } catch (error) {
    console.error("❌ Error durante el sembrado masivo:", error);
  } finally {
    await pool.end();
  }
}

seedMassiveItunesCatalog();