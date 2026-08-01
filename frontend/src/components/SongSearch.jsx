import React, { useState, useRef, useEffect } from 'react';
import { Search, FastForward, CheckCircle, Music } from 'lucide-react';

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

  // Filtrar canciones por título o artista
  const filteredSongs = query.trim() === '' 
    ? [] 
    : songList.filter(song => 
        song.title.toLowerCase().includes(query.toLowerCase()) ||
        song.artist.toLowerCase().includes(query.toLowerCase())
      );

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
    if (!selectedSong && query.trim() !== '') {
      // Si escribió pero no seleccionó de la lista, buscar coincidencia exacta
      const match = songList.find(s => 
        `${s.title} - ${s.artist}`.toLowerCase() === query.toLowerCase() ||
        s.title.toLowerCase() === query.toLowerCase()
      );
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
            placeholder="Busca por título o artista..."
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

      {/* Action Buttons: Saltar vs Adivinar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSkipSubmit}
          className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <FastForward className="w-4 h-4 text-amber-400" />
          <span>Saltar (+{currentAttemptTime}s)</span>
        </button>

        <button
          type="button"
          onClick={handleGuessSubmit}
          disabled={!selectedSong && !query.trim()}
          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
            selectedSong || query.trim()
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-emerald-500/20'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Adivinar</span>
        </button>
      </div>
    </div>
  );
};
