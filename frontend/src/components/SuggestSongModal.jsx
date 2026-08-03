import React, { useState } from 'react';
import { X, Sparkles, Music, CheckCircle2, AlertCircle, Send } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api';

// Categorías Específicas Permitidas para Sugerencias (EXCLUIDO Mix General)
const SUGGESTION_CATEGORIES = [
  { id: 'rock', name: 'Rock Nacional' },
  { id: 'cumbia', name: 'Cumbia Argentina' },
  { id: 'reggaeton', name: 'Reggaeton Old School' },
  { id: 'reggaeton_new', name: 'Reggaeton New School' },
  { id: 'pop', name: 'Pop Latino' },
  { id: 'trap', name: 'Trap en Español' }
];

export function SuggestSongModal({ isOpen, onClose, initialGenre }) {
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [genero, setGenero] = useState(initialGenre || 'rock');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [enviando, setEnviando] = useState(false);

  // Cuando se abre el modal con un género específico, preseleccionarlo
  React.useEffect(() => {
    if (isOpen && initialGenre) {
      const valid = SUGGESTION_CATEGORIES.some(c => c.id === initialGenre);
      setGenero(valid ? initialGenre : 'rock');
    }
  }, [isOpen, initialGenre]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!spotifyUrl.trim()) {
      setMensaje({ texto: 'Por favor pega un enlace de canción de Spotify.', tipo: 'error' });
      return;
    }

    if (!spotifyUrl.includes('/track/')) {
      setMensaje({ texto: 'Los usuarios solo pueden enviar enlaces de Canciones individuales (Track) de Spotify, porfavor verifique que asi sea.', tipo: 'error' });
      return;
    }

    setEnviando(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/sugerencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotify_url: spotifyUrl, genero })
      });

      const data = await res.json();

      if (data.success) {
        setMensaje({ texto: data.message, tipo: 'success' });
        setSpotifyUrl('');
        setTimeout(() => {
          onClose();
          setMensaje({ texto: '', tipo: '' });
        }, 3000);
      } else {
        setMensaje({ texto: data.message || 'No se pudo enviar la sugerencia.', tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl relative space-y-5">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto text-slate-950 shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-xl font-black text-white">Sugerir una Canción</h2>
          <p className="text-xs text-slate-400">
            ¿Falta un temazo en el juego? Pega el enlace de Spotify y lo agregaremos.
          </p>
        </div>

        {/* Formulario de Sugerencia */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enlace de Spotify (Canción / Track)</span>
            </label>
            <input
              required
              type="text"
              placeholder="https://open.spotify.com/track/..."
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Categoría / Género Musical
            </label>
            <select
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs outline-none focus:border-emerald-500 font-medium"
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
            >
              {SUGGESTION_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-1 italic">
              * Nota: El Mix General incluye automáticamente todas las categorías.
            </p>
          </div>

          {/* Feedback Mensajes */}
          {mensaje.texto && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${mensaje.tipo === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
              }`}>
              {mensaje.tipo === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{mensaje.texto}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-98"
          >
            <Send className="w-4 h-4" />
            <span>{enviando ? 'Enviando Sugerencia...' : 'Enviar Sugerencia'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
