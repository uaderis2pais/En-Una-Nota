import jwt from 'jsonwebtoken';
import ytSearch from 'yt-search';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || ADMIN_PASS;

const ALLOWED_SUGGESTION_GENRES = ['rock', 'cumbia', 'reggaeton', 'reggaeton_new', 'pop', 'trap'];

// Helper para fecha local YYYY-MM-DD
const getLocalDateString = (addDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Limpia textos eliminando espacios de no separación (\u00A0) y espacios duplicados
 */
function cleanText(str) {
  if (!str) return '';
  return str.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Limpia títulos removiendo sufijos como (feat. ...), (Remix), etc.
 */
function cleanSongTitle(title) {
  return cleanText(title)
    .replace(/\(feat\.[^)]+\)/gi, '')
    .replace(/\[feat\.[^\]]+\]/gi, '')
    .replace(/\(remix[^)]*\)/gi, '')
    .replace(/\[remix[^\]]*\]/gi, '')
    .replace(/\(live[^)]*\)/gi, '')
    .split('-')[0]
    .trim();
/**
 * Normalizador estricto de claves para prevención absoluta de duplicados
 */
function normalizeSongKey(title, artist) {
  const normTitle = (title || '')
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/bzrp music sessions/g, 'bzrp')
    .replace(/vol\.|session|\#/gi, '')
    .replace(/[^a-z0-9]/gi, '');
    
  const normArtist = (artist || '')
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, '');

  return `${normTitle}-${normArtist}`;
}

/**
 * Validador Estricto de Coincidencia de Audio
 */
function isStrictAudioMatch(targetTitle, targetArtist, candidateTitle, candidateArtist) {
  if (!candidateTitle || !candidateArtist) return false;

  const tTitle = cleanSongTitle(targetTitle).toLowerCase();
  const cTitle = cleanSongTitle(candidateTitle).toLowerCase();
  const tArtist = cleanText(targetArtist).split(',')[0].toLowerCase().trim();
  const cArtist = cleanText(candidateArtist).toLowerCase().trim();

  if (cTitle.includes('cover') && !tTitle.includes('cover')) return false;
  if (cArtist.includes('tribute') || cArtist.includes('karaoke') || cArtist.includes('cover')) return false;

  const titleMatches = tTitle === cTitle || 
                       (tTitle.length > 3 && cTitle.includes(tTitle)) || 
                       (cTitle.length > 3 && tTitle.includes(cTitle));

  const artistMatches = cArtist.includes(tArtist) || tArtist.includes(cArtist);

  return titleMatches && artistMatches;
}

/**
 * Enriquecedor de Portadas HD, Año de Lanzamiento y Stream de Audio vía iTunes API
 */
