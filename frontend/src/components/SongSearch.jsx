import React, { useState, useRef, useEffect } from 'react';
import { Search, FastForward, CheckCircle, Music } from 'lucide-react';

/**
 * Normalizador ultra-flexible: remueve tildes, signos de puntuación, comillas y guiones.
 * Si keepSpaces es false, también remueve espacios para emparejar "keper" -> "ke personajes" o "sodastereo" -> "soda stereo"
 */
const cleanText = (text, keepSpaces = false) => {
  if (!text) return '';
  const cleaned = text
    .toLowerCase()
    .normalize('NFD') // Separa letras de sus tildes
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/[^a-z0-9\s]/g, ' '); // Elimina signos de puntuación

  if (keepSpaces) {
    return cleaned.replace(/\s+/g, ' ').trim();
  }
  return cleaned.replace(/\s+/g, '');
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

  const queryWithSpace = cleanText(query, true);
  const queryNoSpace = cleanText(query, false);

  // Búsqueda ultra-flexible (funciona con espacios, sin espacios, con tildes o sin tildes)
  const filteredSongs = !query.trim()
    ? []
    : songList.filter(song => {
        const titleWithSpace = cleanText(song.title, true);
        const artistWithSpace = cleanText(song.artist, true);
        const titleArtistWithSpace = `${titleWithSpace} ${artistWithSpace}`;
        const artistTitleWithSpace = `${artistWithSpace} ${titleWithSpace}`;

        // 1. Coincidencia normal con espacios (Título, Artista, Título+Artista o Artista+Título)
        if (
          titleWithSpace.includes(queryWithSpace) ||
          artistWithSpace.includes(queryWithSpace) ||
          titleArtistWithSpace.includes(queryWithSpace) ||
          artistTitleWithSpace.includes(queryWithSpace)
        ) {
          return true;
        }

        // 2. Coincidencia ultra-flexible sin espacios ("keper" -> "kepersonajes", "duki she don't" -> "she don't duki")
        const titleNoSpace = cleanText(song.title, false);
        const artistNoSpace = cleanText(song.artist, false);
        const titleArtistNoSpace = `${titleNoSpace}${artistNoSpace}`;
        const artistTitleNoSpace = `${artistNoSpace}${titleNoSpace}`;

        return (
          titleNoSpace.includes(queryNoSpace) ||
          artistNoSpace.includes(queryNoSpace) ||
          titleArtistNoSpace.includes(queryNoSpace) ||
          artistTitleNoSpace.includes(queryNoSpace)
        );
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
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedSong && queryNoSpace !== '') {
      // Intentar encontrar coincidencia exacta manual si presionó Enter
      const match = songList.find(s => {
        const titleNoSpace = cleanText(s.title, false);
        const artistNoSpace = cleanText(s.artist, false);
        const combinedNoSpace = `${titleNoSpace}${artistNoSpace}`;
        return (
          titleNoSpace === queryNoSpace || 
          artistNoSpace === queryNoSpace || 
          combinedNoSpace === queryNoSpace
        );
      });

      if (match) {
        onGuess(match);
        setQuery('');
        setSelectedSong(null);
        setIsOpen(false);
      }
      return;
    }

    if (selectedSong) {
      onGuess(selectedSong);
      setQuery('');
      setSelectedSong(null);
      setIsOpen(false);
    }
  };

  if (isGameOver) {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto mt-4 mb-10 space-y-3 relative" ref={dropdownRef}>
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
            placeholder="Busca por título o artista (ej: keper, soda stereo, duki)..."
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

        {/* Dropdown de Opciones (Limitado a 3 canciones para evitar tapar el borde inferior) */}
        {isOpen && filteredSongs.length > 0 && (
          <ul className="absolute z-40 w-full mt-2 bg-[#121824] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden max-h-[175px] overflow-y-auto divide-y divide-slate-800">
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
