import { pool, initDatabase } from '../config/db.js';

async function seedItunesData(searchTerm, limit = 20) {
  try {
    // 1. Asegurar que las tablas existan en PostgreSQL
    await initDatabase();

    console.log(`🔍 Buscando "${searchTerm}" en iTunes...`);
    const query = encodeURIComponent(searchTerm);
    const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=${limit}&country=AR`);
    const data = await response.json();

    const cleanSongs = data.results.filter(track => track.previewUrl);

    console.log(`💾 Guardando ${cleanSongs.length} canciones en la base de datos...`);

    let addedCount = 0;
    for (const track of cleanSongs) {
      const coverUrl = track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : '';
      const year = track.releaseDate ? track.releaseDate.substring(0, 4) : '2000';

      // Insertamos con tipo explícito ($1::varchar, $2::varchar, etc.) para evitar el error 42P08 de PostgreSQL
      const result = await pool.query(`
        INSERT INTO canciones (titulo, artista, album, anio, portada_url, audio_url)
        SELECT $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::text, $6::text
        WHERE NOT EXISTS (
          SELECT 1 FROM canciones WHERE titulo = $1::varchar AND artista = $2::varchar
        );
      `, [track.trackName, track.artistName, track.collectionName || 'Single', year, coverUrl, track.previewUrl]);

      if (result.rowCount > 0) {
        addedCount++;
      }
    }

    console.log(`✅ ¡Catálogo actualizado con éxito! (${addedCount} canciones nuevas agregadas)`);
  } catch (error) {
    console.error("❌ Error al procesar la siembra de iTunes:", error);
  } finally {
    await pool.end();
  }
}

// Ejecutar con la búsqueda deseada:
seedItunesData("Rock Nacional Argentino", 15);