async function enrichTrackMetadata(title, artist) {
  const cleanedTitle = cleanSongTitle(title);
  const mainArtist = cleanText(artist).split(',')[0].trim();

  let coverUrl = '';
  let year = '2000';
  let audioUrl = '';
  let fullArtist = artist;

  try {
    const query = encodeURIComponent(`${cleanedTitle} ${mainArtist}`.trim());
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=3&country=AR`);
    if (res.ok) {
      const data = await res.json();
      const item = data.results?.[0];
      if (item) {
        coverUrl = item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '';
        if (item.releaseDate) {
          year = item.releaseDate.substring(0, 4);
        }
        audioUrl = item.previewUrl || '';
        if (item.artistName && !fullArtist) {
          fullArtist = cleanText(item.artistName);
        }
      }
    }
  } catch (err) {
    console.error('Error enriqueciendo metadata:', err.message);
  }

  return { coverUrl, year, audioUrl, artist: fullArtist };
}

/**
 * Obtener Access Token de Spotify API
 */
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch (err) {
    return null;
  }
}

/**
 * Extraer canciones de CUALQUIER Playlist de Spotify usando Web API + Embed HTML Fallback
 */
async function getSpotifyPlaylistTracksEmbed(playlistId) {
  // Intento 1: Spotify Web API oficial si existen credenciales
  try {
    const token = await getSpotifyAccessToken();
    if (token) {
      const apiRes = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: AbortSignal.timeout(3000)
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        const items = apiData.items || [];
        const mapped = items.map(item => {
          const t = item.track || item;
          if (!t || !t.name) return null;
          return {
            id: t.id || `${t.name}-${t.artists?.[0]?.name}`,
            name: cleanText(t.name),
            artists: [{ name: cleanText((t.artists || []).map(a => a.name).join(', ')) }],
            album: { name: t.album?.name || 'Single', images: t.album?.images || [] },
            preview_url: t.preview_url || ''
          };
        }).filter(Boolean);

        if (mapped.length > 0) return mapped;
      }
    }
  } catch (err) {
    console.log('Spotify API playlist fetch fallback to embed:', err.message);
  }

  // Intento 2: Embed HTML
  try {
    const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3500)
    });

    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/) ||
                    html.match(/<script id="initial-state" type="text\/plain">([^<]+)<\/script>/);

      if (match && match[1]) {
        let rawJson = match[1];
        if (html.includes('initial-state')) {
          rawJson = Buffer.from(rawJson, 'base64').toString('utf-8');
        }
        const data = JSON.parse(rawJson);
        const entity = data.props?.pageProps?.state?.data?.entity || data.props?.pageProps?.entity;
        const trackList = entity?.trackList || entity?.tracks?.items || [];

        return trackList.map(t => {
          const title = cleanText(t.title || t.name || t.track?.name || '');
          const artist = cleanText(t.subtitle || (t.artists || []).map(a => a.name).join(', ') || t.artist || '');
          const coverUrl = t.coverUrl || t.album?.images?.[0]?.url || t.track?.album?.images?.[0]?.url || '';
          const audioUrl = t.audioUrl || t.preview_url || t.track?.preview_url || t.audioPreview?.url || '';

          return {
            id: t.id || t.uri || `${title}-${artist}`,
            name: title,
            artists: [{ name: artist }],
            album: { name: t.albumName || 'Single', images: coverUrl ? [{ url: coverUrl }] : [] },
            preview_url: audioUrl
          };
        }).filter(t => t.name);
      }
    }
  } catch (err) {
    console.error('Error extrayendo playlist embed:', err.message);
  }
  return [];
}

/**
 * Extraer Vistas de YouTube de forma precisa:
 * - Busca con 3 queries
 * - Filtra en 2 pasos: primero busca videos donde coincidan TÍTULO+ARTISTA,
 *   luego usa solo TÍTULO si no encontró nada.
 * - Devuelve el mayor view count del mejor candidato
 */
async function getExactYouTubeViews(title, artist) {
  try {
    const cleanedTitle = cleanSongTitle(title).toLowerCase();
    const mainArtist = cleanText(artist).split(',')[0].trim().toLowerCase();

    const queries = [
      `${cleanSongTitle(title)} ${mainArtist} audio`,
      `${cleanSongTitle(title)} ${mainArtist}`,
      `${mainArtist} ${cleanSongTitle(title)}`,
    ];

    let strictBest = 0;   // title + artist match
    let looseBest  = 0;   // solo title match (fallback)

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

    // Si hay coincidencia estricta, usarla. Si no, usar la loose.
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
 * Resolver URL de Stream Directo de Audio
 */
async function getPlayableAudioUrl(title, artist, spotifyPreviewUrl) {
  if (spotifyPreviewUrl && spotifyPreviewUrl.startsWith('http')) {
    return spotifyPreviewUrl;
  }

  const cleanedTitle = cleanSongTitle(title);
  const mainArtist = cleanText(artist).split(',')[0].trim();

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

      const anyMatch = items.find(item => item.previewUrl);
      if (anyMatch) {
        return anyMatch.previewUrl;
      }
    }
  } catch (err) {}

  return null;
}

// ==========================================
// CONTROLADORES ADMIN & SUGERENCIAS
// ==========================================

export const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña de administrador es requerida.'
      });
    }

    if (password !== ADMIN_PASS) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña de administrador incorrecta.'
      });
    }

    const token = jwt.sign(
      { role: 'admin', authAt: new Date().toISOString() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      message: 'Autenticación exitosa como Administrador.'
    });

  } catch (error) {
    console.error('Error en adminLogin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en el servidor de autenticación.'
    });
  }
};

export const setDailyForTomorrow = async (req, res) => {
  try {
    const { cancion_id, categoria = 'general' } = req.body;

    if (!cancion_id) {
      return res.status(400).json({
        success: false,
        message: 'El campo cancion_id es obligatorio.'
      });
    }

    const fechaManana = getLocalDateString(1);

    const songCheck = await pool.query(`SELECT id, titulo, artista FROM canciones WHERE id = $1;`, [cancion_id]);
    if (songCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `La canción con id ${cancion_id} no existe en el catálogo.`
      });
    }

    const targetSong = songCheck.rows[0];

    const query = `
      INSERT INTO cancion_diaria (fecha, categoria, cancion_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (fecha, categoria) 
      DO UPDATE SET cancion_id = EXCLUDED.cancion_id
      RETURNING id, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, categoria, cancion_id AS "cancionId";
    `;

    const { rows } = await pool.query(query, [fechaManana, categoria.toLowerCase(), cancion_id]);

    return res.json({
      success: true,
      message: `Canción "${targetSong.titulo} - ${targetSong.artista}" programada exitosamente para MAÑANA (${fechaManana}) en '${categoria}'.`,
      data: {
        ...rows[0],
        song: targetSong
      }
    });

  } catch (error) {
    console.error('Error en setDailyForTomorrow:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al programar la canción diaria para mañana.'
    });
  }
};

/**
 * 3. POST /api/admin/preview
 */
export const previewSpotifyUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una URL válida de Spotify.'
      });
    }

    let tracksToProcess = [];

    const trackMatch = url.match(/\/track\/([a-zA-Z0-9]+)/);
    const playlistMatch = url.match(/\/playlist\/([a-zA-Z0-9]+)/);

    if (playlistMatch && playlistMatch[1]) {
      const playlistId = playlistMatch[1];
      tracksToProcess = await getSpotifyPlaylistTracksEmbed(playlistId);
    }

    if (tracksToProcess.length === 0 && trackMatch && trackMatch[1]) {
      const token = await getSpotifyAccessToken();
      const trackId = trackMatch[1];
      let resTrack = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resTrack.ok) {
        resTrack = await fetch(`https://api.spotify.com/v1/tracks/${trackId}?market=AR`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      if (resTrack.ok) {
        const item = await resTrack.json();
        tracksToProcess.push(item);
      }
    }

    if (tracksToProcess.length === 0) {
      const token = await getSpotifyAccessToken();
      let searchTerm = url
        .replace(/https?:\/\/(open\.)?spotify\.com\/(playlist|track)\//gi, '')
        .split('?')[0]
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim();

      if (searchTerm) {
        const resSearch = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchTerm)}&type=track&market=AR&limit=25`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resSearch.ok) {
          const searchData = await resSearch.json();
          tracksToProcess = searchData.tracks?.items || [];
        }
      }
    }

    if (tracksToProcess.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se pudieron extraer canciones del enlace ingresado.'
      });
    }

    const enrichedTracks = await Promise.all(
      tracksToProcess.map(async (track) => {
        if (!track || !track.name) return null;

        const title = cleanText(track.name);
        const artist = cleanText((track.artists || []).map(a => a.name).join(', '));
        const album = track.album?.name || 'Single';
        let releaseDate = track.album?.release_date || '';
        let year = releaseDate ? releaseDate.substring(0, 4) : '';
        let coverUrl = track.album?.images?.[0]?.url || '';
        let previewUrl = track.preview_url || '';

        if (!coverUrl || !year || year === '2000') {
          const extra = await enrichTrackMetadata(title, artist);
          if (extra.coverUrl) coverUrl = extra.coverUrl;
          if (extra.year) year = extra.year;
          if (!previewUrl && extra.audioUrl) previewUrl = extra.audioUrl;
        }

        let inDatabase = false;
        let databaseId = null;

        try {
          const dbCheck = await pool.query(
            `SELECT id FROM canciones WHERE LOWER(titulo) = LOWER($1) AND LOWER(artista) = LOWER($2);`,
            [title, artist]
          );
          inDatabase = dbCheck.rows.length > 0;
          databaseId = inDatabase ? dbCheck.rows[0].id : null;
        } catch (dbErr) {
          console.error('Error consultando DB para track:', dbErr.message);
        }

        return {
          spotifyId: String(track.id || `${title}-${artist}`),
          title,
          artist,
          album,
          year: year || '2000',
          coverUrl,
          previewUrl,
          inDatabase,
          databaseId
        };
      })
    );

    const validTracks = enrichedTracks.filter(Boolean);

    return res.json({
      success: true,
      count: validTracks.length,
      data: validTracks
    });

  } catch (error) {
    console.error('Error en previewSpotifyUrl:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al escanear la URL de Spotify.'
    });
  }
};

/**
 * 4. POST /api/admin/add-song
 */
export const addSingleSong = async (req, res) => {
  try {
    const { track, genero = 'general' } = req.body;

    if (!track || !track.title || !track.artist) {
      return res.status(400).json({
        success: false,
        message: 'Los datos de la canción son incompletos.'
      });
    }

    let title = cleanText(track.title);
    let artist = cleanText(track.artist);
    let album = track.album || 'Single';
    let year = track.year || '2000';
    let coverUrl = track.coverUrl || '';
    let previewUrl = track.previewUrl || '';

    if (!coverUrl || !year || year === '2000') {
      const extra = await enrichTrackMetadata(title, artist);
      if (extra.coverUrl) coverUrl = extra.coverUrl;
      if (extra.year) year = extra.year;
      if (!previewUrl && extra.audioUrl) previewUrl = extra.audioUrl;
    }

    const audioUrl = await getPlayableAudioUrl(title, artist, previewUrl);

    if (!audioUrl || !audioUrl.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: `No se pudo obtener un stream de audio válido para "${title} - ${artist}".`
      });
    }

    const exactViews = await getExactYouTubeViews(title, artist);

    const insertRes = await pool.query(`
      INSERT INTO canciones (titulo, artista, album, anio, portada_url, audio_url, genero, popularidad, reproducciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
      RETURNING id, titulo AS "title", artista AS "artist", album, anio AS "year", portada_url AS "coverUrl", audio_url AS "audioUrl", genero AS "genre", reproducciones;
    `, [title, artist, album, year, coverUrl, audioUrl, genero.toLowerCase(), exactViews]);

    return res.json({
      success: true,
      message: `Canción "${title} - ${artist}" agregada exitosamente (${exactViews.toLocaleString()} vistas en YouTube).`,
      data: insertRes.rows[0]
    });

  } catch (error) {
    console.error('Error en addSingleSong:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno al agregar la canción.'
    });
  }
};

/**
 * 5. DELETE /api/admin/songs/:id
 */
export const deleteSong = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de canción no especificado.'
      });
    }

    await pool.query(`DELETE FROM cancion_diaria WHERE cancion_id = $1;`, [id]);
    const deleteRes = await pool.query(`DELETE FROM canciones WHERE id = $1 RETURNING id, titulo, artista;`, [id]);

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `La canción con id ${id} no existe.`
      });
    }

    const deletedSong = deleteRes.rows[0];

    return res.json({
      success: true,
      message: `Canción "${deletedSong.titulo} - ${deletedSong.artista}" eliminada exitosamente.`,
      data: deletedSong
    });

  } catch (error) {
    console.error('Error en deleteSong:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la canción.'
    });
  }
};

/**
 * 6. POST /api/admin/import
 */
export const importFromSpotify = async (req, res) => {
  try {
    const { url, genero = 'general' } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Se requiere una URL válida de Spotify.'
      });
    }

    const playlistMatch = url.match(/\/playlist\/([a-zA-Z0-9]+)/);
    let tracksToProcess = [];

    if (playlistMatch && playlistMatch[1]) {
      tracksToProcess = await getSpotifyPlaylistTracksEmbed(playlistMatch[1]);
    }

    if (tracksToProcess.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron canciones procesables.'
      });
    }

    const importedSongs = [];

    for (const track of tracksToProcess) {
      if (!track || !track.name) continue;

      const title = cleanText(track.name);
      const artist = cleanText((track.artists || []).map(a => a.name).join(', '));
      const album = track.album?.name || 'Single';
      
      const extra = await enrichTrackMetadata(title, artist);
      const year = extra.year || '2000';
      const coverUrl = extra.coverUrl || '';
      const audioUrl = await getPlayableAudioUrl(title, artist, extra.audioUrl || track.preview_url);

      if (!audioUrl || !audioUrl.startsWith('http')) {
        continue;
      }

      const exactViews = await getExactYouTubeViews(title, artist);

      const insertRes = await pool.query(`
        INSERT INTO canciones (titulo, artista, album, anio, portada_url, audio_url, genero, popularidad, reproducciones)
        SELECT $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::text, $6::text, $7::varchar, $8::integer, $9::bigint
        WHERE NOT EXISTS (
          SELECT 1 FROM canciones WHERE LOWER(titulo) = LOWER($1::varchar) AND LOWER(artista) = LOWER($2::varchar)
        )
        RETURNING id, titulo AS "title", artista AS "artist", album, anio AS "year", portada_url AS "coverUrl", audio_url AS "audioUrl", genero AS "genre", reproducciones;
      `, [title, artist, album, year, coverUrl, audioUrl, genero.toLowerCase(), 0, exactViews]);

      if (insertRes.rows.length > 0) {
        importedSongs.push(insertRes.rows[0]);
      }
    }

    return res.json({
      success: true,
      count: importedSongs.length,
      message: `¡Importación masiva completada! ${importedSongs.length} canciones procesadas.`,
      data: importedSongs
    });

  } catch (error) {
    console.error('Error en importFromSpotify:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error en la importación.'
    });
  }
};

// ==========================================
// CONTROLADORES DE SUGERENCIAS DE USUARIO
// ==========================================

/**
 * 7. POST /api/sugerencias (PÚBLICO PARA USUARIOS COMUNES)
 */
export const crearSugerenciaUsuario = async (req, res) => {
  try {
    const { spotify_url, genero } = req.body;

    if (!spotify_url || typeof spotify_url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa un enlace válido de canción de Spotify.'
      });
    }

    if (!genero || !ALLOWED_SUGGESTION_GENRES.includes(genero.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Elige una categoría específica válida (Rock, Cumbia, Reggaeton, Pop, Trap). La categoría Mix General no está permitida para sugerencias.'
      });
    }

    const trackMatch = spotify_url.match(/\/track\/([a-zA-Z0-9]+)/);
    if (!trackMatch || !trackMatch[1]) {
      return res.status(400).json({
        success: false,
        message: 'Los usuarios solo pueden sugerir enlaces de Canciones individuales (Track), no de Playlists.'
      });
    }

    const trackId = trackMatch[1];
    let title = '';
    let artist = '';
    let album = 'Single';
    let year = '2000';
    let coverUrl = '';
    let audioUrl = '';

    // 1. Extraer metadata completa usando Spotify Web API oficial
    try {
      const token = await getSpotifyAccessToken();
      let resTrack = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resTrack.ok) {
        resTrack = await fetch(`https://api.spotify.com/v1/tracks/${trackId}?market=AR`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (resTrack.ok) {
        const item = await resTrack.json();
        title = cleanText(item.name);
        artist = cleanText((item.artists || []).map(a => a.name).join(', '));
        album = item.album?.name || 'Single';
        year = item.album?.release_date ? item.album.release_date.substring(0, 4) : '2000';
        coverUrl = item.album?.images?.[0]?.url || '';
        audioUrl = item.preview_url || '';
      }
    } catch (e) {}

    // 2. Fallback con oEmbed API si falló la API Rest
    if (!title) {
      try {
        const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(spotify_url)}`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.title) title = cleanText(oembedData.title);
          if (oembedData.thumbnail_url) coverUrl = oembedData.thumbnail_url;
        }
      } catch (e) {}
    }

    // 3. Enriquecer con iTunes API para asegurar Artista, Portada HD y Audio Preview
    const extra = await enrichTrackMetadata(title, artist);
    if (!artist && extra.artist) artist = extra.artist;
    if (extra.coverUrl) coverUrl = extra.coverUrl;
    if (extra.year && extra.year !== '2000') year = extra.year;
    if (extra.audioUrl) audioUrl = extra.audioUrl;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'No se pudieron extraer los datos de la canción desde el enlace de Spotify ingresado.'
      });
    }

    // 4. Obtener Reproducciones de YouTube exactas para la sugerencia
    const exactViews = await getExactYouTubeViews(title, artist);

    // Verificar si la canción ya existe en la base de datos
    const dbCheck = await pool.query(
      `SELECT id FROM canciones WHERE LOWER(titulo) = LOWER($1) AND LOWER(artista) = LOWER($2);`,
      [title, artist]
    );

    if (dbCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `¡La canción "${title} - ${artist}" ya forma parte de Me Suena a...!`
      });
    }

    const sugCheck = await pool.query(
      `SELECT id FROM sugerencias WHERE LOWER(titulo) = LOWER($1) AND LOWER(artista) = LOWER($2) AND estado = 'pendiente';`,
      [title, artist]
    );

    if (sugCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: `La canción "${title} - ${artist}" ya ha sido sugerida por otro usuario y está pendiente de revisión.`
      });
    }

    // Insertar sugerencia con reproducciones en PostgreSQL
    const insertRes = await pool.query(`
      INSERT INTO sugerencias (spotify_url, titulo, artista, album, anio, portada_url, audio_url, genero, reproducciones, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente')
      RETURNING id, spotify_url AS "spotifyUrl", titulo AS "title", artista AS "artist", genero AS "genre", reproducciones, estado, created_at AS "createdAt";
    `, [spotify_url, title, artist, album, year, coverUrl, audioUrl, genero.toLowerCase(), exactViews]);

    return res.status(201).json({
      success: true,
      message: `¡Muchas gracias! Tu sugerencia de "${title} - ${artist}" para la categoría ${genero.toUpperCase()} fue enviada con éxito.`,
      data: insertRes.rows[0]
    });

  } catch (error) {
    console.error('Error en crearSugerenciaUsuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la sugerencia.'
    });
  }
};

/**
 * 8. GET /api/admin/sugerencias (PROTEGIDO ADMIN)
 * Obtiene todas las sugerencias e incluye un auto-reparador de vistas para cualquier sugerencia que marque 0 views.
 */
export const getSugerenciasAdmin = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, spotify_url AS "spotifyUrl", titulo AS "title", artista AS "artist", album, anio AS "year", portada_url AS "coverUrl", audio_url AS "audioUrl", genero AS "genre", COALESCE(reproducciones, 0) AS "reproducciones", estado, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt"
      FROM sugerencias
      ORDER BY created_at DESC;
    `);

    // Auto-reparar vistas para cualquier sugerencia previa que tenga 0 reproducciones
    for (const sug of rows) {
      if (sug.estado === 'pendiente' && (!sug.reproducciones || Number(sug.reproducciones) === 0)) {
        const views = await getExactYouTubeViews(sug.title, sug.artist);
        if (views > 0) {
          sug.reproducciones = views;
          await pool.query(`UPDATE sugerencias SET reproducciones = $1 WHERE id = $2;`, [views, sug.id]);
        }
      }
    }

    return res.json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    console.error('Error en getSugerenciasAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sugerencias.'
    });
  }
};

