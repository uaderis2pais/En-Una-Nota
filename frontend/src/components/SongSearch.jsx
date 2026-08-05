import React, { useState, useRef, useEffect } from 'react';
import { Search, FastForward, CheckCircle, Music } from 'lucide-react';

/**
 * Normalizador ultra-flexible: remueve tildes, signos de puntuación, comillas, guiones y múltiples espacios.
 * Convierte p.ej. "Música, Pa' la calle, Bizarrap: Bzrp..." a "musica pa la calle bizarrap bzrp"
 */
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD') // Separa caracteres accentuados en letra + diacrítico
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes y diacríticos
    .replace(/[^a-z0-9\s]/g, ' ') // Reemplaza signos de puntuación por espacios
    .replace(/\s+/g, ' ') // Convierte espacios múltiples en 1 solo
    .trim();
};

export const SongSearch = ({
  songList,
  onGuess,
  onSkip,
  isGameOver,
  currentAttemptTime
}) => {
  const [query, setQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const normQuery = normalizeText(query);

  // Filtrar canciones de forma súper flexible ignorando mayúsculas, tildes, comillas y múltiples espacios
  const filteredSongs = normQuery === ''
    ? []
    : songList.filter(song => {
      const normTitle = normalizeText(song.title);
      const normArtist = normalizeText(song.artist);
      const normCombined = `${normTitle} ${normArtist}`;

      return normTitle.includes(normQuery) ||
        normArtist.includes(normQuery) ||
        normCombined.includes(normQuery);
    });

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSong = (song) => {
    setSelectedSong(song);
    setQuery(`${song.title} - ${song.artist}`);
    setIsOpen(false);
  };

  const handleGuessSubmit = (e) => {
    e.preventDefault();
    if (!selectedSong && normQuery !== '') {
      // Búsqueda flexible sin tildes si el usuario presionó Enter escribiendo manualmente
      const match = songList.find(s => {
        const normTitle = normalizeText(s.title);
        const normArtist = normalizeText(s.artist);
        const normCombined = `${normTitle} ${normArtist}`;
        return normTitle === normQuery || normCombined === normQuery || `${normTitle} - ${normArtist}` === normQuery;
      });

      if (match) {
        onGuess(match);
        setQuery('');
        setSelectedSong(null);
      }
      return;
    }

    if (selectedSong) {
      onGuess(selectedSong);
      setQuery('');
      setSelectedSong(null);
    }
  };

  const handleSkipSubmit = () => {
    setQuery('');
    setSelectedSong(null);
    onSkip();
  };

  if (isGameOver) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto my-4 space-y-3 relative" ref={dropdownRef}>
      {/* Autocomplete Input */}
      <form onSubmit={handleGuessSubmit} className="relative">
        <div className="relative flex items-center glass-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50">
          <Search className="w-5 h-5 ml-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedSong(null);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Busca por título o artista (ej: musica, pa la calle)..."
            className="w-full py-3.5 px-3 bg-transparent text-slate-100 placeholder-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedSong(null);
              }}
              className="mr-3 text-xs text-slate-500 hover:text-slate-300"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Dropdown Options */}
        {isOpen && filteredSongs.length > 0 && (
          <ul className="absolute z-30 w-full mt-2 bg-[#121824] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-800">
            {filteredSongs.map((song) => (
              <li
                key={song.id}
                onClick={() => handleSelectSong(song)}
                className="px-4 py-3 hover:bg-emerald-950/40 hover:text-emerald-300 cursor-pointer flex items-center gap-3 transition-colors text-sm"
              >
                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-100">{song.title}</div>
                  <div className="text-xs text-slate-400">{song.artist}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Botón Principal: Adivinar (Opaco y Sólido) */}
      <button
        type="button"
        onClick={handleGuessSubmit}
        disabled={!selectedSong && !query.trim()}
        className={`w-full py-3.5 px-4 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 border ${
          selectedSong || query.trim()
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 border-emerald-400/80 hover:brightness-110 shadow-emerald-500/30'
            : 'bg-slate-900/95 text-slate-500 border-slate-800 cursor-not-allowed'
        }`}
      >
        <CheckCircle className="w-5 h-5" />
        <span>Adivinar</span>
      </button>
    </div>
  );
};
