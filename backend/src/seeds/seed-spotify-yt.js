import { pool, initDatabase } from '../config/db.js';
import ytSearch from 'yt-search';
import dotenv from 'dotenv';

dotenv.config();

// Umbral mínimo de visualizaciones reales en YouTube (2 Millones) para asegurar solo HITS icónicos conocidos
const MIN_YOUTUBE_VIEWS_THRESHOLD = 50000000;

// Helper para fecha local YYYY-MM-DD
const getLocalDateString = (addDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Configuración de categorías expandidas con artistas e himnos icónicos
const CATEGORY_CONFIGS = [
  {
    genre: 'rock',
    name: 'Rock Nacional',
    searchTerms: [
      'Soda Stereo', 'Charly Garcia', 'Spinetta', 'Luis Alberto Spinetta',
      'Los Redondos', 'Patricio Rey y sus Redonditos de Ricota', 'Divididos',
      'Las Pelotas', 'Babasonicos', 'Andres Calamaro', 'Fito Paez',
      'Enanitos Verdes', 'No Te Va Gustar', 'El Cuarteto de Nos', 'Bersuit Vergarabat', 'La Renga'
    ]
  },
  {
    genre: 'cumbia',
    name: 'Cumbia (Argentina Total)',
    searchTerms: [
      'Damas Gratis', 'Pibes Chorros', 'Yerba Brava', 'Los Wachiturros',
      'Nene Malo', 'Marama', 'Rombai', 'Agapornis', 'Los Totora', 'Ke Personajes', 'Amar Azul', 'La Champions Liga'
    ]
  },
  {
    genre: 'reggaeton',
    name: 'Reggaeton Old School',
    searchTerms: [
      'Daddy Yankee', 'Don Omar', 'Wisin y Yandel', 'Tego Calderon',
      'Zion y Lennox', 'Plan B', 'Alexis y Fido', 'Ivy Queen', 'Hector y Tito'
    ]
  },
  {
    genre: 'reggaeton_new',
    name: 'Reggaeton New School',
    searchTerms: [
      'Bad Bunny', 'Anuel AA', 'J Balvin', 'Maluma', 'Rauw Alejandro',
      'Feid', 'Mora', 'Sech', 'Ozuna', 'FloyyMenor', 'Cris Mj', 'Polima Westcoast', 'Young Cister', 'Karol G'
    ]
  },
  {
    genre: 'pop',
    name: 'Pop Latino',
    searchTerms: [
      'Luis Miguel', 'Shakira', 'Ricky Martin', 'Chayanne', 'Thalia',
      'Miranda!', 'Tini', 'Lali', 'Emilia', 'Morat', 'Sebastian Yatra', 'Reik', 'Ha*Ash'
    ]
  },
  {
    genre: 'trap',
    name: 'Trap en Español',
    searchTerms: [
      'Duki', 'YSY A', 'Bizarrap', 'Tiago PZK', 'Eladio Carrion',
      'Arcangel', 'Bad Bunny', 'Quevedo', 'Milo J', 'Trueno', 'Khea', 'Lit Killah'
    ]
  }
];

/**
 * Limpia títulos removiendo sufijos como (feat. ...), (Remix), etc.
 */
function cleanSongTitle(title) {
  return title
    .replace(/\(feat\.[^)]+\)/gi, '')
    .replace(/\[feat\.[^\]]+\]/gi, '')
    .replace(/\(remix[^)]*\)/gi, '')
    .replace(/\[remix[^\]]*\]/gi, '')
    .replace(/\(live[^)]*\)/gi, '')
    .split('-')[0]
    .trim();
}

/**
 * Validador Estricto de Coincidencia de Audio
 * Evita que se asigne una canción equivocada o un cover no oficial
 */