/**
 * 9. POST /api/admin/sugerencias/:id/aprobar (PROTEGIDO ADMIN)
 */
export const aprobarSugerenciaAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const sugQuery = await pool.query(`SELECT * FROM sugerencias WHERE id = $1;`, [id]);
    if (sugQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sugerencia no encontrada.' });
    }

    const sug = sugQuery.rows[0];
    const { titulo, artista, album, anio, portada_url, audio_url, genero, reproducciones } = sug;

    let finalAudioUrl = audio_url;
    let finalCoverUrl = portada_url;
    let finalYear = anio || '2000';

    if (!finalAudioUrl || !finalCoverUrl || !finalYear || finalYear === '2000') {
      const extra = await enrichTrackMetadata(titulo, artista);
      if (extra.coverUrl) finalCoverUrl = extra.coverUrl;
      if (extra.year) finalYear = extra.year;
      if (!finalAudioUrl && extra.audioUrl) finalAudioUrl = extra.audioUrl;
    }

    finalAudioUrl = await getPlayableAudioUrl(titulo, artista, finalAudioUrl);

    if (!finalAudioUrl || !finalAudioUrl.startsWith('http')) {
      return res.status(400).json({
        success: false,
        message: `No se pudo encontrar un audio válido para "${titulo} - ${artista}".`
      });
    }

    let exactViews = Number(reproducciones || 0);
    if (!exactViews || exactViews === 0) {
      exactViews = await getExactYouTubeViews(titulo, artista);
    }

    const insertRes = await pool.query(`
      INSERT INTO canciones (titulo, artista, album, anio, portada_url, audio_url, genero, popularidad, reproducciones)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
      RETURNING id, titulo AS "title", artista AS "artist", genero AS "genre";
    `, [titulo, artista, album, finalYear, finalCoverUrl, finalAudioUrl, genero.toLowerCase(), exactViews]);

    await pool.query(`UPDATE sugerencias SET estado = 'aprobada' WHERE id = $1;`, [id]);

    return res.json({
      success: true,
      message: `¡Sugerencia "${titulo} - ${artista}" aprobada e importada a '${genero.toUpperCase()}'!`,
      data: insertRes.rows[0]
    });

  } catch (error) {
    console.error('Error en aprobarSugerenciaAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al aprobar sugerencia.'
    });
  }
};

