import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Music, 
  Sparkles, 
  LogOut, 
  RefreshCw, 
  Database,
  Inbox,
  Check,
  X,
  Play,
  Pause,
  Eye,
  Volume2
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api/admin';

export function AdminView() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  
  // Estados para programar canción de mañana
  const [cancionId, setCancionId] = useState('');
  const [categoriaDiaria, setCategoriaDiaria] = useState('general');

  // Estados para escanear/importar desde Spotify
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [categoriaImport, setCategoriaImport] = useState('general');
  const [previewTracks, setPreviewTracks] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [loadingTrackIds, setLoadingTrackIds] = useState({});

  // Estados para la sección de Sugerencias de Usuarios
  const [sugerencias, setSugerencias] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [loadingSugerenciaIds, setLoadingSugerenciaIds] = useState({});

  // Estado para reproductor de audio preview en la lista de sugerencias
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioPlayerRef = useRef(null);

  // Mensajes de feedback
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  const mostrarMensaje = (texto, tipo = 'success') => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 5000);
  };

  // Función para reproducir/pausar preview de audio en las sugerencias
  const togglePlayAudio = (id, audioUrl) => {
    if (!audioUrl) {
      mostrarMensaje('Esta sugerencia no posee un fragmento de audio disponible.', 'error');
      return;
    }

    if (playingAudioId === id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const newAudio = new Audio(audioUrl);
      audioPlayerRef.current = newAudio;
      newAudio.play().catch(e => console.error("Audio error:", e));
      setPlayingAudioId(id);

      newAudio.onended = () => {
        setPlayingAudioId(null);
      };
    }
  };

  // Detener audio al desmontar
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  // 1. LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('adminToken', data.token);
        mostrarMensaje('¡Bienvenido Administrador!');
      } else {
        mostrarMensaje(data.message || 'Contraseña incorrecta', 'error');
      }
    } catch (error) {
      mostrarMensaje('Error al conectar con el servidor backend', 'error');
    }
    setCargando(false);
  };

  // 2. CARGAR SUGERENCIAS DE USUARIOS
  const fetchSugerencias = async () => {
    if (!token) return;
    setCargandoSugerencias(true);
    try {
      const res = await fetch(`${API_BASE_URL}/sugerencias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSugerencias(data.data);
      }
    } catch (error) {
      console.error('Error cargando sugerencias:', error);
    } finally {
      setCargandoSugerencias(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSugerencias();
    }
  }, [token]);

  // 3. PROGRAMAR CANCIÓN DE MAÑANA
  const handleSetDaily = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/set-daily`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cancion_id: cancionId, categoria: categoriaDiaria })
      });
      const data = await res.json();
      mostrarMensaje(data.message, data.success ? 'success' : 'error');
      if (data.success) setCancionId('');
    } catch (error) {
      mostrarMensaje('Error al programar la canción diaria', 'error');
    }
    setCargando(false);
  };

  // 4. ESCANEAR PLAYLIST O CANCIÓN DE SPOTIFY
  const handleScanSpotify = async (e) => {
    if (e) e.preventDefault();
    if (!spotifyUrl.trim()) {
      mostrarMensaje('Ingresa un enlace válido de Spotify.', 'error');
      return;
    }

    setIsScanning(true);
    setPreviewTracks([]);

    try {
      const res = await fetch(`${API_BASE_URL}/preview`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url: spotifyUrl })
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setPreviewTracks(data.data);
        mostrarMensaje(`Se encontraron ${data.count} canciones en el enlace.`);
      } else {
        mostrarMensaje(data.message || 'No se pudieron extraer canciones.', 'error');
      }
    } catch (error) {
      mostrarMensaje('Error al escanear el enlace de Spotify.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // 5. AGREGAR CANCIÓN INDIVIDUAL A LA BASE DE DATOS
  const handleAddSong = async (track) => {
    setLoadingTrackIds(prev => ({ ...prev, [track.spotifyId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/add-song`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ track, genero: categoriaImport })
      });

      const data = await res.json();

      if (data.success && data.data) {
        setPreviewTracks(prev => prev.map(item => {
          if (item.spotifyId === track.spotifyId) {
            return {
              ...item,
              inDatabase: true,
              databaseId: data.data.id
            };
          }
          return item;
        }));
        mostrarMensaje(`"${track.title} - ${track.artist}" agregada a la base de datos!`);
      } else {
        mostrarMensaje(data.message || 'No se pudo agregar la canción.', 'error');
      }
    } catch (error) {
      mostrarMensaje(`Error al agregar "${track.title}"`, 'error');
    } finally {
      setLoadingTrackIds(prev => ({ ...prev, [track.spotifyId]: false }));
    }
  };

  // 6. ELIMINAR CANCIÓN INDIVIDUAL DE LA BASE DE DATOS
  const handleDeleteSong = async (track) => {
    if (!track.databaseId) return;

    if (!window.confirm(`¿Estás seguro de eliminar "${track.title} - ${track.artist}" de la base de datos?`)) {
      return;
    }

    setLoadingTrackIds(prev => ({ ...prev, [track.spotifyId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/songs/${track.databaseId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (data.success) {
        setPreviewTracks(prev => prev.map(item => {
          if (item.spotifyId === track.spotifyId) {
            return {
              ...item,
              inDatabase: false,
              databaseId: null
            };
          }
          return item;
        }));
        mostrarMensaje(`"${track.title} - ${track.artist}" eliminada de la base de datos.`);
      } else {
        mostrarMensaje(data.message || 'No se pudo eliminar la canción.', 'error');
      }
    } catch (error) {
      mostrarMensaje(`Error al eliminar "${track.title}"`, 'error');
    } finally {
      setLoadingTrackIds(prev => ({ ...prev, [track.spotifyId]: false }));
    }
  };

  // 7. APROBAR SUGERENCIA DE USUARIO
  const handleAprobarSugerencia = async (id) => {
    setLoadingSugerenciaIds(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/sugerencias/${id}/aprobar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        mostrarMensaje(data.message);
        fetchSugerencias();
      } else {
        mostrarMensaje(data.message || 'No se pudo aprobar la sugerencia.', 'error');
      }
    } catch (error) {
      mostrarMensaje('Error al aprobar sugerencia.', 'error');
    } finally {
      setLoadingSugerenciaIds(prev => ({ ...prev, [id]: false }));
    }
  };

  // 8. RECHAZAR / ELIMINAR SUGERENCIA DE USUARIO
  const handleRechazarSugerencia = async (id) => {
    if (!window.confirm('¿Deseas rechazar y eliminar esta sugerencia?')) return;

    setLoadingSugerenciaIds(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/sugerencias/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        mostrarMensaje(data.message);
        fetchSugerencias();
      } else {
        mostrarMensaje(data.message || 'No se pudo eliminar la sugerencia.', 'error');
      }
    } catch (error) {
      mostrarMensaje('Error al eliminar sugerencia.', 'error');
    } finally {
      setLoadingSugerenciaIds(prev => ({ ...prev, [id]: false }));
    }
  };

  const cerrarSesion = () => {
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    setToken('');
    localStorage.removeItem('adminToken');
  };

  const sugerenciasPendientes = sugerencias.filter(s => s.estado === 'pendiente');

  // Formateador de reproducciones (ej: 9,199,355 -> 9.2M)
  const formatViewsCount = (views) => {
    const num = Number(views || 0);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  // RENDER: VISTA DE LOGIN
  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0d14] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="glass-panel border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-emerald-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white">Panel de Control Admin</h2>
            <p className="text-xs text-slate-400">Ingresa la contraseña maestra para administrar el catálogo</p>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Contraseña Maestra</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-3 bg-slate-900 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-98"
          >
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
          
          {mensaje.texto && (
            <p className={`text-xs text-center font-bold p-2.5 rounded-xl ${mensaje.tipo === 'error' ? 'text-rose-400 bg-rose-950/40 border border-rose-500/30' : 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'}`}>
              {mensaje.texto}
            </p>
          )}
        </form>
      </div>
    );
  }

  // RENDER: VISTA DEL PANEL (DASHBOARD)
  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Cabecera del Panel */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-emerald-400 bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Me Suena a... • Gestión de Canciones & Sugerencias de Usuarios</p>
          </div>
          
          <button 
            onClick={cerrarSesion} 
            className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>

        {/* Mensaje de Alerta Global */}
        {mensaje.texto && (
          <div className={`p-4 rounded-xl text-xs font-bold border flex items-center gap-2 ${mensaje.tipo === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border-rose-500/40'}`}>
            {mensaje.tipo === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{mensaje.texto}</span>
          </div>
        )}

        {/* SECCIÓN 1: SUGERENCIAS DE USUARIOS (FILA FINA Y LARGA CON VIEWS + AUDIO) */}
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-emerald-400" />
              <span>Sugerencias de Usuarios</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30">
                {sugerenciasPendientes.length} Pendientes
              </span>
            </h2>

            <button 
              onClick={fetchSugerencias} 
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all text-xs font-bold flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargandoSugerencias ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {sugerenciasPendientes.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs font-medium">
              ✨ No hay sugerencias pendientes de revisión.
            </div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {sugerenciasPendientes.map((sug) => {
                const isLoading = !!loadingSugerenciaIds[sug.id];
                const isPlaying = playingAudioId === sug.id;

                return (
                  <div 
                    key={sug.id} 
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
                  >
                    {/* Sección Izquierda: Portada + Botón Play Preview + Info Canción */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative group shrink-0">
                        {sug.coverUrl ? (
                          <img src={sug.coverUrl} alt={sug.title} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                            <Music className="w-5 h-5" />
                          </div>
                        )}

                        {/* Botón Overlay Reproducir Audio */}
                        {sug.audioUrl && (
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(sug.id, sug.audioUrl)}
                            className={`absolute inset-0 rounded-lg flex items-center justify-center transition-all ${
                              isPlaying 
                                ? 'bg-emerald-500/80 text-slate-950 opacity-100' 
                                : 'bg-slate-950/60 text-white opacity-0 group-hover:opacity-100'
                            }`}
                            title={isPlaying ? "Pausar vista previa" : "Reproducir vista previa"}
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4 fill-slate-950" />
                            ) : (
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            )}
                          </button>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{sug.title}</h4>
                          <span className="shrink-0 px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[9px] font-black uppercase">
                            {sug.genre}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {sug.artist} {sug.year && sug.year !== '2000' && `• ${sug.year}`}
                        </p>
                      </div>
                    </div>

                    {/* Sección Central: Reproducciones de YouTube + Fecha */}
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      {/* Badge de Reproducciones en YouTube */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-extrabold text-[11px]">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatViewsCount(sug.reproducciones)} vistas</span>
                      </div>

                      <span className="text-[10px] text-slate-500 hidden md:inline">
                        {sug.createdAt}
                      </span>
                    </div>

                    {/* Sección Derecha: Botones de Acción (Aprobar / Rechazar) */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                      <button
                        onClick={() => handleAprobarSugerencia(sug.id)}
                        disabled={isLoading}
                        className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                        title="Aprobar e importar canción al juego"
                      >
                        {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{isLoading ? '...' : 'Aprobar'}</span>
                      </button>

                      <button
                        onClick={() => handleRechazarSugerencia(sug.id)}
                        disabled={isLoading}
                        className="py-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                        title="Rechazar y eliminar sugerencia"
                      >
                        {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Rechazar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Columna Izquierda: Programar Canción de Mañana */}
          <div className="md:col-span-1 glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 h-fit">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Programar Canción (Mañana)</span>
            </h2>
            
            <form onSubmit={handleSetDaily} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ID de Canción en PostgreSQL</label>
                <input 
                  required 
                  type="number" 
                  placeholder="Ej: 15"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl outline-none text-sm text-white focus:border-cyan-500 font-mono" 
                  value={cancionId} 
                  onChange={(e) => setCancionId(e.target.value)} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Categoría Objetivo</label>
                <select 
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl outline-none text-sm text-white focus:border-cyan-500 font-medium" 
                  value={categoriaDiaria} 
                  onChange={(e) => setCategoriaDiaria(e.target.value)}
                >
                  <option value="general">Mix General</option>
                  <option value="rock">Rock Nacional</option>
                  <option value="cumbia">Cumbia Argentina</option>
                  <option value="reggaeton">Reggaeton Old School</option>
                  <option value="reggaeton_new">Reggaeton New School</option>
                  <option value="pop">Pop Latino</option>
                  <option value="trap">Trap en Español</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={cargando} 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-110 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-cyan-500/20 active:scale-98"
              >
                {cargando ? 'Programando...' : 'Programar para Mañana'}
              </button>
            </form>
          </div>

          {/* Columna Derecha (Más ancha): Escáner e Importación Interactiva de Spotify */}
          <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <span>Escáner de Spotify (Playlist / Canción)</span>
              </h2>
            </div>

            {/* Input Form de Búsqueda/Escaneo */}
            <form onSubmit={handleScanSpotify} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input 
                    required 
                    type="text" 
                    placeholder="Pega la URL de Spotify (Track o Playlist)..." 
                    className="w-full py-2.5 pl-10 pr-3 bg-slate-900 border border-slate-700 rounded-xl outline-none text-sm text-white focus:border-emerald-500" 
                    value={spotifyUrl} 
                    onChange={(e) => setSpotifyUrl(e.target.value)} 
                  />
                </div>

                <div className="w-full sm:w-44">
                  <select 
                    className="w-full py-2.5 px-3 bg-slate-900 border border-slate-700 rounded-xl outline-none text-xs text-white focus:border-emerald-500 font-medium" 
                    value={categoriaImport} 
                    onChange={(e) => setCategoriaImport(e.target.value)}
                  >
                    <option value="general">Mix General</option>
                    <option value="rock">Rock Nacional</option>
                    <option value="cumbia">Cumbia Argentina</option>
                    <option value="reggaeton">Reggaeton Old</option>
                    <option value="reggaeton_new">Reggaeton New</option>
                    <option value="pop">Pop Latino</option>
                    <option value="trap">Trap en Español</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={isScanning} 
                  className="py-2.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl hover:brightness-110 flex items-center justify-center gap-2 shrink-0 shadow-md shadow-emerald-500/20 active:scale-98"
                >
                  {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{isScanning ? 'Escaneando...' : 'Escanear'}</span>
                </button>
              </div>
            </form>

            {/* LISTA DE CANCIONES ESCANEADAS DE LA PLAYLIST */}
            {previewTracks.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                  <span>Canciones Encontradas ({previewTracks.length})</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    🟢 Verde = Disponible | ⚪ Gris = Ya en Base de Datos
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {previewTracks.map((track) => {
                    const isInDb = track.inDatabase;
                    const isLoading = !!loadingTrackIds[track.spotifyId];

                    return (
                      <div 
                        key={track.spotifyId}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all duration-200 ${
                          isInDb 
                            ? 'bg-slate-900/40 border-slate-800/80 opacity-60' 
                            : 'bg-slate-900 border-slate-700/80 hover:border-emerald-500/50'
                        }`}
                      >
                        {/* Portada e Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {track.coverUrl ? (
                            <img 
                              src={track.coverUrl} 
                              alt={track.title} 
                              className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                              <Music className="w-5 h-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className={`text-xs font-bold truncate ${isInDb ? 'text-slate-400' : 'text-slate-100'}`}>
                              {track.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {track.artist} • <span className="text-slate-500">{track.year}</span>
                            </p>
                          </div>
                        </div>

                        {/* Botones de Acción (Agregar o Eliminar) */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isInDb ? (
                            <>
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                <Database className="w-3 h-3 text-slate-400" />
                                <span># {track.databaseId}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteSong(track)}
                                disabled={isLoading}
                                className="py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                                title="Eliminar canción de la Base de Datos"
                              >
                                {isLoading ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                                <span>{isLoading ? '...' : 'Eliminar'}</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddSong(track)}
                              disabled={isLoading}
                              className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                              title="Agregar canción a la Base de Datos"
                            >
                              {isLoading ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                              )}
                              <span>{isLoading ? 'Buscando audio...' : 'Agregar'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminView;