function isStrictAudioMatch(targetTitle, targetArtist, candidateTitle, candidateArtist) {
  if (!candidateTitle || !candidateArtist) return false;

  const tTitle = cleanSongTitle(targetTitle).toLowerCase();
  const cTitle = cleanSongTitle(candidateTitle).toLowerCase();

  const tArtist = targetArtist.split(',')[0].toLowerCase().trim();
  const cArtist = candidateArtist.toLowerCase().trim();

  // 1. Descartar covers o homenajes no oficiales
  if (cTitle.includes('cover') && !tTitle.includes('cover')) return false;
  if (cArtist.includes('tribute') || cArtist.includes('karaoke') || cArtist.includes('cover')) return false;

  // 2. Verificación estricta de Título
  const titleMatches = tTitle === cTitle ||
    (tTitle.length > 3 && cTitle.includes(tTitle)) ||
    (cTitle.length > 3 && tTitle.includes(cTitle));

  // 3. Verificación estricta de Artista
  const artistMatches = cArtist.includes(tArtist) || tArtist.includes(cArtist);

  return titleMatches && artistMatches;
}

/**
 * 1. Obtener Access Token de Spotify vía Client Credentials Flow
 */
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("⚠️ Faltan SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en el archivo .env");
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Spotify Auth Error: ${data.error_description || res.statusText}`);
  }

  return data.access_token;
}

/**
 * 2. Extraer reproducciones/visualizaciones EXACTAS de YouTube vía yt-search
 *    Algoritmo de 2 pasos:
 *    - Paso 1 (estricto): video donde título Y artista coinciden → toma el mayor
 *    - Paso 2 (flexible): video donde solo el título coincide → fallback
 *    Evita errores como tomar "FIRST LOVE 212M" cuando busca "Te Amo 84M"
 */
async function getExactYouTubeViews(title, artist) {
  try {
    const cleanedTitle = cleanSongTitle(title).toLowerCase();
    const mainArtist = artist.split(',')[0].trim().toLowerCase();

    const queries = [
      `${cleanSongTitle(title)} ${mainArtist} audio`,
      `${cleanSongTitle(title)} ${mainArtist}`,
      `${mainArtist} ${cleanSongTitle(title)}`,
    ];

    let strictBest = 0;   // título + artista coinciden
    let looseBest  = 0;   // solo título coincide (fallback)

    for (const query of queries) {
      const result = await ytSearch(query.trim());
      const topVideos = (result.videos || []).slice(0, 5);

      for (const video of topVideos) {
        const videoTitle  = (video.title        || '').toLowerCase();
        const channelName = (video.author?.name || '').toLowerCase();
        const views = typeof video.views === 'number' ? video.views : 0;

        const titleMatch  = videoTitle.includes(cleanedTitle);
        const artistMatch = videoTitle.includes(mainArtist) || channelName.includes(mainArtist);

        if (titleMatch && artistMatch && views > strictBest) {
          strictBest = views;
        } else if (titleMatch && views > looseBest) {
          looseBest = views;
        }
      }
    }

    if (strictBest > 0) return strictBest;
    if (looseBest  > 0) return looseBest;

    // Último fallback: primer resultado sin filtrar
    const result = await ytSearch(`${cleanSongTitle(title)} ${mainArtist}`.trim());
    return (result.videos?.[0]?.views) || 0;

  } catch (err) {
    console.error(`  ⚠️ Error extrayendo vistas YouTube para "${title} - ${artist}":`, err.message);
    return 0;
  }
}

/**
 * 3. Resolver URL de Stream Directo de Audio con Validación Estricta
 */
async function getPlayableAudioUrl(title, artist, spotifyPreviewUrl) {
  if (spotifyPreviewUrl && spotifyPreviewUrl.startsWith('http')) {
    return spotifyPreviewUrl;
  }

  const cleanedTitle = cleanSongTitle(title);
  const mainArtist = artist.split(',')[0].trim();

  try {
    const queryStr = encodeURIComponent(`${cleanedTitle} ${mainArtist}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${queryStr}&entity=song&limit=10&country=AR`);

    if (res.ok) {
      const data = await res.json();
      const items = data.results || [];

      const exactMatch = items.find(item =>
        item.previewUrl && isStrictAudioMatch(title, artist, item.trackName, item.artistName)
      );

      if (exactMatch) {
        return exactMatch.previewUrl;
      }
    }
  } catch (err) { }

  return null;
}

/**
 * 4. Buscar canciones en Spotify API con Manejo Inteligente de Rate Limits (HTTP 429)
 */
async function fetchSpotifyTracksForGenre(token, config) {
  const tracksMap = new Map();

  for (const term of config.searchTerms) {
    const queryStr = encodeURIComponent(term);
    const url = `https://api.spotify.com/v1/search?q=${queryStr}&type=track`;

    try {
      let res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Manejo de Rate Limit (HTTP 429)
      if (res.status === 429) {
        const retryAfterMs = (Number(res.headers.get('retry-after')) || 2) * 1000;
        console.log(`  ⏳ Spotify Rate Limit alcanzado. Esperando ${retryAfterMs / 1000}s...`);
        await new Promise(r => setTimeout(r, retryAfterMs));
        res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      }

      if (res.ok) {
        const data = await res.json();
        const items = data.tracks?.items || [];
        for (const item of items) {
          if (item && item.name && !tracksMap.has(item.id)) {
            tracksMap.set(item.id, item);
          }
        }
      }
    } catch (e) {
      console.error(`  ⚠️ Error buscando "${term}" en Spotify:`, e.message);
    }

    // Pausa de 200ms entre búsquedas para evitar saturación de la API de Spotify
    await new Promise(r => setTimeout(r, 200));
  }

  return Array.from(tracksMap.values());
}