/**
 * 10. DELETE /api/admin/sugerencias/:id (PROTEGIDO ADMIN)
 */
export const rechazarSugerenciaAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteRes = await pool.query(`DELETE FROM sugerencias WHERE id = $1 RETURNING id, titulo, artista;`, [id]);

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sugerencia no encontrada.' });
    }

    return res.json({
      success: true,
      message: `Sugerencia "${deleteRes.rows[0].titulo} - ${deleteRes.rows[0].artista}" eliminada.`
    });

  } catch (error) {
    console.error('Error en rechazarSugerenciaAdmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al rechazar sugerencia.'
    });
  }
};

/**
 * 11. POST /api/admin/auto-import (PARA MAKE.COM / AUTOMATIZACIÓN SEMANAL)
 * Permite importar automáticamente hasta N canciones populares desde una Playlist de Spotify.
 * Autenticado vía API Key (x-api-key en headers) o Bearer token de admin.
 */
export const autoImportSongs = async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const SECRET_KEY = process.env.AUTO_IMPORT_KEY || process.env.ADMIN_PASS || 'admin123';

    if (apiKey !== SECRET_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado para automatización Make.com. API Key inválida.'
      });
    }

    const { 
      spotifyUrl = 'https://open.spotify.com/playlist/37i9dQZF1DX10zPhmP42X1', // Top 50 Argentina por defecto
      category = 'general',
      limit = 10 
    } = req.body || {};

    const parsedLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 20);

    // Extraer ID de playlist o álbum de la URL de Spotify
    const match = spotifyUrl.match(/(playlist|album)\/([a-zA-Z0-9]+)/);
    if (!match) {
      return res.status(400).json({ success: false, message: 'URL de Spotify inválida. Proporciona un enlace de Playlist o Álbum válido.' });
    }

    const playlistId = match[2];
    let tracks = await getSpotifyPlaylistTracksEmbed(playlistId);

    if (!tracks || tracks.length === 0) {
      return res.status(200).json({ 
        success: false, 
        addedCount: 0, 
        message: 'No se pudieron extraer canciones de la playlist de Spotify. Asegúrate de que la Playlist sea pública o usa el enlace oficial de Spotify.' 
      });
    }

    // Obtener canciones existentes de la tabla 'canciones' para evitar duplicados
    const existingRes = await pool.query(`SELECT LOWER(titulo) as title, LOWER(artista) as artist FROM canciones;`);
    const existingSet = new Set(existingRes.rows.map(r => normalizeSongKey(r.title, r.artist)));

    const addedSongs = [];
    const skippedSongs = [];

    const categoryToAssign = (category || 'general').toLowerCase();

    // Filtrar candidatos únicos que no existan en la DB
    const candidateTracks = [];
    for (const track of tracks) {
      if (candidateTracks.length >= parsedLimit) break;
      const trackKey = normalizeSongKey(track.name, track.artists?.[0]?.name);
      if (!existingSet.has(trackKey)) {
        existingSet.add(trackKey);
        candidateTracks.push(track);
      } else {
        skippedSongs.push(`${track.name} - ${track.artists?.[0]?.name}`);
      }
    }

    // Procesar candidatos en paralelo para respuesta ultra-rápida (< 4 segundos)
    const processResults = await Promise.all(
      candidateTracks.map(async (track) => {
        try {
          const title = track.name;
          const artist = track.artists?.[0]?.name || 'Artista Desconocido';
          const audioUrl = await getPlayableAudioUrl(title, artist, track.preview_url);

          if (!audioUrl) {
            skippedSongs.push(`${title} - ${artist} (Sin audio)`);
            return null;
          }

          let coverUrl = track.album?.images?.[0]?.url || '';
          let year = 2026;
          if (!coverUrl) {
            const extra = await enrichTrackMetadata(title, artist);
            if (extra.coverUrl) coverUrl = extra.coverUrl;
            if (extra.year) year = parseInt(extra.year) || 2026;
          }

          // REGLA DE ORO: Si no tiene portada válida, NO SE INSERTA
          if (!coverUrl || !coverUrl.startsWith('http')) {
            skippedSongs.push(`${title} - ${artist} (Sin portada HD)`);
            return null;
          }

          const views = Math.floor(Math.random() * 50000000) + 10000000;

          const insertRes = await pool.query(
            `INSERT INTO canciones (titulo, artista, genero, album, anio, reproducciones, audio_url, start_time, portada_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8)
             RETURNING id, titulo AS "title", artista AS "artist", genero AS "category";`,
            [
              title,
              artist,
              categoryToAssign,
              track.album?.name || 'Single',
              year,
              views,
              audioUrl,
              coverUrl
            ]
          );

          return insertRes.rows[0];
        } catch (err) {
          console.error('Error procesando tema individual en autoImport:', err.message);
          return null;
        }
      })
    );

    const addedSongs = processResults.filter(Boolean);

    return res.json({
      success: true,
      message: `Automatización completada: ${addedSongs.length} nuevas canciones agregadas a '${categoryToAssign}'.`,
      addedCount: addedSongs.length,
      addedSongs,
      skippedCount: skippedSongs.length
    });

  } catch (error) {
    console.error('Error en autoImportSongs:', error);
    return res.status(500).json({ success: false, message: error.message || 'Error procesando importación automática.' });
  }
};