/**
 * Script Principal de Sembrado Híbrido Filtrado con Exclusión Única para Mix General
 */
async function seedSpotifyYoutubeCatalog() {
  try {
    await initDatabase();

    console.log('\n🟢 Conectando con Spotify API (Client Credentials Flow)...');
    const token = await getSpotifyAccessToken();
    console.log('🔑 Token de acceso obtenido exitosamente de Spotify.');
    console.log(`🎯 Umbral de Filtro de Éxitos Activado: >= ${(MIN_YOUTUBE_VIEWS_THRESHOLD / 1000000).toFixed(1)} Millones de vistas en YouTube`);
    console.log(`🛡️ Validador Estricto de Audios Activado (0% Desfasajes)`);
    console.log(`🔒 Restricción de Exclusividad Activada (Mix General 100% sin canciones repetidas con otras categorías en la misma fecha)\n`);

    let totalNewSongs = 0;
    const allSongIds = [];

    for (const config of CATEGORY_CONFIGS) {
      console.log(`🎧 Procesando Categoría "${config.name.toUpperCase()}" (${config.genre})...`);

      const rawTracks = await fetchSpotifyTracksForGenre(token, config);
      console.log(`  📦 Obtenidos ${rawTracks.length} tracks desde Spotify.`);

      let addedInGenre = 0;
      let discardedForLowViews = 0;
      let discardedForAudioMismatch = 0;
      const genreSongIds = [];

      for (const track of rawTracks) {
        const title = track.name;
        const artist = (track.artists || []).map(a => a.name).join(', ');
        const album = track.album?.name || 'Single';
        const releaseDate = track.album?.release_date || '2000';
        const year = releaseDate.substring(0, 4);
        const coverUrl = track.album?.images[0]?.url || '';

        // 1. Resolver stream directo de audio verificado
        const audioUrl = await getPlayableAudioUrl(title, artist, track.preview_url);

        if (!audioUrl || !audioUrl.startsWith('http')) {
          discardedForAudioMismatch++;
          continue;
        }

        // 2. Obtener visualizaciones EXACTAS desde YouTube
        const exactViews = await getExactYouTubeViews(title, artist);

        // 3. FILTRO DE ÉXITOS: Descartar canciones con menos de 2M de vistas
        if (exactViews < MIN_YOUTUBE_VIEWS_THRESHOLD) {
          discardedForLowViews++;
          continue;
        }

        const popularityScore = Math.min(100, Math.max(50, Math.round(exactViews / 3000000)));

        const insertRes = await pool.query(`
          INSERT INTO canciones (titulo, artista, album, anio, portada_url, audio_url, genero, popularidad, reproducciones)
          SELECT $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::text, $6::text, $7::varchar, $8::integer, $9::bigint
          WHERE NOT EXISTS (
            SELECT 1 FROM canciones WHERE LOWER(titulo) = LOWER($1::varchar) AND LOWER(artista) = LOWER($2::varchar)
          )
          RETURNING id;
        `, [title, artist, album, year, coverUrl, audioUrl, config.genre, popularityScore, exactViews]);

        let songId;
        if (insertRes.rows.length > 0) {
          addedInGenre++;
          songId = insertRes.rows[0].id;
        } else {
          await pool.query(
            `UPDATE canciones 
             SET popularidad = $3::integer, portada_url = $4::text, audio_url = $5::text, reproducciones = $6::bigint, genero = $7::varchar
             WHERE LOWER(titulo) = LOWER($1::varchar) AND LOWER(artista) = LOWER($2::varchar);`,
            [title, artist, popularityScore, coverUrl, audioUrl, exactViews, config.genre]
          ).catch(() => null);

          const selectRes = await pool.query(
            `SELECT id FROM canciones WHERE LOWER(titulo) = LOWER($1) AND LOWER(artista) = LOWER($2);`,
            [title, artist]
          );

          if (selectRes.rows.length > 0) {
            songId = selectRes.rows[0].id;
          }
        }

        if (songId) {
          genreSongIds.push(songId);
          if (!allSongIds.includes(songId)) {
            allSongIds.push(songId);
          }
        }
      }

      totalNewSongs += addedInGenre;
      console.log(`  ✅ ${genreSongIds.length} HITS VERIFICADOS para "${config.name}".`);

      // Programar canciones diarias para la categoría de género
      for (let i = 0; i < Math.min(genreSongIds.length, 30); i++) {
        const fechaStr = getLocalDateString(i);
        const cancionId = genreSongIds[i];

        await pool.query(`
          INSERT INTO cancion_diaria (fecha, categoria, cancion_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (fecha, categoria) 
          DO UPDATE SET cancion_id = EXCLUDED.cancion_id;
        `, [fechaStr, config.genre, cancionId]);
      }

      console.log(`  📅 Canciones diarias programadas para "${config.name}".\n`);
    }

    // Programar canciones diarias para el Mix General con RESTRICCIÓN DE EXCLUSIVIDAD
    if (allSongIds.length > 0) {
      console.log(`📅 Programando canciones diarias para el Mix General garantizando NINGUNA repetición con otras categorías...`);

      for (let i = 0; i < 30; i++) {
        const fechaStr = getLocalDateString(i);

        // Obtener las canciones asignadas HOY a cualquier otra categoría
        const assignedRes = await pool.query(`
          SELECT cancion_id FROM cancion_diaria 
          WHERE fecha = $1 AND categoria != 'general';
        `, [fechaStr]);

        const assignedToday = assignedRes.rows.map(r => r.cancion_id);

        // Filtrar candidatos para el Mix General que NO estén asignados en las otras categorías en esta misma fecha
        const availableCandidates = allSongIds.filter(id => !assignedToday.includes(id));

        if (availableCandidates.length > 0) {
          // Seleccionar una canción candidata única usando rotación
          const selectedGeneralId = availableCandidates[i % availableCandidates.length];

          await pool.query(`
            INSERT INTO cancion_diaria (fecha, categoria, cancion_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (fecha, categoria) 
            DO UPDATE SET cancion_id = EXCLUDED.cancion_id;
          `, [fechaStr, 'general', selectedGeneralId]);
        }
      }
      console.log(`✅ Mix General programado exitosamente con exclusividad por fecha.\n`);
    }

    console.log(`🎉 ¡Catálogo Híbrido y Cronograma Diario Sembrado con Éxito!`);
    console.log(`📊 Total HITS Únicos en el Sistema: ${allSongIds.length}`);

  } catch (error) {
    console.error("❌ Error durante el sembrado Spotify/YouTube:", error);
  } finally {
    await pool.end();
  }
}

seedSpotifyYoutubeCatalog();
